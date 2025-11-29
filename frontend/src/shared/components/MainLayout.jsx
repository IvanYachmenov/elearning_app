import { NavLink, Outlet } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import '../../styles/layout.css';
import AppFooter from './AppFooter';

function MainLayout({ user, onLogout }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const getLinkClassName = ({ isActive }) =>
    isActive ? 'app-nav-link app-nav-link--active' : 'app-nav-link';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const getInitials = (username) =>
    username ? username.charAt(0).toUpperCase() : 'U';

  const handleDropdownNavClick = () => {
    setIsDropdownOpen(false);
  };

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header__container">
          <div className="app-header__left">
            <div className="app-logo">E-Learning</div>

            <nav className="app-nav">
              <NavLink to="/home" className={getLinkClassName}>
                Home
              </NavLink>

              <NavLink to="/courses" className={getLinkClassName}>
                Courses
              </NavLink>

              <NavLink to="/learning" className={getLinkClassName}>
                Learning
              </NavLink>

              <NavLink to="/shop" className={getLinkClassName}>
                Shop
              </NavLink>

              <NavLink to="/settings" className={getLinkClassName}>
                Settings
              </NavLink>
            </nav>
          </div>

          <div className="app-header__right" ref={dropdownRef}>
            <button
              type="button"
              className="profile-button"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
            >
              <div className="profile-avatar">{getInitials(user.username)}</div>
              <span>{user.username}</span>
              <svg
                className={
                  'profile-chevron' + (isDropdownOpen ? ' open' : '')
                }
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="profile-dropdown">
                <div className="profile-dropdown__nav">
                  <NavLink
                    to="/home"
                    className="profile-dropdown__item"
                    onClick={handleDropdownNavClick}
                  >
                    <img
                        src={"../../../public/assets/icons/home.png"}
                        alt="Home"
                        className="profile-dropdown__icon"
                    />
                    Home
                  </NavLink>
                  <NavLink
                    to="/courses"
                    className="profile-dropdown__item"
                    onClick={handleDropdownNavClick}
                  >
                  <img
                    src={"../../../public/assets/icons/courses.png"}
                    alt="Courses"
                    className="profile-dropdown__icon"
                  />
                    Courses
                  </NavLink>
                  <NavLink
                    to="/learning"
                    className="profile-dropdown__item"
                    onClick={handleDropdownNavClick}
                  >
                  <img
                    src={"../../../public/assets/icons/learning.png"}
                    alt="Learning"
                    className="profile-dropdown__icon"
                  />
                    Learning
                  </NavLink>
                  <NavLink
                    to="/shop"
                    className="profile-dropdown__item"
                    onClick={handleDropdownNavClick}
                  >
                    <img
                      src={"../../../public/assets/icons/shop.png"}
                      alt="Shop"
                      className="profile-dropdown__icon"
                    />
                    Shop
                  </NavLink>
                  <NavLink
                    to="/settings"
                    className="profile-dropdown__item"
                    onClick={handleDropdownNavClick}
                  >
                    <img
                      src={"../../../public/assets/icons/settings.png"}
                      alt="Settings"
                      className="profile-dropdown__icon"
                    />
                    Settings
                  </NavLink>
                </div>

                <div className="profile-dropdown__divider" />

                <NavLink
                  to="/profile"
                  className="profile-dropdown__item"
                  onClick={handleDropdownNavClick}
                >
                    <img
                      src={"../../../public/assets/icons/profile.png"}
                      alt="Profile"
                      className="profile-dropdown__icon"
                    />
                  Profile
                </NavLink>

                <button
                  type="button"
                  className="profile-dropdown__item profile-dropdown__item--danger"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onLogout();
                  }}
                >
                    <img
                      src={"../../../public/assets/icons/logout.png"}
                      alt="Logout"
                      className="profile-dropdown__icon"
                    />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <AppFooter />
    </div>
  );
}

export default MainLayout;
