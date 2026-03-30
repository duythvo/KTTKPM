const http = require("http");
const express = require("express");
const cors = require("cors");
const { Kafka } = require("kafkajs");
const { WebSocketServer } = require("ws");
const db = require("./db");

const app = express();
const PORT = 4001;

app.use(cors());
app.use(express.json());

const kafka = new Kafka({
  clientId: "eda-demo-consumer",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "eda-demo-group" });

const insertOrderStmt = db.prepare(`
  INSERT OR IGNORE INTO orders (event_id, customer_name, product, amount, status, created_at)
  VALUES (@event_id, @customer_name, @product, @amount, @status, @created_at)
`);

const insertPaymentStmt = db.prepare(`
  INSERT OR IGNORE INTO payments (event_id, order_id, amount, method, status, created_at)
  VALUES (@event_id, @order_id, @amount, @method, @status, @created_at)
`);

const insertNotificationStmt = db.prepare(`
  INSERT OR IGNORE INTO notifications (event_id, user_id, message, channel, created_at)
  VALUES (@event_id, @user_id, @message, @channel, @created_at)
`);

const updateOrderPaidStmt = db.prepare(`
  UPDATE orders
  SET status = 'PAID'
  WHERE event_id = ?
`);

const insertEventLogStmt = db.prepare(`
  INSERT INTO event_log (event_id, topic, payload, processed_at)
  VALUES (?, ?, ?, ?)
`);

const latestEventsStmt = db.prepare(`
  SELECT event_id AS eventId, topic, payload, processed_at AS processedAt
  FROM event_log
  ORDER BY id DESC
  LIMIT 50
`);

const statsStmt = {
  totalOrders: db.prepare("SELECT COUNT(*) AS count FROM orders"),
  totalPayments: db.prepare("SELECT COUNT(*) AS count FROM payments"),
  totalNotifications: db.prepare("SELECT COUNT(*) AS count FROM notifications"),
  totalRevenue: db.prepare(
    "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'SUCCESS'",
  ),
};

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (socket) => {
  socket.send(
    JSON.stringify({ type: "WELCOME", message: "Connected to event stream" }),
  );
});

function broadcast(messageObj) {
  const message = JSON.stringify(messageObj);
  let clientCount = 0;

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
      clientCount += 1;
    }
  });

  return clientCount;
}

function handleEvent(topic, event) {
  const now = new Date().toISOString();

  if (topic === "order.created") {
    insertOrderStmt.run({
      event_id: event.eventId,
      customer_name: event.data.customerName,
      product: event.data.product,
      amount: Number(event.data.amount),
      status: "CREATED",
      created_at: event.timestamp || now,
    });
  }

  if (topic === "payment.processed") {
    insertPaymentStmt.run({
      event_id: event.eventId,
      order_id: String(event.data.orderId),
      amount: Number(event.data.amount),
      method: event.data.method,
      status: "SUCCESS",
      created_at: event.timestamp || now,
    });

    updateOrderPaidStmt.run(String(event.data.orderId));
  }

  if (topic === "notification.sent") {
    insertNotificationStmt.run({
      event_id: event.eventId,
      user_id: String(event.data.userId),
      message: event.data.message,
      channel: event.data.channel,
      created_at: event.timestamp || now,
    });
  }

  insertEventLogStmt.run(event.eventId, topic, JSON.stringify(event), now);

  return now;
}

async function startConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: "order.created", fromBeginning: false });
  await consumer.subscribe({
    topic: "payment.processed",
    fromBeginning: false,
  });
  await consumer.subscribe({
    topic: "notification.sent",
    fromBeginning: false,
  });

  console.log("[CONSUMER] Kafka connected. Waiting for events...");

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const startedAt = Date.now();

      try {
        const parsed = JSON.parse(message.value.toString());
        console.log(
          `[CONSUMER] Received: ${topic} | eventId: ${parsed.eventId}`,
        );

        const processedAt = handleEvent(topic, parsed);
        const processingTime = Date.now() - startedAt;

        console.log(
          `[CONSUMER] Saved to DB | Processing time: ${processingTime}ms`,
        );

        const sent = broadcast({
          type: "NEW_EVENT",
          event: parsed,
          processedAt,
        });

        console.log(`[CONSUMER] WebSocket broadcast -> ${sent} clients`);
      } catch (error) {
        console.error("[CONSUMER] Failed to process event:", error.message);
      }
    },
  });
}

app.get("/api/events", (_req, res) => {
  const rows = latestEventsStmt.all();
  const events = rows.map((row) => ({
    eventId: row.eventId,
    topic: row.topic,
    processedAt: row.processedAt,
    payload: JSON.parse(row.payload),
  }));

  res.json(events);
});

app.get("/api/stats", (_req, res) => {
  res.json({
    totalOrders: statsStmt.totalOrders.get().count,
    totalPayments: statsStmt.totalPayments.get().count,
    totalNotifications: statsStmt.totalNotifications.get().count,
    totalRevenue: statsStmt.totalRevenue.get().total,
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "consumer" });
});

server.listen(PORT, () => {
  console.log(`[CONSUMER] API + WebSocket running at http://localhost:${PORT}`);
  startConsumer().catch((error) => {
    console.error("[CONSUMER] Unable to start Kafka consumer:", error.message);
  });
});

process.on("SIGINT", async () => {
  await consumer.disconnect();
  db.close();
  process.exit(0);
});
