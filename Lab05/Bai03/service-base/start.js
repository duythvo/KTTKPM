const concurrently = require("concurrently");

const projectRoot = __dirname;

concurrently(
  [
    {
      command: "node gateway/index.js",
      name: "gateway",
      prefixColor: "blue",
      cwd: projectRoot
    },
    {
      command: "node services/order/index.js",
      name: "order",
      prefixColor: "yellow",
      cwd: projectRoot
    },
    {
      command: "node services/payment/index.js",
      name: "payment",
      prefixColor: "magenta",
      cwd: projectRoot
    },
    {
      command: "node services/shipping/index.js",
      name: "shipping",
      prefixColor: "cyan",
      cwd: projectRoot
    }
  ],
  {
    prefix: "[{name}]",
    killOthersOn: ["failure"]
  }
)
  .result.then(() => {
    console.log("All services exited.");
  })
  .catch((error) => {
    console.error("One or more services failed to start:", error.message);
    process.exit(1);
  });
