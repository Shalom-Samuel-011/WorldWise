const mongoose = require("mongoose");

const citiesSchema = new mongoose.Schema({
    cityName: String,
    country: String,
    emoji: String,
    date: Date,
    notes: String,
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
