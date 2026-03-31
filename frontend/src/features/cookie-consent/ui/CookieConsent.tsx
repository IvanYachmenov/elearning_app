import { useState } from 'react';

import { getCookieConsent, setCookieConsent } from '../../../shared/lib/storage/cookies';
import { useLanguage } from '../../../shared/lib/i18n/LanguageContext';
import './CookieConsent.css';

function CookieConsent() {
  const { t } = useLanguage();
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
              <strong>{t('cookie.title')}</strong>
              <p>{t('cookie.message')}</p>
            </div>
            <button className="cookie-consent__button" onClick={handleAccept}>
              {t('cookie.accept')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default CookieConsent;
