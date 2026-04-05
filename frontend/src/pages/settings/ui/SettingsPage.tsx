import { useLanguage } from '../../../shared/lib/i18n/LanguageContext';
import type { SettingsPageProps } from '../model/types';
import SettingsAccountSection from './components/SettingsAccountSection';
import SettingsLanguageSection from './components/SettingsLanguageSection';
import SettingsThemeSection from './components/SettingsThemeSection';
import '../styles/settings.css';

function SettingsPage({ user, onUserUpdate }: SettingsPageProps) {
  const { t } = useLanguage();

  return (
    <div className="page page-enter">
      <h1 className="page__title">{t('pages.settings.title')}</h1>

      <SettingsAccountSection user={user} onUserUpdate={onUserUpdate} />
      <SettingsLanguageSection />
      <SettingsThemeSection />
    </div>
  );
}

export default SettingsPage;
