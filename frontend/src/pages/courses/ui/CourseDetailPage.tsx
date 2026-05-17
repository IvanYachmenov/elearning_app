import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { api } from '../../../shared/api';
import type { CourseDetail } from '../../../shared/types';
import { LoadingIndicator } from '../../../shared/ui';
import type { CourseDetailPageData } from '../model/types';
import '../styles/courses.css';

const MAX_RATING = 5;
const FILLED_STAR = '\u2605';
const EMPTY_STAR = '\u2606';

function formatReviewDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function RatingStars({ rating }: { rating: number | null }) {
  const normalizedRating = typeof rating === 'number' ? rating : 0;

  return (
    <span className="course-rating__stars" aria-hidden="true">
      {Array.from({ length: MAX_RATING }, (_, index) => {
        const fillPercent = clamp((normalizedRating - index) * 100, 0, 100);

        return (
          <span key={index} className="course-rating__star">
            <span className="course-rating__star-base">{EMPTY_STAR}</span>
            <span className="course-rating__star-fill" style={{ width: `${fillPercent}%` }}>
              {FILLED_STAR}
            </span>
          </span>
        );
      })}
    </span>
  );
}

function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
          setError("Course not found or failed to load.");
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
          setError("Course not found or failed to load.");
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
  }, [id]);

  const authorName = useMemo(() => {
    if (!course) {
      return null;
    }

    return course.author_name || course.author?.username || course.author?.email || null;
  }, [course]);

  const hasRating = Boolean(
    course && course.average_rating && course.reviews_count && course.reviews_count > 0,
  );

  const ratingText = useMemo(() => {
    if (!hasRating || !course?.average_rating) {
      return '';
    }

    return course.average_rating.toFixed(1);
  }, [hasRating, course]);

  const handleEnroll = async () => {
    if (!id) {
      setError("Failed to enroll. Please try again.");
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
      setError("Failed to enroll. Please try again.");
    } finally {
      setEnrolling(false);
    }
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
        <Link to="/courses" className="btn-primary" style={{ marginTop: '16px' }}>
          {"Back to courses"}
        </Link>
      </div>
    );
  }

  return (
    <div className="page page-enter">
      <div className="course-detail-back">
        <button type="button" className="btn-primary" onClick={() => navigate('/courses')}>
          {"Back to Courses"}
        </button>
      </div>

      <div className="course-detail-header">
        <div className="course-detail-hero">
          <div className="course-detail-hero__content">
            <h1 className="page__title">{course.title}</h1>

            {authorName && (
              <p className="page__subtitle">
                by <strong>{authorName}</strong>
              </p>
            )}

            {hasRating && (
              <div className="course-rating course-rating--detail" aria-label={ratingText}>
                <RatingStars rating={course.average_rating} />
                <span className="course-rating__text">{ratingText}</span>
              </div>
            )}

            <div className="course-detail-actions">
              {enrolled ? (
                <Link to="/learning" className="btn-primary">
                  {"Go to learning"}
                </Link>
              ) : (
                <button type="button" className="btn-primary" onClick={handleEnroll} disabled={enrolling}>
                  {enrolling ? "Enrolling..." : "Enroll in this course"}
                </button>
              )}
            </div>
          </div>
        </div>

        {course.description && <p className="course-detail-description">{course.description}</p>}

        {error && <p style={{ color: '#dc2626', marginTop: '12px' }}>{error}</p>}
      </div>

      {course.modules && course.modules.length > 0 && (
        <section className="course-content">
          <h2 className="section-title">{"Course Content"}</h2>
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
                          <span className="topic-item__timed-badge" title={"Timed test"}>
                            TIMER
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

      <section className="course-reviews">
        <div className="course-reviews__header">
          <h2 className="section-title">{"Course reviews"}</h2>
        </div>

        <div className="course-review-thread" aria-live="polite">
          {course.reviews.length === 0 ? (
            <p className="course-review-thread__empty">{"No one has reviewed this course yet."}</p>
          ) : (
            course.reviews.map((review) => (
              <article key={review.id} className="course-review-message">
                <div className="course-review-message__meta">
                  <strong>{review.user_name}</strong>
                  <span>{formatReviewDate(review.updated_at)}</span>
                </div>
                <div className="course-rating course-rating--message" aria-label={review.rating.toFixed(1)}>
                  <RatingStars rating={review.rating} />
                  <span className="course-rating__text">{review.rating.toFixed(1)}</span>
                </div>
                {review.comment ? (
                  <p className="course-review-message__comment">{review.comment}</p>
                ) : (
                  <p className="course-review-message__comment course-review-message__comment--empty">
                    {"Rating without a comment."}
                  </p>
                )}
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default CourseDetailPage;
