import { useEffect } from 'react';
import { Link } from 'react-router-dom';

import { useLanguage } from '../../../shared/lib/i18n/LanguageContext';
import { useTheme } from '../../../shared/lib/theme/ThemeContext';
import '../styles/landing.css';

function StartPage() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    document.body.classList.remove('theme-app');
    document.body.classList.add('theme-auth');
    return () => document.body.classList.remove('theme-auth');
  }, []);

  return (
    <div className="landing-container">
      <div className="landing-controls">
        <div className="landing-theme-selector">
          <button
            className="landing-theme-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            <img
              src={theme === 'dark' ? '/assets/icons/sun.png' : '/assets/icons/moon.png'}
              alt={theme === 'dark' ? 'Light theme' : 'Dark theme'}
            />
          </button>
        </div>
        <div className="landing-language-selector">
          <button
            className={`landing-language-btn ${language === 'en' ? 'active' : ''}`}
            onClick={() => setLanguage('en')}
          >
            EN
          </button>
          <button
            className={`landing-language-btn ${language === 'sk' ? 'active' : ''}`}
            onClick={() => setLanguage('sk')}
          >
            SK
          </button>
        </div>
      </div>
      <div className="landing-content">
        <div className="landing-header">
          <h1 className="landing-title">{t('pages.landing.title')}</h1>
          <p className="landing-subtitle">{t('pages.landing.subtitle')}</p>
        </div>

        <div className="landing-actions">
          <Link to="/login" className="landing-button landing-button--primary">
            {t('pages.landing.logIn')}
          </Link>
          <Link to="/register" className="landing-button landing-button--secondary">
            {t('pages.landing.registration')}
          </Link>
          <Link to="/courses" className="landing-button landing-button--tertiary">
            {t('pages.landing.explore')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default StartPage;
