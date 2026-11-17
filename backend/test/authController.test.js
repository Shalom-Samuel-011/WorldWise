const assert = require("node:assert/strict");
const test = require("node:test");
const authController = require("../controllers/authController");

async function getResetPasswordError(body) {
    let forwardedError;

    await authController.resetPassword(
        { params: { token: "reset-token" }, body },
        {},
        (error) => {
            forwardedError = error;
        },
    );

    return forwardedError;
}

test("password reset rejects missing password fields", async () => {
    const error = await getResetPasswordError({ password: "", confirmPassword: "" });

    assert.equal(error.statusCode, 400);
    assert.equal(error.message, "Complete all password fields");
});

test("password reset rejects passwords shorter than eight characters", async () => {
    const error = await getResetPasswordError({
        password: "short",
        confirmPassword: "short",
    });

    assert.equal(error.statusCode, 400);
    assert.equal(error.message, "Password must be at least 8 characters");
});

test("password reset rejects mismatched passwords", async () => {
    const error = await getResetPasswordError({
        password: "correct-horse",
        confirmPassword: "different-horse",
    });

    assert.equal(error.statusCode, 400);
    assert.equal(error.message, "Passwords do not match");
});
