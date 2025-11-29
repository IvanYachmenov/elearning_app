import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../../api/client';
import '../courses.css';

function CourseDetailPage() {
  const { id } = useParams();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState(null);
  const [enrolled, setEnrolled] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);

    api
      .get(`/api/courses/${id}/`)
      .then((resp) => {
        setCourse(resp.data);
        if (resp.data.is_enrolled) setEnrolled(true);
      })
      .catch((err) => {
        console.error(err);
        setError('Course not found or failed to load.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleEnroll = async () => {
    setError(null);
    setEnrolling(true);
    try {
      const resp = await api.post(`/api/courses/${id}/enroll/`);
      setCourse(resp.data);
      setEnrolled(true);
    } catch (err) {
      console.error(err);
      setError('Failed to enroll. Please try again.');
    } finally {
      setEnrolling(false);
    }
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
        <Link to="/courses" className="btn-primary" style={{ marginTop: '16px' }}>
          ← Back to courses
        </Link>
      </div>
    );
  }

  const authorName =
    course.author_name ||
    (course.author && (course.author.username || course.author.email)) ||
    null;

  return (
    <div className="page page-enter">
      <div className="course-detail-header">
        <h1 className="page__title">{course.title}</h1>

        {authorName && (
          <p className="page__subtitle">
            by <strong>{authorName}</strong>
          </p>
        )}

        {course.description && (
          <p style={{ marginTop: '16px', fontSize: '15px' }}>
            {course.description}
          </p>
        )}

        <div className="course-detail-actions">
          {enrolled ? (
            <Link to="/learning" className="btn-primary">
              Go to learning →
            </Link>
          ) : (
            <button
              className="btn-primary"
              onClick={handleEnroll}
              disabled={enrolling}
            >
              {enrolling ? 'Enrolling...' : 'Enroll in this course'}
            </button>
          )}
        </div>

        {error && (
          <p style={{ color: '#dc2626', marginTop: '12px' }}>{error}</p>
        )}
      </div>

      {course.modules && course.modules.length > 0 && (
        <section className="course-content">
          <h2 className="section-title">Course Content</h2>
          <div className="module-list">
            {course.modules.map((mod) => (
              <div key={mod.id} className="module-item">
                <strong>{mod.title}</strong>
                {mod.topics && mod.topics.length > 0 && (
                  <ul className="topic-list">
                    {mod.topics.map((topic) => (
                      <li key={topic.id} className="topic-item">
                        {topic.title}
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
