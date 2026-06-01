// src/hooks/useLogout.js
// Drop-in hook — call logoutUser() from any button/component
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

export function useLogout() {
    const navigate = useNavigate();

    const logoutUser = async () => {
        await authAPI.logout();   // blacklists tokens server-side + clears localStorage
        navigate('/login');
    };

    return { logoutUser };
}