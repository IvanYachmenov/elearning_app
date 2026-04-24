import { useLanguage } from '../../../../shared/lib/i18n/LanguageContext';
import { useTheme } from '../../../../shared/lib/theme/ThemeContext';

function SettingsThemeSection() {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <div className="settings-section">
      <h2 className="settings-section__title">{t('pages.settings.theme')}</h2>
      <div className="settings-options settings-options--theme">
        <button
          type="button"
          className={`settings-option ${theme === 'light' ? 'settings-option--active' : ''}`}
          onClick={() => {
            if (theme !== 'light') {
              setTheme('light');
            }
          }}
        >
          <span className="settings-option__icon">
            <img src="/assets/icons/sun.png" alt={t('pages.settings.lightTheme')} />
          </span>
          <span className="settings-option__label">{t('pages.settings.lightTheme')}</span>
        </button>
        <button
          type="button"
          className={`settings-option ${theme === 'dark' ? 'settings-option--active' : ''}`}
          onClick={() => {
            if (theme !== 'dark') {
              setTheme('dark');
            }
          }}
        >
          <span className="settings-option__icon">
            <img src="/assets/icons/moon.png" alt={t('pages.settings.darkTheme')} />
          </span>
          <span className="settings-option__label">{t('pages.settings.darkTheme')}</span>
        </button>
      </div>
    </div>
  );
}

export default SettingsThemeSection;
