import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import '../styles/index.css';

import LoginPage from '../features/auth/pages/LoginPage';
import RegisterPage from '../features/auth/pages/RegisterPage';

import HomePage from '../features/home/pages/HomePage';
import ProfilePage from '../features/profile/pages/ProfilePage';
import SettingsPage from '../features/settings/pages/SettingsPage';
import ShopPage from '../features/shop/pages/ShopPage';

import CreditsPage from '../features/credits/pages/CreditsPage';

import CoursesPage from '../features/courses/pages/CoursesPage';
import CourseDetailPage from '../features/courses/pages/CourseDetailPage';

import LearningPage from '../features/learning/pages/LearningPage';
import CourseLearningPage from '../features/learning/pages/CourseLearningPage';

import MainLayout from '../shared/components/MainLayout';


import { api, setAuthToken } from '../api/client';

function App() {
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access');
    if (!token) {
      setIsCheckingAuth(false);
      return;
    }

    setAuthToken(token);
    api
      .get('/api/auth/me/')
      .then((resp) => setUser(resp.data))
      .catch(() => {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        setAuthToken(null);
        setUser(null);
      })
      .finally(() => setIsCheckingAuth(false));
  }, []);

  const handleAuthSuccess = (accessToken, profile) => {
    localStorage.setItem('access', accessToken);
    setAuthToken(accessToken);
    setUser(profile);
  };

  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    setAuthToken(null);
    setUser(null);
  };

  if (isCheckingAuth) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontSize: '18px',
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            user ? <Navigate to="/home" replace /> : <Navigate to="/register" replace />
          }
        />

        <Route
          path="/register"
          element={
            user ? <Navigate to="/home" replace /> : <RegisterPage onAuth={handleAuthSuccess} />
          }
        />
        <Route
          path="/login"
          element={
            user ? <Navigate to="/home" replace /> : <LoginPage onAuth={handleAuthSuccess} />
          }
        />

        <Route
          element={
            user ? (
              <MainLayout user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route path="/home" element={<HomePage user={user} />} />
          <Route path="/profile" element={<ProfilePage user={user} />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:id" element={<CourseDetailPage />} />
          <Route path="/learning" element={<LearningPage />} />
          <Route path="/learning/courses/:id" element={<CourseLearningPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/credits" element={<CreditsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
