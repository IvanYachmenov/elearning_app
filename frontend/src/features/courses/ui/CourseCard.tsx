import { Link } from 'react-router-dom';

import { useLanguage } from '../../../shared/lib/i18n/LanguageContext';
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

function CourseCard({ course }: CourseCardProps) {
  const { t } = useLanguage();
  const description = course.description || '';
  const shortDescription = description.length > 160 ? `${description.slice(0, 160).trimEnd()}...` : description;
  const authorName = course.author_name || course.author?.username || course.author?.email || null;
  const hasRating = typeof course.average_rating === 'number' && course.reviews_count > 0;
  const ratingText = hasRating
    ? `${course.average_rating?.toFixed(1)} / 5 (${course.reviews_count})`
    : t('pages.courses.noReviews');
  const roundedRating = hasRating ? Math.round(course.average_rating || 0) : 0;

  return (
    <article className="course-card">
      <div className="course-card__image">
        {course.image_url ? (
          <img src={course.image_url} alt={course.title} />
        ) : (
          <div className="course-card__image-placeholder">C</div>
        )}
      </div>
      <div className="course-card__content">
        <h3 className="course-card__title">{course.title}</h3>

        {authorName && <p className="course-card__author">by {authorName}</p>}

        <div className="course-rating course-rating--card" aria-label={ratingText}>
          <span className="course-rating__stars" aria-hidden="true">
            {'★'.repeat(roundedRating)}
            {'☆'.repeat(MAX_RATING - roundedRating)}
          </span>
          <span className="course-rating__text">{ratingText}</span>
        </div>

        {shortDescription && <p className="course-card__description">{shortDescription}</p>}

        <div className="course-card__footer">
          <Link to={`/courses/${course.id}`} className="btn-primary">
            {t('pages.courses.viewDetails')}
          </Link>
        </div>
      </div>
    </article>
  );
}

export default CourseCard;
