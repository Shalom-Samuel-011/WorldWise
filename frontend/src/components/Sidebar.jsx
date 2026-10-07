import { Outlet } from "react-router-dom";
import AppNav from "./AppNav";
import Logo from "./Logo";
import styles from "./Sidebar.module.css";

export default function Sidebar({ mobileOpen, onClose }) {
    return (
        <div
            className={`${styles.sidebar} ${mobileOpen ? styles.mobileOpen : ""}`}
        >
            <button
                className={styles.mobilePanelClose}
                type="button"
                aria-label="Close places panel"
                onClick={onClose}
            >
                ×
            </button>
            <Logo />
            <AppNav />
            <Outlet />
            <footer className={styles.footer}>
                <p className={styles.copyright}>
                    © Copyright {new Date().getFullYear()} by WorldWise Inc.
                </p>
            </footer>
        </div>
    );
}
