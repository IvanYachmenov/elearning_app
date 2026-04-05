import { useLanguage } from '../../../../shared/lib/i18n/LanguageContext';
import type { ProfileCustomizationProps } from '../../model/types';

function ProfileCustomization({
  selectedGradient,
  isEditingProfile,
  setIsEditingProfile,
  avatarPreview,
  getInitials,
  handleAvatarClick,
  avatarInputRef,
  handleAvatarChange,
  formData,
  user,
  handleSaveProfile,
  isSavingProfile,
  handleCancelProfile,
  visibleGradients,
  gradientPage,
  setSelectedGradient,
  handleGradientPrev,
  handleGradientNext,
}: ProfileCustomizationProps) {
  const { t } = useLanguage();

  return (
    <div
      className="profile-header"
      style={{
        background: selectedGradient || undefined,
        position: 'relative',
      }}
    >
      <div className="profile-header-content">
        <div className="profile-header-main">
          <div
            className={`profile-avatar-large ${isEditingProfile ? 'editable' : ''} ${avatarPreview ? 'profile-avatar-large--with-image' : ''}`}
            onClick={handleAvatarClick}
            style={{ cursor: isEditingProfile ? 'pointer' : 'default' }}
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt={t('pages.profile.avatar')} className="profile-avatar-img" />
            ) : (
              <span>{getInitials()}</span>
            )}
            {isEditingProfile && (
              <div className="profile-avatar-overlay">
                <span>{t('pages.profile.change')}</span>
              </div>
            )}
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: 'none' }}
          />
          <div className="profile-info">
            <h2>{formData.username || user.username || t('pages.profile.user')}</h2>
            <p>{formData.email || user.email || t('pages.profile.noEmailProvided')}</p>
          </div>
        </div>
        {!isEditingProfile && (
          <button
            type="button"
            className="profile-edit-appearance-btn"
            onClick={() => setIsEditingProfile(true)}
            title={t('pages.profile.editProfileAppearance')}
          >
            Edit
          </button>
        )}
        {isEditingProfile && (
          <div className="profile-appearance-actions">
            <button
              type="button"
              className="profile-save-appearance-btn"
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
            >
              {isSavingProfile ? t('pages.auth.saving') : t('pages.profile.save')}
            </button>
            <button
              type="button"
              className="profile-cancel-appearance-btn"
              onClick={handleCancelProfile}
              disabled={isSavingProfile}
            >
              {t('pages.profile.cancel')}
            </button>
          </div>
        )}
      </div>
      {isEditingProfile && (
        <div className="profile-gradient-selector">
          <label className="profile-gradient-label">{t('pages.profile.chooseBackgroundGradient')}</label>
          <div className="profile-gradients-container">
            <button
              type="button"
              className="profile-gradient-nav profile-gradient-nav--prev"
              onClick={handleGradientPrev}
              aria-label={t('pages.profile.previousPage')}
            >
              {'<'}
            </button>
            <div className="profile-gradients-grid">
              {visibleGradients.map((option, index) => (
                <div
                  key={`${option.type}-${gradientPage}-${index}`}
                  className={`profile-gradient-option ${selectedGradient === option.value ? 'selected' : ''}`}
                  onClick={() => setSelectedGradient(option.value)}
                  style={{
                    background: option.value || '#fff',
                    backgroundSize:
                      option.value?.includes('radial-gradient') && option.value?.includes('linear-gradient')
                        ? '20px 20px, 100% 100%'
                        : '100% 100%',
                    border: '2px solid var(--nav-black)',
                  }}
                  title={option.name}
                >
                  {selectedGradient === option.value && (
                    <span className="profile-gradient-check">OK</span>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              className="profile-gradient-nav profile-gradient-nav--next"
              onClick={handleGradientNext}
              aria-label={t('pages.profile.nextPage')}
            >
              {'>'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileCustomization;
