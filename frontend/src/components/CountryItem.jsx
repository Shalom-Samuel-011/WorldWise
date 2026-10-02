import styles from "./CountryItem.module.css";
import Emoji from "./Emoji";

function CountryItem({ country }) {
    return (
        <li className={styles.countryItem}>
            <Emoji
                emoji={country.emoji}
                alt={country.countryName}
                className={styles.emoji}
            />
            <span>{country.countryName}</span>
        </li>
    );
}

export default CountryItem;
