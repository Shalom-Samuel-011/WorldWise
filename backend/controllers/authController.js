const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");

const appError = require("../utils/appError");

const signToken = function (payload) {
    return jwt.sign(payload, process.env.JWT_STRING, {
        expiresIn: process.env.JWT_EXPIRES,
    });
};

const signAndSendToken = function (
    res,
    payload,
    user = false,
    message = "user logged in",
) {
    const token = signToken(payload);

    if (user) {
        res.status(200).json({
            status: "success",
            message,
            user,
            token,
        });
    }

    res.status(200).json({
        status: "success",
        message,
        token,
    });
};

exports.signup = async function (req, res) {
    const { name, email, password, confirmPassword } = req.body;

    const newUser = await userModel.create({
        name,
        email,
        password,
        confirmPassword,
    });

    signAndSendToken(
        res,
        { id: newUser._id },
        newUser,
        "user sucessfully created!",
    );
};

exports.login = async function (req, res, next) {
    const { email, password } = req.body;

    if (!password) {
        return next(new appError("enter your password to login", 401));
    }

    if (!email) {
        return next(new appError("enter your email to login", 401));
    }

    // fetching the user

    const user = await userModel.findOne({ email }).select("+password");

    if (!user) {
        return next(
            new appError("The user with this email does not exist, Sign in!"),
            401,
        );
    }

    // Password verification

    if (!(await user.comparePasswords(password))) {
        return next(new appError("Incorrect password", 401));
    }

    // logging user in

    signAndSendToken(res, { id: user._id });
};
