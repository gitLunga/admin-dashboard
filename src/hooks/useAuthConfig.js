import { useEffect, useState } from 'react';
import { fetchAuthConfig, LOCAL_AUTH } from '../services/authConfig';

// Returns the server's sign-in settings; `loaded` is false until the first answer (or fallback) arrives.
export function useAuthConfig() {
    const [state, setState] = useState({ config: LOCAL_AUTH, loaded: false });

    useEffect(() => {
        let active = true;
        fetchAuthConfig().then((config) => { if (active) setState({ config, loaded: true }); });
        return () => { active = false; };
    }, []);

    return state;
}
