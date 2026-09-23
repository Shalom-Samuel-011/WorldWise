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
    // Operational Errors:
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    }
    // Programming or other errors : we don't want to leak information about them, so no message
    else {
        console.error(err);
        res.status(err.statusCode).json({
            status: err.status,
            message: `Something went wrong!`,
        });
    }
};

const handleCastErrorDB = (err) => {
    return new appError(`${err.value} is an invalid ${err.path}`, 404);
};

const handleDuplicateKeyErrorDB = (err) => {
    const fieldName = Object.keys(err.keyValue)[0]; // Get the field that caused the duplicate error
    const fieldValue = err.keyValue[fieldName];
    return new appError(
        `The ${fieldName} '${fieldValue}' already exists. Please use another value!`,
        400,
    );
};

const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data. ${errors.join(". ")}`;
    return new appError(err.message, 400);
};

const handleJWTError = () => {
    return new appError("Please Login Again", 401);
};

const handleTokenExpiredError = () => {
    return new appError("Session timed out!", 401);
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";
    if (process.env.NODE_ENV === "development") {
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV === "production") {
        let error = err;
        console.log(error);
        if (error.name === "CastError") {
            error = handleCastErrorDB(error);
        }
        if (error.code === 11000) {
            error = handleDuplicateKeyErrorDB(error);
        }
        if (error.name === "ValidationError") {
            error = handleValidationErrorDB(error);
        }
        if (error.name === "JsonWebTokenError") {
            error = handleJWTError();
        }
        if (error.name === "TokenExpiredError") {
            error = handleTokenExpiredError();
        }
        sendErrorProd(error, res);
    }

    next();
};
