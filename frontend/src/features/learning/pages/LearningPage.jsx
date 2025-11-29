import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../../api/client';
import '../learning.css';
import '../../courses/courses.css';

function LearningPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    api
      .get('/api/my-courses/')
      .then((resp) => {
        setCourses(resp.data.results || resp.data || []);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load your courses.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page page-enter">
      <h1 className="page__title">My Learning</h1>
      <p className="page__subtitle">Courses you&apos;re currently enrolled in</p>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: '#dc2626' }}>{error}</p>}

      {!loading && !error && courses.length === 0 && (
        <div className="learning-empty">
          <h2 className="learning-empty__title">No courses yet</h2>
          <p className="learning-empty__text">
            You haven&apos;t enrolled in any courses. Browse our catalog to get started!
          </p>
          <Link to="/courses" className="btn-primary">
            Explore courses →
          </Link>
        </div>
      )}

      {!loading && !error && courses.length > 0 && (
        <div className="courses-grid">
          {courses.map((course) => (
            <article key={course.id} className="course-card">
              <h3 className="course-card__title">{course.title}</h3>
              {course.description && (
                <p className="course-card__description">
                  {course.description.length > 160
                    ? course.description.slice(0, 160).trimEnd() + '…'
                    : course.description}
                </p>
              )}
              <div className="course-card__footer">
                <Link to={`/learning/courses/${course.id}`} className="btn-primary">
                  Continue learning →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default LearningPage;
