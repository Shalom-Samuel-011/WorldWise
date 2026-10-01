import { createContext, useEffect, useReducer } from "react";
import useAuth from "../hooks/useAuth";
import { API_BASE_URL, getAuthHeaders } from "../api";

const CitiesContext = createContext();

const initialStates = {
    cities: [],
    loading: false,
    currentCity: {},
    error: "",
};

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
                    (city) => city.id !== action.payload.id,
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

function CitiesProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, initialStates);
    const { cities, loading, currentCity } = state;
    const { isAuthenticated } = useAuth();

    async function handleRemoveCity(city) {
        try {
            dispatch({ type: "loading" });
            const res = await fetch(`${API_BASE_URL}/cities/${city.id}`, {
                method: "DELETE",
                headers: getAuthHeaders(),
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
            const res = await fetch(`${API_BASE_URL}/cities`, {
                method: "POST",
                body: JSON.stringify(newCity),
                headers: {
                    "content-type": "application/json",
                    ...getAuthHeaders(),
                },
            });
            if (!res.ok) throw new Error("Could not add the city, Try again.");
            const data = await res.json();
            dispatch({ type: "city/add", payload: data });
        } catch (err) {
            dispatch({ type: "error", payload: err.message });
        }
    }

    useEffect(
        function () {
            if (!isAuthenticated) return;
            const fetchCities = async function () {
                console.log("fetchCities Running");
                try {
                    dispatch({ type: "loading" });
                    const res = await fetch(`${API_BASE_URL}/cities`, {
                        method: "GET",
                        headers: getAuthHeaders(),
                        credentials: "include",
                    });

                    if (!res.ok) throw new Error("Failed to fetch cities");

                    const data = await res.json();

                    console.log(data);
                    dispatch({ type: "cities/loaded", payload: data.cities });
                } catch (err) {
                    dispatch({ type: "error", payload: err.message });
                }
            };

            fetchCities();
        },
        [isAuthenticated],
    );

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
