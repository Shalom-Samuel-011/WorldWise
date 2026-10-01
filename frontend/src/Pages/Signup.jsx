import { useState, useEffect } from "react";
import styles from "./Signup.module.css";
import Button from "../components/Button";
import PageNav from "../components/PageNav";
import useAuth from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";

export default function Signup() {
    // PRE-FILL FOR DEV PURPOSES
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const [message, setMessage] = useState("Already have an account? Log in!");
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleClickLogin = function () {
        navigate("/login", { replace: true });
    };

    const handleSubmit = async function (e) {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/users/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    confirmPassword,
                }),
                credentials: "include",
            });

            const data = await response.json();
            console.log(data);
            const { user, token } = data;

            if (response.ok) {
                login(user, token);
            }

            setMessage(data.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(
        function () {
            if (isAuthenticated) navigate("/app", { replace: true });
        },
        [isAuthenticated, navigate],
    );

    return (
        <main className={styles.signup}>
            <PageNav />
            <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.row}>
                    <label htmlFor="name">Name</label>
                    <input
                        type="string"
                        id="name"
                        onChange={(e) => setName(e.target.value)}
                        value={name}
                        placeholder="your name"
                    />
                </div>
                <div className={styles.row}>
                    <label htmlFor="email">Email address</label>
                    <input
                        type="email"
                        id="email"
                        onChange={(e) => setEmail(e.target.value)}
                        value={email}
                        placeholder="your email"
                    />
                </div>

                <div className={styles.row}>
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        onChange={(e) => setPassword(e.target.value)}
                        value={password}
                        placeholder="create a password"
                    />
                </div>
                <div className={styles.row}>
                    <label htmlFor="password">Confirm Password</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        value={confirmPassword}
                        placeholder="confirm your password"
                    />
                </div>

                {message && <h2>{message}</h2>}

                <div className={styles.buttons}>
                    <Button type="primary" htmlType="submit">
                        Sign up
                    </Button>
                    <Button type="secondary" onClick={handleClickLogin}>
                        Log in
                    </Button>
                </div>
            </form>
        </main>
    );
}
