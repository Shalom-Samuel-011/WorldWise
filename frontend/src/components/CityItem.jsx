import { Link } from "react-router-dom";
import styles from "./CityItem.module.css";
import useCities from "../hooks/useCities";
import Emoji from "./Emoji";

export default function CityItem({ city }) {
    const { handleRemoveCity, dispatch, currentCity } = useCities();
    const { cityName, emoji, date, id, position } = city;
    const visitDate = new Date(date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
    const cityPath =
        Number.isFinite(position?.lat) && Number.isFinite(position?.lng)
            ? `${id}?lat=${position.lat}&lng=${position.lng}`
            : `${id}`;

    return (
        <li onClick={() => dispatch({ type: "city/selected", payload: city })}>
            <div
                className={`${styles.cityItem} ${
                    currentCity?.id === city.id ? styles.cityItemActive : ""
                }`}
            >
                <Link to={cityPath} className={styles.cityLink}>
                    <Emoji emoji={emoji} className={styles.emoji} />
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
