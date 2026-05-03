import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { Link, useNavigate } from 'react-router-dom';

import { useLanguage } from '../../../shared/lib/i18n/LanguageContext';
import { api } from '../../../shared/api';
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
import type { AuthPageProps, GoogleCredentialResponse, RegisterFormValues } from '../../../features/auth/types';
import '../styles/auth.css';

const INITIAL_FORM: RegisterFormValues = {
  username: '',
  email: '',
  password: '',
  first_name: '',
  last_name: '',
};

function RegisterPage({ onAuth }: AuthPageProps) {
  const [form, setForm] = useState<RegisterFormValues>(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const googleHiddenButtonRef = useRef<HTMLDivElement | null>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await api.post('/api/auth/register/', form);

      const { access, refresh } = await loginWithPassword({
        username: form.username,
        password: form.password,
      });

      applyAuthSession(access, refresh);

      const user = await fetchCurrentUser();
      if (onAuth) {
        onAuth(access, user);
      }

      navigate('/courses');
    } catch (authError) {
      console.error(authError);
      setError(t('pages.auth.registrationFailed'));
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

  const handleGoogleRegister = async () => {
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
      console.error('Google register error:', authError);
      if (!(authError instanceof DOMException && authError.name === 'AbortError')) {
        setError(t('pages.auth.googleSignInFailed'));
      }
    }
  };

  const handleGitHubRegister = () => {
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
      formatProviderError: (providerError) => `${t('pages.auth.githubAuthFailed')}: ${providerError}`,
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
    <div className="auth-container auth-container--register">
      <AuthDisplayControls />
      <div className="auth-left">
        <div className="auth-left__content">
          <div className="auth-left__logo"></div>
          <h1 className="auth-left__title">{t('pages.auth.startJourney')}</h1>
          <p className="auth-left__subtitle">{t('pages.auth.joinLearners')}</p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrapper">
          <h1 className="auth-title">{t('pages.auth.createAccount')}</h1>
          <p className="auth-subtitle">{t('pages.auth.chooseSignupMethod')}</p>

          {!showEmailForm ? (
            <>
              <AuthSocialButtons
                isLoading={isLoading}
                onGoogleClick={handleGoogleRegister}
                onGitHubClick={handleGitHubRegister}
                googleLoadingLabel={t('pages.auth.signingUp')}
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
              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="auth-field">
                  <label className="auth-label">
                    {t('pages.auth.username')} <span className="auth-label-required">*</span>
                  </label>
                  <input
                    className="auth-input"
                    type="text"
                    name="username"
                    placeholder={t('pages.auth.chooseUsername')}
                    value={form.username}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="auth-field">
                  <label className="auth-label">
                    {t('pages.auth.email')} <span className="auth-label-required">*</span>
                  </label>
                  <input
                    className="auth-input"
                    type="email"
                    name="email"
                    placeholder={t('pages.auth.yourEmail')}
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="auth-field">
                  <label className="auth-label">
                    {t('pages.auth.password')} <span className="auth-label-required">*</span>
                  </label>
                  <input
                    className="auth-input"
                    type="password"
                    name="password"
                    placeholder={t('pages.auth.createPassword')}
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="auth-field">
                  <label className="auth-label">{t('pages.auth.firstName')}</label>
                  <input
                    className="auth-input"
                    type="text"
                    name="first_name"
                    placeholder={t('pages.auth.yourFirstName')}
                    value={form.first_name}
                    onChange={handleChange}
                  />
                </div>

                <div className="auth-field">
                  <label className="auth-label">{t('pages.auth.lastName')}</label>
                  <input
                    className="auth-input"
                    type="text"
                    name="last_name"
                    placeholder={t('pages.auth.yourLastName')}
                    value={form.last_name}
                    onChange={handleChange}
                  />
                </div>

                <button type="submit" className="auth-button" disabled={isLoading}>
                  {isLoading ? t('pages.auth.creatingAccount') : t('pages.auth.createAccountButton')}
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
              {t('pages.auth.alreadyHaveAccount')}{' '}
              <Link to="/login" className="auth-link">
                {t('pages.auth.login')}
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
