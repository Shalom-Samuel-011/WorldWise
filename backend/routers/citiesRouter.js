const express = require("express");

const authController = require("../controllers/authController");
const citiesController = require("../controllers/citiesController");

const citiesRouter = express.Router();

citiesRouter.get("/", authController.protected, citiesController.getCities);
citiesRouter.post("/", authController.protected, citiesController.addCity);
citiesRouter.delete(
    "/:id",
    authController.protected,
    citiesController.deleteCity,
);

module.exports = citiesRouter;
