import type { Dispatch, SetStateAction } from 'react';

import type { User } from '../../../shared/types';

export type SettingsSectionKey = 'account' | 'language' | 'theme';
export type SocialProvider = 'google' | 'github';

export interface SettingsPageProps {
  user: User;
  onUserUpdate: Dispatch<SetStateAction<User | null>>;
}

export interface SettingsNavProps {
  activeKey: SettingsSectionKey;
  onChange: (key: SettingsSectionKey) => void;
}

export interface SocialConnectionsResponse {
  google: boolean;
  github: boolean;
}

export type SettingsAccountSectionProps = SettingsPageProps

