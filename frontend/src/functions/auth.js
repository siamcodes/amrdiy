import axios from "axios";

const apiUrl = import.meta.env.VITE_API;
const authBaseUrl = `${apiUrl}/auth`;

const authFetch = (path, options = {}) =>
    fetch(`${authBaseUrl}${path}`, {
        credentials: "include",
        ...options,
    });

const getCsrfToken = async () => {
    const response = await authFetch("/csrf");
    if (!response.ok) throw new Error("Unable to initialize authentication");
    return (await response.json()).csrfToken;
};

export const registerUser = async (values) =>
    axios.post(`${apiUrl}/register`, values, { withCredentials: true });

export const verifyEmail = async (values) =>
    axios.post(`${apiUrl}/verify-email`, values, { withCredentials: true });

export const signInWithCredentials = async (identifier, password) => {
    const csrfToken = await getCsrfToken();
    const response = await authFetch("/callback/credentials", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "X-Auth-Return-Redirect": "1",
        },
        body: new URLSearchParams({
            csrfToken,
            identifier,
            password,
            callbackUrl: `${window.location.origin}/login`,
        }),
    });
    const data = await response.json();
    if (!response.ok || data.url?.includes("error=")) {
        throw new Error("INVALID_CREDENTIALS");
    }
    return getSession();
};

export const signInWithProvider = async (provider) => {
    const csrfToken = await getCsrfToken();
    const response = await authFetch(`/signin/${provider}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "X-Auth-Return-Redirect": "1",
        },
        body: new URLSearchParams({
            csrfToken,
            callbackUrl: `${window.location.origin}/login`,
        }),
    });
    const data = await response.json();
    if (!response.ok || !data.url) throw new Error("OAUTH_START_FAILED");
    window.location.assign(data.url);
};

export const getSession = async () => {
    const response = await authFetch("/session");
    if (!response.ok) return null;
    const session = await response.json();
    return session?.user ? session : null;
};

export const signOut = async () => {
    const csrfToken = await getCsrfToken();
    await authFetch("/signout", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "X-Auth-Return-Redirect": "1",
        },
        body: new URLSearchParams({
            csrfToken,
            callbackUrl: `${window.location.origin}/login`,
        }),
    });
};

export const currentUser = async () =>
    axios.get(`${apiUrl}/current-user`, { withCredentials: true });

export const currentAdmin = async () =>
    axios.get(`${apiUrl}/current-admin`, { withCredentials: true });
