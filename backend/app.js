const express = require("express");

// controllers
const globalErrorMiddleware = require("./controllers/errorController");

// routers
const userRouter = require("./routers/userRouter");

const app = express();

app.use(express.json());

app.use("/api/v1/users", userRouter);

// globalErrorHandler
app.use(globalErrorMiddleware);

module.exports = app;
