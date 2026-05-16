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
        return "Student";
      case 'teacher':
        return "Teacher";
      case 'admin':
        return "Admin";
      default:
        return String(user.role);
    }
  }, [user.role]);

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
      setError("Failed to disconnect. Please try again.");
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
      setError(providerError || "Google authentication failed. Please try again.");
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
      setError("Google authentication failed. Please try again.");
    }
  };

  const handleConnectGoogle = async () => {
    setError(null);

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    if (!clientId) {
      setError("Google OAuth is not configured.");
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
        setError("Google Sign-In failed to load. Please refresh the page.");
      }
    } catch (requestError: unknown) {
      console.error('Google connect error:', requestError);
      if (!(requestError instanceof DOMException && requestError.name === 'AbortError')) {
        setError("Failed to initialize Google Sign-In. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="settings-section">
      <h2 className="settings-section__title">{"Account"}</h2>

      {error && <div className="settings-account__error">{error}</div>}

      <div className="settings-account__grid">
        <div className="settings-account__card">
          <div className="settings-account__card-title">{"Overview"}</div>
          <div className="settings-account__row">
            <span className="settings-account__label">{"Status"}</span>
            <span className="settings-account__value">{"Active"}</span>
          </div>
          <div className="settings-account__row">
            <span className="settings-account__label">{"Created"}</span>
            <span className="settings-account__value">{createdAtLabel}</span>
          </div>
          <div className="settings-account__row">
            <span className="settings-account__label">{"Role"}</span>
            <span className="settings-account__value">{roleLabel}</span>
          </div>
          <div className="settings-account__row">
            <span className="settings-account__label">{"Username"}</span>
            <span className="settings-account__value">{user.username || '-'}</span>
          </div>
          <div className="settings-account__row">
            <span className="settings-account__label">{"Email"}</span>
            <span className="settings-account__value">{user.email || '-'}</span>
          </div>
        </div>

        <div className="settings-account__card">
          <div className="settings-account__card-title">{"Connections"}</div>

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
                    alt={connections.github ? "Connected" : "Not connected"}
                  />
                  <span>{connections.github ? "Connected" : "Not connected"}</span>
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
                  {"Disconnect"}
                </button>
              ) : (
                <button
                  type="button"
                  className="settings-account__btn settings-account__btn--connect"
                  onClick={handleConnectGitHub}
                  disabled={isLoading}
                >
                  {"Connect"}
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
                    alt={connections.google ? "Connected" : "Not connected"}
                  />
                  <span>{connections.google ? "Connected" : "Not connected"}</span>
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
                  {"Disconnect"}
                </button>
              ) : (
                <button
                  type="button"
                  className="settings-account__btn settings-account__btn--connect"
                  onClick={handleConnectGoogle}
                  disabled={isLoading}
                >
                  {"Connect"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsAccountSection;
