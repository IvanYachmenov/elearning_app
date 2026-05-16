import type { TeacherCourseFormData } from '../../model/types';

interface TeacherCourseBasicsSectionProps {
  courseData: TeacherCourseFormData;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

function TeacherCourseBasicsSection({
  courseData,
  onTitleChange,
  onDescriptionChange,
}: TeacherCourseBasicsSectionProps) {
  return (
    <>
      <div className="teacher-form-group">
        <label className="teacher-form-label">{"Course Title"}</label>
        <input
          type="text"
          className="teacher-form-input"
          value={courseData.title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder={"Course Title"}
        />
      </div>

      <div className="teacher-form-group">
        <label className="teacher-form-label">{"Description"}</label>
        <textarea
          className="teacher-form-textarea"
          value={courseData.description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder={"Description"}
          rows={8}
        />
      </div>
    </>
  );
}

export default TeacherCourseBasicsSection;
