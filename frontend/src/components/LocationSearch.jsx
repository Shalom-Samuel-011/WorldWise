import { useEffect, useRef, useState } from "react";
import styles from "./LocationSearch.module.css";

export default function LocationSearch({ onSelect }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const lastRequestAt = useRef(0);
    const requestController = useRef(null);

    useEffect(() => () => requestController.current?.abort(), []);

    async function handleSubmit(event) {
        event.preventDefault();
        const searchTerm = query.trim();
        if (searchTerm.length < 2) {
            setError("Enter at least 2 characters to search.");
            setResults([]);
            return;
        }

        requestController.current?.abort();
        const controller = new AbortController();
        requestController.current = controller;
        setError("");
        setResults([]);
        setIsLoading(true);

        try {
            const waitTime = Math.max(
                0,
                1100 - (Date.now() - lastRequestAt.current),
            );
            if (waitTime)
                await new Promise((resolve) => setTimeout(resolve, waitTime));
            if (controller.signal.aborted) return;

            lastRequestAt.current = Date.now();
            const params = new URLSearchParams({
                q: searchTerm,
                format: "jsonv2",
                limit: "5",
                addressdetails: "1",
            });
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?${params}`,
                {
                    headers: { Accept: "application/json" },
                    signal: controller.signal,
                },
            );
            if (!response.ok) throw new Error("Place search is unavailable.");

            const places = await response.json();
            if (!places.length) {
                setError("No matching places found.");
                return;
            }

            setResults(places);
        } catch (searchError) {
            if (searchError.name !== "AbortError")
                setError(
                    searchError.message || "Could not search for that place.",
                );
        } finally {
            if (requestController.current === controller) setIsLoading(false);
        }
    }

    function handleSelect(place) {
        onSelect({
            ...place,
            lat: Number(place.lat),
            lon: Number(place.lon),
        });
        setQuery(place.display_name);
        setResults([]);
        setError("");
    }

    return (
        <div className={styles.searchControl}>
            <form className={styles.searchForm} onSubmit={handleSubmit}>
                <input
                    type="search"
                    value={query}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setError("");
                    }}
                    onKeyDown={(event) => {
                        if (event.key === "Escape") setResults([]);
                    }}
                    placeholder="Search for a place"
                    aria-label="Search for a place"
                    aria-expanded={results.length > 0}
                    aria-controls="place-search-results"
                />
                <button
                    type="submit"
                    aria-label="Search places"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <span className={styles.spinner} aria-hidden="true" />
                    ) : (
                        <svg
                            aria-hidden="true"
                            viewBox="0 0 24 24"
                            focusable="false"
                        >
                            <circle cx="10.8" cy="10.8" r="6.8" />
                            <path d="m16 16 4.5 4.5" />
                        </svg>
                    )}
                </button>
            </form>

            {results.length > 0 && (
                <ul
                    id="place-search-results"
                    className={styles.results}
                    role="listbox"
                    aria-label="Place search results"
                >
                    {results.map((place) => (
                        <li key={place.place_id}>
                            <button
                                type="button"
                                role="option"
                                onClick={() => handleSelect(place)}
                            >
                                <strong>
                                    {place.name ||
                                        place.display_name.split(",")[0]}
                                </strong>
                                <span>{place.display_name}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {(error || isLoading) && (
                <p className={styles.status} role={error ? "status" : "status"}>
                    {error || "Searching places..."}
                </p>
            )}
        </div>
    );
}
