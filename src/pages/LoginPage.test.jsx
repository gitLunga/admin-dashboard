import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }), { virtual: true });
jest.mock('../components/Navigation/Navbar', () => () => <nav data-testid="navbar" />);

const mockLogin = jest.fn();
jest.mock('../services/api', () => ({ authAPI: { login: (...a) => mockLogin(...a) } }));

const mockToast = { success: jest.fn(), error: jest.fn(), warning: jest.fn() };
jest.mock('../hooks/useToast', () => ({ useToast: () => mockToast }));

const mockFetchConfig = jest.fn();
jest.mock('../services/authConfig', () => ({
    ...jest.requireActual('../services/authConfig'),
    fetchAuthConfig: (...a) => mockFetchConfig(...a),
}));
const { LOCAL_AUTH } = jest.requireActual('../services/authConfig');

const LoginPage = require('./LoginPage').default;

const serverSays = (over) => mockFetchConfig.mockResolvedValue({ ...LOCAL_AUTH, ...over });

beforeEach(() => { jest.clearAllMocks(); localStorage.clear(); sessionStorage.clear(); });

describe('LoginPage', () => {
    it('local mode: email, password and a forgot-password link, as before', async () => {
        serverSays({});
        render(<LoginPage />);
        expect(await screen.findByText('Email Address')).toBeInTheDocument();
        await waitFor(() => expect(mockFetchConfig).toHaveBeenCalled());
        expect(screen.getByText('Forgot password?')).toBeInTheDocument();
        expect(screen.getByText(/created by your system administrator/i)).toBeInTheDocument();
    });

    it('ldap mode: asks for a username or email, drops the forgot-password link and posts to the same login call', async () => {
        serverSays({ provider: 'ldap', directory: true, loginMethod: 'password', passwordManagedLocally: false, selfRegistration: false });
        render(<LoginPage />);

        await waitFor(() => expect(screen.getByText('Username or Email')).toBeInTheDocument());
        expect(screen.queryByText('Forgot password?')).not.toBeInTheDocument();
        expect(screen.getByText(/add you to a staff group/i)).toBeInTheDocument();

        mockLogin.mockResolvedValue({
            data: { message: 'Operational user login successful', data: { user: { op_user_id: 1, first_name: 'Ada', last_name: 'Admin', user_role: 'Admin' }, accessToken: 'a', refreshToken: 'r' } },
        });
        fireEvent.change(screen.getByPlaceholderText(/DOMAIN/), { target: { name: 'email', value: 'EXAMPLE\\aadmin' } });
        fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { name: 'password', value: 'secret' } });
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => expect(mockLogin).toHaveBeenCalledWith({ email: 'EXAMPLE\\aadmin', password: 'secret' }));
        expect(localStorage.getItem('adminToken')).toBe('a');
    });

    it('entra mode: a Microsoft button that starts the sign-in on the API, and no password form at all', async () => {
        serverSays({ provider: 'entra', directory: true, loginMethod: 'microsoft', passwordManagedLocally: false, selfRegistration: false });
        render(<LoginPage />);

        const link = await screen.findByRole('link', { name: /sign in with microsoft/i });
        const url = new URL(link.getAttribute('href'));
        expect(url.pathname).toMatch(/\/auth\/entra\/login$/);
        expect(url.searchParams.get('audience')).toBe('staff');
        expect(url.searchParams.get('redirect')).toBe(`${window.location.origin}/auth/callback`);

        expect(screen.queryByPlaceholderText('Enter your password')).not.toBeInTheDocument();
        expect(screen.queryByText('Forgot password?')).not.toBeInTheDocument();
    });

    it('shows the reason a Microsoft sign-in failed, once', async () => {
        sessionStorage.setItem('auth_flash', JSON.stringify({ type: 'error', text: 'Your account does not have staff access.', title: 'Sign-in Failed' }));
        serverSays({});
        render(<LoginPage />);
        await waitFor(() => expect(mockToast.error).toHaveBeenCalledWith('Your account does not have staff access.', 'Sign-in Failed'));
        expect(sessionStorage.getItem('auth_flash')).toBeNull();
    });
});
