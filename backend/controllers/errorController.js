const appError = require(`${__dirname}/../utils/appError.js`);

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        error: err,
        stack: err.stack,
    });
};

const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    }
    // Programming or other unknown error: don't leak error details
    else {
        console.error("ERROR 💥", err);
        res.status(500).json({
            status: "error",
            message: "Something went wrong!",
        });
    }
};

const handleCastErrorDB = (err) => {
    return new appError(`${err.value} is an invalid ${err.path}`, 400);
};

const handleDuplicateKeyErrorDB = (err) => {
    // Extract keyValue safely whether it's directly on `err` or nested in `errorResponse`
    const keyValue = err.keyValue || err.errorResponse?.keyValue;

    // Fallback if keyValue is somehow missing
    if (!keyValue) {
        return new appError(
            "Duplicate field value entered. Please use another value!",
            400,
        );
    }

    const fieldName = Object.keys(keyValue)[0];
    const fieldValue = keyValue[fieldName];

    return new appError(
        `The ${fieldName} '${fieldValue}' already exists. Please use another value!`,
        400,
    );
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data. ${errors.join(". ")}`;
    return new appError(message, 400);
};

const handleJWTError = () =>
    new appError("Invalid token. Please log in again!", 401);

const handleTokenExpiredError = () =>
    new appError("Your token has expired! Please log in again.", 401);

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";

    // 1. Create a shallow copy and explicitly preserve non-enumerable props
    let error = { ...err };
    error.message = err.message;
    error.name = err.name;
    error.code = err.code;
    error.keyValue = err.keyValue || err.errorResponse?.keyValue;

    // 2. Transform DB Operational Errors first (applies to both Dev and Prod)
    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateKeyErrorDB(error);
    if (error.name === "ValidationError")
        error = handleValidationErrorDB(error);
    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleTokenExpiredError();

    // 3. Send response based on environment
    if (process.env.NODE_ENV === "development") {
        sendErrorDev(error, res);
    } else if (process.env.NODE_ENV === "production") {
        sendErrorProd(error, res);
    }
};
