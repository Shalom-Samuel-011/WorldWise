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
                    <NavLink to="/pricing">PRICING</NavLink>
                </li>
                <li>
                    <NavLink to="/product">PRODUCT</NavLink>
                </li>
                <li>
                    {isAuthenticated ? (
                        <User />
                    ) : (
                        <Button
                            type="primary"
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
