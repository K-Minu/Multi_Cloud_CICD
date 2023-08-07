"use strict";

const express = require("express");
const Prometheus = require("prom-client");

const app = express();
const port = 80;
const metricsInterval = Prometheus.collectDefaultMetrics();
const checkoutsTotal = new Prometheus.Counter({
  name: "checkouts_total",
  help: "Total number of checkouts",
  labelNames: ["payment_method"],
});
const httpRequestDurationMicroseconds = new Prometheus.Histogram({
  name: "http_request_duration_ms",
  help: "Duration of HTTP requests in ms",
  labelNames: ["method", "route", "code"],
  buckets: [0.1, 5, 15, 50, 100, 200, 300, 400, 500], // buckets for response time from 0.1ms to 500ms
});

// Runs before each requests
app.use((req, res, next) => {
  res.locals.startEpoch = Date.now();
  next();
});

app.get("/", (req, res, next) => {
  res.sendFile(__dirname + "/index.html");
  Math.round(Math.random() * 200);
});

app.get("/bad", (req, res, next) => {
  next(new Error("My Error"));
});

app.get("/checkout", (req, res, next) => {
  let random_num = Math.round(Math.random() * 10);
  const paymentMethod = random_num > 9 ? "fail" : "sucess";
  console.log(`값 >> ${random_num} // ${paymentMethod}`);

  checkoutsTotal.inc({
    payment_method: paymentMethod,
  });

  res.json({ status: "ok" });
  next();
});

app.get("/checkout/fail", (req, res, next) => {
  let random_num = 10;
  const paymentMethod = random_num > 9 ? "fail" : "sucess";
  console.log(`값 >> ${random_num} // ${paymentMethod}`);

  checkoutsTotal.inc({
    payment_method: paymentMethod,
  });

  res.json({ status: "fail ++" });
  next();
});

app.get("/checkout/sucess", (req, res, next) => {
  let random_num = 1;
  const paymentMethod = random_num > 9 ? "fail" : "sucess";
  console.log(`값 >> ${random_num} // ${paymentMethod}`);

  checkoutsTotal.inc({
    payment_method: paymentMethod,
  });

  res.json({ status: "sucess ++" });
  next();
});

app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", Prometheus.register.contentType);
    res.end(await Prometheus.register.metrics());
  } catch (err) {
    res.status(500), ex(err);
  }
});

// Error handler
app.use((err, req, res, next) => {
  res.statusCode = 500;
  // Do not expose your error in production
  res.json({ error: err.message });
  next();
});

// Runs after each requests
app.use((req, res, next) => {
  const responseTimeInMs = Date.now() - res.locals.startEpoch;

  httpRequestDurationMicroseconds
    .labels(req.method, req.route, res.statusCode)
    .observe(responseTimeInMs);

  next();
});

const server = app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  clearInterval(metricsInterval);

  server.close((err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    process.exit(0);
  });
});
