const mongoose = require("mongoose");

const tempData = [
    {
        cityName: "Lisbon",
        country: "Portugal",
        emoji: "🇵🇹",
        date: "2027-10-31T15:59:59.138Z",
        notes: "My favorite city so far!",
        position: {
            lat: 38.727881642324164,
            lng: -9.140900099907554,
        },
        id: "73930385",
        user: "6ab3d0c1640e8b86f5e98fcc",
    },
    {
        cityName: "Madrid",
        country: "Spain",
        emoji: "🇪🇸",
        date: "2027-07-15T08:22:53.976Z",
        notes: "",
        position: {
            lat: 40.46635901755316,
            lng: -3.7133789062500004,
        },
        id: "17806751",
        user: "6ab3d0c1640e8b86f5e98fcc",
    },
    {
        id: "a6c2",
        cityName: "Delhi",
        country: "India",
        emoji: "🇮🇳",
        date: "2025-08-09T19:22:17.355Z",
        notes: "mera ghar\n",
        position: {
            lat: 28.590920690273038,
            lng: 77.21740722656251,
        },
        user: "6ab3d0c1640e8b86f5e98fcc",
    },
];

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

citiesSchema.statics.seedTempData = async function () {
    const cityCount = await this.countDocuments();

    if (cityCount === 0) {
        await this.create(tempData);
    }
};

const citiesModel = mongoose.model("City", citiesSchema);

module.exports = citiesModel;
