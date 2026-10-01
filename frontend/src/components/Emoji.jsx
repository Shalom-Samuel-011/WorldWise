import { useState } from "react";
import styles from "./Emoji.module.css";

const TWEMOJI_ASSET_BASE =
    "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg";

function getEmojiAssetUrl(emoji) {
    const codePoints = Array.from(emoji)
        .map((character) => character.codePointAt(0).toString(16))
        .filter((codePoint) => codePoint !== "fe0f")
        .join("-");

    return `${TWEMOJI_ASSET_BASE}/${codePoints}.svg`;
}

export default function Emoji({ emoji, alt = "", className = "" }) {
    const [failedEmoji, setFailedEmoji] = useState(null);
    if (!emoji) return null;

    const classes = `${styles.emoji} ${className}`.trim();

    if (failedEmoji === emoji) {
        return (
            <span
                className={classes}
                role={alt ? "img" : undefined}
                aria-label={alt || undefined}
                aria-hidden={alt ? undefined : true}
            >
                {emoji}
            </span>
        );
    }

    return (
        <img
            className={classes}
            src={getEmojiAssetUrl(emoji)}
            alt={alt}
            onError={() => setFailedEmoji(emoji)}
        />
    );
}
