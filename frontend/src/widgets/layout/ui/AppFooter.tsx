import { Link } from 'react-router-dom';


function AppFooter() {

  return (
    <footer
      style={{
        padding: '16px 24px',
        fontSize: '12px',
        color: 'var(--text-muted)',
        textAlign: 'center',
      }}
    >
      {"Icons by"}{' '}
      <a
        href="https://www.flaticon.com/"
        target="_blank"
        rel="noreferrer"
        style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}
      >
        Flaticon
      </a>
      {' | '}
      {"See full credits on the"}{' '}
      <Link to="/credits" style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}>
        {"Credits page"}
      </Link>
      .
    </footer>
  );
}

export default AppFooter;
