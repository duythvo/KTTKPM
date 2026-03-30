const express = require("express");
const amqp = require("amqplib");
const { v4: uuidv4 } = require("uuid");

const PORT = Number(process.env.PORT || 4001);
const SERVICE_NAME = process.env.SERVICE_NAME || "order-service";
const RABBIT_URL = process.env.RABBIT_URL || "amqp://localhost:5672";
const EXCHANGE_NAME = process.env.EXCHANGE_NAME || "food.events";

const app = express();
app.use((_, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept",
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});
app.use(express.json());

const orders = new Map();
let channel;

function log(message, data) {
  const extra = data ? ` ${JSON.stringify(data)}` : "";
  console.log(`[${SERVICE_NAME}] ${message}${extra}`);
}

function pushHistory(order, status, note) {
  order.status = status;
  order.updatedAt = new Date().toISOString();
  order.history.push({ status, note, at: order.updatedAt });
}

function publish(type, event) {
  if (!channel) {
    log("Skip publish because RabbitMQ channel is not ready", {
      type,
      orderId: event.orderId,
    });
    return false;
  }
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
    correlationId: message.correlationId,
    payload: message.payload,
  });
  return true;
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
      const order = orders.get(event.orderId);
      if (!order) {
        channel.ack(msg);
        return;
      }

      const note =
        event.payload && event.payload.reason
          ? event.payload.reason
          : "State updated from event";
      switch (event.type) {
        case "INVENTORY_RESERVED":
        case "INVENTORY_FAILED":
        case "PAYMENT_SUCCESS":
        case "PAYMENT_FAILED":
        case "KITCHEN_DONE":
        case "KITCHEN_FAILED":
        case "PAYMENT_REFUNDED":
        case "DELIVERY_DONE":
        case "DELIVERY_FAILED":
        case "ORDER_COMPLETED":
        case "ORDER_CANCELLED":
          pushHistory(order, event.type, note);
          break;
        default:
          break;
      }

      log(`Handled ${event.type}`, {
        orderId: event.orderId,
        status: order.status,
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

app.post("/orders", (req, res) => {
  const { items, totalAmount, address } = req.body;
  if (
    !Array.isArray(items) ||
    items.length === 0 ||
    !Number.isFinite(totalAmount) ||
    !address
  ) {
    return res.status(400).json({
      message:
        "Invalid payload. Required: items[], totalAmount(number), address(string).",
    });
  }

  const id = uuidv4();
  const order = {
    id,
    items,
    totalAmount,
    address,
    status: "ORDER_CREATED",
    history: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  pushHistory(order, "ORDER_CREATED", "Order accepted from API");
  orders.set(id, order);

  const published = publish("ORDER_CREATED", {
    orderId: id,
    correlationId: id,
    payload: { items, totalAmount, address },
  });

  if (!published) {
    orders.delete(id);
    return res.status(503).json({
      message: "Order service is warming up. Please retry in a moment.",
    });
  }

  return res.status(201).json(order);
});

app.get("/orders/:id", (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  return res.json(order);
});

app.get("/health", (_, res) => {
  res.json({ service: SERVICE_NAME, status: "ok" });
});

app.listen(PORT, () => {
  log(`HTTP server listening on ${PORT}`);
  connectBus();
});
