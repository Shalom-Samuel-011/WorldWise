const util = require("util");

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

    res.cookie("jwt", token, {
        expires: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        sameSite: "none",
        secure: process.env.NODE_ENV === "production",
    });

    if (user) {
        return res.status(200).json({
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

    if (!password && !email)
        return next(new appError("Enter the credentials to log in", 401));

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
            new appError(
                "The user with this email does not exist, Sign up!",
                401,
            ),
        );
    }

    // Password verification

    if (!(await user.comparePasswords(password))) {
        return next(new appError("Incorrect password", 401));
    }

    // logging user in

    signAndSendToken(res, { id: user._id }, user);
};

exports.protected = async function (req, res, next) {
    const token = req.headers.authorization?.startsWith("Bearer")
        ? req.headers.authorization.split(" ")[1]
        : undefined;

    // checking if the token exists
    if (!token) {
        return next(
            new appError("You need to log in to access this page", 401),
        );
    }

    // verifying the token
    const data = await util.promisify(jwt.verify)(
        token,
        process.env.JWT_STRING,
    );

    // checking if the password has been changed since the issueing of the token

    const user = await userModel.findById(data.id);
    console.log(user);
    console.log(data);

    if (user.passwordChanged(data.iat)) {
        return next(
            new appError("Password was changed after last log in", 401),
        );
    }

    // authorizing user
    req.user = user;

    next();
};
