import { useEffect, useState } from 'react';

import { useLanguage } from '../../../../shared/lib/i18n/LanguageContext';
import type { TeacherCourseFormData } from '../../model/types';

interface TeacherCourseBasicsSectionProps {
  courseData: TeacherCourseFormData;
  imagePreviewUrl: string | null;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onProgrammingLanguagesChange: (value: string[]) => void;
  onFrameworksChange: (value: string[]) => void;
  onImageChange: (file: File | null) => void;
}

function tagsToInputValue(tags: string[]): string {
  return tags.join(', ');
}

function inputValueToTags(value: string): string[] {
  const seenTags = new Set<string>();

  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => {
      const key = item.toLowerCase();
      if (!item || seenTags.has(key)) {
        return false;
      }

      seenTags.add(key);
      return true;
    });
}

function haveSameTags(firstTags: string[], secondTags: string[]): boolean {
  if (firstTags.length !== secondTags.length) {
    return false;
  }

  return firstTags.every((tag, index) => tag === secondTags[index]);
}

function TeacherCourseBasicsSection({
  courseData,
  imagePreviewUrl,
  onTitleChange,
  onDescriptionChange,
  onProgrammingLanguagesChange,
  onFrameworksChange,
  onImageChange,
}: TeacherCourseBasicsSectionProps) {
  const { t } = useLanguage();
  const [programmingLanguagesInput, setProgrammingLanguagesInput] = useState(() =>
    tagsToInputValue(courseData.programming_languages),
  );
  const [frameworksInput, setFrameworksInput] = useState(() => tagsToInputValue(courseData.frameworks));

  useEffect(() => {
    if (!haveSameTags(inputValueToTags(programmingLanguagesInput), courseData.programming_languages)) {
      setProgrammingLanguagesInput(tagsToInputValue(courseData.programming_languages));
    }
  }, [courseData.programming_languages, programmingLanguagesInput]);

  useEffect(() => {
    if (!haveSameTags(inputValueToTags(frameworksInput), courseData.frameworks)) {
      setFrameworksInput(tagsToInputValue(courseData.frameworks));
    }
  }, [courseData.frameworks, frameworksInput]);

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

      <div className="teacher-form-grid">
        <div className="teacher-form-group">
          <label className="teacher-form-label">{t('pages.teacher.programmingLanguages')}</label>
          <input
            type="text"
            className="teacher-form-input"
            value={programmingLanguagesInput}
            onChange={(event) => {
              setProgrammingLanguagesInput(event.target.value);
              onProgrammingLanguagesChange(inputValueToTags(event.target.value));
            }}
            onBlur={() => onProgrammingLanguagesChange(inputValueToTags(programmingLanguagesInput))}
            placeholder={t('pages.teacher.programmingLanguagesPlaceholder')}
          />
        </div>

        <div className="teacher-form-group">
          <label className="teacher-form-label">{t('pages.teacher.frameworks')}</label>
          <input
            type="text"
            className="teacher-form-input"
            value={frameworksInput}
            onChange={(event) => {
              setFrameworksInput(event.target.value);
              onFrameworksChange(inputValueToTags(event.target.value));
            }}
            onBlur={() => onFrameworksChange(inputValueToTags(frameworksInput))}
            placeholder={t('pages.teacher.frameworksPlaceholder')}
          />
        </div>
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
