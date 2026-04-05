import type { CSSProperties, Ref } from 'react';

import type { TeacherCourseListItem } from '../../model/types';

const CARD_HEIGHT = 300;
const IMAGE_HEIGHT = 160;

interface TeacherCourseGridProps {
  courses: TeacherCourseListItem[];
  openDropdownId: number | null;
  activeCardRef: Ref<HTMLDivElement>;
  onOpenCourse: (courseId: number) => void;
}

function TeacherCourseGrid({ courses, openDropdownId, activeCardRef, onOpenCourse }: TeacherCourseGridProps) {
  return (
    <div className="teacher-courses-grid-wrapper">
      <div className="teacher-courses-grid">
        {courses.map((course) => {
          const isOpen = openDropdownId === course.id;
          const topicsCount = course.modules.reduce((sum, moduleItem) => sum + moduleItem.topics.length, 0);
          const cardStyle: CSSProperties = {
            ['--teacher-card-height' as string]: `${CARD_HEIGHT}px`,
            ['--teacher-image-height' as string]: `${IMAGE_HEIGHT}px`,
          };

          return (
            <div
              key={course.id}
              ref={isOpen ? activeCardRef : null}
              className="teacher-course-card teacher-course-card--clickable"
              style={cardStyle}
              role="button"
              tabIndex={0}
              onClick={() => onOpenCourse(course.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onOpenCourse(course.id);
                }
              }}
            >
              <div className="teacher-course-card__image-wrap">
                {course.image_url ? (
                  <img src={course.image_url} alt="" className="teacher-course-card__image" />
                ) : null}
              </div>
              <div className="teacher-course-card__body">
                <h3 className="teacher-course-card__title">{course.title}</h3>
                <div className="teacher-course-card__meta">
                  <span>Modules: {course.modules.length}</span>
                  <span>|</span>
                  <span>Topics: {topicsCount}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TeacherCourseGrid;
