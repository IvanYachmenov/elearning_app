import type { ChangeEvent, Dispatch, RefObject, SetStateAction } from 'react';

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

export interface ProfileGradient {
  name: string;
  value: string;
}

export interface ProfileGradientChoice {
  type: 'gradient' | 'none';
  name: string;
  value: string | null;
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
  selectedGradient: string | null;
  isEditingProfile: boolean;
  setIsEditingProfile: Dispatch<SetStateAction<boolean>>;
  avatarPreview: string | null;
  getInitials: () => string | null;
  handleAvatarClick: () => void;
  avatarInputRef: RefObject<HTMLInputElement | null>;
  handleAvatarChange: (event: ChangeEvent<HTMLInputElement>) => void;
  formData: ProfileFormValues;
  user: User;
  handleSaveProfile: () => void | Promise<void>;
  isSavingProfile: boolean;
  handleCancelProfile: () => void;
  visibleGradients: ProfileGradientChoice[];
  gradientPage: number;
  setSelectedGradient: Dispatch<SetStateAction<string | null>>;
  handleGradientPrev: () => void;
  handleGradientNext: () => void;
}
