import type { TeacherCourseListItem } from '../../model/types';

interface TeacherCourseGridProps {
  courses: TeacherCourseListItem[];
  onEdit: (courseId: number) => void;
  onRequestDelete: (courseId: number) => void;
}

function TeacherCourseGrid({ courses, onEdit, onRequestDelete }: TeacherCourseGridProps) {
  return (
    <div className="teacher-courses-grid-wrapper">
      <div className="teacher-courses-grid">
        {courses.map((course) => {
          const topicsCount = course.modules.reduce(
            (sum, moduleItem) => sum + moduleItem.topics.length,
            0,
          );

          return (
            <div key={course.id} className="teacher-course-card">
              <div className="teacher-course-card__body">
                <h3 className="teacher-course-card__title">{course.title}</h3>
                <div className="teacher-course-card__meta">
                  <span>Modules: {course.modules.length}</span>
                  <span>|</span>
                  <span>Topics: {topicsCount}</span>
                </div>
              </div>

              <div className="teacher-course-card__actions">
                <button
                  type="button"
                  className="teacher-card-btn teacher-card-btn--edit"
                  onClick={() => onEdit(course.id)}
                >
                  {"Edit"}
                </button>
                <button
                  type="button"
                  className="teacher-card-btn teacher-card-btn--delete"
                  onClick={() => onRequestDelete(course.id)}
                >
                  {"Delete"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TeacherCourseGrid;
