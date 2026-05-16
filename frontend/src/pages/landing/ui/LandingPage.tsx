import { useEffect } from 'react';
import { Link } from 'react-router-dom';

import '../styles/landing.css';

function StartPage() {
  useEffect(() => {
    document.body.classList.remove('theme-app');
    document.body.classList.add('theme-auth');
    return () => document.body.classList.remove('theme-auth');
  }, []);

  return (
    <div className="landing-container">
      <div className="landing-content">
        <div className="landing-header">
          <h1 className="landing-title">E-learning web application</h1>
          <p className="landing-subtitle">Your journey to knowledge starts here</p>
        </div>

        <div className="landing-actions">
          <Link to="/login" className="landing-button landing-button--primary">
            Log In
          </Link>
          <Link to="/register" className="landing-button landing-button--secondary">
            Registration
          </Link>
        </div>
      </div>
    </div>
  );
}

export default StartPage;
