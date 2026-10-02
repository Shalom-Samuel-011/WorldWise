import styles from "./CityList.module.css";
import CityItem from "./CityItem";
import Spinner from "./Spinner";
import useCities from "../hooks/useCities";

export default function CityList() {
    const { cities, loading } = useCities();
    if (loading) return <Spinner />;
    if (!cities.length)
        return <h2>👋 Add your first city by clicking on a city on the map</h2>;
    return (
        <ul className={styles.cityList}>
            {cities.map((city, i) => (
                <CityItem city={city} key={i} />
            ))}
        </ul>
    );
}
