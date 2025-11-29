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
      Icons by{' '}
      <a
        href="https://www.flaticon.com/"
        target="_blank"
        rel="noreferrer"
      >
        Flaticon
      </a>
      {' '}· See full credits on the{' '}
      <a href="/credits">
        Credits page
      </a>
      .
    </footer>
  );
}

export default AppFooter;
