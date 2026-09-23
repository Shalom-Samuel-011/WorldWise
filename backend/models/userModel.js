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
    },
    password: {
        type: "String",
        required: [true, "A user must have a password"],
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
});

userSchema.pre("save", async function () {
    this.password = await bcrypt.hash(this.password, 12);
    this.confirmPassword = undefined;
});

export default userModel = mongoose.model("Users", userSchema);
