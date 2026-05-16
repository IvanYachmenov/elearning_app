import { useState } from 'react';

import { getCookieConsent, setCookieConsent } from '../../../shared/lib/storage/cookies';
import './CookieConsent.css';

function CookieConsent() {
  const [show, setShow] = useState<boolean>(() => !getCookieConsent());

  const handleAccept = () => {
    setCookieConsent(true);
    setShow(false);
  };

  if (!show) {
    return null;
  }

  return (
    <>
      <div className="cookie-consent__backdrop" />
      <div className="cookie-consent">
        <div className="cookie-consent__content">
          <div className="cookie-consent__icon">&#127850;</div>
          <div className="cookie-consent__text-wrap">
            <div className="cookie-consent__text">
              <strong>{"Cookies"}</strong>
              <p>{"We use cookies to enhance your experience and keep your data secure."}</p>
            </div>
            <button className="cookie-consent__button" onClick={handleAccept}>
              {"Accept"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default CookieConsent;
