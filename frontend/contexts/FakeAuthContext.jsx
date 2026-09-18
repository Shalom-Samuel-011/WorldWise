import { createContext, useReducer } from "react";

const FAKE_USER = {
    name: "Jack",
    email: "jack@example.com",
    password: "qwerty",
    avatar: "https://i.pravatar.cc/100?u=zz",
};

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

    function login(email, password) {
        if (!email || !password) return;
        if (FAKE_USER.email === email && FAKE_USER.password === password)
            dispatch({ type: "login", payload: FAKE_USER });
        else {
            alert("Incorrect email or password");
        }
    }

    function logout() {
        dispatch({ type: "logout" });
    }

    return (
        <AuthContext.Provider value={{ login, logout, user, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
}

export { AuthContext, AuthProvider };
