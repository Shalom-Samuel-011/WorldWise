const configuredApiUrl =
    import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export const API_BASE_URL = configuredApiUrl.replace(/\/+$/, "");

export function getAuthHeaders() {
    const token = localStorage.getItem("jwt");
    return token ? { Authorization: `Bearer ${token}` } : {};
}
