const express = require("express");
const multer = require("multer");
const rateLimit = require("express-rate-limit");
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const appError = require("../utils/appError");

const userRouter = express.Router();
const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        status: "fail",
        message: "Too many password reset attempts. Please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
const uploadAvatar = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, callback) => {
        if (file.mimetype.startsWith("image/")) return callback(null, true);
        callback(new appError("Profile pictures must be images", 400));
    },
});

userRouter.post("/signup", authController.signup);
userRouter.post("/login", authController.login);
userRouter.post(
    "/forgot-password",
    passwordResetLimiter,
    authController.forgotPassword,
);
userRouter.post(
    "/reset-password/:token",
    passwordResetLimiter,
    authController.resetPassword,
);
userRouter.post("/google", authController.googleAuth);
userRouter.get("/profile", authController.protected, userController.getProfile);
userRouter.patch(
    "/profile",
    authController.protected,
    userController.updateProfile,
);
userRouter.patch(
    "/password",
    authController.protected,
    authController.changePassword,
);
userRouter.post(
    "/profile/avatar",
    authController.protected,
    uploadAvatar.single("avatar"),
    userController.uploadAvatar,
);
userRouter.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        const message =
            err.code === "LIMIT_FILE_SIZE"
                ? "Profile pictures must be 10 MB or smaller"
                : "Upload one profile picture at a time";
        return next(new appError(message, 400));
    }

    next(err);
});

module.exports = userRouter;
