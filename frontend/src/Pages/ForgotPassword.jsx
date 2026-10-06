import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button";
import PageNav from "../components/PageNav";
import { API_BASE_URL } from "../api";
import styles from "./Login.module.css";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
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
                `${API_BASE_URL}/users/forgot-password`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                },
            );
            const data = await response.json();
            if (!response.ok)
                throw new Error(data.message || "Could not send reset email");

            setMessage(data.message);
        } catch (requestError) {
            setError(requestError.message || "Could not send reset email");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className={styles.login}>
            <PageNav />
            <form className={styles.form} onSubmit={handleSubmit}>
                <h1>Forgot password?</h1>
                <p>
                    Enter the email address registered to your account and
                    we&apos;ll send you a password reset link.
                </p>
                <div className={styles.row}>
                    <label htmlFor="email">Email address</label>
                    <input
                        type="email"
                        id="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="enter your email address"
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
                    <Button
                        type="primary"
                        htmlType="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Sending..." : "Send reset link"}
                    </Button>
                    <Link className={styles.formLink} to="/login">
                        Back to log in
                    </Link>
                </div>
            </form>
        </main>
    );
}
