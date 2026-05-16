import type { ChangeEvent, Dispatch, SetStateAction } from 'react';

import type { User } from '../../../shared/types';

export interface ProfilePageProps {
  user: User;
  onUserUpdate: Dispatch<SetStateAction<User | null>>;
}

export interface ProfileFormValues {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
}

export interface ProfileInfoProps {
  isEditing: boolean;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
  isSaving: boolean;
  handleSave: () => void | Promise<void>;
  handleCancel: () => void;
  error: string | null;
  success: string | null;
  formData: ProfileFormValues;
  handleInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export interface ProfileCustomizationProps {
  formData: ProfileFormValues;
  user: User;
  getInitials: () => string | null;
}
