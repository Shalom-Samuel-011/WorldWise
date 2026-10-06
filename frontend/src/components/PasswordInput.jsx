import { useState } from "react";
import styles from "./PasswordInput.module.css";

export default function PasswordInput({
    className = "",
    toggleClassName = "",
    visibilityLabel = "password",
    ...inputProps
}) {
    const [isVisible, setIsVisible] = useState(false);
    const action = isVisible ? "Hide" : "Show";

    return (
        <span className={styles.wrapper}>
            <input
                {...inputProps}
                className={`${styles.input} ${className}`.trim()}
                type={isVisible ? "text" : "password"}
            />
            <button
                className={`${styles.toggle} ${toggleClassName}`.trim()}
                type="button"
                aria-label={`${action} ${visibilityLabel}`}
                aria-pressed={isVisible}
                onClick={() => setIsVisible((visible) => !visible)}
            >
                {isVisible ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8" />
                        <path d="M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 4.2 9.5 6.5a10.8 10.8 0 01-3 4.1M6.2 6.2A12.2 12.2 0 002.5 11.5C3.5 13.8 7 18 12 18c1 0 1.9-.2 2.8-.5" />
                    </svg>
                ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M2.5 12S6 5.5 12 5.5s9.5 6.5 9.5 6.5S18 18.5 12 18.5 2.5 12 2.5 12z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                )}
            </button>
        </span>
    );
}
