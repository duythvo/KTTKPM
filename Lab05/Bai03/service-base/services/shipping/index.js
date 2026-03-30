const express = require("express");
const cors = require("cors");
const db = require("../../db/database");

const app = express();
const PORT = 3003;

const COLOR_CYAN = "\x1b[36m";
const COLOR_RESET = "\x1b[0m";

function log(message) {
  console.log(`${COLOR_CYAN}[SHIPPING SERVICE]${COLOR_RESET} ${message}`);
}

app.use(cors());
app.use(express.json());

app.post("/shippings", (req, res) => {
  log("POST /shippings");

  const { order_id, address } = req.body;

  if (!order_id || !address) {
    return res.status(400).json({ message: "order_id and address are required" });
  }

  try {
    const insertShipping = db.prepare(
      "INSERT INTO shippings (order_id, address, status, shipped_at) VALUES (?, ?, ?, ?)"
    );
    const result = insertShipping.run(order_id, address, "pending", null);

    const shipping = db
      .prepare("SELECT id, order_id, address, status, shipped_at FROM shippings WHERE id = ?")
      .get(result.lastInsertRowid);

    return res.status(201).json({ message: "Shipment created", shipping });
  } catch (error) {
    log(`Error creating shipment: ${error.message}`);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/shippings", (req, res) => {
  log("GET /shippings");

  try {
    const shippings = db
      .prepare("SELECT id, order_id, address, status, shipped_at FROM shippings ORDER BY id DESC")
      .all();
    return res.json(shippings);
  } catch (error) {
    log(`Error fetching shipments: ${error.message}`);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.put("/shippings/:id/ship", (req, res) => {
  log(`PUT /shippings/${req.params.id}/ship`);

  const shippingId = Number(req.params.id);

  try {
    const existingShipping = db
      .prepare("SELECT id, order_id, address, status, shipped_at FROM shippings WHERE id = ?")
      .get(shippingId);

    if (!existingShipping) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    db.prepare("UPDATE shippings SET status = ?, shipped_at = CURRENT_TIMESTAMP WHERE id = ?").run(
      "shipped",
      shippingId
    );

    const updatedShipping = db
      .prepare("SELECT id, order_id, address, status, shipped_at FROM shippings WHERE id = ?")
      .get(shippingId);

    return res.json({ message: "Shipment marked shipped", shipping: updatedShipping });
  } catch (error) {
    log(`Error shipping order: ${error.message}`);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/health", (req, res) => {
  res.json({ service: "shipping", status: "ok", port: PORT });
});

app.listen(PORT, () => {
  log(`Running on http://localhost:${PORT}`);
});
