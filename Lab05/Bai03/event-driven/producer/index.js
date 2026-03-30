const express = require("express");
const cors = require("cors");
const { Kafka } = require("kafkajs");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = 4000;
const TOPICS = ["order.created", "payment.processed", "notification.sent"];

app.use(cors());
app.use(express.json());

const kafka = new Kafka({
  clientId: "eda-demo-producer",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});

const producer = kafka.producer();
let kafkaConnected = false;

async function connectKafka() {
  try {
    await producer.connect();
    kafkaConnected = true;

    const admin = kafka.admin();
    await admin.connect();
    await admin.createTopics({
      waitForLeaders: true,
      topics: TOPICS.map((topic) => ({
        topic,
        numPartitions: 1,
        replicationFactor: 1,
      })),
    });
    await admin.disconnect();

    console.log("[PRODUCER] Kafka connected and topics ready.");
  } catch (error) {
    kafkaConnected = false;
    console.error("[PRODUCER] Kafka connection error:", error.message);
  }
}

async function publishEvent(topic, eventType, data) {
  if (!kafkaConnected) {
    throw new Error("Kafka is not connected");
  }

  const event = {
    eventId: uuidv4(),
    eventType,
    topic,
    timestamp: new Date().toISOString(),
    data,
  };

  console.log(
    `[PRODUCER] Publishing event: ${eventType} | eventId: ${event.eventId}`,
  );

  await producer.send({
    topic,
    messages: [{ key: event.eventId, value: JSON.stringify(event) }],
  });

  return event;
}

app.post("/api/events/order", async (req, res) => {
  try {
    const { customerName, product, amount } = req.body;
    if (!customerName || !product || Number.isNaN(Number(amount))) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const event = await publishEvent("order.created", "order.created", {
      customerName,
      product,
      amount: Number(amount),
    });

    return res.status(201).json({ message: "Order event published", event });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/events/payment", async (req, res) => {
  try {
    const { orderId, amount, method } = req.body;
    if (!orderId || Number.isNaN(Number(amount)) || !method) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const event = await publishEvent("payment.processed", "payment.processed", {
      orderId,
      amount: Number(amount),
      method,
    });

    return res.status(201).json({ message: "Payment event published", event });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/events/notify", async (req, res) => {
  try {
    const { userId, message, channel } = req.body;
    if (!userId || !message || !channel) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const event = await publishEvent("notification.sent", "notification.sent", {
      userId,
      message,
      channel,
    });

    return res
      .status(201)
      .json({ message: "Notification event published", event });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    kafka: kafkaConnected ? "connected" : "disconnected",
    topics: TOPICS,
  });
});

app.listen(PORT, () => {
  console.log(`[PRODUCER] API is running at http://localhost:${PORT}`);
  connectKafka();
});

process.on("SIGINT", async () => {
  await producer.disconnect();
  process.exit(0);
});
