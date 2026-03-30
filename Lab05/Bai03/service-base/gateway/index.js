const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = 3000;

const ORDER_SERVICE_URL = "http://localhost:3001";
const PAYMENT_SERVICE_URL = "http://localhost:3002";
const SHIPPING_SERVICE_URL = "http://localhost:3003";

const COLOR_GREEN = "\x1b[32m";
const COLOR_RESET = "\x1b[0m";

function log(message) {
  console.log(`${COLOR_GREEN}[GATEWAY]${COLOR_RESET} ${message}`);
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "frontend")));

async function forwardRequest(req, res, serviceName, serviceUrl, targetPath) {
  const targetUrl = `${serviceUrl}${targetPath}`;
  log(`Routing ${req.method} ${req.originalUrl} -> ${targetUrl}`);

  try {
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      params: req.query,
      headers: {
        "Content-Type": "application/json"
      },
      validateStatus: () => true
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    log(`Forwarding error: ${error.message}`);
    return res.status(502).json({
      message: "Bad gateway",
      error: error.message
    });
  }
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

app.get("/api/orders", (req, res) => forwardRequest(req, res, "order", ORDER_SERVICE_URL, "/orders"));
app.post("/api/orders", (req, res) => forwardRequest(req, res, "order", ORDER_SERVICE_URL, "/orders"));

app.get("/api/payments", (req, res) => forwardRequest(req, res, "payment", PAYMENT_SERVICE_URL, "/payments"));
app.post("/api/payments", (req, res) => forwardRequest(req, res, "payment", PAYMENT_SERVICE_URL, "/payments"));
app.put("/api/payments/:id/confirm", (req, res) =>
  forwardRequest(req, res, "payment", PAYMENT_SERVICE_URL, `/payments/${req.params.id}/confirm`)
);

app.get("/api/shippings", (req, res) =>
  forwardRequest(req, res, "shipping", SHIPPING_SERVICE_URL, "/shippings")
);
app.post("/api/shippings", (req, res) =>
  forwardRequest(req, res, "shipping", SHIPPING_SERVICE_URL, "/shippings")
);
app.put("/api/shippings/:id/ship", (req, res) =>
  forwardRequest(req, res, "shipping", SHIPPING_SERVICE_URL, `/shippings/${req.params.id}/ship`)
);

app.get("/health", async (req, res) => {
  log("Checking service health status");

  const checks = [
    { name: "order", url: `${ORDER_SERVICE_URL}/health` },
    { name: "payment", url: `${PAYMENT_SERVICE_URL}/health` },
    { name: "shipping", url: `${SHIPPING_SERVICE_URL}/health` }
  ];

  const results = await Promise.all(
    checks.map(async (service) => {
      try {
        const response = await axios.get(service.url, { timeout: 1500 });
        return {
          service: service.name,
          status: response.data.status || "ok",
          details: response.data
        };
      } catch (error) {
        return {
          service: service.name,
          status: "down",
          error: error.message
        };
      }
    })
  );

  const overall = results.every((item) => item.status === "ok") ? "ok" : "degraded";

  return res.json({
    gateway: "ok",
    overall,
    services: results
  });
});

app.listen(PORT, () => {
  log(`Running on http://localhost:${PORT}`);
});
