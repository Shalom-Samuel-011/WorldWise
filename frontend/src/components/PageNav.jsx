import { NavLink, useNavigate } from "react-router-dom";
import styles from "./PageNav.module.css";
import Logo from "./Logo";
import Button from "./Button";
import useAuth from "../hooks/useAuth";
import User from "./User";

export default function Header() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    return (
        <nav className={styles.nav}>
            <Logo />
            <ul>
                <li>
                    <NavLink to="/how-it-works">HOW IT WORKS</NavLink>
                </li>
                <li>
                    <NavLink to="/product">FEATURES &amp; PROJECT</NavLink>
                </li>
                <li>
                    {isAuthenticated ? (
                        <User placement="navigation" />
                    ) : (
                        <Button
                            type="primary"
                            className={styles.loginBtn}
                            onClick={() => navigate("/login")}
                        >
                            Log in
                        </Button>
                    )}
                </li>
            </ul>
        </nav>
    );
}

