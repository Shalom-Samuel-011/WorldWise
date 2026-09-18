import styles from "./CountryItem.module.css";

function CountryItem({ country }) {
    return (
        <li className={styles.countryItem}>
            <span>{country.emoji}</span>
            <span>{country.countryName}</span>
        </li>
    );
}

export default CountryItem;
