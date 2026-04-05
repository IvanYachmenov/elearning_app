import { isAxiosError } from 'axios';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  applyAuthSession,
  exchangeGoogleToken,
  initializeGoogleSignIn,
  initiateGitHubLogin,
  triggerGoogleFedCmSignIn,
} from '../../../../features/auth';
import type { GoogleCredentialResponse } from '../../../../features/auth/types';
import { api } from '../../../../shared/api';
import { useLanguage } from '../../../../shared/lib/i18n/LanguageContext';
import type { ApiErrorResponse, User } from '../../../../shared/types';
import type {
  SettingsAccountSectionProps,
  SocialConnectionsResponse,
  SocialProvider,
} from '../../model/types';

const INITIAL_CONNECTIONS: SocialConnectionsResponse = {
  google: false,
  github: false,
};

function SettingsAccountSection({ user, onUserUpdate }: SettingsAccountSectionProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [connections, setConnections] = useState<SocialConnectionsResponse>(INITIAL_CONNECTIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const googleHiddenButtonRef = useRef<HTMLDivElement | null>(null);

  const createdAtLabel = useMemo(() => {
    try {
      return new Date(user.date_joined).toLocaleString();
    } catch {
      return String(user.date_joined);
    }
  }, [user.date_joined]);

  const roleLabel = useMemo(() => {
    switch (user.role) {
      case 'student':
        return t('pages.settings.roleStudent');
      case 'teacher':
        return t('pages.settings.roleTeacher');
      case 'admin':
        return t('pages.settings.roleAdmin');
      default:
        return String(user.role);
    }
  }, [t, user.role]);

  const loadConnections = useCallback(async () => {
    try {
      const response = await api.get<SocialConnectionsResponse>('/api/auth/social-connections/');
      setConnections(response.data);
    } catch (loadError) {
      console.error('Failed to load social connections:', loadError);
    }
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    const response = await api.get<User>('/api/auth/me/');
    onUserUpdate(response.data);
  }, [onUserUpdate]);

  useEffect(() => {
    void loadConnections();
  }, [loadConnections]);

  const handleDisconnect = async (provider: SocialProvider) => {
    setIsLoading(true);
    setError(null);

    try {
      await api.post(`/api/auth/social-connections/${provider}/disconnect/`);
      await loadConnections();
      await refreshCurrentUser();
    } catch (requestError: unknown) {
      console.error('Disconnect failed:', requestError);
      setError(t('pages.settings.failedToDisconnect'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectGitHub = () => {
    initiateGitHubLogin('/settings');
  };

  const sendGoogleTokenToBackend = async (idToken: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { access, refresh, user: userFromBackend } = await exchangeGoogleToken(idToken);
      applyAuthSession(access, refresh);
      onUserUpdate(userFromBackend);
      await loadConnections();
      navigate('/settings', { replace: true });
    } catch (requestError: unknown) {
      console.error('Google auth error:', requestError);
      const providerError = isAxiosError<ApiErrorResponse>(requestError)
        ? requestError.response?.data?.detail
        : undefined;
      setError(providerError || t('pages.auth.googleAuthFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleCallback = async (response: GoogleCredentialResponse) => {
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

    if (isLoading) {
      return;
    }

    try {
      setIsLoading(true);
      await initializeGoogleSignIn(clientId, handleGoogleCallback);

      const didStart = await triggerGoogleFedCmSignIn(googleHiddenButtonRef);
      if (!didStart) {
        setError(t('pages.auth.googleSignInLoadFailed'));
      }
    } catch (requestError: unknown) {
      console.error('Google connect error:', requestError);
      if (!(requestError instanceof DOMException && requestError.name === 'AbortError')) {
        setError(t('pages.auth.googleSignInFailed'));
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
            <span className="settings-account__value">{user.username || '-'}</span>
          </div>
          <div className="settings-account__row">
            <span className="settings-account__label">{t('pages.auth.email')}</span>
            <span className="settings-account__value">{user.email || '-'}</span>
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
                    src={connections.github ? '/assets/icons/connected.png' : '/assets/icons/disconnected.png'}
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
                    src={connections.google ? '/assets/icons/connected.png' : '/assets/icons/disconnected.png'}
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

          <div className="settings-account__note">{t('pages.settings.accountDeletionNote')}</div>
        </div>
      </div>
    </div>
  );
}

export default SettingsAccountSection;
