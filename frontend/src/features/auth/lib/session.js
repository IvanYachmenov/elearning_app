import {api, setAuthToken} from '../../../shared/api';
import {setCookie} from '../../../shared/lib/storage/cookies';

export function applyAuthSession(access, refresh, days = 365) {
    setCookie('access', access, days);
    setCookie('refresh', refresh, days);
    setAuthToken(access);
}

export async function fetchCurrentUser() {
    const meResp = await api.get('/api/auth/me/');
    return meResp.data;
}

export async function exchangeGoogleToken(token) {
    const resp = await api.post('/api/auth/google/', {
        token,
    });

    return resp.data;
}

