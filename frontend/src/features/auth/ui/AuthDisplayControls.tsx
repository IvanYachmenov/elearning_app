import { useLanguage } from '../../../shared/lib/i18n/LanguageContext';
import { useTheme } from '../../../shared/lib/theme/ThemeContext';

function AuthDisplayControls() {
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="auth-controls">
      <div className="auth-theme-selector">
        <button
          className="auth-theme-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          <img
            src={theme === 'dark' ? '/assets/icons/sun.png' : '/assets/icons/moon.png'}
            alt={theme === 'dark' ? 'Light theme' : 'Dark theme'}
          />
        </button>
      </div>
      <div className="auth-language-selector">
        <button
          className={`auth-language-btn ${language === 'en' ? 'active' : ''}`}
          onClick={() => setLanguage('en')}
        >
          EN
        </button>
        <button
          className={`auth-language-btn ${language === 'sk' ? 'active' : ''}`}
          onClick={() => setLanguage('sk')}
        >
          SK
        </button>
      </div>
    </div>
  );
}

export default AuthDisplayControls;
