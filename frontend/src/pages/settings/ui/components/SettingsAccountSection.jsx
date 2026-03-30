import {useEffect, useMemo, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';

import {api} from '../../../../shared/api';
import {
    applyAuthSession,
    exchangeGoogleToken,
    initializeGoogleSignIn,
    initiateGitHubLogin,
    triggerGoogleFedCmSignIn,
} from '../../../../features/auth';
import {useLanguage} from '../../../../shared/lib/i18n/LanguageContext';

function SettingsAccountSection({user, onUserUpdate}) {
    const navigate = useNavigate();
    const {t} = useLanguage();

    const [connections, setConnections] = useState({google: false, github: false});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const googleHiddenButtonRef = useRef(null);

    const createdAtLabel = useMemo(() => {
        if (!user?.date_joined) return '-';
        try {
            return new Date(user.date_joined).toLocaleString();
        } catch {
            return String(user.date_joined);
        }
    }, [user?.date_joined]);

    const roleLabel = useMemo(() => {
        const role = user?.role;
        if (role === 'student') return t('pages.settings.roleStudent');
        if (role === 'teacher') return t('pages.settings.roleTeacher');
        if (role === 'admin') return t('pages.settings.roleAdmin');
        return role ? String(role) : '-';
    }, [user?.role, t]);

    const loadConnections = async () => {
        try {
            const resp = await api.get('/api/auth/social-connections/');
            setConnections(resp.data);
        } catch (err) {
            console.error('Failed to load social connections:', err);
        }
    };

    const refreshMe = async () => {
        const meResp = await api.get('/api/auth/me/');
        onUserUpdate?.(meResp.data);
    };

    useEffect(() => {
        loadConnections();
    }, []);

    const handleDisconnect = async (provider) => {
        setIsLoading(true);
        setError(null);
        try {
            await api.post(`/api/auth/social-connections/${provider}/disconnect/`);
            await loadConnections();
            await refreshMe();
        } catch (err) {
            console.error('Disconnect failed:', err);
            setError(t('pages.settings.failedToDisconnect'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnectGitHub = () => {
        initiateGitHubLogin('/settings');
    };

    const sendGoogleTokenToBackend = async (idToken) => {
        setIsLoading(true);
        setError(null);

        try {
            const {access, refresh, user: userFromBackend} = await exchangeGoogleToken(idToken);
            applyAuthSession(access, refresh);

            if (onUserUpdate) {
                onUserUpdate(userFromBackend);
            }
            await loadConnections();
            navigate('/settings', {replace: true});
        } catch (err) {
            console.error('Google auth error:', err);
            setError(err.response?.data?.detail || t('pages.auth.googleAuthFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleCallback = async (response) => {
        if (response.credential) {
            await sendGoogleTokenToBackend(response.credential);
            return;
        }

        if (response.error && response.error !== 'popup_closed_by_user' && response.error !== 'popup_blocked') {
            setError(t('pages.auth.googleAuthFailed'));
        }
    };

    const handleConnectGoogle = async () => {
        setError(null);

        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
        if (!clientId) {
            setError(t('pages.settings.googleOAuthNotConfigured'));
            return;
        }

        try {
            setIsLoading(true);
            await initializeGoogleSignIn(clientId, handleGoogleCallback);

            const didStart = await triggerGoogleFedCmSignIn(googleHiddenButtonRef);
            if (!didStart) {
                setError('Failed to initialize Google Sign-In. Please try again.');
            }
        } catch (err) {
            console.error('Google connect error:', err);
            if (err.name !== 'AbortError' && !err.message?.includes('aborted')) {
                setError('Failed to initialize Google Sign-In. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="settings-section">
            <h2 className="settings-section__title">{t('pages.settings.account')}</h2>

            {error && <div className="settings-account__error">{error}</div>}

            <div className="settings-account__grid">
                <div className="settings-account__card">
                    <div className="settings-account__card-title">{t('pages.settings.overview')}</div>
                    <div className="settings-account__row">
                        <span className="settings-account__label">{t('pages.settings.status')}</span>
                        <span className="settings-account__value">{t('pages.settings.active')}</span>
                    </div>
                    <div className="settings-account__row">
                        <span className="settings-account__label">{t('pages.settings.created')}</span>
                        <span className="settings-account__value">{createdAtLabel}</span>
                    </div>
                    <div className="settings-account__row">
                        <span className="settings-account__label">{t('pages.settings.role')}</span>
                        <span className="settings-account__value">{roleLabel}</span>
                    </div>
                    <div className="settings-account__row">
                        <span className="settings-account__label">{t('pages.auth.username')}</span>
                        <span className="settings-account__value">{user?.username || '-'}</span>
                    </div>
                    <div className="settings-account__row">
                        <span className="settings-account__label">{t('pages.auth.email')}</span>
                        <span className="settings-account__value">{user?.email || '-'}</span>
                    </div>
                </div>

                <div className="settings-account__card">
                    <div className="settings-account__card-title">{t('pages.settings.connections')}</div>

                    <div className="settings-account__connection">
                        <div className="settings-account__connection-left">
                            <img
                                className="settings-account__provider-icon"
                                src="/assets/icons/github.png"
                                alt="GitHub"
                            />
                            <div className="settings-account__connection-main">
                                <div className="settings-account__connection-name">GitHub</div>
                                <div className="settings-account__connection-status">
                                    <img
                                        className="settings-account__status-icon"
                                        src={
                                            connections.github
                                                ? '/assets/icons/connected.png'
                                                : '/assets/icons/disconnected.png'
                                        }
                                        alt={connections.github ? t('pages.settings.connected') : t('pages.settings.notConnected')}
                                    />
                                    <span>{connections.github ? t('pages.settings.connected') : t('pages.settings.notConnected')}</span>
                                </div>
                            </div>
                        </div>
                        <div className="settings-account__connection-actions">
                            {connections.github ? (
                                <button
                                    type="button"
                                    className="settings-account__btn settings-account__btn--danger"
                                    onClick={() => handleDisconnect('github')}
                                    disabled={isLoading}
                                >
                                    {t('pages.settings.disconnect')}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="settings-account__btn"
                                    onClick={handleConnectGitHub}
                                    disabled={isLoading}
                                >
                                    {t('pages.settings.connect')}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="settings-account__connection">
                        <div className="settings-account__connection-left">
                            <img
                                className="settings-account__provider-icon"
                                src="/assets/icons/google.png"
                                alt="Google"
                            />
                            <div className="settings-account__connection-main">
                                <div className="settings-account__connection-name">Google</div>
                                <div className="settings-account__connection-status">
                                    <img
                                        className="settings-account__status-icon"
                                        src={
                                            connections.google
                                                ? '/assets/icons/connected.png'
                                                : '/assets/icons/disconnected.png'
                                        }
                                        alt={connections.google ? t('pages.settings.connected') : t('pages.settings.notConnected')}
                                    />
                                    <span>{connections.google ? t('pages.settings.connected') : t('pages.settings.notConnected')}</span>
                                </div>
                            </div>
                        </div>
                        <div className="settings-account__connection-actions">
                            {connections.google ? (
                                <button
                                    type="button"
                                    className="settings-account__btn settings-account__btn--danger"
                                    onClick={() => handleDisconnect('google')}
                                    disabled={isLoading}
                                >
                                    {t('pages.settings.disconnect')}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="settings-account__btn"
                                    onClick={handleConnectGoogle}
                                    disabled={isLoading}
                                >
                                    {t('pages.settings.connect')}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="settings-account__note">
                        {t('pages.settings.accountDeletionNote')}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SettingsAccountSection;

