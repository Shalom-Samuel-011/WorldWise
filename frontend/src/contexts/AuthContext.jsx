import { createContext, useEffect, useReducer } from "react";
import { API_BASE_URL, getAuthHeaders } from "../api";

const AuthContext = createContext();

const initialStates = { user: {}, isAuthenticated: false };

function getInitialState() {
    const token = localStorage.getItem("jwt");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) return initialStates;

    try {
        const user = JSON.parse(storedUser);
        if (user.avatar === "https://i.pravatar.cc/100?u=zz") {
            delete user.avatar;
            localStorage.setItem("user", JSON.stringify(user));
        }
        return { user, isAuthenticated: true };
    } catch {
        localStorage.removeItem("jwt");
        localStorage.removeItem("user");
        return initialStates;
    }
}

function reducer(state, action) {
    switch (action.type) {
        case "login":
            return { ...state, user: action.payload, isAuthenticated: true };
        case "profile/update":
            return { ...state, user: action.payload };
        case "logout":
            return { ...state, user: {}, isAuthenticated: false };
        default:
            throw new Error("Action type not recognised");
    }
}

function AuthProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, null, getInitialState);
    const { user, isAuthenticated } = state;

    function login(user, token) {
        const sessionUser = {
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            avatar: user.avatar,
            hasPassword: user.hasPassword !== false,
        };
        localStorage.setItem("jwt", token);
        localStorage.setItem("user", JSON.stringify(sessionUser));

        dispatch({ type: "login", payload: sessionUser });
    }

    function updateProfile(profile) {
        const updatedUser = { ...state.user, ...profile };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        dispatch({ type: "profile/update", payload: updatedUser });
    }

    function logout() {
        dispatch({ type: "logout" });
        localStorage.removeItem("jwt");
        localStorage.removeItem("user");
    }

    useEffect(() => {
        if (!isAuthenticated) return undefined;

        const controller = new AbortController();
        fetch(`${API_BASE_URL}/users/profile`, {
            headers: getAuthHeaders(),
            signal: controller.signal,
        })
            .then(async (response) => {
                const data = await response.json();
                if (!response.ok)
                    throw new Error(
                        data.message || "Could not refresh profile",
                    );

                const refreshedUser = {
                    ...data.user,
                    hasPassword: data.user.hasPassword !== false,
                };
                localStorage.setItem("user", JSON.stringify(refreshedUser));
                dispatch({ type: "profile/update", payload: refreshedUser });
            })
            .catch(() => {});

        return () => controller.abort();
    }, [isAuthenticated]);

    return (
        <AuthContext.Provider
            value={{ login, logout, updateProfile, user, isAuthenticated }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export { AuthContext, AuthProvider };
