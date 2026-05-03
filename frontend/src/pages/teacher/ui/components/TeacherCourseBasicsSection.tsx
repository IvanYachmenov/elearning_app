import { useLanguage } from '../../../../shared/lib/i18n/LanguageContext';
import type { TeacherCourseFormData } from '../../model/types';

interface TeacherCourseBasicsSectionProps {
  courseData: TeacherCourseFormData;
  imagePreviewUrl: string | null;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onImageChange: (file: File | null) => void;
}

function TeacherCourseBasicsSection({
  courseData,
  imagePreviewUrl,
  onTitleChange,
  onDescriptionChange,
  onImageChange,
}: TeacherCourseBasicsSectionProps) {
  const { t } = useLanguage();

  return (
    <>
      <div className="teacher-form-group">
        <label className="teacher-form-label">{t('pages.teacher.courseTitle')}</label>
        <input
          type="text"
          className="teacher-form-input"
          value={courseData.title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder={t('pages.teacher.courseTitle')}
        />
      </div>

      <div className="teacher-form-group">
        <label className="teacher-form-label">{t('pages.teacher.description')}</label>
        <textarea
          className="teacher-form-textarea"
          value={courseData.description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder={t('pages.teacher.description')}
          rows={8}
        />
      </div>

      <div className="teacher-form-group">
        <label className="teacher-form-label">{t('pages.teacher.courseImage')}</label>
        <div className="teacher-file-input-wrapper">
          <input
            type="file"
            accept="image/*"
            id="course-image-input"
            className="teacher-file-input"
            onChange={(event) => onImageChange(event.target.files?.[0] || null)}
          />
          <label htmlFor="course-image-input" className="teacher-file-input-label">
            {courseData.image instanceof File ? courseData.image.name : t('pages.teacher.chooseFile')}
          </label>
        </div>

        {imagePreviewUrl ? (
          <div style={{ marginTop: '8px' }}>
            <img
              src={imagePreviewUrl}
              alt="Course preview"
              style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover', border: '1px solid #ccc' }}
            />
          </div>
        ) : null}
      </div>
    </>
  );
}

export default TeacherCourseBasicsSection;
