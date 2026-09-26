import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

export default function useAuth() {
    const value = useContext(AuthContext);
    if (!value) throw new Error("useAuth was used outside the AuthProvider");
    return value;
}
