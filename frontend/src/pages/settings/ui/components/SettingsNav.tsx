import { useLanguage } from '../../../../shared/lib/i18n/LanguageContext';
import type { SettingsNavProps, SettingsSectionKey } from '../../model/types';

function SettingsNav({ activeKey, onChange }: SettingsNavProps) {
  const { t } = useLanguage();
  const items: Array<{ key: SettingsSectionKey; label: string }> = [
    { key: 'account', label: t('pages.settings.account') },
    { key: 'language', label: t('pages.settings.language') },
    { key: 'theme', label: t('pages.settings.theme') },
  ];

  return (
    <div className="settings-nav">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`settings-nav__item ${activeKey === item.key ? 'settings-nav__item--active' : ''}`}
          onClick={() => onChange(item.key)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export default SettingsNav;
