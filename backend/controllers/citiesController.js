const citiesModel = require("../models/citiesModel");

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
