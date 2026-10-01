import styles from "./Button.module.css";

function Button({ type, htmlType = "button", onClick, children, disabled }) {
    return (
        <button
            type={htmlType}
            disabled={disabled}
            className={`${styles.btn} ${styles[`${type}`]}`}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

export default Button;
