const express = require("express");

const authController = require("../controllers/authController");
const citiesController = require("../controllers/citiesController");

const citiesRouter = express.Router();

citiesRouter.get("/", authController.protected, citiesController.getCities);

module.exports = citiesRouter;
