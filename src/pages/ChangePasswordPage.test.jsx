import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// react-router-dom v7 ships ESM-style "exports" that CRA's Jest can't resolve; the page only needs these two.
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
    Navigate: ({ to }) => <div data-testid="redirect">{to}</div>,
}), { virtual: true });

const mockChangePassword = jest.fn();
const mockLogout = jest.fn();
jest.mock('../services/api', () => ({
    authAPI: {
        changePassword: (...a) => mockChangePassword(...a),
        logout: (...a) => mockLogout(...a),
    },
}));

const ChangePasswordPage = require('./ChangePasswordPage').default;

const type = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const submit = () => fireEvent.click(screen.getByRole('button', { name: /change password/i }));

beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('adminToken', 'access');
    localStorage.setItem('adminRefreshToken', 'refresh');
    localStorage.setItem('adminUser', '{"id":1}');
    mockLogout.mockResolvedValue({});
});

describe('ChangePasswordPage', () => {
    it('sends people without a session to the login page', () => {
        localStorage.clear();
        render(<ChangePasswordPage />);
        expect(screen.getByTestId('redirect')).toHaveTextContent('/login');
    });

    it('ticks each password requirement as it is met', () => {
        render(<ChangePasswordPage />);
        const items = () => screen.getAllByRole('listitem').map((li) => li.style.color || getComputedStyle(li).color);
        const before = items();
        type('New password', 'Abcdef1!');
        expect(items()).not.toEqual(before);
        expect(screen.getAllByRole('listitem')).toHaveLength(5);
    });

    it.each([
        ['empty fields', ['', '', ''], /all fields are required/i],
        ['a mismatch', ['Temp#Pass1', 'Br@ndNew123', 'Br@ndNew124'], /do not match/i],
        ['reusing the temporary password', ['Temp#Pass1', 'Temp#Pass1', 'Temp#Pass1'], /different from the temporary/i],
        ['a password that breaks the policy', ['Temp#Pass1', 'alllowercase', 'alllowercase'], /does not meet all/i],
    ])('rejects %s without calling the server', (_name, [cur, next, confirm], message) => {
        render(<ChangePasswordPage />);
        type('Temporary password', cur);
        type('New password', next);
        type('Confirm new password', confirm);
        submit();
        expect(screen.getByRole('alert')).toHaveTextContent(message);
        expect(mockChangePassword).not.toHaveBeenCalled();
    });

    it('changes the password, ends the temporary session and returns to sign-in', async () => {
        mockChangePassword.mockResolvedValue({ data: { success: true } });
        render(<ChangePasswordPage />);
        type('Temporary password', 'Temp#Pass1');
        type('New password', 'Br@ndNew123');
        type('Confirm new password', 'Br@ndNew123');
        submit();

        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true }));
        expect(mockChangePassword).toHaveBeenCalledWith('Temp#Pass1', 'Br@ndNew123');
        expect(mockLogout).toHaveBeenCalledWith('refresh');                       // refresh token revoked server-side
        expect(localStorage.getItem('adminToken')).toBeNull();
        expect(localStorage.getItem('adminRefreshToken')).toBeNull();
        expect(localStorage.getItem('adminUser')).toBeNull();
        expect(JSON.parse(sessionStorage.getItem('auth_flash'))).toMatchObject({ type: 'success' });
    });

    it('still finishes if the logout call fails', async () => {
        mockChangePassword.mockResolvedValue({});
        mockLogout.mockRejectedValue(new Error('network'));
        render(<ChangePasswordPage />);
        type('Temporary password', 'Temp#Pass1');
        type('New password', 'Br@ndNew123');
        type('Confirm new password', 'Br@ndNew123');
        submit();
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true }));
        expect(localStorage.getItem('adminToken')).toBeNull();
    });

    it('shows the server message and keeps the session when the temporary password is wrong', async () => {
        mockChangePassword.mockRejectedValue({ response: { data: { message: 'Current password is incorrect.' } } });
        render(<ChangePasswordPage />);
        type('Temporary password', 'wrong');
        type('New password', 'Br@ndNew123');
        type('Confirm new password', 'Br@ndNew123');
        submit();
        expect(await screen.findByRole('alert')).toHaveTextContent('Current password is incorrect.');
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(localStorage.getItem('adminToken')).toBe('access');
        expect(screen.getByRole('button', { name: /change password/i })).toBeEnabled();
    });
});
