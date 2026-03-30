const express = require("express");
const amqp = require("amqplib");

const PORT = Number(process.env.PORT || 4003);
const SERVICE_NAME = process.env.SERVICE_NAME || "payment-service";
const RABBIT_URL = process.env.RABBIT_URL || "amqp://localhost:5672";
const EXCHANGE_NAME = process.env.EXCHANGE_NAME || "food.events";
const PAYMENT_FAIL_RATE = Number(process.env.PAYMENT_FAIL_RATE || 0.3);

const app = express();
let channel;

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

async function connectBus() {
  try {
    const connection = await amqp.connect(RABBIT_URL);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });
    const q = await channel.assertQueue(`${SERVICE_NAME}.events`, {
      durable: false,
    });
    await channel.bindQueue(q.queue, EXCHANGE_NAME, "PAYMENT_CHARGE_REQUEST");
    await channel.bindQueue(q.queue, EXCHANGE_NAME, "PAYMENT_REFUND_REQUEST");

    channel.consume(q.queue, (msg) => {
      if (!msg) {
        return;
      }
      const event = JSON.parse(msg.content.toString());

      if (event.type === "PAYMENT_CHARGE_REQUEST") {
        const failed = Math.random() < PAYMENT_FAIL_RATE;
        if (failed) {
          publish("PAYMENT_FAILED", {
            orderId: event.orderId,
            correlationId: event.correlationId,
            payload: {
              reason: `Random payment failure (${PAYMENT_FAIL_RATE})`,
            },
          });
        } else {
          publish("PAYMENT_SUCCESS", {
            orderId: event.orderId,
            correlationId: event.correlationId,
            payload: { transactionId: `tx-${Date.now()}` },
          });
        }
      }

      if (event.type === "PAYMENT_REFUND_REQUEST") {
        publish("PAYMENT_REFUNDED", {
          orderId: event.orderId,
          correlationId: event.correlationId,
          payload: { reason: event.payload.reason || "Refund completed" },
        });
      }

      log(`Handled ${event.type}`, { orderId: event.orderId });
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
    paymentFailRate: PAYMENT_FAIL_RATE,
  });
});

app.listen(PORT, () => {
  log(`HTTP server listening on ${PORT}`);
  connectBus();
});
