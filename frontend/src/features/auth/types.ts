import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { NavigateFunction } from 'react-router-dom';

import type { AuthSuccessHandler, AuthTokens, User } from '../../shared/types';

export interface AuthSessionTokens extends AuthTokens {
  refresh: string;
}

export interface LoginFormValues {
  username: string;
  password: string;
}

export interface RegisterFormValues {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface AuthPageProps {
  onAuth?: AuthSuccessHandler;
}

export interface GoogleCredentialResponse {
  credential?: string;
  error?: string;
}

export interface GoogleButtonOptions {
  type: string;
  theme: string;
  size: string;
  text: string;
  width: number;
  use_fedcm_for_button: boolean;
}

export interface GoogleIdApi {
  initialize(config: { client_id: string; callback: (response: GoogleCredentialResponse) => void }): void;
  renderButton(container: HTMLElement, options: GoogleButtonOptions): void;
}

export interface GoogleIdentityWindow {
  accounts: {
    id: GoogleIdApi;
  };
}

export interface GoogleAuthExchangeResponse extends AuthSessionTokens {
  user: User;
}

export type HiddenGoogleButtonRef = MutableRefObject<HTMLDivElement | null>;

export interface GitHubCallbackResult {
  access: string | null;
  refresh: string | null;
  error: string | null;
  provider: string | null;
  nextPath: string;
  isGitHubCallback: boolean;
}

export interface GitHubCallbackHandlerOptions {
  onAuth?: AuthSuccessHandler;
  navigate: NavigateFunction;
  setError: Dispatch<SetStateAction<string | null>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  formatProviderError: (providerError: string) => string;
  genericError: string;
}

export interface AuthSocialButtonsProps {
  isLoading: boolean;
  onGoogleClick: () => void | Promise<void>;
  onGitHubClick: () => void;
  googleLoadingLabel: string;
  googleLabel: string;
  githubLabel: string;
}

declare global {
  interface Window {
    google?: GoogleIdentityWindow;
  }
}

