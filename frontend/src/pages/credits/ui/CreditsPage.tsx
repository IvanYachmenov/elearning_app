import type { CSSProperties } from 'react';

import { useLanguage } from '../../../shared/lib/i18n/LanguageContext';

const sectionStyle: CSSProperties = { marginBottom: '32px' };
const sectionTitleStyle: CSSProperties = {
  fontSize: '20px',
  fontWeight: 900,
  marginBottom: '16px',
  color: 'var(--text-primary)',
};
const paragraphStyle: CSSProperties = { marginBottom: '12px', color: 'var(--text-secondary)' };
const listStyle: CSSProperties = { fontSize: '14px', lineHeight: 1.8, listStyle: 'none', padding: 0, margin: 0 };
const listItemStyle: CSSProperties = { marginBottom: '8px' };
const linkStyle: CSSProperties = { color: 'var(--text-primary)', textDecoration: 'underline' };

function CreditsPage() {
  const { t } = useLanguage();

  return (
    <div className="page page-enter">
      <h1 className="page__title">{t('pages.credits.title')}</h1>
      <p className="page__subtitle">{t('pages.credits.subtitle')}</p>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>{t('pages.credits.icons')}</h2>
        <p style={paragraphStyle}>{t('pages.credits.iconsDescription')}</p>
        <ul style={listStyle}>
          <li style={listItemStyle}>
            <a href="https://www.flaticon.com/free-icons/study" title="study icons" target="_blank" rel="noreferrer" style={linkStyle}>
              Study icons created by Freepik - Flaticon
            </a>
          </li>
          <li style={listItemStyle}>
            <a href="https://www.flaticon.com/free-icons/github" title="github icons" target="_blank" rel="noreferrer" style={linkStyle}>
              Github icons created by Pixel perfect - Flaticon
            </a>
          </li>
          <li style={listItemStyle}>
            <a href="https://www.flaticon.com/free-icons/google" title="google icons" target="_blank" rel="noreferrer" style={linkStyle}>
              Google icons created by Freepik - Flaticon
            </a>
          </li>
          <li style={listItemStyle}>
            <a href="https://www.flaticon.com/free-icons/quit" title="quit icons" target="_blank" rel="noreferrer" style={linkStyle}>
              Quit icons created by Pixel perfect - Flaticon
            </a>
          </li>
          <li style={listItemStyle}>
            <a href="https://www.flaticon.com/free-icons/correct" title="correct icons" target="_blank" rel="noreferrer" style={linkStyle}>
              Correct icons created by Aldo Cervantes - Flaticon
            </a>
          </li>
          <li style={listItemStyle}>
            <a href="https://www.flaticon.com/free-icons/sun" title="sun icons" target="_blank" rel="noreferrer" style={linkStyle}>
              Sun icons used for the light theme selector - Flaticon
            </a>
          </li>
          <li style={listItemStyle}>
            <a href="https://www.flaticon.com/free-icons/moon" title="moon icons" target="_blank" rel="noreferrer" style={linkStyle}>
              Moon icons used for the dark theme selector - Flaticon
            </a>
          </li>
          <li style={listItemStyle}>
            <a href="https://www.flaticon.com/free-icons/connect" title="connection status icons" target="_blank" rel="noreferrer" style={linkStyle}>
              Connected and disconnected status icons used in settings - Flaticon
            </a>
          </li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>{t('pages.credits.frontendLibraries')}</h2>
        <ul style={listStyle}>
          <li style={listItemStyle}>
            <strong>React</strong> - <a href="https://react.dev/" target="_blank" rel="noreferrer" style={linkStyle}>https://react.dev/</a> (MIT License)
          </li>
          <li style={listItemStyle}>
            <strong>React Router</strong> - <a href="https://reactrouter.com/" target="_blank" rel="noreferrer" style={linkStyle}>https://reactrouter.com/</a> (MIT License)
          </li>
          <li style={listItemStyle}>
            <strong>Vite</strong> - <a href="https://vitejs.dev/" target="_blank" rel="noreferrer" style={linkStyle}>https://vitejs.dev/</a> (MIT License)
          </li>
          <li style={listItemStyle}>
            <strong>Axios</strong> - <a href="https://axios-http.com/" target="_blank" rel="noreferrer" style={linkStyle}>https://axios-http.com/</a> (MIT License)
          </li>
          <li style={listItemStyle}>
            <strong>Redux Toolkit</strong> - <a href="https://redux-toolkit.js.org/" target="_blank" rel="noreferrer" style={linkStyle}>https://redux-toolkit.js.org/</a> (MIT License)
          </li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>{t('pages.credits.backendLibraries')}</h2>
        <ul style={listStyle}>
          <li style={listItemStyle}>
            <strong>Django</strong> - <a href="https://www.djangoproject.com/" target="_blank" rel="noreferrer" style={linkStyle}>https://www.djangoproject.com/</a> (BSD License)
          </li>
          <li style={listItemStyle}>
            <strong>Django REST Framework</strong> - <a href="https://www.django-rest-framework.org/" target="_blank" rel="noreferrer" style={linkStyle}>https://www.django-rest-framework.org/</a> (BSD License)
          </li>
          <li style={listItemStyle}>
            <strong>djangorestframework-simplejwt</strong> - <a href="https://github.com/jazzband/djangorestframework-simplejwt" target="_blank" rel="noreferrer" style={linkStyle}>JWT Authentication for Django REST Framework</a> (MIT License)
          </li>
          <li style={listItemStyle}>
            <strong>Pillow</strong> - <a href="https://pillow.readthedocs.io/" target="_blank" rel="noreferrer" style={linkStyle}>https://pillow.readthedocs.io/</a> (HPND License)
          </li>
          <li style={listItemStyle}>
            <strong>PostgreSQL</strong> - <a href="https://www.postgresql.org/" target="_blank" rel="noreferrer" style={linkStyle}>https://www.postgresql.org/</a> (PostgreSQL License)
          </li>
        </ul>
      </section>

      <section>
        <h2 style={sectionTitleStyle}>{t('pages.credits.designInspiration')}</h2>
        <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          {t('pages.credits.designDescription')}
        </p>
      </section>

      <section style={{ marginTop: '32px', paddingTop: '24px', borderTop: '2px solid var(--border-color)' }}>
        <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          {t('pages.credits.footerNote')}
        </p>
      </section>
    </div>
  );
}

export default CreditsPage;
