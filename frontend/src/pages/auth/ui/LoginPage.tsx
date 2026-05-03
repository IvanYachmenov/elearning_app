import { useEffect, useRef, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { Link, useNavigate } from 'react-router-dom';

import { useLanguage } from '../../../shared/lib/i18n/LanguageContext';
import type { ApiErrorResponse } from '../../../shared/types';
import {
  AuthDisplayControls,
  AuthSocialButtons,
  applyAuthSession,
  exchangeGoogleToken,
  fetchCurrentUser,
  initializeGoogleSignIn,
  initiateGitHubLogin,
  loginWithPassword,
  processGitHubCallback,
  triggerGoogleFedCmSignIn,
} from '../../../features/auth';
import type { AuthPageProps, GoogleCredentialResponse } from '../../../features/auth/types';
import '../styles/auth.css';

function LoginPage({ onAuth }: AuthPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const googleHiddenButtonRef = useRef<HTMLDivElement | null>(null);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { access, refresh } = await loginWithPassword({
        username,
        password,
      });

      applyAuthSession(access, refresh);

      const user = await fetchCurrentUser();
      if (onAuth) {
        onAuth(access, user);
      }

      navigate('/courses');
    } catch (authError) {
      console.error(authError);
      setError(t('pages.auth.loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const sendGoogleTokenToBackend = async (idToken: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { access, refresh, user } = await exchangeGoogleToken(idToken);
      applyAuthSession(access, refresh);

      if (onAuth) {
        onAuth(access, user);
      }

      navigate('/courses');
    } catch (authError) {
      console.error('Google auth error:', authError);
      const providerError = isAxiosError<ApiErrorResponse>(authError)
        ? authError.response?.data?.detail
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

  const handleGoogleLogin = async () => {
    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
      if (!clientId) {
        setError(t('pages.auth.googleOAuthNotConfigured'));
        return;
      }

      if (isLoading) {
        return;
      }

      await initializeGoogleSignIn(clientId, handleGoogleCallback);

      const didStart = await triggerGoogleFedCmSignIn(googleHiddenButtonRef);
      if (!didStart) {
        setError(t('pages.auth.googleSignInLoadFailed'));
      }
    } catch (authError) {
      console.error('Google login error:', authError);
      if (!(authError instanceof DOMException && authError.name === 'AbortError')) {
        setError(t('pages.auth.googleSignInFailed'));
      }
    }
  };

  const handleGitHubLogin = () => {
    initiateGitHubLogin('/courses');
  };

  useEffect(() => {
    document.body.classList.remove('theme-app');
    document.body.classList.add('theme-auth');

    void processGitHubCallback({
      onAuth,
      navigate,
      setError,
      setIsLoading,
      formatProviderError: (providerError) => `GitHub authentication failed: ${providerError}`,
      genericError: t('pages.auth.githubAuthFailed'),
    });

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    if (clientId && !showEmailForm) {
      void initializeGoogleSignIn(clientId, handleGoogleCallback);
    }

    return () => document.body.classList.remove('theme-auth');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showEmailForm]);

  return (
    <div className="auth-container">
      <AuthDisplayControls />
      <div className="auth-left">
        <div className="auth-left__content">
          <div className="auth-left__logo"></div>
          <h1 className="auth-left__title">{t('pages.auth.welcomeBack')}</h1>
          <p className="auth-left__subtitle">{t('pages.auth.continueLearning')}</p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrapper">
          <h1 className="auth-title">{t('pages.auth.login')}</h1>
          <p className="auth-subtitle">{t('pages.auth.chooseLoginMethod')}</p>

          {!showEmailForm ? (
            <>
              <AuthSocialButtons
                isLoading={isLoading}
                onGoogleClick={handleGoogleLogin}
                onGitHubClick={handleGitHubLogin}
                googleLoadingLabel={t('pages.auth.signingIn')}
                googleLabel={t('pages.auth.continueGoogle')}
                githubLabel={t('pages.auth.continueGitHub')}
              />

              <div className="auth-divider">
                <span>{t('pages.auth.or')}</span>
              </div>

              <button
                type="button"
                className="auth-button auth-button--outline"
                onClick={() => setShowEmailForm(true)}
              >
                {t('pages.auth.useEmailPassword')}
              </button>
            </>
          ) : (
            <>
              <form className="auth-form" onSubmit={handleLogin}>
                <div className="auth-field">
                  <label className="auth-label">{t('pages.auth.usernameOrEmail')}</label>
                  <input
                    className="auth-input"
                    type="text"
                    placeholder={t('pages.auth.enterUsernameOrEmail')}
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    required
                  />
                </div>

                <div className="auth-field">
                  <label className="auth-label">{t('pages.auth.password')}</label>
                  <input
                    className="auth-input"
                    type="password"
                    placeholder={t('pages.auth.enterPassword')}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="auth-button" disabled={isLoading}>
                  {isLoading ? t('pages.auth.loggingIn') : t('pages.auth.login')}
                </button>
              </form>

              {error && <div className="auth-error">{error}</div>}

              <button
                type="button"
                className="auth-button-back"
                onClick={() => setShowEmailForm(false)}
              >
                {t('pages.auth.backToOptions')}
              </button>
            </>
          )}

          {!showEmailForm && (
            <p className="auth-footer">
              {t('pages.auth.dontHaveAccount')}{' '}
              <Link to="/register" className="auth-link">
                {t('pages.auth.register')}
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

