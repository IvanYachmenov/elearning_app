import { useLanguage } from '../../../../shared/lib/i18n/LanguageContext';
import type { ProfileInfoProps } from '../../model/types';

function ProfileInfo({
  isEditing,
  setIsEditing,
  isSaving,
  handleSave,
  handleCancel,
  error,
  success,
  formData,
  handleInputChange,
}: ProfileInfoProps) {
  const { t } = useLanguage();

  return (
    <div className="profile-section">
      <div className="profile-section-header">
        <h3>{t('pages.profile.accountInformation')}</h3>
        {!isEditing ? (
          <button type="button" className="profile-edit-btn" onClick={() => setIsEditing(true)}>
            {t('pages.profile.editProfile')}
          </button>
        ) : (
          <div className="profile-action-buttons">
            <button type="button" className="profile-save-btn" onClick={handleSave} disabled={isSaving}>
              {isSaving ? t('pages.auth.saving') : t('pages.profile.saveChanges')}
            </button>
            <button type="button" className="profile-cancel-btn" onClick={handleCancel} disabled={isSaving}>
              {t('pages.profile.cancel')}
            </button>
          </div>
        )}
      </div>

      {error && <div className="profile-error">{error}</div>}
      {success && <div className="profile-success">{success}</div>}

      <div className="profile-form">
        <div className="profile-field">
          <label htmlFor="username">{t('pages.auth.username')}</label>
          <input
            id="username"
            name="username"
            type="text"
            value={formData.username}
            onChange={handleInputChange}
            disabled={!isEditing}
            className={isEditing ? 'profile-input' : 'profile-input profile-input--disabled'}
            placeholder={t('pages.profile.enterUsername')}
            required
          />
          {!isEditing && <p className="profile-field-hint">{t('pages.profile.clickEditToChangeUsername')}</p>}
          {isEditing && <p className="profile-field-hint">{t('pages.profile.usernameMustBeUnique')}</p>}
        </div>

        <div className="profile-field">
          <label htmlFor="email">{t('pages.auth.email')}</label>
          <input
            id="email"
            type="email"
            value={formData.email}
            disabled
            className="profile-input profile-input--disabled"
          />
          <p className="profile-field-hint">{t('pages.profile.emailCannotBeChanged')}</p>
        </div>

        <div className="profile-field">
          <label htmlFor="first_name">{t('pages.auth.firstName')}</label>
          <input
            id="first_name"
            name="first_name"
            type="text"
            value={formData.first_name}
            onChange={handleInputChange}
            disabled={!isEditing}
            className={`profile-input ${!isEditing ? 'profile-input--disabled' : ''}`}
            placeholder={t('pages.auth.yourFirstName')}
          />
        </div>

        <div className="profile-field">
          <label htmlFor="last_name">{t('pages.auth.lastName')}</label>
          <input
            id="last_name"
            name="last_name"
            type="text"
            value={formData.last_name}
            onChange={handleInputChange}
            disabled={!isEditing}
            className={`profile-input ${!isEditing ? 'profile-input--disabled' : ''}`}
            placeholder={t('pages.auth.yourLastName')}
          />
        </div>
      </div>
    </div>
  );
}

export default ProfileInfo;
