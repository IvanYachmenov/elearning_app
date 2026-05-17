import { useState } from 'react';
import { isAxiosError } from 'axios';

import { api } from '../../../shared/api';

type CourseCompletionReviewModalProps = {
  courseId: number;
  onReviewed: () => void;
};

const STAR_QUESTIONS = [
  { key: 'rating', label: 'How much did you like this course?' },
  { key: 'app_rating', label: 'How do you rate the app overall?' },
  { key: 'design_rating', label: 'How do you rate the design?' },
  { key: 'delivery_rating', label: 'How do you rate the way courses are delivered?' },
] as const;

type RatingKey = (typeof STAR_QUESTIONS)[number]['key'];

function isEnglishOnly(text: string): boolean {
  for (let i = 0; i < text.length; i += 1) {
    if (text.charCodeAt(i) > 127) {
      return false;
    }
  }
  return true;
}

function CourseCompletionReviewModal({ courseId, onReviewed }: CourseCompletionReviewModalProps) {
  const [ratings, setRatings] = useState<Record<RatingKey, number>>({
    rating: 0,
    app_rating: 0,
    design_rating: 0,
    delivery_rating: 0,
  });
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const allRated = STAR_QUESTIONS.every((question) => ratings[question.key] > 0);

  const handleSubmit = async () => {
    if (submitting) {
      return;
    }

    if (!allRated) {
      setError('Please answer every rating question.');
      return;
    }

    if (comment && !isEnglishOnly(comment)) {
      setError('Please write your comment in English.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/api/courses/${courseId}/reviews/`, {
        rating: ratings.rating,
        app_rating: ratings.app_rating,
        design_rating: ratings.design_rating,
        delivery_rating: ratings.delivery_rating,
        comment: comment.trim(),
      });
      onReviewed();
    } catch (requestError: unknown) {
      const detail = isAxiosError<{ detail?: string; comment?: string[] }>(requestError)
        ? requestError.response?.data?.detail || requestError.response?.data?.comment?.[0]
        : undefined;
      setError(detail || 'Failed to submit your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="course-review-modal-overlay" role="dialog" aria-modal="true">
      <div className="course-review-modal">
        <h2 className="course-review-modal__title">{"Rate this course"}</h2>
        <p className="course-review-modal__subtitle">
          {"You finished the course. Please share your feedback to continue."}
        </p>

        {STAR_QUESTIONS.map((question) => (
          <div className="course-review-modal__question" key={question.key}>
            <span className="course-review-modal__label">{question.label}</span>
            <div className="course-review-modal__stars">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  type="button"
                  key={value}
                  className={
                    'course-review-modal__star' +
                    (ratings[question.key] >= value ? ' course-review-modal__star--on' : '')
                  }
                  onClick={() => setRatings((prev) => ({ ...prev, [question.key]: value }))}
                  aria-label={`${question.label} ${value} of 5`}
                >
                  {'★'}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="course-review-modal__question">
          <span className="course-review-modal__label">{"Your comment (English only)"}</span>
          <textarea
            className="course-review-modal__textarea"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={4}
            placeholder={"Write your feedback in English..."}
          />
        </div>

        {error && <p className="course-review-modal__error">{error}</p>}

        <button
          type="button"
          className="course-review-modal__submit"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit review'}
        </button>
      </div>
    </div>
  );
}

export default CourseCompletionReviewModal;
