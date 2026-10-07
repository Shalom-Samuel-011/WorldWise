const citiesModel = require("../models/citiesModel");
const appError = require("../utils/appError");
const { uploadMemory, deleteMemory } = require("../utils/cloudinary");

function ensureCloudinaryConfigured(
    next,
    message = "Memory uploads are not configured on the server",
) {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
        process.env;

    if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
        return true;
    }

    next(new appError(message, 503));
    return false;
}

exports.getCities = async function (req, res) {
    console.log(req.user);
    const cities = await citiesModel.find({ user: req.user._id });

    res.status(201).json({
        status: "success",
        message: "ye lo",
        length: cities.length,
        cities,
    });
};

exports.addCity = async function (req, res) {
    const user = req.user;
    const { cityName, country, emoji, date, notes, position } = req.body;

    const newCity = await citiesModel.create({
        cityName,
        country,
        emoji,
        date,
        notes,
        position,
        user: user._id,
    });

    res.status(201).json({
        status: "success",
        message: "City Added",
        data: newCity,
    });
};

exports.deleteCity = async function (req, res, next) {
    const city = await citiesModel.findOne({
        _id: req.params.id,
        user: req.user._id,
    });

    if (!city) return next(new appError("City not found", 404));

    if (
        city.memories.length &&
        !ensureCloudinaryConfigured(
            next,
            "This city has saved photos or videos that cannot be removed right now. Please contact the site owner.",
        )
    )
        return;
    await Promise.all(
        city.memories.map((memory) =>
            deleteMemory(memory.publicId, memory.resourceType),
        ),
    );
    await city.deleteOne();

    res.status(200).json({
        status: "success",
        message: "deleted",
        data: city,
    });
};

exports.addMemory = async function (req, res, next) {
    if (!req.file) return next(new appError("Choose an image or video", 400));
    if (!ensureCloudinaryConfigured(next)) return;

    const city = await citiesModel.findOne({
        _id: req.params.id,
        user: req.user._id,
    });

    if (!city) return next(new appError("City not found", 404));

    const asset = await uploadMemory(req.file, req.user._id, city._id);
    const memory = {
        publicId: asset.public_id,
        url: asset.secure_url,
        resourceType: asset.resource_type,
        format: asset.format,
        originalName: req.file.originalname,
        bytes: asset.bytes,
    };

    try {
        city.memories.push(memory);
        await city.save();
    } catch (error) {
        await deleteMemory(asset.public_id, asset.resource_type).catch(
            () => {},
        );
        return next(error);
    }

    res.status(201).json({
        status: "success",
        data: city.memories[city.memories.length - 1],
    });
};

exports.deleteMemory = async function (req, res, next) {
    if (!ensureCloudinaryConfigured(next)) return;

    const city = await citiesModel.findOne({
        _id: req.params.id,
        user: req.user._id,
    });

    if (!city) return next(new appError("City not found", 404));

    const memory = city.memories.id(req.params.memoryId);
    if (!memory) return next(new appError("Memory not found", 404));

    await deleteMemory(memory.publicId, memory.resourceType);
    memory.deleteOne();
    await city.save();

    res.status(200).json({ status: "success", message: "Memory deleted" });
};
