import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { Link, useNavigate } from 'react-router-dom';

import { api } from '../../../shared/api';
import type { ApiErrorResponse } from '../../../shared/types';
import {
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
      setError("Registration failed. Username or email may already be taken.");
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

  const handleGoogleRegister = async () => {
    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
      if (!clientId) {
        setError("Google OAuth is not configured. Please contact support.");
        return;
      }

      if (isLoading) {
        return;
      }

      await initializeGoogleSignIn(clientId, handleGoogleCallback);

      const didStart = await triggerGoogleFedCmSignIn(googleHiddenButtonRef);
      if (!didStart) {
        setError("Google Sign-In failed to load. Please refresh the page.");
      }
    } catch (authError) {
      console.error('Google register error:', authError);
      if (!(authError instanceof DOMException && authError.name === 'AbortError')) {
        setError("Failed to initialize Google Sign-In. Please try again.");
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
      formatProviderError: (providerError) => `${"GitHub authentication failed. Please try again."}: ${providerError}`,
      genericError: "GitHub authentication failed. Please try again.",
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
      <div className="auth-left">
        <div className="auth-left__content">
          <div className="auth-left__logo"></div>
          <h1 className="auth-left__title">{"Start Your Learning Journey"}</h1>
          <p className="auth-left__subtitle">{"Join thousands of learners and start mastering new skills today."}</p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrapper">
          <h1 className="auth-title">{"Create Account"}</h1>
          <p className="auth-subtitle">{"Choose your preferred signup method"}</p>

          {!showEmailForm ? (
            <>
              <AuthSocialButtons
                isLoading={isLoading}
                onGoogleClick={handleGoogleRegister}
                onGitHubClick={handleGitHubRegister}
                googleLoadingLabel={"Signing up..."}
                googleLabel={"Continue with Google"}
                githubLabel={"Continue with GitHub"}
              />

              <div className="auth-divider">
                <span>{"or"}</span>
              </div>

              <button
                type="button"
                className="auth-button auth-button--outline"
                onClick={() => setShowEmailForm(true)}
              >
                {"Use email / password"}
              </button>
            </>
          ) : (
            <>
              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="auth-field">
                  <label className="auth-label">
                    {"Username"} <span className="auth-label-required">*</span>
                  </label>
                  <input
                    className="auth-input"
                    type="text"
                    name="username"
                    placeholder={"Choose a username"}
                    value={form.username}
                    onChange={handleChange}
                    maxLength={10}
                    required
                  />
                </div>

                <div className="auth-field">
                  <label className="auth-label">
                    {"Email"} <span className="auth-label-required">*</span>
                  </label>
                  <input
                    className="auth-input"
                    type="email"
                    name="email"
                    placeholder={"Your email"}
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="auth-field">
                  <label className="auth-label">
                    {"Password"} <span className="auth-label-required">*</span>
                  </label>
                  <input
                    className="auth-input"
                    type="password"
                    name="password"
                    placeholder={"Create a password"}
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="auth-field">
                  <label className="auth-label">{"First name"}</label>
                  <input
                    className="auth-input"
                    type="text"
                    name="first_name"
                    placeholder={"Your first name"}
                    value={form.first_name}
                    onChange={handleChange}
                    maxLength={13}
                  />
                </div>

                <div className="auth-field">
                  <label className="auth-label">{"Last name"}</label>
                  <input
                    className="auth-input"
                    type="text"
                    name="last_name"
                    placeholder={"Your last name"}
                    value={form.last_name}
                    onChange={handleChange}
                    maxLength={13}
                  />
                </div>

                <button type="submit" className="auth-button" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create account"}
                </button>
              </form>

              {error && <div className="auth-error">{error}</div>}

              <button
                type="button"
                className="auth-button-back"
                onClick={() => setShowEmailForm(false)}
              >
                {"Back to other options"}
              </button>
            </>
          )}

          {!showEmailForm && (
            <p className="auth-footer">
              {"Already have an account?"}{' '}
              <Link to="/login" className="auth-link">
                {"Log in"}
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
