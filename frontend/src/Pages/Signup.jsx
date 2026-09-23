import { useState, useEffect } from "react";
import styles from "./Signup.module.css";
import Button from "../../components/Button";
import PageNav from "../../components/PageNav";
import useAuth from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function Signup() {
    // PRE-FILL FOR DEV PURPOSES
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [message, setMessage] = useState("");
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async function (e) {
        e.preventDefault();

        const response = await fetch(
            "http://127.0.0.1:8000/api/v1/users/signup",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    confirmPassword,
                }),
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
                    />
                </div>
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
                <div className={styles.row}>
                    <label htmlFor="password">Confirm Password</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        value={confirmPassword}
                    />
                </div>

                {message && <h2>{message}</h2>}

                <div>
                    <Button type="primary">Sign up</Button>
                </div>
            </form>
        </main>
    );
}
