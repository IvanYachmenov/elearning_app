import { useEffect, useState } from 'react';

import { CourseCard } from '../../../features/courses';
import { api } from '../../../shared/api';
import { useLanguage } from '../../../shared/lib/i18n/LanguageContext';
import type { CourseListItem } from '../../../shared/types';
import type { CourseListResponse } from '../model/types';
import '../styles/courses.css';

function normalizeCourseList(data: CourseListResponse): CourseListItem[] {
  return Array.isArray(data) ? data : data.results || [];
}

function CoursesPage() {
  const { t } = useLanguage();
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadCourses = async () => {
      try {
        setError(null);
        const response = await api.get<CourseListResponse>('/api/courses/');
        if (!isActive) {
          return;
        }

        setCourses(normalizeCourseList(response.data));
      } catch (requestError) {
        console.error(requestError);
        if (isActive) {
          setError('Failed to load courses.');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadCourses();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="page page-enter">
      <h1 className="page__title">{t('pages.courses.title')}</h1>
      <p className="page__subtitle">{t('pages.courses.subtitle')}</p>

      {loading && <p>{t('pages.courses.loading')}</p>}
      {error && <p style={{ color: '#dc2626' }}>{error}</p>}

      {!loading && !error && courses.length === 0 && <p>{t('pages.courses.noCourses')}</p>}

      {!loading && !error && courses.length > 0 && (
        <div className="courses-list">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}

export default CoursesPage;
