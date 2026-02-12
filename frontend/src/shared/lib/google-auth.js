/**
 * Google OAuth integration using Google Identity Services
 * Uses OAuth 2.0 Token Client for reliable button-based authentication
 */

let googleLoaded = false;
let tokenClient = null;

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
    return loadGoogleScript().then(() => {
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
                } else if (response.error) {
                    
                    console.log('Google Sign-In error:', response.error);
                    
                    if (response.error !== 'popup_closed_by_user' && 
                        response.error !== 'popup_blocked' &&
                        response.error !== 'access_denied') {
                        callback({ error: response.error });
                    }
                }
            },
            
        });

        if (window.google.accounts.oauth2) {
            tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: 'openid profile email',
                callback: (tokenResponse) => {},
            });
        }
    }).catch((error) => {
        console.error('Error loading Google script:', error);
        throw error;
    });
}

export function renderGoogleButton(buttonElement, clientId, callback) {
    if (!buttonElement) {
        console.error('Button element is required');
        return;
    }

    return loadGoogleScript().then(() => {
        if (!window.google || !window.google.accounts || !window.google.accounts.id) {
            throw new Error('Google Identity Services not loaded');
        }

        window.google.accounts.id.renderButton(buttonElement, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            width: buttonElement.offsetWidth || 300,
        });

    }).catch((error) => {
        console.error('Error rendering Google button:', error);
        throw error;
    });
}

export function requestGoogleIdToken(clientId, callback) {
    return loadGoogleScript().then(() => {
        if (!window.google || !window.google.accounts || !window.google.accounts.id) {
            throw new Error('Google Identity Services not loaded');
        }

        try {
            
            window.google.accounts.id.prompt((notification) => {
                
                if (notification.isNotDisplayed() || 
                    notification.isSkippedMoment() || 
                    notification.isDismissedMoment()) {
                    
                    return;
                }
            });
        } catch (error) {
            if (error.name === 'AbortError' || error.message?.includes('aborted')) {
                console.log('Google Sign-In was cancelled');
            } else {
                throw error;
            }
        }
    }).catch((error) => {
        console.error('Error requesting Google ID token:', error);
        throw error;
    });
}
