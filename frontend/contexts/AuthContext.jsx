import { createContext, useReducer } from "react";

const AuthContext = createContext();

const initialStates = { user: {}, isAuthenticated: false };

function reducer(state, action) {
    switch (action.type) {
        case "login":
            return { ...state, user: action.payload, isAuthenticated: true };
        case "logout":
            return { ...state, user: {}, isAuthenticated: false };
        default:
            throw new Error("Action type not recognised");
    }
}

function AuthProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, initialStates);
    const { user, isAuthenticated } = state;

    function login(user, token) {
        user.avatar = "https://i.pravatar.cc/100?u=zz";
        localStorage.setItem("jwt", token);

        dispatch({ type: "login", payload: user });
    }

    function logout() {
        dispatch({ type: "logout" });
        localStorage.removeItem("jwt");
    }

    return (
        <AuthContext.Provider value={{ login, logout, user, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
}

export { AuthContext, AuthProvider };
