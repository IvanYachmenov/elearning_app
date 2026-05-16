import { isAxiosError } from 'axios';
import { useEffect, useState, type ChangeEvent } from 'react';

import { api } from '../../../shared/api';
import type { ApiErrorResponse, User } from '../../../shared/types';
import type { ProfileFormValues, ProfilePageProps } from '../model/types';
import ProfileInfo from './components/ProfileInfo';
import ProfileCustomization from './components/ProfileCustomization';
import '../styles/profile.css';

function buildProfileForm(user: User): ProfileFormValues {
  return {
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email || '',
    username: user.username || '',
  };
}

function getFieldError(errorData: ApiErrorResponse | undefined, fieldName: string): string | null {
  const fieldError = errorData?.[fieldName];
  if (Array.isArray(fieldError)) {
    return typeof fieldError[0] === 'string' ? fieldError[0] : null;
  }

  return typeof fieldError === 'string' ? fieldError : null;
}

function ProfilePage({ user, onUserUpdate }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProfileFormValues>(() => buildProfileForm(user));

  useEffect(() => {
    setFormData(buildProfileForm(user));
  }, [user]);

  const getInitials = () => {
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
      setSuccess('Profile information updated successfully!');
      setIsEditing(false);
      window.setTimeout(() => setSuccess(null), 3000);
    } catch (requestError: unknown) {
      console.error('Error updating profile:', requestError);
      const errorData = isAxiosError<ApiErrorResponse>(requestError)
        ? requestError.response?.data
        : undefined;

      const usernameError = getFieldError(errorData, 'username');
      const firstNameError = getFieldError(errorData, 'first_name');
      const lastNameError = getFieldError(errorData, 'last_name');
      setError(
        usernameError ||
          firstNameError ||
          lastNameError ||
          errorData?.detail ||
          errorData?.message ||
          'Failed to update profile. Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(buildProfileForm(user));
    setError(null);
    setSuccess(null);
    setIsEditing(false);
  };

  return (
    <div className="page page-enter">
      <div className="profile-container">
        <ProfileCustomization formData={formData} user={user} getInitials={getInitials} />

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
