const express = require("express");
const cors = require("cors");
const axios = require("axios");
const db = require("../../db/database");

const app = express();
const PORT = 3001;
const PAYMENT_SERVICE_URL = "http://localhost:3002";

const COLOR_BLUE = "\x1b[34m";
const COLOR_RESET = "\x1b[0m";

function log(message) {
  console.log(`${COLOR_BLUE}[ORDER SERVICE]${COLOR_RESET} ${message}`);
}

app.use(cors());
app.use(express.json());

app.post("/orders", async (req, res) => {
  log("POST /orders");

  const { customer_name, product, amount, address } = req.body;

  if (!customer_name || !product || amount === undefined || amount === null) {
    return res.status(400).json({ message: "customer_name, product, amount are required" });
  }

  try {
    const insertOrder = db.prepare(
      "INSERT INTO orders (customer_name, product, amount, status) VALUES (?, ?, ?, ?)"
    );
    const result = insertOrder.run(customer_name, product, amount, "pending");

    const order = db
      .prepare("SELECT id, customer_name, product, amount, status, created_at FROM orders WHERE id = ?")
      .get(result.lastInsertRowid);

    let payment = null;
    try {
      log("Calling Payment Service to create payment...");
      const paymentResponse = await axios.post(`${PAYMENT_SERVICE_URL}/payments`, {
        order_id: order.id,
        amount: order.amount,
        address: address || "No address provided"
      });
      payment = paymentResponse.data;
    } catch (error) {
      log(`Payment Service call failed: ${error.message}`);
    }

    return res.status(201).json({
      message: "Order created",
      order,
      payment
    });
  } catch (error) {
    log(`Error creating order: ${error.message}`);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/orders", (req, res) => {
  log("GET /orders");

  try {
    const orders = db
      .prepare("SELECT id, customer_name, product, amount, status, created_at FROM orders ORDER BY id DESC")
      .all();
    return res.json(orders);
  } catch (error) {
    log(`Error fetching orders: ${error.message}`);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/health", (req, res) => {
  res.json({ service: "order", status: "ok", port: PORT });
});

app.listen(PORT, () => {
  log(`Running on http://localhost:${PORT}`);
});
