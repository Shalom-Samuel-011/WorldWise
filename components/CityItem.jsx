import { Link } from "react-router-dom";
import styles from "./CityItem.module.css";
import useCities from "../hooks/useCities";

export default function CityItem({ city }) {
    const { handleRemoveCity, dispatch, currentCity } = useCities();
    const { cityName, emoji, date, id, position } = city;
    const visitDate = new Date(date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    return (
        <li onClick={() => dispatch({ type: "city/selected", payload: city })}>
            <div
                className={`${styles.cityItem} ${
                    currentCity?.id === city.id ? styles.cityItemActive : ""
                }`}
            >
                <Link
                    to={`${id}?lat=${position.lat}&lng=${position.lng}`}
                    className={styles.cityLink}
                >
                    <span className={styles.emoji}>{emoji}</span>
                    <p className={styles.name}>{cityName}</p>
                    <p className={styles.date}>({visitDate})</p>
                </Link>
                <button
                    className={styles.deleteBtn}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveCity(city);
                    }}
                >
                    ×
                </button>
            </div>
        </li>
    );
}
