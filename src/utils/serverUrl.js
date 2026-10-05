// Resolves a server-relative link — e.g. the "/api/files/…?exp=…&sig=…" the backend
// returns for documents — to an absolute URL on the same server the dashboard talks to.
//
// Do not use REACT_APP_API_URL.replace('/api', ''): for "https://api.malcam.co.za/api"
// it matches the "//api" in the hostname and produces "https:/.malcam.co.za/api".
// Only a trailing "/api" is removed here.

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const SERVER_BASE = API_URL.replace(/\/api\/?$/, '');

export function resolveServerUrl(url) {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    return `${SERVER_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}
