import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { API_BASE_URL } from "../api";
import styles from "./GoogleSignIn.module.css";

export default function GoogleSignIn({ onAuthSuccess }) {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const [error, setError] = useState("");

    if (!clientId) {
        return (
            <p className={styles.configurationMessage} role="status">
                Google sign-in is not configured for this app.
            </p>
        );
    }

    async function handleGoogleSuccess(response) {
        setError("");
        try {
            const result = await fetch(`${API_BASE_URL}/users/google`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential: response.credential }),
                credentials: "include",
            });
            const data = await result.json();

            if (!result.ok)
                throw new Error(data.message || "Google sign-in failed");

            onAuthSuccess(data);
        } catch (error) {
            setError(error.message || "Google sign-in failed");
        }
    }

    return (
        <div className={styles.googleSignIn}>
            <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() =>
                    setError("Google sign-in could not be completed")
                }
                theme="outline"
                shape="rectangular"
                text="continue_with"
                width="360"
            />
            {error && (
                <p className={styles.error} role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}
