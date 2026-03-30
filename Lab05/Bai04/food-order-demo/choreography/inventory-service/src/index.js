const express = require("express");
const amqp = require("amqplib");

const PORT = Number(process.env.PORT || 3002);
const SERVICE_NAME = process.env.SERVICE_NAME || "inventory-service";
const RABBIT_URL = process.env.RABBIT_URL || "amqp://localhost:5672";
const EXCHANGE_NAME = process.env.EXCHANGE_NAME || "food.events";

const app = express();
let channel;

const stock = new Map([
  ["burger", 1000],
  ["pizza", 1000],
  ["tea", 1000],
  ["cola", 1000],
]);

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

function reserveItems(items) {
  const missing = [];
  for (const item of items) {
    const key = item.sku || item.name || item.id || "unknown";
    const qty = Number(item.quantity || 1);
    const current = stock.has(key) ? stock.get(key) : 1000;
    if (qty > current) {
      missing.push({ item: key, requested: qty, available: current });
    }
  }
  if (missing.length > 0) {
    return { ok: false, missing };
  }
  for (const item of items) {
    const key = item.sku || item.name || item.id || "unknown";
    const qty = Number(item.quantity || 1);
    const current = stock.has(key) ? stock.get(key) : 1000;
    stock.set(key, current - qty);
  }
  return { ok: true };
}

async function connectBus() {
  try {
    const connection = await amqp.connect(RABBIT_URL);
    channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });
    const q = await channel.assertQueue(`${SERVICE_NAME}.events`, {
      durable: false,
    });
    await channel.bindQueue(q.queue, EXCHANGE_NAME, "ORDER_CREATED");

    channel.consume(q.queue, (msg) => {
      if (!msg) {
        return;
      }
      const event = JSON.parse(msg.content.toString());
      if (event.type !== "ORDER_CREATED") {
        channel.ack(msg);
        return;
      }

      const items = event.payload.items || [];
      const reservation = reserveItems(items);
      if (!reservation.ok) {
        publish("INVENTORY_FAILED", {
          orderId: event.orderId,
          correlationId: event.correlationId,
          payload: {
            reason: "Insufficient stock",
            missing: reservation.missing,
          },
        });
      } else {
        publish("INVENTORY_RESERVED", {
          orderId: event.orderId,
          correlationId: event.correlationId,
          payload: { reserved: true },
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
  res.json({ service: SERVICE_NAME, status: "ok" });
});

app.listen(PORT, () => {
  log(`HTTP server listening on ${PORT}`);
  connectBus();
});
