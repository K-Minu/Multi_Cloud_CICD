"use strict";

const express = require("express");
const Prometheus = require("prom-client");
const bodyParser = require("body-parser");
const axios = require("axios");
const register = new Prometheus.Registry();
const repeatCount = 100;

const app = express();
const port = 80;
const defaulturl =
  "https://sdp-test-app2.livelybeach-1db350aa.koreacentral.azurecontainerapps.io/metrics";
const replicaId = "SDP_POC_APP_ID";

let playBtn;
const requests = Array.from({ length: repeatCount }, () =>
  axios.get(defaulturl)
);
const targetWords = [replicaId];
let tmpTwo = 0;
let tmpBool = false;

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
const replicaNameMetric = new Prometheus.Gauge({
  name: "replica_name",
  help: "Name of the current replica",
  labelNames: ["replica_id"],
});

// Set replica name based on your identification method
replicaNameMetric.labels(replicaId).set(0);

// Register the metric
register.registerMetric(replicaNameMetric);

// Runs before each requests
app.use((req, res, next) => {
  res.locals.startEpoch = Date.now();
  next();
});

app.use(bodyParser.json());

app.get("/", (req, res, next) => {
  res.sendFile(__dirname + "/index.html");
  Math.round(Math.random() * 200);
});

app.get("/bad", (req, res, next) => {
  next(new Error("My Error"));
});

Promise.all(requests)
  .then((responses) => {
    responses.forEach((response, index) => {
      const metricsData = response.data;
      const lines = metricsData.split("\n");
      const tmpWord = {};
      let tmpOne;
      for (const line of lines) {
        for (const word of targetWords) {
          if (line.includes(word)) {
            const startIndex = line.indexOf(word) + word.length;
            const restOfLine = line.slice(startIndex).trim();
            const wordAfterSpace = restOfLine.split(" ")[1];
            tmpWord[word] = parseInt(wordAfterSpace);
          }
        }
      }
      tmpOne = tmpWord.SDP_POC_APP_ID;
      if (tmpTwo < tmpOne) {
        tmpTwo = tmpOne;
        tmpBool = true;
      }
      // console.log(`Extracted Last Three Characters ${index}:`, tmpTwo);
    });
    if (tmpBool) {
      tmpTwo++;
      replicaNameMetric.labels(replicaId).set(tmpTwo);
      // console.log(`Replica Num >> ${tmpTwo}`);
    } else {
      replicaNameMetric.labels(replicaId).set(1);
    }
  })
  .catch((error) => {
    console.error("Error:", error);
  });

/*
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
*/

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

// checkout 페이지 이동 없이 metric Data 입력 버튼 이벤트 추가
app.post("/clicked", (req, res) => {
  const receivedData = req.body;

  if (receivedData.message) {
    checkoutsTotal.inc({
      payment_method: "sucess",
    });
  } else {
    checkoutsTotal.inc({
      payment_method: "fail",
    });
  }
  res.json({ message: "Click event received on the server" });
});

// 버튼 클릭시 일정 시간동안 계속 metrics Data 입력 하는 이벤트 추가
app.post("/sendData", (req, res) => {
  const receivedData = req.body;

  if (receivedData.message) {
    playBtn = setInterval(function () {
      checkoutsTotal.inc({
        payment_method: "sucess",
      });
    }, 60000);
  } else {
    clearInterval(playBtn);
  }
  res.json({ message: "Interval event received on the server" });
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
