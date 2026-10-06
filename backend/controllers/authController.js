const util = require("util");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const nodemailer = require("nodemailer");
const validator = require("validator");

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

exports.forgotPassword = async function (req, res, next) {
    const { email } = req.body;
    const smtpHost = process.env.SMTP_HOST || "smtp.resend.com";
    const smtpPort = Number(process.env.SMTP_PORT || 465);
    const smtpUser = process.env.SMTP_USER || "resend";
    const smtpPassword =
        process.env.RESEND_API_KEY || process.env.SMTP_PASS;
    const frontendUrl =
        process.env.NODE_ENV === "production"
            ? process.env.FRONTEND_URL_PROD
            : process.env.FRONTEND_URL_DEV;

    if (
        !Number.isInteger(smtpPort) ||
        smtpPort <= 0 ||
        !smtpPassword ||
        !process.env.SMTP_FROM ||
        !frontendUrl
    ) {
        return next(
            new appError("Password reset email is not configured", 503),
        );
    }

    if (typeof email !== "string" || !validator.isEmail(email.trim())) {
        return next(new appError("Enter a valid email address", 400));
    }

    const user = await userModel.findOne({
        email: email.trim().toLowerCase(),
    });

    if (!user) {
        return next(
            new appError("No account exists with this email address.", 404),
        );
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${frontendUrl.replace(/\/+$/, "")}/reset-password/${resetToken}`;
    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure:
            process.env.SMTP_SECURE === undefined
                ? smtpPort === 465
                : process.env.SMTP_SECURE === "true",
        auth: {
            user: smtpUser,
            pass: smtpPassword,
        },
    });

    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: user.email,
            subject: "Reset your WorldWise password",
            text: `Use this link to reset your WorldWise password. It expires in 10 minutes:\n\n${resetUrl}\n\nIf you did not request a reset, you can ignore this email.`,
            html: `<p>Use the link below to reset your WorldWise password. It expires in 10 minutes.</p><p><a href="${resetUrl}">Reset password</a></p><p>If you did not request a reset, you can ignore this email.</p>`,
        });
    } catch (error) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(error);
    }

    return res.status(200).json({
        status: "success",
        message: "Password reset link sent. Check your email.",
    });
};

exports.resetPassword = async function (req, res, next) {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword)
        return next(new appError("Complete all password fields", 400));
    if (password.length < 8)
        return next(new appError("Password must be at least 8 characters", 400));
    if (password !== confirmPassword)
        return next(new appError("Passwords do not match", 400));

    const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
    const user = await userModel
        .findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() },
        })
        .select("+passwordResetToken +passwordResetExpires");

    if (!user)
        return next(
            new appError("Password reset link is invalid or has expired", 400),
        );

    user.password = password;
    user.confirmPassword = confirmPassword;
    user.hasPassword = true;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res.status(200).json({
        status: "success",
        message: "Password reset successfully. Please log in.",
    });
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
        phoneNumber: user.phoneNumber,
        hasPassword: user.hasPassword,
        role: user.role,
    };

    signAndSendToken(
        res,
        { id: user._id },
        profile,
        "Google sign-in successful",
    );
};

exports.changePassword = async function (req, res, next) {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword)
        return next(new appError("Complete all password fields", 400));
    if (newPassword.length < 8)
        return next(
            new appError("New password must be at least 8 characters", 400),
        );
    if (newPassword !== confirmPassword)
        return next(new appError("New passwords do not match", 400));

    const user = await userModel.findById(req.user._id).select("+password");
    if (!user) return next(new appError("User account not found", 404));

    if (user.hasPassword) {
        if (!currentPassword)
            return next(new appError("Enter your current password", 400));
        if (!(await user.comparePasswords(currentPassword)))
            return next(new appError("Current password is incorrect", 401));
    }

    user.password = newPassword;
    user.confirmPassword = confirmPassword;
    user.hasPassword = true;
    await user.save();

    const profile = {
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        avatar: user.avatar,
        hasPassword: user.hasPassword,
        role: user.role,
    };

    signAndSendToken(
        res,
        { id: user._id },
        profile,
        "Password updated successfully",
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
