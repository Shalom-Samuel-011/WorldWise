const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

// controllers
const globalErrorMiddleware = require("./controllers/errorController");

const app = express();

const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 1000,
    message: "Too many requests from this IP. Please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
});

// routers
const userRouter = require("./routers/userRouter");
const citiesRouter = require("./routers/citiesRouter");

// Middlewares

app.use(express.json());
app.use(limiter);

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
