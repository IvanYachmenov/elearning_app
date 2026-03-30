/**
 * Google OAuth integration using Google Identity Services.
 * Uses OAuth 2.0 Identity Services script loading and initialization.
 */

let googleLoaded = false;

export function loadGoogleScript() {
    if (googleLoaded || window.google) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
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

export function initializeGoogleSignIn(clientId, callback) {
    return loadGoogleScript()
        .then(() => {
            if (!window.google || !window.google.accounts || !window.google.accounts.id) {
                throw new Error('Google Identity Services not loaded');
            }

            const currentOrigin = window.location.origin;
            console.log('[Google Auth] Initializing with Client ID:', clientId);
            console.log('[Google Auth] Current origin:', currentOrigin);
            console.log('[Google Auth] Make sure this origin is added in Google Cloud Console!');

            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: (response) => {
                    if (response.credential) {
                        callback(response);
                        return;
                    }

                    if (response.error) {
                        console.log('Google Sign-In error:', response.error);

                        if (
                            response.error !== 'popup_closed_by_user' &&
                            response.error !== 'popup_blocked' &&
                            response.error !== 'access_denied'
                        ) {
                            callback({error: response.error});
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
