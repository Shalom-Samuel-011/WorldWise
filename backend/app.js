const express = require("express");
const globalErrorMiddleware = require("./controllers/errorController");
const app = express();

app.use(express.json());

app.use(globalErrorMiddleware);

module.exports = app;
