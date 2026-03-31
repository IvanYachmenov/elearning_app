import { Link } from 'react-router-dom';

import { useLanguage } from '../../../shared/lib/i18n/LanguageContext';

function AppFooter() {
  const { t } = useLanguage();

  return (
    <footer
      style={{
        padding: '16px 24px',
        fontSize: '12px',
        color: 'var(--text-muted)',
        textAlign: 'center',
      }}
    >
      {t('pages.credits.footerIconsBy')}{' '}
      <a
        href="https://www.flaticon.com/"
        target="_blank"
        rel="noreferrer"
        style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}
      >
        Flaticon
      </a>
      {' | '}
      {t('pages.credits.footerSeeFullCredits')}{' '}
      <Link to="/credits" style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}>
        {t('pages.credits.footerCreditsPage')}
      </Link>
      .
    </footer>
  );
}

export default AppFooter;
