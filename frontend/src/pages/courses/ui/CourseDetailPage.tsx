import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { api } from '../../../shared/api';
import { useLanguage } from '../../../shared/lib/i18n/LanguageContext';
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
  const { t } = useLanguage();
  const [course, setCourse] = useState<CourseDetailPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

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
        const ownReview = response.data.reviews?.find((review) => review.is_current_user);
        setReviewRating(ownReview?.rating || 0);
        setReviewComment(ownReview?.comment || '');
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

  const ratingText = useMemo(() => {
    if (!course || !course.average_rating || course.reviews_count === 0) {
      return t('pages.courses.noReviews');
    }

    return course.average_rating.toFixed(1);
  }, [course, t]);

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

  const handleReviewSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!id) {
      setReviewError(t('pages.courses.failedToSaveReview'));
      return;
    }

    if (reviewRating < 1 || reviewRating > MAX_RATING) {
      setReviewError(t('pages.courses.selectRating'));
      return;
    }

    setReviewError(null);
    setReviewSuccess(null);
    setReviewSubmitting(true);

    try {
      const response = await api.post<CourseDetailPageData>(`/api/courses/${id}/reviews/`, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setCourse(response.data);
      const ownReview = response.data.reviews.find((review) => review.is_current_user);
      setReviewRating(ownReview?.rating || reviewRating);
      setReviewComment(ownReview?.comment || reviewComment.trim());
      setReviewSuccess(t('pages.courses.reviewSaved'));
    } catch (requestError) {
      console.error(requestError);
      setReviewError(t('pages.courses.failedToSaveReview'));
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page page-enter">
        <LoadingIndicator label={t('common.loading')} />
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
        <div className="course-detail-hero">
          <div className="course-detail-header__image">
            {course.image_url ? (
              <img src={course.image_url} alt={course.title} />
            ) : (
              <div className="course-detail-header__image-placeholder">C</div>
            )}
          </div>

          <div className="course-detail-hero__content">
            <h1 className="page__title">{course.title}</h1>

            {authorName && (
              <p className="page__subtitle">
                by <strong>{authorName}</strong>
              </p>
            )}

            <div className="course-rating course-rating--detail" aria-label={ratingText}>
              <RatingStars rating={course.average_rating} />
              <span className="course-rating__text">{ratingText}</span>
            </div>

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
          </div>
        </div>

        {course.description && <p className="course-detail-description">{course.description}</p>}

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
          <h2 className="section-title">{t('pages.courses.reviewsTitle')}</h2>
        </div>

        <form className="course-review-form" onSubmit={handleReviewSubmit}>
          <label className="course-review-form__label">{t('pages.courses.yourRating')}</label>
          <div className="course-review-stars" role="radiogroup" aria-label={t('pages.courses.yourRating')}>
            {Array.from({ length: MAX_RATING }, (_, index) => {
              const value = index + 1;
              return (
                <button
                  key={value}
                  type="button"
                  className={`course-review-stars__button ${value <= reviewRating ? 'is-active' : ''}`}
                  onClick={() => setReviewRating(value)}
                  role="radio"
                  aria-checked={value === reviewRating}
                  aria-label={`${value} ${t('pages.courses.stars')}`}
                >
                  {FILLED_STAR}
                </button>
              );
            })}
          </div>

          <label className="course-review-form__label" htmlFor="course-review-comment">
            {t('pages.courses.yourComment')}
          </label>
          <textarea
            id="course-review-comment"
            className="course-review-form__textarea"
            value={reviewComment}
            onChange={(event) => setReviewComment(event.target.value)}
            placeholder={t('pages.courses.commentPlaceholder')}
            rows={4}
            maxLength={1000}
          />

          <div className="course-review-form__footer">
            <button type="submit" className="btn-primary" disabled={reviewSubmitting}>
              {reviewSubmitting ? t('pages.courses.savingReview') : t('pages.courses.submitReview')}
            </button>
            {reviewError && <span className="course-review-form__message course-review-form__message--error">{reviewError}</span>}
            {reviewSuccess && <span className="course-review-form__message course-review-form__message--success">{reviewSuccess}</span>}
          </div>
        </form>

        <div className="course-review-thread" aria-live="polite">
          {course.reviews.length === 0 ? (
            <p className="course-review-thread__empty">{t('pages.courses.noReviewComments')}</p>
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
                    {t('pages.courses.ratingOnly')}
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
