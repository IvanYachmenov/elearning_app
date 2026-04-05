import { isAxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { api } from '../../../shared/api';
import { useLanguage } from '../../../shared/lib/i18n/LanguageContext';
import type { TopicTheory } from '../../../shared/types';
import type { TopicRouteParams } from '../model/types';
import '../styles/learning.css';

function TopicTheoryPage() {
  const { courseId, topicId } = useParams<TopicRouteParams>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [topic, setTopic] = useState<TopicTheory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadTopic = async () => {
      if (!topicId) {
        if (isActive) {
          setError(t('pages.learning.topicNotFound'));
          setLoading(false);
        }
        return;
      }

      try {
        setError(null);
        const response = await api.get<TopicTheory>(`/api/learning/topics/${topicId}/`);
        if (!isActive) {
          return;
        }

        setTopic(response.data);
      } catch (requestError: unknown) {
        console.error(requestError);
        if (!isActive) {
          return;
        }

        const status = isAxiosError(requestError) ? requestError.response?.status : undefined;
        if (status === 404) {
          setError(t('pages.learning.topicNotFound'));
        } else if (status === 403) {
          setError(t('pages.learning.notEnrolled'));
        } else {
          setError(t('pages.learning.failedToLoadTopic'));
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadTopic();

    return () => {
      isActive = false;
    };
  }, [topicId, t]);

  const handleBackToCourse = () => {
    if (courseId) {
      navigate(`/learning/courses/${courseId}/`);
    } else if (topic?.course_id) {
      navigate(`/learning/courses/${topic.course_id}/`);
    } else {
      navigate('/learning');
    }
  };

  const handleGoToPractice = () => {
    if (!topic) {
      return;
    }

    const resolvedCourseId = courseId || String(topic.course_id);
    navigate(`/learning/courses/${resolvedCourseId}/topics/${topic.id}/practice`);
  };

  if (loading) {
    return (
      <div className="page page-enter">
        <p>{t('pages.learning.loadingTopic')}</p>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="page page-enter">
        <p style={{ color: '#dc2626' }}>{error || t('pages.learning.topicNotFound')}</p>
        <button
          type="button"
          className="learning-back-link"
          onClick={() => navigate('/learning')}
          style={{ marginTop: '16px' }}
        >
          {t('pages.learning.backToMyLearning')}
        </button>
      </div>
    );
  }

  const progressPercent = topic.progress_percent ?? 0;
  const timedLabel =
    topic.time_limit_seconds != null ? ` (${Math.floor(topic.time_limit_seconds / 60)} min)` : '';

  return (
    <div className="page page-enter">
      <header className="topic-page-header">
        <button type="button" className="learning-back-link" onClick={handleBackToCourse}>
          {t('pages.learning.backToCourse')}
        </button>

        <div className="topic-meta">
          {topic.course_title} | {topic.module_title}
          {topic.is_timed_test && (
            <span className="topic-meta__timed-badge" title={`${t('pages.learning.timedTest')}${timedLabel}`}>
              {t('pages.learning.timedTest')}
            </span>
          )}
        </div>

        <h1 className="page__title">{topic.title}</h1>
      </header>

      <div className="topic-theory-progress">
        <div className="learning-progress-bar">
          <div className="learning-progress-bar__fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <section className="topic-theory">
        <h2 className="topic-section-title">{t('pages.learning.theory')}</h2>
        <div className="topic-theory__content">{topic.content}</div>
      </section>

      <div className="topic-theory__actions">
        <button type="button" className="topic-theory__practice-btn" onClick={handleGoToPractice}>
          {t('pages.learning.goToPractice')}
        </button>
      </div>
    </div>
  );
}

export default TopicTheoryPage;
