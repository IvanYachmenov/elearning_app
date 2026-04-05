import { isAxiosError } from 'axios';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';

import { API_URL, api } from '../../../shared/api';
import { useLanguage } from '../../../shared/lib/i18n/LanguageContext';
import type { ApiErrorResponse, User } from '../../../shared/types';
import type {
  ProfileFormValues,
  ProfileGradientChoice,
  ProfilePageProps,
} from '../model/types';
import ProfileInfo from './components/ProfileInfo';
import ProfileCustomization from './components/ProfileCustomization';
import { GRADIENTS_PER_PAGE, gradients } from './profileBackgrounds';
import '../styles/profile.css';

function buildProfileForm(user: User): ProfileFormValues {
  return {
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email || '',
    username: user.username || '',
  };
}

function resolveAvatarUrl(user: User): string | null {
  const avatarUrl = user.avatar_url || user.avatar;
  if (!avatarUrl) {
    return null;
  }

  return avatarUrl.startsWith('http') ? avatarUrl : `${API_URL}${avatarUrl}`;
}

function getFieldError(errorData: ApiErrorResponse | undefined, fieldName: string): string | null {
  const fieldError = errorData?.[fieldName];
  if (Array.isArray(fieldError)) {
    return typeof fieldError[0] === 'string' ? fieldError[0] : null;
  }

  return typeof fieldError === 'string' ? fieldError : null;
}

function ProfilePage({ user, onUserUpdate }: ProfilePageProps) {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProfileFormValues>(() => buildProfileForm(user));
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(() => resolveAvatarUrl(user));
  const [selectedGradient, setSelectedGradient] = useState<string | null>(
    user.profile_background_gradient || null,
  );
  const [gradientPage, setGradientPage] = useState(0);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setFormData(buildProfileForm(user));
    setAvatarPreview(resolveAvatarUrl(user));
    setSelectedGradient(user.profile_background_gradient || null);
    setAvatar(null);
  }, [user]);

  const getInitials = () => {
    if (avatarPreview) {
      return null;
    }

    const firstName = formData.first_name || user.username || '';
    const lastName = formData.last_name || '';
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }

    return (user.username || 'U').charAt(0).toUpperCase();
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const fieldName = event.target.name as keyof ProfileFormValues;
    const { value } = event.target;

    setFormData((previousForm) => ({
      ...previousForm,
      [fieldName]: value,
    }));
  };

  const handleAvatarClick = () => {
    if (isEditingProfile) {
      avatarInputRef.current?.click();
    }
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(t('pages.profile.avatarSizeError'));
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError(t('pages.profile.avatarFileTypeError'));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setAvatarPreview(reader.result);
        setAvatar(file);
        setError(null);
        return;
      }

      setError(t('pages.profile.avatarReadError'));
    };
    reader.onerror = () => {
      setError(t('pages.profile.avatarReadError'));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const formDataToSend = new FormData();

      if (formData.username !== user.username) {
        formDataToSend.append('username', formData.username);
      }
      if (formData.first_name !== user.first_name) {
        formDataToSend.append('first_name', formData.first_name);
      }
      if (formData.last_name !== user.last_name) {
        formDataToSend.append('last_name', formData.last_name);
      }

      const response = await api.patch<User>('/api/auth/me/', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onUserUpdate(response.data);
      setSuccess(t('pages.profile.profileInfoUpdated'));
      setIsEditing(false);
      window.setTimeout(() => setSuccess(null), 3000);
    } catch (requestError: unknown) {
      console.error('Error updating profile:', requestError);
      const errorData = isAxiosError<ApiErrorResponse>(requestError)
        ? requestError.response?.data
        : undefined;

      const usernameError = getFieldError(errorData, 'username');
      setError(usernameError || errorData?.detail || errorData?.message || t('pages.profile.failedToUpdate'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    setError(null);
    setSuccess(null);

    try {
      const formDataToSend = new FormData();

      if (avatar) {
        formDataToSend.append('avatar', avatar);
      }
      if (selectedGradient !== (user.profile_background_gradient || null)) {
        formDataToSend.append('profile_background_gradient', selectedGradient || '');
      }

      const response = await api.patch<User>('/api/auth/me/', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const updatedUser: User = {
        ...response.data,
        profile_background_gradient:
          typeof response.data.profile_background_gradient === 'string'
            ? response.data.profile_background_gradient
            : null,
      };

      onUserUpdate(updatedUser);
      setSuccess(t('pages.profile.profileAppearanceUpdated'));
      setIsEditingProfile(false);
      window.setTimeout(() => setSuccess(null), 3000);
    } catch (requestError: unknown) {
      console.error('Error updating profile:', requestError);
      const errorData = isAxiosError<ApiErrorResponse>(requestError)
        ? requestError.response?.data
        : undefined;

      const gradientError = getFieldError(errorData, 'profile_background_gradient');
      setError(gradientError || errorData?.detail || errorData?.message || t('pages.profile.failedToUpdate'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancel = () => {
    setFormData(buildProfileForm(user));
    setError(null);
    setSuccess(null);
    setIsEditing(false);
  };

  const handleCancelProfile = () => {
    setAvatarPreview(resolveAvatarUrl(user));
    setSelectedGradient(user.profile_background_gradient || null);
    setAvatar(null);
    setError(null);
    setSuccess(null);
    setIsEditingProfile(false);
    setGradientPage(0);
  };

  const getVisibleGradients = (): ProfileGradientChoice[] => {
    const allOptions: ProfileGradientChoice[] = [
      ...gradients.map((gradient) => ({ type: 'gradient' as const, ...gradient })),
      { type: 'none', name: t('pages.profile.none'), value: null },
    ];

    const start = gradientPage * GRADIENTS_PER_PAGE;
    const end = start + GRADIENTS_PER_PAGE;

    if (start >= allOptions.length) {
      return allOptions.slice(0, GRADIENTS_PER_PAGE);
    }

    if (end > allOptions.length) {
      const overflow = end - allOptions.length;
      return [...allOptions.slice(start), ...allOptions.slice(0, overflow)];
    }

    return allOptions.slice(start, end);
  };

  const handleGradientPrev = () => {
    const maxPage = Math.max(1, Math.ceil((gradients.length + 1) / GRADIENTS_PER_PAGE));
    setGradientPage((previousPage) => (previousPage <= 0 ? maxPage - 1 : previousPage - 1));
  };

  const handleGradientNext = () => {
    const maxPage = Math.max(1, Math.ceil((gradients.length + 1) / GRADIENTS_PER_PAGE));
    setGradientPage((previousPage) => (previousPage >= maxPage - 1 ? 0 : previousPage + 1));
  };

  return (
    <div className="page page-enter">
      <div className="profile-container">
        <ProfileCustomization
          selectedGradient={selectedGradient}
          isEditingProfile={isEditingProfile}
          setIsEditingProfile={setIsEditingProfile}
          avatarPreview={avatarPreview}
          getInitials={getInitials}
          handleAvatarClick={handleAvatarClick}
          avatarInputRef={avatarInputRef}
          handleAvatarChange={handleAvatarChange}
          formData={formData}
          user={user}
          handleSaveProfile={handleSaveProfile}
          isSavingProfile={isSavingProfile}
          handleCancelProfile={handleCancelProfile}
          visibleGradients={getVisibleGradients()}
          gradientPage={gradientPage}
          setSelectedGradient={setSelectedGradient}
          handleGradientPrev={handleGradientPrev}
          handleGradientNext={handleGradientNext}
        />

        <ProfileInfo
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          isSaving={isSaving}
          handleSave={handleSave}
          handleCancel={handleCancel}
          error={error}
          success={success}
          formData={formData}
          handleInputChange={handleInputChange}
        />
      </div>
    </div>
  );
}

export default ProfilePage;
