import { useEffect, useState, type MouseEvent } from 'react';
import { NavLink, Outlet, type NavLinkRenderProps } from 'react-router-dom';

import '../../../shared/styles/layout.css';
import type { User } from '../../../shared/types';
import AppFooter from './AppFooter';
import { useNavigationLock } from '../../../shared/lib/navigation-lock';

const ANIM_MS = 80;

interface MainLayoutProps {
  user: User;
  onLogout: () => void;
}

function MainLayout({ user, onLogout }: MainLayoutProps) {
  const { isLocked, lockReason, lockAction } = useNavigationLock();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);

  const getLinkClassName = ({ isActive }: NavLinkRenderProps): string =>
    isActive ? 'app-nav-link app-nav-link--active' : 'app-nav-link';

  const getNavLinkClass = (modifier: string) => (props: NavLinkRenderProps): string => {
    const baseClassName = getLinkClassName(props);
    const classNameWithModifier = `${baseClassName} ${modifier}`;
    return isLocked ? `${classNameWithModifier} app-nav-link--disabled` : classNameWithModifier;
  };

  useEffect(() => {
    document.body.classList.remove('theme-auth');
    document.body.classList.add('theme-app');
    return () => document.body.classList.remove('theme-app');
  }, []);

  useEffect(() => {
    if (!isMenuOpen || isMenuClosing) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen, isMenuClosing]);

  const handlePreventNavigation = (event: MouseEvent<HTMLElement>) => {
    if (!isLocked) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
  };

  const openMenu = () => {
    setIsMenuOpen(true);
    setIsMenuClosing(false);
  };

  const closeMenu = () => {
    if (!isMenuOpen || isMenuClosing) {
      return;
    }

    setIsMenuClosing(true);
    window.setTimeout(() => {
      setIsMenuOpen(false);
      setIsMenuClosing(false);
    }, ANIM_MS);
  };

  const toggleMenu = (event: MouseEvent<HTMLButtonElement>) => {
    if (isLocked) {
      event.preventDefault();
      return;
    }

    if (isMenuOpen && !isMenuClosing) {
      closeMenu();
      return;
    }

    openMenu();
  };

  const handleMenuNavClick = (event: MouseEvent<HTMLElement>) => {
    handlePreventNavigation(event);
    if (!isLocked) {
      closeMenu();
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMenuOpen, isMenuClosing]);

  const initials = user.username ? user.username.charAt(0).toUpperCase() : 'U';

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header__container">
          <div className="app-header__left">
            <div className="app-logo">E-learning web application</div>
          </div>

          <div className="app-header__right">
            <nav className="app-nav" aria-label="Main navigation">
              <NavLink
                to="/playground"
                className={getNavLinkClass('app-nav-link--playground')}
                onClick={handlePreventNavigation}
                aria-disabled={isLocked}
              >
                {"Playground"}
              </NavLink>

              <NavLink
                to="/courses"
                className={getNavLinkClass('app-nav-link--courses')}
                onClick={handlePreventNavigation}
                aria-disabled={isLocked}
              >
                {"Catalog"}
              </NavLink>

              <NavLink
                to="/learning"
                className={getNavLinkClass('app-nav-link--learning')}
                onClick={handlePreventNavigation}
                aria-disabled={isLocked}
              >
                {"My courses"}
              </NavLink>
            </nav>

            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `profile-button profile-button--link${
                  isActive ? ' profile-button--active' : ''
                }${isLocked ? ' app-nav-link--disabled' : ''}`
              }
              onClick={handlePreventNavigation}
              aria-disabled={isLocked}
            >
              <div className="profile-avatar">{initials}</div>
              <span className="profile-name">{user.username || 'User'}</span>
            </NavLink>

            <button
              type="button"
              className="burger-button"
              onClick={toggleMenu}
              aria-label="Open menu"
              aria-disabled={isLocked}
            >
              <span className={`burger-icon${isMenuOpen && !isMenuClosing ? ' open' : ''}`}>
                <span />
                <span />
                <span />
              </span>
            </button>
          </div>
        </div>
      </header>

      {(isMenuOpen || isMenuClosing) && (
        <div
          className={`app-menu${isMenuClosing ? ' is-closing' : ''}`}
          role="dialog"
          aria-modal="true"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeMenu();
            }
          }}
        >
          <div
            className={`app-menu__panel${isMenuClosing ? ' is-closing' : ''}`}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="app-menu__top">
              <div className="app-menu__title">{"Menu"}</div>
              <button type="button" className="app-menu__close" onClick={closeMenu} aria-label="Close menu">
                {"Close"}
              </button>
            </div>

            <nav className="app-menu__nav" aria-label="Fullscreen navigation">
              <NavLink
                to="/courses"
                className={({ isActive }) => `app-menu__link${isActive ? ' active' : ''}`}
                onClick={handleMenuNavClick}
                aria-disabled={isLocked}
              >
                {"Catalog"}
              </NavLink>
              <NavLink
                to="/learning"
                className={({ isActive }) => `app-menu__link${isActive ? ' active' : ''}`}
                onClick={handleMenuNavClick}
                aria-disabled={isLocked}
              >
                {"My courses"}
              </NavLink>

              {user.role === 'teacher' && (
                <NavLink
                  to="/teacher/courses"
                  className={({ isActive }) => `app-menu__link${isActive ? ' active' : ''}`}
                  onClick={handleMenuNavClick}
                  aria-disabled={isLocked}
                >
                  {"Teacher's cabinet"}
                </NavLink>
              )}

              <NavLink
                to="/profile"
                className={({ isActive }) => `app-menu__link${isActive ? ' active' : ''}`}
                onClick={handleMenuNavClick}
                aria-disabled={isLocked}
              >
                {"Profile"}
              </NavLink>
              <NavLink
                to="/settings"
                className={({ isActive }) => `app-menu__link${isActive ? ' active' : ''}`}
                onClick={handleMenuNavClick}
                aria-disabled={isLocked}
              >
                {"Settings"}
              </NavLink>

              <button
                type="button"
                className="app-menu__link app-menu__link--danger"
                onClick={(event) => {
                  if (isLocked) {
                    event.preventDefault();
                    return;
                  }

                  closeMenu();
                  onLogout();
                }}
                aria-disabled={isLocked}
              >
                {"Logout"}
              </button>
            </nav>
          </div>
        </div>
      )}

      <main className="app-main">
        {isLocked && (
          <div className="app-navigation-lock">
            <span className="app-navigation-lock__dot" />
            <span className="app-navigation-lock__text">{lockReason || 'Navigation is temporarily locked.'}</span>
            {lockAction && (
              <button
                type="button"
                className="app-navigation-lock__action"
                onClick={lockAction.onAction}
                disabled={lockAction.disabled}
              >
                {lockAction.label}
              </button>
            )}
          </div>
        )}
        <Outlet />
      </main>

      <AppFooter />
    </div>
  );
}

export default MainLayout;
