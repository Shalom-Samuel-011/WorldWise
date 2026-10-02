import { useState, useEffect } from "react";
import styles from "./Login.module.css";
import Button from "../components/Button";
import PageNav from "../components/PageNav";
import Spinner from "../components/Spinner";
import useAuth from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";

export default function Login() {
    // PRE-FILL FOR DEV PURPOSES
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("Do no have an account? Sign up!");
    const { isAuthenticated, login } = useAuth();
    const navigate = useNavigate();

    const handleSignupClick = function () {
        navigate("/signup", { replace: true });
    };

    const handleSubmit = async function (e) {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/users/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
                credentials: "include",
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Something went wrong");
            }

            const { user, token } = data;

            setMessage(data.message);
            login(user, token);
        } catch (err) {
            setMessage(err.message);
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
        <main className={styles.login}>
            <PageNav />

            <form className={styles.form} onSubmit={handleSubmit}>
                {isLoading ? (
                    <Spinner />
                ) : (
                    <>
                        <div className={styles.row}>
                            <label htmlFor="email">Email address</label>
                            <input
                                type="email"
                                id="email"
                                onChange={(e) => setEmail(e.target.value)}
                                value={email}
                                placeholder="enter your email address"
                            />
                        </div>

                        <div className={styles.row}>
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                onChange={(e) => setPassword(e.target.value)}
                                value={password}
                                placeholder="your password"
                            />
                        </div>
                        <h2>{message}</h2>
                        <div className={styles.buttons}>
                            <Button type="primary" htmlType="submit">
                                log in
                            </Button>
                            <Button
                                type="secondary"
                                onClick={handleSignupClick}
                            >
                                Sign up
                            </Button>
                        </div>
                    </>
                )}
            </form>
        </main>
    );
}
