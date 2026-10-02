import { createContext, useEffect, useReducer } from "react";
import useAuth from "../hooks/useAuth";
import { API_BASE_URL, getAuthHeaders } from "../api";

const CitiesContext = createContext();

const initialStates = {
    cities: [],
    loading: false,
    loaded: false,
    currentCity: {},
    error: "",
};

function normalizeCity(city) {
    const coordinates = city.position?.coordinates;

    return {
        ...city,
        id: city.id ?? city._id,
        position:
            Array.isArray(coordinates) && coordinates.length === 2
                ? { lat: coordinates[1], lng: coordinates[0] }
                : city.position,
    };
}

function reducer(state, action) {
    switch (action.type) {
        case "cities/loaded":
            return {
                ...state,
                cities: action.payload,
                loading: false,
                loaded: true,
            };
        case "city/add": {
            return {
                ...state,
                cities: [...state.cities, action.payload],
                currentCity: action.payload,
                loading: false,
                error: "",
            };
        }
        case "city/delete":
            return {
                ...state,
                cities: state.cities.filter(
                    (city) => city.id !== action.payload.id,
                ),
                currentCity:
                    state.currentCity?.id === action.payload.id
                        ? {}
                        : state.currentCity,
                loading: false,
                error: "",
            };
        case "city/selected":
            return { ...state, currentCity: action.payload };
        case "memory/added": {
            const { cityId, memory } = action.payload;
            const addToCity = (city) =>
                city?.id === cityId
                    ? { ...city, memories: [...(city.memories || []), memory] }
                    : city;

            return {
                ...state,
                cities: state.cities.map(addToCity),
                currentCity: addToCity(state.currentCity),
            };
        }
        case "memory/deleted": {
            const { cityId, memoryId } = action.payload;
            const removeFromCity = (city) =>
                city?.id === cityId
                    ? {
                          ...city,
                          memories: (city.memories || []).filter(
                              (memory) => String(memory._id) !== memoryId,
                          ),
                      }
                    : city;

            return {
                ...state,
                cities: state.cities.map(removeFromCity),
                currentCity: removeFromCity(state.currentCity),
            };
        }
        case "loading": {
            return { ...state, loading: true, error: "" };
        }
        case "error":
            return {
                ...state,
                error: action.payload,
                loading: false,
                loaded: true,
            };
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
            const data = await res.json();
            if (!res.ok)
                throw new Error(data.message || "Unable to delete city");
            if (!data.data)
                throw new Error("The deleted city was not returned");

            dispatch({
                type: "city/delete",
                payload: normalizeCity(data.data),
            });
        } catch (err) {
            dispatch({
                type: "error",
                payload:
                    err instanceof Error
                        ? err.message
                        : "Unable to delete city",
            });
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
            const data = await res.json();
            if (!res.ok)
                throw new Error(data.message || "Could not add the city");
            if (!data.data)
                throw new Error("The created city was not returned");

            const city = normalizeCity(data.data);
            dispatch({ type: "city/add", payload: city });
            return city;
        } catch (err) {
            dispatch({
                type: "error",
                payload:
                    err instanceof Error
                        ? err.message
                        : "Could not add the city",
            });
            return null;
        }
    }

    async function handleAddMemory(cityId, file) {
        const formData = new FormData();
        formData.append("memory", file);

        const res = await fetch(`${API_BASE_URL}/cities/${cityId}/memories`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: formData,
            credentials: "include",
        });
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Could not upload memory");

        dispatch({
            type: "memory/added",
            payload: { cityId, memory: data.data },
        });
    }

    async function handleRemoveMemory(cityId, memoryId) {
        const res = await fetch(
            `${API_BASE_URL}/cities/${cityId}/memories/${memoryId}`,
            {
                method: "DELETE",
                headers: getAuthHeaders(),
                credentials: "include",
            },
        );
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Could not delete memory");

        dispatch({
            type: "memory/deleted",
            payload: { cityId, memoryId },
        });
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
                    dispatch({
                        type: "cities/loaded",
                        payload: data.cities.map(normalizeCity),
                    });
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
                error: state.error,
                loaded: state.loaded,
                handleRemoveCity,
                handleAddCity,
                handleAddMemory,
                handleRemoveMemory,
                currentCity,
                dispatch,
            }}
        >
            {children}
        </CitiesContext.Provider>
    );
}

export { CitiesProvider, CitiesContext };
