const express = require("express");
const cors = require("cors");

// controllers
const globalErrorMiddleware = require("./controllers/errorController");

// routers
const userRouter = require("./routers/userRouter");

const app = express();

app.use(express.json());

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    }),
);

app.use("/api/v1/users", userRouter);

// globalErrorHandler
app.use(globalErrorMiddleware);

module.exports = app;
