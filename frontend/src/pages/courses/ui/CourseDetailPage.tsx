import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { api } from '../../../shared/api';
import { useLanguage } from '../../../shared/lib/i18n/LanguageContext';
import type { CourseDetail } from '../../../shared/types';
import type { CourseDetailPageData } from '../model/types';
import '../styles/courses.css';

function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [course, setCourse] = useState<CourseDetailPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrolled, setEnrolled] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadCourse = async () => {
      if (!id) {
        if (isActive) {
          setError(t('pages.courses.courseNotFound'));
          setLoading(false);
        }
        return;
      }

      try {
        setError(null);
        const response = await api.get<CourseDetailPageData>(`/api/courses/${id}/`);
        if (!isActive) {
          return;
        }

        setCourse(response.data);
        setEnrolled(Boolean(response.data.is_enrolled));
      } catch (requestError) {
        console.error(requestError);
        if (isActive) {
          setError(t('pages.courses.courseNotFound'));
          setCourse(null);
          setEnrolled(false);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadCourse();

    return () => {
      isActive = false;
    };
  }, [id, t]);

  const authorName = useMemo(() => {
    if (!course) {
      return null;
    }

    return course.author_name || course.author?.username || course.author?.email || null;
  }, [course]);

  const handleEnroll = async () => {
    if (!id) {
      setError(t('pages.courses.failedToEnroll'));
      return;
    }

    setError(null);
    setEnrolling(true);

    try {
      const response = await api.post<CourseDetail>(`/api/courses/${id}/enroll/`);
      setCourse((previousCourse) => ({ ...(previousCourse || response.data), ...response.data }));
      setEnrolled(true);
    } catch (requestError) {
      console.error(requestError);
      setError(t('pages.courses.failedToEnroll'));
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="page page-enter">
        <p>{t('pages.courses.loadingCourse')}</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="page page-enter">
        <p style={{ color: '#dc2626' }}>{error || t('pages.courses.courseNotFoundShort')}</p>
        <Link to="/courses" className="btn-primary" style={{ marginTop: '16px' }}>
          {t('pages.courses.backToCourses')}
        </Link>
      </div>
    );
  }

  return (
    <div className="page page-enter">
      <div className="course-detail-back">
        <button type="button" className="btn-primary" onClick={() => navigate('/courses')}>
          {t('pages.courses.backToCoursesTitle')}
        </button>
      </div>

      <div className="course-detail-header">
        <div className="course-detail-header__image">
          {course.image_url ? (
            <img src={course.image_url} alt={course.title} />
          ) : (
            <div className="course-detail-header__image-placeholder">C</div>
          )}
        </div>

        <h1 className="page__title">{course.title}</h1>

        {authorName && (
          <p className="page__subtitle">
            by <strong>{authorName}</strong>
          </p>
        )}

        {course.description && <p style={{ marginTop: '16px', fontSize: '15px' }}>{course.description}</p>}

        <div className="course-detail-actions">
          {enrolled ? (
            <Link to="/learning" className="btn-primary">
              {t('pages.courses.goToLearning')}
            </Link>
          ) : (
            <button type="button" className="btn-primary" onClick={handleEnroll} disabled={enrolling}>
              {enrolling ? t('pages.courses.enrolling') : t('pages.courses.enrollInCourse')}
            </button>
          )}
        </div>

        {error && <p style={{ color: '#dc2626', marginTop: '12px' }}>{error}</p>}
      </div>

      {course.modules && course.modules.length > 0 && (
        <section className="course-content">
          <h2 className="section-title">{t('pages.learning.courseContent')}</h2>
          <div className="module-list">
            {course.modules.map((moduleItem) => (
              <div key={moduleItem.id} className="module-item">
                <strong>{moduleItem.title}</strong>
                {moduleItem.topics && moduleItem.topics.length > 0 && (
                  <ul className="topic-list">
                    {moduleItem.topics.map((topic) => (
                      <li key={topic.id} className="topic-item">
                        {topic.title}
                        {topic.is_timed_test && (
                          <span className="topic-item__timed-badge" title={t('pages.learning.timedTest')}>
                            TIMED
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default CourseDetailPage;
