import type { GoogleCredentialResponse } from '../../types';

let googleLoaded = false;

export function loadGoogleScript(): Promise<void> {
  if (googleLoaded || window.google) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');

    script.src = 'https://accounts.google.com/gsi/client?hl=en';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      googleLoaded = true;
      resolve();
    };
    script.onerror = () => {
      reject(new Error('Failed to load Google Identity Services'));
    };

    document.head.appendChild(script);
  });
}

export function initializeGoogleSignIn(
  clientId: string,
  callback: (response: GoogleCredentialResponse) => void,
): Promise<void> {
  return loadGoogleScript()
    .then(() => {
      if (!window.google?.accounts?.id) {
        throw new Error('Google Identity Services not loaded');
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) {
            callback(response);
            return;
          }

          if (response.error) {
            if (
              response.error !== 'popup_closed_by_user' &&
              response.error !== 'popup_blocked' &&
              response.error !== 'access_denied'
            ) {
              callback({ error: response.error });
            }
          }
        },
      });
    })
    .catch((error) => {
      console.error('Error loading Google script:', error);
      throw error;
    });
}
