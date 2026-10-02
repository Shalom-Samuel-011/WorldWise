const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

function uploadMemory(file, userId, cityId) {
    return new Promise((resolve, reject) => {
        const upload = cloudinary.uploader.upload_stream(
            {
                folder: `worldwise/${userId}/${cityId}`,
                resource_type: "auto",
                use_filename: true,
                unique_filename: true,
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            },
        );

        upload.end(file.buffer);
    });
}

function deleteMemory(publicId, resourceType) {
    return cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
    });
}

module.exports = { cloudinary, uploadMemory, deleteMemory };
