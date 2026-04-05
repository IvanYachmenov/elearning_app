import { useCallback, useState } from 'react';

import { useLanguage } from '../../../shared/lib/i18n/LanguageContext';
import type { SettingsSectionKey, SettingsPageProps } from '../model/types';
import SettingsAccountSection from './components/SettingsAccountSection';
import SettingsLanguageSection from './components/SettingsLanguageSection';
import SettingsNav from './components/SettingsNav';
import SettingsThemeSection from './components/SettingsThemeSection';
import '../styles/settings.css';

const SECTION_IDS = {
  account: 'settings-account',
  language: 'settings-language',
  theme: 'settings-theme',
} as const satisfies Record<SettingsSectionKey, string>;

function SettingsPage({ user, onUserUpdate }: SettingsPageProps) {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState<SettingsSectionKey>('account');

  const handleNavClick = useCallback((key: SettingsSectionKey) => {
    setActiveSection(key);

    const sectionId = SECTION_IDS[key];
    const sectionElement = document.getElementById(sectionId);
    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <div className="page page-enter">
      <h1 className="page__title">{t('pages.settings.title')}</h1>

      <SettingsNav activeKey={activeSection} onChange={handleNavClick} />

      <div id={SECTION_IDS.account} className="settings-section-anchor">
        <SettingsAccountSection user={user} onUserUpdate={onUserUpdate} />
      </div>
      <div id={SECTION_IDS.language} className="settings-section-anchor">
        <SettingsLanguageSection />
      </div>
      <div id={SECTION_IDS.theme} className="settings-section-anchor">
        <SettingsThemeSection />
      </div>
    </div>
  );
}

export default SettingsPage;
