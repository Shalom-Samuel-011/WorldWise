import styles from "./Button.module.css";

function Button({
    type,
    htmlType = "button",
    onClick,
    children,
    disabled,
    className = "",
}) {
    return (
        <button
            type={htmlType}
            disabled={disabled}
            className={`${styles.btn} ${styles[`${type}`] || ""} ${className}`.trim()}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

export default Button;
