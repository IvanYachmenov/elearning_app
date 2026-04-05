import { useLanguage } from '../../../../shared/lib/i18n/LanguageContext';

function SettingsLanguageSection() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="settings-section">
      <h2 className="settings-section__title">{t('pages.settings.language')}</h2>
      <div className="settings-options">
        <button
          type="button"
          className={`settings-option ${language === 'en' ? 'settings-option--active' : ''}`}
          onClick={() => setLanguage('en')}
        >
          <span className="settings-option__icon">EN</span>
          <span className="settings-option__label">{t('pages.settings.english')}</span>
        </button>
        <button
          type="button"
          className={`settings-option ${language === 'sk' ? 'settings-option--active' : ''}`}
          onClick={() => setLanguage('sk')}
        >
          <span className="settings-option__icon">SK</span>
          <span className="settings-option__label">{t('pages.settings.slovak')}</span>
        </button>
      </div>
    </div>
  );
}

export default SettingsLanguageSection;
