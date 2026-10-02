import styles from "./CountryList.module.css";
import Spinner from "./Spinner";
import CountryItem from "./CountryItem";
import useCities from "../hooks/useCities";

function CountryList() {
    const seen = new Set();
    const { cities, loading } = useCities();

    const countries = cities.reduce((arr, city) => {
        if (!seen.has(city.country)) {
            seen.add(city.country);
            return [...arr, { countryName: city.country, emoji: city.emoji }];
        }
        return arr;
    }, []);

    if (loading) return <Spinner />;
    if (!cities.length)
        return (
            <h2>
                👋 Add your first country by clicking on a country on the map
            </h2>
        );
    return (
        <ul className={styles.countryList}>
            {countries.map((country) => (
                <CountryItem key={country.countryName} country={country} />
            ))}
        </ul>
    );
}

export default CountryList;
