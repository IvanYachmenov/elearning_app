import type { ProfileCustomizationProps } from '../../model/types';

function ProfileCustomization({ formData, user, getInitials }: ProfileCustomizationProps) {
  return (
    <div className="profile-header">
      <div className="profile-header-content">
        <div className="profile-header-main">
          <div className="profile-avatar-large">
            <span>{getInitials()}</span>
          </div>
          <div className="profile-info">
            <h2>{formData.username || user.username || 'User'}</h2>
            <p>{formData.email || user.email || 'No email provided'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileCustomization;
