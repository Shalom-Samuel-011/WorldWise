const mongoose = require("mongoose");

const memorySchema = new mongoose.Schema({
    publicId: { type: String, required: true },
    url: { type: String, required: true },
    resourceType: { type: String, enum: ["image", "video"], required: true },
    format: String,
    originalName: String,
    bytes: Number,
    createdAt: { type: Date, default: Date.now },
});

const citiesSchema = new mongoose.Schema({
    cityName: String,
    country: String,
    emoji: String,
    date: Date,
    notes: String,
    memories: { type: [memorySchema], default: [] },
    position: {
        type: {
            type: String,
            default: "Point",
        },
        coordinates: [Number],
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
});

const citiesModel = mongoose.model("City", citiesSchema);

module.exports = citiesModel;
