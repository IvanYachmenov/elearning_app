import type { HiddenGoogleButtonRef } from '../types';

function ensureHiddenButtonContainer(googleHiddenButtonRef: HiddenGoogleButtonRef): HTMLDivElement {
  let hiddenButtonContainer = googleHiddenButtonRef.current;

  if (!hiddenButtonContainer) {
    hiddenButtonContainer = document.createElement('div');
    hiddenButtonContainer.style.position = 'fixed';
    hiddenButtonContainer.style.left = '-9999px';
    hiddenButtonContainer.style.opacity = '0';
    hiddenButtonContainer.style.pointerEvents = 'none';
    document.body.appendChild(hiddenButtonContainer);
    googleHiddenButtonRef.current = hiddenButtonContainer;
  }

  return hiddenButtonContainer;
}

function findGoogleButton(container: HTMLElement): HTMLElement | null {
  return (
    container.querySelector<HTMLElement>('[role="button"]') ||
    container.querySelector<HTMLElement>('div[class*="SignInButton"]') ||
    container.querySelector<HTMLElement>('button')
  );
}

export async function triggerGoogleFedCmSignIn(googleHiddenButtonRef: HiddenGoogleButtonRef): Promise<boolean> {
  if (!window.google?.accounts?.id) {
    return false;
  }

  const hiddenButtonContainer = ensureHiddenButtonContainer(googleHiddenButtonRef);
  hiddenButtonContainer.innerHTML = '';

  window.google.accounts.id.renderButton(hiddenButtonContainer, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'signin_with',
    width: 300,
    use_fedcm_for_button: true,
  });

  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 100);
  });

  const googleButton = findGoogleButton(hiddenButtonContainer);
  if (!googleButton) {
    return false;
  }

  googleButton.click();
  return true;
}
