import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../../api/client.js';
import '../learning.css';

function CourseLearningPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    api
      .get(`/api/learning/courses/${id}/`)
      .then((resp) => {
        setCourse(resp.data);

        const defaultExpanded = {};
        (resp.data.modules || []).forEach((m) => {
          defaultExpanded[m.id] = true;
        });
        setExpandedModules(defaultExpanded);
      })
      .catch((err) => {
        console.error(err);
        if (err.response && err.response.status === 404) {
          setError('Course not found or you are not enrolled.');
        } else if (err.response && err.response.status === 403) {
          setError('You are not enrolled in this course.');
        } else {
          setError('Failed to load course.');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const toggleModule = (moduleId) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const handleTopicClick = (topic) => {
    console.log('Click topic', topic.id);
  };

  if (loading) {
    return (
      <div className="page page-enter">
        <p>Loading course...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="page page-enter">
        <p style={{ color: '#dc2626' }}>{error || 'Course not found.'}</p>
        <Link
          to="/learning"
          className="btn-primary"
          style={{ marginTop: '16px' }}
        >
          ← Back to My Learning
        </Link>
      </div>
    );
  }

  const progressPercent = course.progress_percent ?? 0;

  const fullDescription = course.description || '';
  const maxDescLength = 260;
  const isLongDescription = fullDescription.length > maxDescLength;
  const shortDescription = isLongDescription
    ? fullDescription.slice(0, maxDescLength).trimEnd() + '…'
    : fullDescription;

  return (
    <div className="page page-enter">
      <header className="learning-course-header">
        <button
          type="button"
          className="learning-back-link"
          onClick={() => navigate('/learning')}
        >
          ← Back to My Learning
        </button>

        <h1 className="page__title">{course.title}</h1>

        {fullDescription && (
          <p className="learning-course-description">
            {shortDescription}{' '}
            {isLongDescription && (
              <Link
                to={`/courses/${course.id}`}
                className="learning-course-description__link"
              >
                Read more
              </Link>
            )}
          </p>
        )}

        <div className="learning-course-progress">
          <div className="learning-course-progress__info">
            <span className="learning-course-progress__label">Progress:</span>
            <span className="learning-course-progress__value">
              {course.completed_topics}/{course.total_topics} topics
            </span>
            <span className="learning-course-progress__percent">
              ({progressPercent}%)
            </span>
          </div>

          <div className="learning-progress-bar">
            <div
              className="learning-progress-bar__fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </header>

      <section className="learning-modules">
        {course.modules && course.modules.length > 0 ? (
          course.modules.map((mod) => {
            const isOpen = expandedModules[mod.id];

            return (
              <article key={mod.id} className="learning-module">
                <button
                  type="button"
                  className="learning-module__header"
                  onClick={() => toggleModule(mod.id)}
                >
                  <div>
                    <div className="learning-module__title">{mod.title}</div>
                    <div className="learning-module__meta">
                      {mod.topics.length} topics
                    </div>
                  </div>
                  <div
                    className={
                      'learning-module__chevron' + (isOpen ? ' open' : '')
                    }
                  >
                    ▾
                  </div>
                </button>

                <div
                  className={
                    'learning-topic-wrapper' +
                    (isOpen ? ' learning-topic-wrapper--open' : '')
                  }
                >
                  {mod.topics.length > 0 ? (
                    <ul className="learning-topic-list">
                      {mod.topics.map((topic) => (
                        <li
                          key={topic.id}
                          className={
                            'learning-topic learning-topic--' + topic.status
                          }
                          onClick={() => handleTopicClick(topic)}
                        >
                          <div className="learning-topic__title">{topic.title}</div>

                          <div className="learning-topic__status">
                            <span className="learning-topic__status-pill">
                              {topic.status.replace('_', ' ')}
                            </span>
                            {topic.score != null && (
                              <span className="learning-topic__score">
                                {topic.score}%
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="learning-topic-empty">No topics yet.</p>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <p>No modules yet.</p>
        )}
      </section>
    </div>
  );
}

export default CourseLearningPage;
