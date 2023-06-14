"use strict";

const express = require("express");

// Constants
const PORT = 80;

// App
const app = express();
app.get("/", (req, res) => {
  res.send("test 1");
});

app.listen(PORT, () => {
  console.log(`Server1 is running on >> http://localhost:${PORT}`);
});
