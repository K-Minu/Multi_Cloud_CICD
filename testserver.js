"use strict";

const express = require("express");
const Prometheus = require("prom-client");

const app = express();
const port = 4000;
const checkoutsTotal = new Prometheus.Counter({
  name: "checkouts_total",
  help: "Total number of checkouts",
  labelNames: ["payment_method"],
});

// Runs before each requests
app.use((req, res, next) => {
  res.locals.startEpoch = Date.now();
  next();
});

app.get("/", (req, res, next) => {
  setTimeout(() => {
    res.json({ message: "Hello World!" });
    next();
  }, Math.round(Math.random() * 200));
});

app.get("/bad", (req, res, next) => {
  next(new Error("My Error"));
});

app.get("/checkout", (req, res, next) => {
  const paymentMethod = Math.round(Math.random()) === 0 ? "stripe" : "paypal";

  checkoutsTotal.inc({
    payment_method: paymentMethod,
  });

  res.json({ status: "ok" });
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

const server = app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});
