const defaultApiUrl = import.meta.env.DEV
    ? "http://localhost:8000/api/v1"
    : "https://worldwise-ic2v.onrender.com/api/v1";

const configuredApiUrl = import.meta.env.VITE_API_URL || defaultApiUrl;

export const API_BASE_URL = configuredApiUrl.replace(/\/+$/, "");

export function getAuthHeaders() {
    const token = localStorage.getItem("jwt");
    return token ? { Authorization: `Bearer ${token}` } : {};
}
