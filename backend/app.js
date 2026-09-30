const express = require("express");
const cors = require("cors");

// controllers
const globalErrorMiddleware = require("./controllers/errorController");

// routers
const userRouter = require("./routers/userRouter");
const citiesRouter = require("./routers/citiesRouter");

const app = express();

// Middlewares

app.use(express.json());

app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "https://world-wise-shalom23.vercel.app",
        ],
        credentials: true,
    }),
);

// Routers

app.use("/api/v1/users", userRouter);
app.use("/api/v1/cities", citiesRouter);

// globalErrorHandler

app.use(globalErrorMiddleware);

module.exports = app;
