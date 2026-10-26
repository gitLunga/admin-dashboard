import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// How people sign in is a server setting (AUTH_PROVIDER): "local" email + password, "ldap" domain credentials,
// or "entra" Microsoft sign-in. This is what we assume until the server says otherwise, and what an older
// server (without /auth/config) is treated as.
export const LOCAL_AUTH = Object.freeze({
    provider: 'local',
    directory: false,
    loginMethod: 'password',
    selfRegistration: true,
    passwordManagedLocally: true,
    usernameLabel: 'Email',
});

let cached = null;

export async function fetchAuthConfig({ force = false } = {}) {
    if (cached && !force) return cached;
    try {
        const res = await axios.get(`${API_BASE_URL}/auth/config`, { timeout: 8000 });
        const data = res.data?.data;
        if (data && typeof data.provider === 'string') {
            cached = { ...LOCAL_AUTH, ...data };
            return cached;
        }
    } catch (_) { /* server unreachable or older than directory sign-in: fall through */ }
    return LOCAL_AUTH;        // not cached, so the next page load asks again
}

export const resetAuthConfigCache = () => { cached = null; };

// Where the browser goes to start the Microsoft sign-in. The server sends the person back to /auth/callback here.
export function microsoftSignInUrl(audience = 'staff', origin = window.location.origin) {
    const redirect = `${origin}/auth/callback`;
    return `${API_BASE_URL}/auth/entra/login?audience=${encodeURIComponent(audience)}&redirect=${encodeURIComponent(redirect)}`;
}
