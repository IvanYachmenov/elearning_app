import type { CSSProperties } from 'react';


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

  return (
    <div className="page page-enter">
      <h1 className="page__title">{"Credits & Attributions"}</h1>
      <p className="page__subtitle">{"This project uses various open-source libraries, icons, and resources. Below are all the required attributions and credits."}</p>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>{"Icons"}</h2>
        <p style={paragraphStyle}>{"All icons used in this application are from Flaticon and are used in accordance with their free license terms."}</p>
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
            <a href="https://www.flaticon.com/free-icons/connect" title="connection status icons" target="_blank" rel="noreferrer" style={linkStyle}>
              Connected and disconnected status icons used in settings - Flaticon
            </a>
          </li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>{"Frontend Libraries"}</h2>
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
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>{"Backend Libraries"}</h2>
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
            <strong>django-allauth</strong> - <a href="https://docs.allauth.org/" target="_blank" rel="noreferrer" style={linkStyle}>https://docs.allauth.org/</a> (MIT License)
          </li>
          <li style={listItemStyle}>
            <strong>django-cors-headers</strong> - <a href="https://github.com/adamchainz/django-cors-headers" target="_blank" rel="noreferrer" style={linkStyle}>https://github.com/adamchainz/django-cors-headers</a> (MIT License)
          </li>
          <li style={listItemStyle}>
            <strong>PyJWT</strong> - <a href="https://pyjwt.readthedocs.io/" target="_blank" rel="noreferrer" style={linkStyle}>https://pyjwt.readthedocs.io/</a> (MIT License)
          </li>
          <li style={listItemStyle}>
            <strong>python-dotenv</strong> - <a href="https://github.com/theskumar/python-dotenv" target="_blank" rel="noreferrer" style={linkStyle}>https://github.com/theskumar/python-dotenv</a> (BSD License)
          </li>
          <li style={listItemStyle}>
            <strong>PostgreSQL</strong> - <a href="https://www.postgresql.org/" target="_blank" rel="noreferrer" style={linkStyle}>https://www.postgresql.org/</a> (PostgreSQL License)
          </li>
        </ul>
      </section>

      <section>
        <h2 style={sectionTitleStyle}>{"Design & Inspiration"}</h2>
        <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          {"The design system and UI patterns used in this application were created from scratch, inspired by modern web design principles and best practices. Color schemes and layout structures were developed specifically for this project."}
        </p>
      </section>

      <section style={{ marginTop: '32px', paddingTop: '24px', borderTop: '2px solid var(--border-color)' }}>
        <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          {"All resources listed above are used in accordance with their respective licenses. This project does not claim ownership of any third-party libraries or icons."}
        </p>
      </section>
    </div>
  );
}

export default CreditsPage;
