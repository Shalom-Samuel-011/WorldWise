const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    name: {
        type: "String",
        required: [true, "A user must have a name"],
    },
    email: {
        type: "String",
        required: [true, "A user must have an email"],
        validate: validator.isEmail,
        lowercase: true,
        unique: true,
    },
    password: {
        type: "String",
        required: [true, "A user must have a password"],
        select: false,
    },
    confirmPassword: {
        type: "String",
        required: [true, "Confirm your password"],
        validate: {
            validator: function (el) {
                return el === this.password;
            },
            message: "Password and confirm password does not match",
        },
    },
    role: {
        type: "String",
        enum: ["user", "admin"],
        default: "user",
    },
    passwordChangedAt: Date,
    avatar: String,
    avatarPublicId: String,
    googleId: { type: String, unique: true, sparse: true },
});

userSchema.methods.comparePasswords = async function (payload) {
    return await bcrypt.compare(payload, this.password);
};

userSchema.methods.passwordChanged = function (JWTTimeStamp) {
    if (!this.passwordChangedAt) {
        return false;
    }

    const time = this.passwordChangedAt.getTime() / 1000;
    return time > JWTTimeStamp;
};

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    if (!this.isNew && this.isModified("password")) {
        this.passwordChangedAt = Date.now();
    }
    this.password = await bcrypt.hash(this.password, 12);
    this.confirmPassword = undefined;
});

const userModel = mongoose.model("User", userSchema);

module.exports = userModel;
