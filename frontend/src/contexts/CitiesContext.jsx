import { createContext, useEffect, useReducer } from "react";

const CitiesContext = createContext();
const BASE_URL = "http://localhost:8000";

function reducer(state, action) {
    switch (action.type) {
        case "cities/loaded":
            return { ...state, cities: action.payload, loading: false };
        case "city/add": {
            return {
                ...state,
                cities: [...state.cities, action.payload],
                currentCity: action.payload,
                loading: false,
            };
        }
        case "city/delete":
            return {
                ...state,
                cities: state.cities.filter(
                    (city) => city.id !== action.payload.id
                ),
                loading: false,
            };
        case "city/selected":
            return { ...state, currentCity: action.payload };
        case "loading": {
            return { ...state, loading: true };
        }
        case "error":
            return { ...state, error: action.payload, loading: false };
        default:
            throw new Error("Unknown action type");
    }
}

const initialStates = {
    cities: [],
    loading: false,
    currentCity: {},
    error: "",
};

function CitiesProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, initialStates);
    const { cities, loading, currentCity } = state;

    async function handleRemoveCity(city) {
        try {
            dispatch({ type: "loading" });
            const res = await fetch(`${BASE_URL}/cities/${city.id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Unable to delete :(");
            const data = await res.json();

            dispatch({ type: "city/delete", payload: data });
        } catch (err) {
            dispatch({ type: "error", payload: err.message });
        }
    }

    async function handleAddCity(newCity) {
        try {
            dispatch({ type: "loading" });
            const res = await fetch(`${BASE_URL}/cities`, {
                method: "POST",
                body: JSON.stringify(newCity),
                headers: {
                    "content-type": "application/json",
                },
            });
            if (!res.ok) throw new Error("Could not add the city, Try again.");
            const data = await res.json();
            dispatch({ type: "city/add", payload: data });
        } catch (err) {
            dispatch({ type: "error", payload: err.message });
        }
    }

    useEffect(function () {
        const fetchCities = async function () {
            try {
                dispatch({ type: "loading" });
                const res = await fetch(`${BASE_URL}/cities`);
                if (!res.ok) throw new Error("Failed to fetch cities");

                const data = await res.json();
                dispatch({ type: "cities/loaded", payload: data });
            } catch (err) {
                dispatch({ type: "error", payload: err.message });
            }
        };

        fetchCities();
    }, []);

    return (
        <CitiesContext.Provider
            value={{
                cities,
                loading,
                handleRemoveCity,
                handleAddCity,
                currentCity,
                dispatch,
            }}
        >
            {children}
        </CitiesContext.Provider>
    );
}

export { CitiesProvider, CitiesContext };
