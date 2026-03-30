const express = require("express");
const cors = require("cors");
const axios = require("axios");
const db = require("../../db/database");

const app = express();
const PORT = 3002;
const SHIPPING_SERVICE_URL = "http://localhost:3003";

const COLOR_YELLOW = "\x1b[33m";
const COLOR_RESET = "\x1b[0m";

const paymentAddressMap = new Map();

function log(message) {
  console.log(`${COLOR_YELLOW}[PAYMENT SERVICE]${COLOR_RESET} ${message}`);
}

app.use(cors());
app.use(express.json());

app.post("/payments", (req, res) => {
  log("POST /payments");

  const { order_id, amount, address } = req.body;

  if (!order_id || amount === undefined || amount === null) {
    return res
      .status(400)
      .json({ message: "order_id and amount are required" });
  }

  try {
    const insertPayment = db.prepare(
      "INSERT INTO payments (order_id, amount, status, paid_at) VALUES (?, ?, ?, ?)",
    );
    const result = insertPayment.run(order_id, amount, "pending", null);

    const payment = db
      .prepare(
        "SELECT id, order_id, amount, status, paid_at FROM payments WHERE id = ?",
      )
      .get(result.lastInsertRowid);

    paymentAddressMap.set(payment.id, address || "No address provided");

    return res.status(201).json({ message: "Payment created", payment });
  } catch (error) {
    log(`Error creating payment: ${error.message}`);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/payments", (req, res) => {
  log("GET /payments");

  try {
    const payments = db
      .prepare(
        "SELECT id, order_id, amount, status, paid_at FROM payments ORDER BY id DESC",
      )
      .all();
    return res.json(payments);
  } catch (error) {
    log(`Error fetching payments: ${error.message}`);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.put("/payments/:id/confirm", async (req, res) => {
  log(`PUT /payments/${req.params.id}/confirm`);

  const paymentId = Number(req.params.id);

  try {
    const existingPayment = db
      .prepare(
        "SELECT id, order_id, amount, status, paid_at FROM payments WHERE id = ?",
      )
      .get(paymentId);

    if (!existingPayment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    db.prepare(
      "UPDATE payments SET status = ?, paid_at = CURRENT_TIMESTAMP WHERE id = ?",
    ).run("paid", paymentId);

    const updatedPayment = db
      .prepare(
        "SELECT id, order_id, amount, status, paid_at FROM payments WHERE id = ?",
      )
      .get(paymentId);

    const shippingAddress =
      req.body.address || paymentAddressMap.get(paymentId) || "Unknown address";

    let shipping = null;
    try {
      log("Calling Shipping Service to create shipment...");
      const shippingResponse = await axios.post(
        `${SHIPPING_SERVICE_URL}/shippings`,
        {
          order_id: updatedPayment.order_id,
          address: shippingAddress,
        },
      );
      shipping = shippingResponse.data;
    } catch (error) {
      log(`Shipping Service call failed: ${error.message}`);
    }

    return res.json({
      message: "Payment confirmed",
      payment: updatedPayment,
      shipping,
    });
  } catch (error) {
    log(`Error confirming payment: ${error.message}`);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/health", (req, res) => {
  res.json({ service: "payment", status: "ok", port: PORT });
});

app.listen(PORT, () => {
  log(`Running on http://localhost:${PORT}`);
});
