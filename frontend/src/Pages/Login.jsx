import { useState, useEffect } from "react";
import styles from "./Login.module.css";
import Button from "../../components/Button";
import PageNav from "../../components/PageNav";
import useAuth from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function Login() {
    // PRE-FILL FOR DEV PURPOSES
    const [email, setEmail] = useState("jack@example.com");
    const [password, setPassword] = useState("qwerty");
    const [message, setMessage] = useState("Do no have an account? Register");
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async function (e) {
        e.preventDefault();
        // login(email, password);
        const response = await fetch(
            "http://127.0.0.1:8000/api/v1/users/login",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            },
        );

        const data = await response.json();
        console.log(data);

        setMessage(data.message);
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
                <div className={styles.row}>
                    <label htmlFor="email">Email address</label>
                    <input
                        type="email"
                        id="email"
                        onChange={(e) => setEmail(e.target.value)}
                        value={email}
                    />
                </div>

                <div className={styles.row}>
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        onChange={(e) => setPassword(e.target.value)}
                        value={password}
                    />
                </div>
                <h2>{message}</h2>
                <div className={styles.buttons}>
                    <Button type="primary">log in</Button>
                    <Button type="primary">Sign up</Button>
                </div>
            </form>
        </main>
    );
}
