const appError = require("../utils/appError");
const validator = require("validator");
const { uploadProfileImage, deleteMemory } = require("../utils/cloudinary");

exports.getProfile = async function (req, res) {
    res.status(200).json({
        status: "success",
        user: {
            name: req.user.name,
            email: req.user.email,
            phoneNumber: req.user.phoneNumber,
            avatar: req.user.avatar,
            hasPassword: req.user.hasPassword,
        },
    });
};

exports.updateProfile = async function (req, res, next) {
    const { name, email, phoneNumber } = req.body;

    if (name !== undefined) {
        if (typeof name !== "string" || !name.trim())
            return next(new appError("Name cannot be empty", 400));
        req.user.name = name.trim();
    }

    if (email !== undefined) {
        if (typeof email !== "string" || !validator.isEmail(email.trim()))
            return next(new appError("Enter a valid email address", 400));
        req.user.email = email.trim().toLowerCase();
    }

    if (phoneNumber !== undefined) {
        if (typeof phoneNumber !== "string")
            return next(new appError("Enter a valid phone number", 400));
        req.user.phoneNumber = phoneNumber.trim();
    }

    await req.user.save({ validateBeforeSave: false });

    res.status(200).json({
        status: "success",
        user: {
            name: req.user.name,
            email: req.user.email,
            phoneNumber: req.user.phoneNumber,
            avatar: req.user.avatar,
        },
    });
};

exports.uploadAvatar = async function (req, res, next) {
    if (!req.file) return next(new appError("Choose an image to upload", 400));

    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
        process.env;
    if (
        !CLOUDINARY_CLOUD_NAME ||
        !CLOUDINARY_API_KEY ||
        !CLOUDINARY_API_SECRET
    ) {
        return next(
            new appError("Profile image uploads are not configured", 503),
        );
    }

    const asset = await uploadProfileImage(req.file, req.user._id);
    const previousPublicId = req.user.avatarPublicId;

    try {
        req.user.avatar = asset.secure_url;
        req.user.avatarPublicId = asset.public_id;
        await req.user.save({ validateBeforeSave: false });
    } catch (error) {
        await deleteMemory(asset.public_id, "image").catch(() => {});
        return next(error);
    }

    if (previousPublicId && previousPublicId !== asset.public_id) {
        await deleteMemory(previousPublicId, "image").catch((error) => {
            console.error("Could not remove the previous profile image", error);
        });
    }

    res.status(200).json({
        status: "success",
        user: {
            name: req.user.name,
            email: req.user.email,
            avatar: req.user.avatar,
        },
    });
};
