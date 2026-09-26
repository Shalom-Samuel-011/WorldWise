// "https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=0&longitude=0"

import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

import Button from "./Button";
import styles from "./Form.module.css";
import { useNavigate } from "react-router-dom";
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
    const [cityName, setCityName] = useState("");
    const [country, setCountry] = useState("");
    const [date, setDate] = useState(new Date());
    const [notes, setNotes] = useState("");
    const [isLoadingGeocoding, setIsLoadingGeocoding] = useState(false);
    const [emoji, setEmoji] = useState();
    const [geocodingError, setGeocodingError] = useState("");

    const navigate = useNavigate();
    const [lat, lng] = useUrlPosition();
    const { handleAddCity, loading } = useCities();

    async function handleSubmit(e) {
        e.preventDefault();
        if (!date || !cityName) return;
        const newCity = {
            cityName,
            country,
            emoji,
            date,
            notes,
            position: { lat, lng },
        };
        console.log("Add button clicked!");
        console.log(newCity);
        handleAddCity(newCity);
        navigate("/app/cities");
    }

    useEffect(
        function () {
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
                    setCityName(data.city || data.locality);
                    setCountry(data.countryName);
                    setEmoji(convertToEmoji(data.countryCode));
                } catch (err) {
                    setGeocodingError(err.message);
                } finally {
                    setIsLoadingGeocoding(false);
                }
            }
            fetchCityData();
        },
        [lat, lng],
    );

    if (isLoadingGeocoding) return <Spinner />;
    if (geocodingError) return <h2>{geocodingError}</h2>;

    return (
        <form className={`${styles.form} ${loading ? styles.loading : ""}`}>
            <div className={styles.row}>
                <label htmlFor="cityName">City name</label>
                <input
                    id="cityName"
                    onChange={(e) => setCityName(e.target.value)}
                    value={cityName}
                />
                <span className={styles.flag}>{emoji}</span>
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
                <Button type="primary" onClick={handleSubmit}>
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
        </form>
    );
}

export default Form;
