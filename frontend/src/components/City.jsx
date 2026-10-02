import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import styles from "./City.module.css";
import Button from "./Button";
import Emoji from "./Emoji";
import useCities from "../hooks/useCities";
import MemoriesModal from "./MemoriesModal";

const formatDate = (date) =>
    new Intl.DateTimeFormat("en", {
        day: "numeric",
        month: "long",
        year: "numeric",
        weekday: "long",
    }).format(new Date(date));

function City() {
    const { cities, currentCity, loading, loaded, error } = useCities();
    const [memoriesOpen, setMemoriesOpen] = useState(false);
    const navigate = useNavigate();
    const { id } = useParams();
    const city =
        cities.find((item) => String(item.id) === id) ||
        (String(currentCity?.id) === id ? currentCity : null);

    if (!city) {
        return (
            <div className={styles.city}>
                <p className={styles.status}>
                    {loading || !loaded
                        ? "Loading city..."
                        : error || "This city could not be found."}
                </p>
                {loaded && (
                    <Button type="back" onClick={() => navigate("/app/cities")}>
                        Back to cities
                    </Button>
                )}
            </div>
        );
    }

    const { cityName, emoji, date, notes, memories = [] } = city;

    return (
        <div className={styles.city}>
            <div className={styles.row}>
                <h6>City name</h6>
                <h3>
                    <Emoji
                        emoji={emoji}
                        alt={cityName}
                        className={styles.emoji}
                    />
                    {cityName}
                </h3>
            </div>

            <div className={styles.row}>
                <h6>You went to {cityName} on</h6>
                <p>{formatDate(date || null)}</p>
            </div>

            {notes && (
                <div className={styles.row}>
                    <h6>Your notes</h6>
                    <p>{notes}</p>
                </div>
            )}

            <div className={styles.row}>
                <h6>Memories</h6>
                <button
                    className={styles.memoriesButton}
                    onClick={() => setMemoriesOpen(true)}
                >
                    Browse memories
                    <span>{memories.length}</span>
                </button>
            </div>

            <div className={styles.row}>
                <h6>Learn more</h6>
                <a
                    href={`https://en.wikipedia.org/wiki/${cityName}`}
                    target="_blank"
                    rel="noreferrer"
                >
                    Check out {cityName} on Wikipedia &rarr;
                </a>
            </div>

            <div>
                <Button type="back" onClick={() => navigate(-1)}>
                    Back
                </Button>
            </div>
            {memoriesOpen && (
                <MemoriesModal
                    city={city}
                    onClose={() => setMemoriesOpen(false)}
                />
            )}
        </div>
    );
}

export default City;
