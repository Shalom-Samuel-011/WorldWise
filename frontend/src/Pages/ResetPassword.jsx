import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import Button from "../components/Button";
import PageNav from "../components/PageNav";
import PasswordInput from "../components/PasswordInput";
import { API_BASE_URL } from "../api";
import styles from "./Login.module.css";

export default function ResetPassword() {
    const { token } = useParams();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();
        setIsSubmitting(true);
        setMessage("");
        setError("");

        try {
            const response = await fetch(
                `${API_BASE_URL}/users/reset-password/${encodeURIComponent(token)}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ password, confirmPassword }),
                },
            );
            const data = await response.json();
            if (!response.ok)
                throw new Error(data.message || "Could not reset password");

            setMessage(data.message);
            setPassword("");
            setConfirmPassword("");
        } catch (requestError) {
            setError(requestError.message || "Could not reset password");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className={styles.login}>
            <PageNav />
            <form className={styles.form} onSubmit={handleSubmit}>
                <h1>Set a new password</h1>
                <div className={styles.row}>
                    <label htmlFor="new-password">New password</label>
                    <PasswordInput
                        id="new-password"
                        autoComplete="new-password"
                        required
                        minLength={8}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="at least 8 characters"
                        visibilityLabel="new password"
                    />
                </div>
                <div className={styles.row}>
                    <label htmlFor="confirm-password">Confirm password</label>
                    <PasswordInput
                        id="confirm-password"
                        autoComplete="new-password"
                        required
                        minLength={8}
                        value={confirmPassword}
                        onChange={(event) =>
                            setConfirmPassword(event.target.value)
                        }
                        placeholder="confirm your new password"
                        visibilityLabel="confirm password"
                    />
                </div>
                {message && (
                    <p className={styles.formMessage} role="status">
                        {message}
                    </p>
                )}
                {error && (
                    <p className={styles.formMessage} role="alert">
                        {error}
                    </p>
                )}
                <div className={styles.buttons}>
                    {!message && (
                        <Button
                            type="primary"
                            htmlType="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Saving..." : "Reset password"}
                        </Button>
                    )}
                    {message && (
                        <Link className={styles.formLink} to="/login">
                            Go to log in
                        </Link>
                    )}
                </div>
            </form>
        </main>
    );
}
