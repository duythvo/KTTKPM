const express = require("express");
const amqp = require("amqplib");

const PORT = Number(process.env.PORT || 4000);
const SERVICE_NAME = process.env.SERVICE_NAME || "orchestrator-service";
const RABBIT_URL = process.env.RABBIT_URL || "amqp://localhost:5672";
const EXCHANGE_NAME = process.env.EXCHANGE_NAME || "food.events";
const DELIVERY_MAX_RETRY = Number(process.env.DELIVERY_MAX_RETRY || 3);

const app = express();
let channel;

const sagaState = new Map();

function log(message, data) {
  const extra = data ? ` ${JSON.stringify(data)}` : "";
  console.log(`[${SERVICE_NAME}] ${message}${extra}`);
}

function publish(type, event) {
  const message = {
    type,
    orderId: event.orderId,
    correlationId: event.correlationId || event.orderId,
    timestamp: new Date().toISOString(),
    payload: event.payload || {},
  };
  channel.publish(EXCHANGE_NAME, type, Buffer.from(JSON.stringify(message)));
  log(`Published ${type}`, {
    orderId: message.orderId,
    payload: message.payload,
  });
}

function cancelOrder(orderId, correlationId, reason) {
  publish("ORDER_CANCELLED", {
    orderId,
    correlationId,
    payload: { reason },
  });
  sagaState.delete(orderId);
}

async function connectBus() {
  try {
    const connection = await amqp.connect(RABBIT_URL);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });
    const q = await channel.assertQueue(`${SERVICE_NAME}.events`, {
      durable: false,
    });
    await channel.bindQueue(q.queue, EXCHANGE_NAME, "#");

    channel.consume(q.queue, (msg) => {
      if (!msg) {
        return;
      }

      const event = JSON.parse(msg.content.toString());
      const orderId = event.orderId;
      const correlationId = event.correlationId || orderId;
      const state = sagaState.get(orderId) || { deliveryAttempts: 0 };

      switch (event.type) {
        case "ORDER_CREATED":
          sagaState.set(orderId, { step: "CREATED", deliveryAttempts: 0 });
          publish("INVENTORY_CHECK_REQUEST", {
            orderId,
            correlationId,
            payload: { items: event.payload.items },
          });
          break;

        case "INVENTORY_RESERVED":
          sagaState.set(orderId, { ...state, step: "INVENTORY_RESERVED" });
          publish("PAYMENT_CHARGE_REQUEST", {
            orderId,
            correlationId,
            payload: { totalAmount: event.payload.totalAmount },
          });
          break;

        case "INVENTORY_FAILED":
          cancelOrder(
            orderId,
            correlationId,
            event.payload.reason || "Inventory failed",
          );
          break;

        case "PAYMENT_SUCCESS":
          sagaState.set(orderId, { ...state, step: "PAYMENT_SUCCESS" });
          publish("KITCHEN_PREPARE_REQUEST", {
            orderId,
            correlationId,
            payload: { items: event.payload.items },
          });
          break;

        case "PAYMENT_FAILED":
          cancelOrder(
            orderId,
            correlationId,
            event.payload.reason || "Payment failed",
          );
          break;

        case "KITCHEN_DONE":
          sagaState.set(orderId, {
            ...state,
            step: "KITCHEN_DONE",
            deliveryAttempts: 1,
          });
          publish("DELIVERY_START_REQUEST", {
            orderId,
            correlationId,
            payload: { address: event.payload.address, attempt: 1 },
          });
          break;

        case "KITCHEN_FAILED":
          sagaState.set(orderId, { ...state, step: "KITCHEN_FAILED" });
          publish("PAYMENT_REFUND_REQUEST", {
            orderId,
            correlationId,
            payload: { reason: "Kitchen failed" },
          });
          break;

        case "PAYMENT_REFUNDED":
          cancelOrder(
            orderId,
            correlationId,
            "Kitchen failed, payment refunded",
          );
          break;

        case "DELIVERY_DONE":
          publish("ORDER_COMPLETED", {
            orderId,
            correlationId,
            payload: { deliveredAt: new Date().toISOString() },
          });
          sagaState.delete(orderId);
          break;

        case "DELIVERY_FAILED": {
          const currentAttempt = Number(
            event.payload.attempt || state.deliveryAttempts || 1,
          );
          if (currentAttempt < DELIVERY_MAX_RETRY) {
            const nextAttempt = currentAttempt + 1;
            sagaState.set(orderId, {
              ...state,
              step: "DELIVERY_RETRY",
              deliveryAttempts: nextAttempt,
            });
            publish("DELIVERY_START_REQUEST", {
              orderId,
              correlationId,
              payload: { address: event.payload.address, attempt: nextAttempt },
            });
          } else {
            cancelOrder(
              orderId,
              correlationId,
              `Delivery failed after ${DELIVERY_MAX_RETRY} retries`,
            );
          }
          break;
        }

        default:
          break;
      }

      log(`Handled ${event.type}`, {
        orderId,
        saga: sagaState.get(orderId) || "ended",
      });
      channel.ack(msg);
    });

    connection.on("close", () => {
      log("RabbitMQ connection closed. Reconnecting...");
      setTimeout(connectBus, 2000);
    });
    connection.on("error", (err) =>
      log("RabbitMQ error", { error: err.message }),
    );

    log("Connected to RabbitMQ");
  } catch (err) {
    log("Failed to connect RabbitMQ", { error: err.message });
    setTimeout(connectBus, 2000);
  }
}

app.get("/health", (_, res) => {
  res.json({
    service: SERVICE_NAME,
    status: "ok",
    deliveryMaxRetry: DELIVERY_MAX_RETRY,
  });
});

app.listen(PORT, () => {
  log(`HTTP server listening on ${PORT}`);
  connectBus();
});
