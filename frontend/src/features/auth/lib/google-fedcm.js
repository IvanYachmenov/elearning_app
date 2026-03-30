function ensureHiddenButtonContainer(googleHiddenButtonRef) {
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

function findGoogleButton(container) {
    return (
        container.querySelector('[role="button"]') ||
        container.querySelector('div[class*="SignInButton"]') ||
        container.querySelector('button')
    );
}

export async function triggerGoogleFedCmSignIn(googleHiddenButtonRef) {
    if (!window.google || !window.google.accounts || !window.google.accounts.id) {
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

    await new Promise((resolve) => {
        setTimeout(resolve, 100);
    });

    const googleButton = findGoogleButton(hiddenButtonContainer);
    if (!googleButton) {
        return false;
    }

    googleButton.click();
    return true;
}
