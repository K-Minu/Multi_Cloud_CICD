"use strict";

const express = require("express");

// Constants
const PORT = 80;

// App
const app = express();
app.get("/", (req, res) => {
  res.send("Hello World notification test ~ ~");
});

app.listen(PORT, () => {
  console.log(`Server1 is running on >> http://localhost:${PORT}`);
});
