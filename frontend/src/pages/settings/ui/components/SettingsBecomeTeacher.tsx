import { isAxiosError } from 'axios';
import { useState } from 'react';

import { api } from '../../../../shared/api';
import type { ApiErrorResponse, User } from '../../../../shared/types';
import type { SettingsPageProps } from '../../model/types';

function SettingsBecomeTeacher({ user, onUserUpdate }: SettingsPageProps) {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isTeacher = user.role === 'teacher';

  const handleSubmit = async () => {
    if (!code.trim() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.post<User>('/api/auth/become-teacher/', {
        code: code.trim(),
      });
      onUserUpdate(response.data);
      setCode('');
      setSuccess('You are now a teacher. The teacher tools are available in the menu.');
    } catch (requestError: unknown) {
      const detail = isAxiosError<ApiErrorResponse>(requestError)
        ? requestError.response?.data?.detail
        : undefined;
      setError(detail || 'Could not verify the teacher access code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="settings-section">
      <h2 className="settings-section__title">{"Become a teacher"}</h2>

      {isTeacher ? (
        <div className="settings-account__card">
          <p className="settings-account__value">
            You already have teacher access. Manage your courses from the menu.
          </p>
        </div>
      ) : (
        <div className="settings-account__card">
          <p className="settings-account__hint">
            Have a teacher access code? Enter it below to unlock course creation.
          </p>

          {error && <div className="settings-account__error">{error}</div>}
          {success && <div className="settings-account__success">{success}</div>}

          <div className="settings-become-teacher__form">
            <input
              type="text"
              className="settings-become-teacher__input"
              placeholder={"Teacher access code"}
              value={code}
              maxLength={64}
              onChange={(event) => setCode(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void handleSubmit();
                }
              }}
            />
            <button
              type="button"
              className="settings-account__btn"
              onClick={handleSubmit}
              disabled={isSubmitting || !code.trim()}
            >
              {isSubmitting ? "Checking..." : "Unlock teacher access"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsBecomeTeacher;
