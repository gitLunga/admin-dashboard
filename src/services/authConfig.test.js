import axios from 'axios';
import { fetchAuthConfig, resetAuthConfigCache, microsoftSignInUrl, LOCAL_AUTH } from './authConfig';

jest.mock('axios', () => ({ __esModule: true, default: { get: jest.fn() } }));

beforeEach(() => { jest.clearAllMocks(); resetAuthConfigCache(); });

describe('fetchAuthConfig', () => {
    it('returns what the server says and remembers it', async () => {
        axios.get.mockResolvedValue({ data: { data: { provider: 'entra', directory: true, loginMethod: 'microsoft', passwordManagedLocally: false } } });
        const first = await fetchAuthConfig();
        expect(first).toMatchObject({ provider: 'entra', loginMethod: 'microsoft', passwordManagedLocally: false, selfRegistration: true });
        await fetchAuthConfig();
        expect(axios.get).toHaveBeenCalledTimes(1);
        expect(axios.get.mock.calls[0][0]).toMatch(/\/auth\/config$/);
    });

    it('treats an older server, or one that cannot be reached, as local sign-in and asks again next time', async () => {
        axios.get.mockRejectedValueOnce({ response: { status: 404 } });
        expect(await fetchAuthConfig()).toEqual(LOCAL_AUTH);

        axios.get.mockResolvedValueOnce({ data: { data: { provider: 'ldap', directory: true } } });
        expect((await fetchAuthConfig()).provider).toBe('ldap');
    });

    it('ignores an answer that is not a sign-in configuration', async () => {
        axios.get.mockResolvedValue({ data: { data: null } });
        expect(await fetchAuthConfig()).toEqual(LOCAL_AUTH);
    });
});

describe('microsoftSignInUrl', () => {
    it('asks the API to send the person back to this app\'s /auth/callback', () => {
        const url = new URL(microsoftSignInUrl('staff', 'https://admin.example.gov.za'));
        expect(url.pathname).toMatch(/\/auth\/entra\/login$/);
        expect(url.searchParams.get('audience')).toBe('staff');
        expect(url.searchParams.get('redirect')).toBe('https://admin.example.gov.za/auth/callback');
    });
});
