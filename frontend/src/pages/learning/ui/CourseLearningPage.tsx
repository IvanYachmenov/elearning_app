import { isAxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { api } from '../../../shared/api';
import type { LearningCourse } from '../../../shared/types';
import { LoadingIndicator } from '../../../shared/ui';
import type { ExpandedModulesState, LearningRouteParams } from '../model/types';
import '../styles/learning.css';

function CourseLearningPage() {
  const { id } = useParams<LearningRouteParams>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<LearningCourse | null>(null);
  const [expandedModules, setExpandedModules] = useState<ExpandedModulesState>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadCourse = async () => {
      if (!id) {
        if (isActive) {
          setError("Course not found or you are not enrolled.");
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
          setError("Course not found or you are not enrolled.");
        } else if (status === 403) {
          setError("You are not enrolled in this course.");
        } else {
          setError("Failed to load course.");
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
  }, [id]);

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
        <LoadingIndicator label={"Loading..."} />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="page page-enter">
        <p style={{ color: '#dc2626' }}>{error || "Course not found."}</p>
        <Link to="/learning" className="btn-primary" style={{ marginTop: '16px' }}>
          {"Back to My Learning"}
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
          {"Back to My Learning"}
        </button>

        <h1 className="page__title">{course.title}</h1>

        {fullDescription && (
          <p className="learning-course-description">
            {shortDescription}{' '}
            {isLongDescription && (
              <Link to={`/courses/${course.id}`} className="learning-course-description__link">
                {"Read more"}
              </Link>
            )}
          </p>
        )}

        <div className="learning-course-progress">
          <div className="learning-course-progress__info">
            <span className="learning-course-progress__label">{"Progress:"}</span>
            <span className="learning-course-progress__value">
              {course.completed_topics}/{course.total_topics} {"topics"}
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
                      {moduleItem.topics.length} {"topics"}
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
                      {moduleItem.topics.map((topic) => {
                        const visibleScore = topic.score ?? (topic.status === 'in_progress' ? 0 : null);

                        return (
                          <li
                            key={topic.id}
                            className={'learning-topic learning-topic--' + topic.status}
                            onClick={() => handleTopicClick(topic.id)}
                          >
                            <div className="learning-topic__title">
                              <span>{topic.title}</span>
                              {topic.is_timed_test && (
                                <span className="learning-topic__timed-badge" title={"Timed test"}>
                                  TIMER
                                </span>
                              )}
                            </div>

                            <div className="learning-topic__status">
                              <span className="learning-topic__status-pill">
                                {topic.status === 'not_started'
                                  ? "Not started"
                                  : topic.status === 'in_progress'
                                    ? "In progress"
                                    : topic.status === 'completed'
                                      ? topic.score != null && topic.score >= 100
                                        ? "Passed"
                                        : "Completed"
                                      : topic.status === 'failed'
                                        ? "Failed"
                                        : topic.status.replace('_', ' ')}
                              </span>
                              {visibleScore != null && <span className="learning-topic__score">{visibleScore}%</span>}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="learning-topic-empty">{"No topics yet."}</p>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <p>{"No modules yet."}</p>
        )}
      </section>

    </div>
  );
}

export default CourseLearningPage;
