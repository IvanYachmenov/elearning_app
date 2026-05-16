import type { SettingsPageProps } from '../model/types';
import SettingsAccountSection from './components/SettingsAccountSection';
import SettingsBecomeTeacher from './components/SettingsBecomeTeacher';
import '../styles/settings.css';

function SettingsPage({ user, onUserUpdate }: SettingsPageProps) {
  return (
    <div className="page page-enter">
      <h1 className="page__title">Settings</h1>

      <SettingsAccountSection user={user} onUserUpdate={onUserUpdate} />
      <SettingsBecomeTeacher user={user} onUserUpdate={onUserUpdate} />
    </div>
  );
}

export default SettingsPage;
