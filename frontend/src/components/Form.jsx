// "https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=0&longitude=0"

import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

import Button from "./Button";
import Emoji from "./Emoji";
import styles from "./Form.module.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import useUrlPosition from "../hooks/useUrlPosition";
import Spinner from "./Spinner";
import useCities from "../hooks/useCities";

function convertToEmoji(countryCode) {
    const codePoints = countryCode
        .toUpperCase()
        .split("")
        .map((char) => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
}

function Form() {
    const [searchParams] = useSearchParams();
    const searchedCityName = searchParams.get("cityName") || "";
    const searchedCountry = searchParams.get("country") || "";
    const searchedCountryCode = searchParams.get("countryCode") || "";
    const [cityName, setCityName] = useState(searchedCityName);
    const [country, setCountry] = useState(searchedCountry);
    const [date, setDate] = useState(new Date());
    const [notes, setNotes] = useState("");
    const [isLoadingGeocoding, setIsLoadingGeocoding] = useState(false);
    const [emoji, setEmoji] = useState();
    const [geocodingError, setGeocodingError] = useState("");

    const navigate = useNavigate();
    const [lat, lng] = useUrlPosition();
    const { handleAddCity, loading, error } = useCities();

    async function handleSubmit(e) {
        e.preventDefault();
        if (loading || !date || !cityName || !country || !emoji) return;
        const newCity = {
            cityName,
            country,
            emoji,
            date,
            notes,
            position: {
                type: "Point",
                coordinates: [lng, lat],
            },
        };
        const createdCity = await handleAddCity(newCity);
        if (createdCity) navigate("/app/cities");
    }

    useEffect(
        function () {
            if (searchedCityName) setCityName(searchedCityName);
            if (searchedCountry) setCountry(searchedCountry);
            if (searchedCountryCode)
                setEmoji(convertToEmoji(searchedCountryCode));

            if (searchedCityName && searchedCountry && searchedCountryCode)
                return;

            async function fetchCityData() {
                try {
                    setGeocodingError("");
                    setIsLoadingGeocoding(true);
                    const res = await fetch(
                        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}`,
                    );
                    if (!res.ok)
                        throw new Error("Could not fetch data for the city");
                    const data = await res.json();
                    if (!data.countryName)
                        throw new Error(
                            "This is not a city, Try somewhere else!",
                        );
                    setCityName(searchedCityName || data.city || data.locality);
                    setCountry(searchedCountry || data.countryName);
                    setEmoji(
                        searchedCountryCode
                            ? convertToEmoji(searchedCountryCode)
                            : convertToEmoji(data.countryCode),
                    );
                } catch (err) {
                    setGeocodingError(err.message);
                } finally {
                    setIsLoadingGeocoding(false);
                }
            }
            fetchCityData();
        },
        [lat, lng, searchedCityName, searchedCountry, searchedCountryCode],
    );

    if (isLoadingGeocoding) return <Spinner />;
    if (geocodingError) return <h2>{geocodingError}</h2>;

    return (
        <form
            className={`${styles.form} ${loading ? styles.loading : ""}`}
            onSubmit={handleSubmit}
        >
            <div className={styles.row}>
                <label htmlFor="cityName">City name</label>
                <input
                    id="cityName"
                    onChange={(e) => setCityName(e.target.value)}
                    value={cityName}
                />
                <Emoji emoji={emoji} alt={country} className={styles.flag} />
            </div>

            <div className={styles.row}>
                <label htmlFor="date">When did you go to {cityName}?</label>
                <DatePicker
                    id="date"
                    selected={date}
                    onChange={(date) => setDate(date)}
                    dateFormat="dd/MM/yyyy"
                />
            </div>

            <div className={styles.row}>
                <label htmlFor="notes">
                    Notes about your trip to {cityName}
                </label>
                <textarea
                    id="notes"
                    onChange={(e) => setNotes(e.target.value)}
                    value={notes}
                />
            </div>

            <div className={styles.buttons}>
                <Button type="primary" htmlType="submit" disabled={loading}>
                    Add
                </Button>
                <Button
                    type="back"
                    onClick={(e) => {
                        e.preventDefault();
                        navigate("/app/cities");
                    }}
                >
                    Back
                </Button>
            </div>
            {error && <p role="alert">{error}</p>}
        </form>
    );
}

export default Form;
