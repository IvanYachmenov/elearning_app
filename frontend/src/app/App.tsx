import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import '../shared/styles/index.css';

import {
  LoginPage,
  RegisterPage,
  StartPage,
  ProfilePage,
  SettingsPage,
  CreditsPage,
  CourseDetailPage,
  CoursesPage,
  CourseLearningPage,
  LearningPage,
  TopicTheoryPage,
  TopicPracticePage,
  TeacherCoursesPage,
  TeacherCourseEditPage,
  TeacherModuleEditPage,
  TeacherTopicEditPage,
} from '../pages';

import { MainLayout } from '../widgets/layout';

import { api, setAuthToken } from '../shared/api';
import { getCookie } from '../shared/lib/storage/cookies';
import { LoadingIndicator } from '../shared/ui';
import { CookieConsent } from '../features/cookie-consent';

import { NavigationLockProvider } from '../shared/lib/navigation-lock';
import { ThemeProvider } from '../shared/lib/theme/ThemeContext';
import { LanguageProvider } from '../shared/lib/i18n/LanguageContext';
import { clearAuthSession, isGitHubCallbackInUrl } from '../features/auth';
import type { AuthSuccessHandler, User } from '../shared/types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(() => Boolean(getCookie('access')));
  const hasGitHubCallback = isGitHubCallbackInUrl();

  useEffect(() => {
    const token = getCookie('access');
    if (!token) {
      return;
    }

    setAuthToken(token);
    void api
      .get<User>('/api/auth/me/')
      .then((response) => setUser(response.data))
      .catch((error: unknown) => {
        const status = isAxiosError(error) ? error.response?.status : undefined;

        if (status === 401 || status === 403) {
          clearAuthSession();
          setUser(null);
        }
      })
      .finally(() => setIsCheckingAuth(false));
  }, []);

  const handleAuthSuccess: AuthSuccessHandler = (accessToken, profile) => {
    setAuthToken(accessToken);
    setUser(profile);
  };

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
  };

  if (isCheckingAuth) {
    return (
      <div className="app-loading-screen">
        <LoadingIndicator label="Loading..." />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <NavigationLockProvider>
            <CookieConsent />
            <Routes>
              <Route path="/" element={user ? <Navigate to="/courses" replace /> : <StartPage />} />

              <Route
                path="/register"
                element={user && !hasGitHubCallback ? <Navigate to="/courses" replace /> : <RegisterPage onAuth={handleAuthSuccess} />}
              />
              <Route
                path="/login"
                element={user && !hasGitHubCallback ? <Navigate to="/courses" replace /> : <LoginPage onAuth={handleAuthSuccess} />}
              />

              <Route
                element={
                  user ? <MainLayout user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />
                }
              >
                <Route path="/home" element={<Navigate to="/courses" replace />} />
                <Route path="/profile" element={<ProfilePage user={user!} onUserUpdate={setUser} />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/courses/:id" element={<CourseDetailPage />} />
                <Route path="/learning" element={<LearningPage />} />
                <Route path="/learning/courses/:id" element={<CourseLearningPage />} />
                <Route path="/shop" element={<Navigate to="/courses" replace />} />
                <Route path="/settings" element={<SettingsPage user={user!} onUserUpdate={setUser} />} />
                <Route path="/credits" element={<CreditsPage />} />
                <Route path="/learning/courses/:courseId/topics/:topicId" element={<TopicTheoryPage />} />
                <Route
                  path="/learning/courses/:courseId/topics/:topicId/practice"
                  element={<TopicPracticePage />}
                />
                <Route path="/teacher/courses" element={<TeacherCoursesPage user={user!} />} />
                <Route path="/teacher/courses/new" element={<TeacherCourseEditPage user={user!} />} />
                <Route path="/teacher/courses/:id/edit" element={<TeacherCourseEditPage user={user!} />} />
                <Route
                  path="/teacher/courses/:courseId/modules/new"
                  element={<TeacherModuleEditPage user={user!} />}
                />
                <Route
                  path="/teacher/courses/:courseId/modules/:moduleId/edit"
                  element={<TeacherModuleEditPage user={user!} />}
                />
                <Route
                  path="/teacher/courses/:courseId/modules/:moduleId/topics/new"
                  element={<TeacherTopicEditPage user={user!} />}
                />
                <Route
                  path="/teacher/courses/:courseId/modules/:moduleId/topics/:topicId/edit"
                  element={<TeacherTopicEditPage user={user!} />}
                />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </NavigationLockProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
