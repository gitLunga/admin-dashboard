import React from 'react';
import { render, waitFor } from '@testing-library/react';

// react-router-dom v7 ships ESM-style "exports" that CRA's Jest can't resolve; the page only needs useNavigate.
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }), { virtual: true });

const mockExchange = jest.fn();
jest.mock('../services/api', () => ({ authAPI: { exchangeTicket: (...a) => mockExchange(...a) } }));

const AuthCallbackPage = require('./AuthCallbackPage').default;

const visit = (search) => window.history.pushState({}, '', `/auth/callback${search}`);
const session = (role) => ({
    data: { data: { user: { op_user_id: 7, first_name: 'Mo', last_name: 'Manager', email: 'mo@x.gov.za', user_role: role }, accessToken: 'access-1', refreshToken: 'refresh-1' } },
});

beforeEach(() => { jest.clearAllMocks(); localStorage.clear(); sessionStorage.clear(); });

describe('AuthCallbackPage', () => {
    it('swaps the ticket for a session, removes it from the address bar and goes to the role\'s home page', async () => {
        visit('?ticket=one-time');
        mockExchange.mockResolvedValue(session('Manager'));

        render(<AuthCallbackPage />);

        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/manager/dashboard', { replace: true }));
        expect(mockExchange).toHaveBeenCalledWith('one-time');
        expect(window.location.search).toBe('');
        expect(localStorage.getItem('adminToken')).toBe('access-1');
        expect(localStorage.getItem('adminRefreshToken')).toBe('refresh-1');
        expect(JSON.parse(localStorage.getItem('adminUser'))).toMatchObject({ op_user_id: 7, user_role: 'Manager', must_change_password: false });
    });

    it.each([['Finance', '/finance/dashboard'], ['Admin', '/dashboard']])('sends a %s to %s', async (role, route) => {
        visit('?ticket=t');
        mockExchange.mockResolvedValue(session(role));
        render(<AuthCallbackPage />);
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith(route, { replace: true }));
    });

    it('swaps the ticket only once even if the effect runs twice (a ticket works once)', async () => {
        visit('?ticket=once');
        mockExchange.mockResolvedValue(session('Admin'));
        const { rerender } = render(<React.StrictMode><AuthCallbackPage /></React.StrictMode>);
        rerender(<React.StrictMode><AuthCallbackPage /></React.StrictMode>);
        await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
        expect(mockExchange).toHaveBeenCalledTimes(1);
    });

    it('shows the reason on the login page when Microsoft or the server refused the sign-in', async () => {
        visit('?error=NO_STAFF_ACCESS&error_description=Your%20account%20does%20not%20have%20staff%20access.');
        render(<AuthCallbackPage />);
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true }));
        expect(mockExchange).not.toHaveBeenCalled();
        expect(JSON.parse(sessionStorage.getItem('auth_flash'))).toEqual({
            type: 'error', text: 'Your account does not have staff access.', title: 'Sign-in Failed',
        });
        expect(localStorage.getItem('adminToken')).toBeNull();
    });

    it('explains an unusable link when there is neither a ticket nor an error', async () => {
        visit('');
        render(<AuthCallbackPage />);
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true }));
        expect(JSON.parse(sessionStorage.getItem('auth_flash')).text).toMatch(/not valid/);
    });

    it('goes back to the login page with the server\'s message when the ticket is refused', async () => {
        visit('?ticket=stale');
        mockExchange.mockRejectedValue({ response: { data: { message: 'This sign-in link has expired. Please sign in again.' } } });
        render(<AuthCallbackPage />);
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true }));
        expect(JSON.parse(sessionStorage.getItem('auth_flash')).text).toMatch(/expired/);
        expect(localStorage.getItem('adminToken')).toBeNull();
    });
});
