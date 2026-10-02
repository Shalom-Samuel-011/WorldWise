const util = require("util");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");

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

exports.googleAuth = async function (req, res, next) {
    const { credential } = req.body;
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
        return next(new appError("Google sign-in is not configured", 503));
    }
    if (!credential) {
        return next(
            new appError("Google did not provide a sign-in token", 400),
        );
    }

    let googlePayload;
    try {
        const ticket = await new OAuth2Client(clientId).verifyIdToken({
            idToken: credential,
            audience: clientId,
        });
        googlePayload = ticket.getPayload();
    } catch {
        return next(
            new appError("Google sign-in token is invalid or expired", 401),
        );
    }

    if (
        !googlePayload?.sub ||
        !googlePayload.email ||
        !googlePayload.email_verified
    ) {
        return next(new appError("A verified Google email is required", 401));
    }

    const email = googlePayload.email.toLowerCase();
    let user = await userModel.findOne({ googleId: googlePayload.sub });

    if (!user) {
        user = await userModel.findOne({ email });

        if (user?.googleId && user.googleId !== googlePayload.sub) {
            return next(
                new appError(
                    "This email is linked to a different Google account",
                    409,
                ),
            );
        }

        if (user) {
            user.googleId = googlePayload.sub;
            if (!user.avatar && googlePayload.picture)
                user.avatar = googlePayload.picture;
            await user.save({ validateBeforeSave: false });
        } else {
            const generatedPassword = crypto.randomBytes(32).toString("hex");
            user = await userModel.create({
                name: googlePayload.name || email,
                email,
                password: generatedPassword,
                confirmPassword: generatedPassword,
                googleId: googlePayload.sub,
                avatar: googlePayload.picture,
            });
        }
    }

    const profile = {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
    };

    signAndSendToken(
        res,
        { id: user._id },
        profile,
        "Google sign-in successful",
    );
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
