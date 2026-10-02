const express = require("express");
const multer = require("multer");

const authController = require("../controllers/authController");
const citiesController = require("../controllers/citiesController");
const appError = require("../utils/appError");

const citiesRouter = express.Router();
const uploadMemory = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, callback) => {
        if (
            file.mimetype.startsWith("image/") ||
            file.mimetype.startsWith("video/")
        ) {
            return callback(null, true);
        }

        callback(new appError("Memories must be images or videos", 400));
    },
});

citiesRouter.get("/", authController.protected, citiesController.getCities);
citiesRouter.post("/", authController.protected, citiesController.addCity);
citiesRouter.delete(
    "/:id",
    authController.protected,
    citiesController.deleteCity,
);
citiesRouter.post(
    "/:id/memories",
    authController.protected,
    uploadMemory.single("memory"),
    citiesController.addMemory,
);
citiesRouter.delete(
    "/:id/memories/:memoryId",
    authController.protected,
    citiesController.deleteMemory,
);

citiesRouter.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        const message =
            err.code === "LIMIT_FILE_SIZE"
                ? "Each memory must be 50 MB or smaller"
                : "Only one memory can be uploaded at a time";
        return next(new appError(message, 400));
    }

    next(err);
});

module.exports = citiesRouter;
