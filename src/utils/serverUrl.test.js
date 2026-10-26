// serverUrl reads REACT_APP_API_URL when it is first imported, so each case loads a fresh copy.
function load(apiUrl) {
    jest.resetModules();
    if (apiUrl === undefined) delete process.env.REACT_APP_API_URL;
    else process.env.REACT_APP_API_URL = apiUrl;
    return require('./serverUrl');
}

const SIGNED = '/api/files/documents/id_5_1.pdf?exp=1791225399&sig=abc-_123';

describe('resolveServerUrl', () => {
    const original = process.env.REACT_APP_API_URL;
    afterAll(() => {
        if (original === undefined) delete process.env.REACT_APP_API_URL;
        else process.env.REACT_APP_API_URL = original;
    });

    it('keeps the production host intact (String.replace("/api","") turned it into "https:/.malcam.co.za/api")', () => {
        const { resolveServerUrl, SERVER_BASE } = load('https://api.malcam.co.za/api');
        expect(SERVER_BASE).toBe('https://api.malcam.co.za');
        expect(resolveServerUrl(SIGNED)).toBe(`https://api.malcam.co.za${SIGNED}`);
    });

    it('points at the local backend in development', () => {
        const { resolveServerUrl } = load('http://localhost:5000/api');
        expect(resolveServerUrl(SIGNED)).toBe(`http://localhost:5000${SIGNED}`);
    });

    it('defaults to the local backend when REACT_APP_API_URL is unset', () => {
        const { resolveServerUrl } = load(undefined);
        expect(resolveServerUrl(SIGNED)).toBe(`http://localhost:5000${SIGNED}`);
    });

    it('supports an API served from a sub-path and tolerates a trailing slash', () => {
        expect(load('https://example.com/backend/api').SERVER_BASE).toBe('https://example.com/backend');
        expect(load('https://api.malcam.co.za/api/').SERVER_BASE).toBe('https://api.malcam.co.za');
    });

    it('passes absolute URLs through and handles empty / slash-less input', () => {
        const { resolveServerUrl } = load('https://api.malcam.co.za/api');
        expect(resolveServerUrl('https://cdn.example.com/a.pdf')).toBe('https://cdn.example.com/a.pdf');
        expect(resolveServerUrl('')).toBe('');
        expect(resolveServerUrl(undefined)).toBe('');
        expect(resolveServerUrl('api/files/x.pdf')).toBe('https://api.malcam.co.za/api/files/x.pdf');
    });
});
