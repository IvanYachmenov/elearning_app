import type { CourseListItem } from '../../../shared/types';
import './CourseCardSimple.css';

interface CourseCardSimpleProps {
  course: Pick<CourseListItem, 'title' | 'image_url'>;
}

function CourseCardSimple({ course }: CourseCardSimpleProps) {
  const title = course.title || '';
  const placeholderText = title.trim() ? title.trim().slice(0, 2).toUpperCase() : 'NA';

  return (
    <div className="course-card-simple">
      <div className="course-card-simple__image">
        {course.image_url ? (
          <img src={course.image_url} alt={course.title} />
        ) : (
          <div className="course-card-simple__image-placeholder">
            <span className="course-card-simple__image-placeholder-text">{placeholderText}</span>
          </div>
        )}
      </div>
      <h3 className="course-card-simple__title">{course.title}</h3>
    </div>
  );
}

export default CourseCardSimple;
