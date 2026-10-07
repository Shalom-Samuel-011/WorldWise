import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import styles from "./PageNav.module.css";
import Logo from "./Logo";
import Button from "./Button";
import useAuth from "../hooks/useAuth";
import User from "./User";

export default function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const navRef = useRef(null);
    const toggleRef = useRef(null);

    useEffect(() => {
        if (!menuOpen) return undefined;

        function closeOnOutsideClick(event) {
            if (!navRef.current?.contains(event.target)) setMenuOpen(false);
        }

        document.addEventListener("pointerdown", closeOnOutsideClick);
        return () =>
            document.removeEventListener("pointerdown", closeOnOutsideClick);
    }, [menuOpen]);

    useEffect(
        () => setMenuOpen(false),
        [isAuthenticated, location.pathname],
    );

    function handleMenuKeyDown(event) {
        if (event.key !== "Escape" || !menuOpen) return;
        setMenuOpen(false);
        toggleRef.current?.focus();
    }

    function closeMenu() {
        setMenuOpen(false);
    }

    return (
        <nav
            ref={navRef}
            className={styles.nav}
            onKeyDown={handleMenuKeyDown}
        >
            <Logo />
            <ul
                id="primary-navigation"
                className={`${styles.menu} ${menuOpen && !isAuthenticated ? styles.menuOpen : ""}`}
            >
                <li>
                    <NavLink to="/how-it-works" onClick={closeMenu}>
                        HOW IT WORKS
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/product" onClick={closeMenu}>
                        FEATURES &amp; PROJECT
                    </NavLink>
                </li>
                {!isAuthenticated && (
                    <li>
                        <Button
                            type="primary"
                            className={styles.loginBtn}
                            onClick={() => {
                                closeMenu();
                                navigate("/login");
                            }}
                        >
                            Log in
                        </Button>
                    </li>
                )}
            </ul>
            <div className={styles.navActions}>
                {isAuthenticated ? (
                    <User placement="navigation" includeNavigation />
                ) : (
                    <button
                        ref={toggleRef}
                        className={styles.menuToggle}
                        type="button"
                        aria-label={
                            menuOpen
                                ? "Close navigation menu"
                                : "Open navigation menu"
                        }
                        aria-expanded={menuOpen}
                        aria-controls="primary-navigation"
                        onClick={() => setMenuOpen((open) => !open)}
                    >
                        <span className={styles.menuBar} />
                        <span className={styles.menuBar} />
                        <span className={styles.menuBar} />
                    </button>
                )}
            </div>
        </nav>
    );
}

