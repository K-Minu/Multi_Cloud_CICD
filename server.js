"use strict";

// const express = require("express");
// // Constants
// const PORT = 80;

// // App
// const app = express();
// app.get("/", (req, res) => {
//   res.sendFile(__dirname + "/index.html");
// });

// app.listen(PORT, () => {
//   console.log(`Server1 is running on >> http://localhost:${PORT}`);
// });

const Koa = require("koa");
const Router = require("koa-router");
const app = new Koa();
const router = new Router();
const port = 80;
const { Prometheus } = require("./metrics");

router.get("/", async (ctx) => {
  ctx.body = "Home";
});

router.get("/metrics", async (ctx) => {
  const { metrics, contentType } = await Prometheus.get();
  ctx.set("Content-Type", contentType);
  ctx.body = metrics;
});
router.get("/metrics/:name", (ctx) => {
  const { name } = ctx.params;
  const randomNumber = Math.round(Math.random() * 10);
  console.info(name, randomNumber);
  Prometheus.add({ name, data: randomNumber });
  ctx.body = "done";
});
app.use(router.routes());
app.use(router.allowedMethods());
app.listen(port, () => {
  console.info(`Server is running on >> http://localhost:${port}`);
});
