const citiesModel = require("../models/citiesModel");
const appError = require("../utils/appError");

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
    const deletedCity = await citiesModel.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id,
    });

    if (!deletedCity) {
        return next(new appError("City not found", 404));
    }

    res.status(200).json({
        status: "success",
        message: "deleted",
        data: deletedCity,
    });
};
