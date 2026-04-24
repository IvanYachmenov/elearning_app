import { isAxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { api } from '../../../shared/api';
import { useLanguage } from '../../../shared/lib/i18n/LanguageContext';
import type { LearningCourse } from '../../../shared/types';
import type { ExpandedModulesState, LearningRouteParams } from '../model/types';
import '../styles/learning.css';

function CourseLearningPage() {
  const { id } = useParams<LearningRouteParams>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [course, setCourse] = useState<LearningCourse | null>(null);
  const [expandedModules, setExpandedModules] = useState<ExpandedModulesState>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadCourse = async () => {
      if (!id) {
        if (isActive) {
          setError(t('pages.learning.courseNotFoundOrNotEnrolled'));
          setLoading(false);
        }
        return;
      }

      try {
        setError(null);
        const response = await api.get<LearningCourse>(`/api/learning/courses/${id}/`);
        if (!isActive) {
          return;
        }

        setCourse(response.data);

        const defaultExpanded = response.data.modules.reduce<ExpandedModulesState>((accumulator, moduleItem) => {
          accumulator[moduleItem.id] = true;
          return accumulator;
        }, {});
        setExpandedModules(defaultExpanded);
      } catch (requestError: unknown) {
        console.error(requestError);
        if (!isActive) {
          return;
        }

        const status = isAxiosError(requestError) ? requestError.response?.status : undefined;
        if (status === 404) {
          setError(t('pages.learning.courseNotFoundOrNotEnrolled'));
        } else if (status === 403) {
          setError(t('pages.learning.notEnrolled'));
        } else {
          setError(t('pages.learning.failedToLoadCourse'));
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

  const toggleModule = (moduleId: number) => {
    setExpandedModules((previous) => ({
      ...previous,
      [moduleId]: !previous[moduleId],
    }));
  };

  const handleTopicClick = (topicId: number) => {
    if (!course) {
      return;
    }

    navigate(`/learning/courses/${course.id}/topics/${topicId}/`);
  };

  if (loading) {
    return (
      <div className="page page-enter">
        <p>{t('pages.learning.loadingCourse')}</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="page page-enter">
        <p style={{ color: '#dc2626' }}>{error || t('pages.learning.courseNotFound')}</p>
        <Link to="/learning" className="btn-primary" style={{ marginTop: '16px' }}>
          {t('pages.learning.backToMyLearning')}
        </Link>
      </div>
    );
  }

  const progressPercent = course.progress_percent ?? 0;
  const fullDescription = course.description || '';
  const maxDescLength = 260;
  const isLongDescription = fullDescription.length > maxDescLength;
  const shortDescription = isLongDescription
    ? `${fullDescription.slice(0, maxDescLength).trimEnd()}...`
    : fullDescription;

  return (
    <div className="page page-enter">
      <header className="learning-course-header">
        <button type="button" className="learning-back-link" onClick={() => navigate('/learning')}>
          {t('pages.learning.backToMyLearning')}
        </button>

        <h1 className="page__title">{course.title}</h1>

        {fullDescription && (
          <p className="learning-course-description">
            {shortDescription}{' '}
            {isLongDescription && (
              <Link to={`/courses/${course.id}`} className="learning-course-description__link">
                {t('pages.learning.readMore')}
              </Link>
            )}
          </p>
        )}

        <div className="learning-course-progress">
          <div className="learning-course-progress__info">
            <span className="learning-course-progress__label">{t('pages.learning.progress')}</span>
            <span className="learning-course-progress__value">
              {course.completed_topics}/{course.total_topics} {t('pages.learning.topics')}
            </span>
            <span className="learning-course-progress__percent">({progressPercent}%)</span>
          </div>

          <div className="learning-progress-bar">
            <div className="learning-progress-bar__fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </header>

      <section className="learning-modules">
        {course.modules && course.modules.length > 0 ? (
          course.modules.map((moduleItem) => {
            const isOpen = Boolean(expandedModules[moduleItem.id]);
            const wrapperMaxHeight = isOpen ? '2000px' : '0px';

            return (
              <article key={moduleItem.id} className="learning-module">
                <button
                  type="button"
                  className="learning-module__header"
                  onClick={() => toggleModule(moduleItem.id)}
                >
                  <div className="learning-module__header-left">
                    <div className="learning-module__title">{moduleItem.title}</div>
                    <div className="learning-module__meta">
                      {moduleItem.topics.length} {t('pages.learning.topics')}
                    </div>
                  </div>
                  <div className={'learning-module__chevron' + (isOpen ? ' open' : '')} aria-hidden="true">
                    {isOpen ? '−' : '+'}
                  </div>
                </button>

                <div
                  className={'learning-topic-wrapper' + (isOpen ? ' learning-topic-wrapper--open' : '')}
                  style={{ maxHeight: wrapperMaxHeight }}
                >
                  {moduleItem.topics.length > 0 ? (
                    <ul className="learning-topic-list">
                      {moduleItem.topics.map((topic) => (
                        <li
                          key={topic.id}
                          className={'learning-topic learning-topic--' + topic.status}
                          onClick={() => handleTopicClick(topic.id)}
                        >
                          <div className="learning-topic__title">
                            <span>{topic.title}</span>
                            {topic.is_timed_test && (
                              <span className="learning-topic__timed-badge" title={t('pages.learning.timedTest')}>
                                TIMED
                              </span>
                            )}
                          </div>

                          <div className="learning-topic__status">
                            <span className="learning-topic__status-pill">
                              {topic.status === 'not_started'
                                ? t('pages.learning.statusNotStarted')
                                : topic.status === 'in_progress'
                                  ? t('pages.learning.statusInProgress')
                                  : topic.status === 'completed'
                                    ? topic.score != null && topic.score >= 100
                                      ? t('pages.learning.statusPassed')
                                      : t('pages.learning.statusCompleted')
                                    : topic.status === 'failed'
                                      ? t('pages.learning.statusFailed')
                                      : topic.status.replace('_', ' ')}
                            </span>
                            {topic.score != null && <span className="learning-topic__score">{topic.score}%</span>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="learning-topic-empty">{t('pages.learning.noTopicsYet')}</p>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <p>{t('pages.learning.noModulesYet')}</p>
        )}
      </section>
    </div>
  );
}

export default CourseLearningPage;
