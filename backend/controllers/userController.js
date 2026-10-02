const appError = require("../utils/appError");
const { uploadProfileImage, deleteMemory } = require("../utils/cloudinary");

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
