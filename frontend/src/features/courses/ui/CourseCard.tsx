import { Link } from 'react-router-dom';

import type { CourseListItem } from '../../../shared/types';

interface CourseCardAuthor {
  username?: string | null;
  email?: string | null;
}

interface CourseCardData extends CourseListItem {
  author?: CourseCardAuthor | null;
}

interface CourseCardProps {
  course: CourseCardData;
}

const MAX_RATING = 5;
const FILLED_STAR = '\u2605';
const EMPTY_STAR = '\u2606';

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

function CourseCard({ course }: CourseCardProps) {
  const description = course.description || '';
  const shortDescription = description.length > 160 ? `${description.slice(0, 160).trimEnd()}...` : description;
  const authorName = course.author_name || course.author?.username || course.author?.email || null;
  const hasRating = typeof course.average_rating === 'number' && course.reviews_count > 0;
  const ratingText = hasRating ? course.average_rating?.toFixed(1) : '';

  return (
    <article className="course-card">
      <div className="course-card__content">
        <h3 className="course-card__title">{course.title}</h3>

        {authorName && <p className="course-card__author">by {authorName}</p>}

        {hasRating && (
          <div className="course-rating course-rating--card" aria-label={ratingText}>
            <RatingStars rating={course.average_rating} />
            <span className="course-rating__text">{ratingText}</span>
          </div>
        )}

        {shortDescription && <p className="course-card__description">{shortDescription}</p>}

        <div className="course-card__footer">
          <Link to={`/courses/${course.id}`} className="btn-primary">
            {"View details"}
          </Link>
        </div>
      </div>
    </article>
  );
}

export default CourseCard;
