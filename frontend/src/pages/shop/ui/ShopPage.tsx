import { useLanguage } from '../../../shared/lib/i18n/LanguageContext';

function ShopPage() {
  const { t } = useLanguage();

  return (
    <div className="page page-enter">
      <div
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border-light)',
          textAlign: 'center',
        }}
      >
        <h1 className="page__title">{t('pages.shop.title')}</h1>
        <p className="page__subtitle">Coming soon.</p>
      </div>
    </div>
  );
}

export default ShopPage;
