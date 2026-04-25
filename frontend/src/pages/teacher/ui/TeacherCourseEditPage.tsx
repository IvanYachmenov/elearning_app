import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { api } from '../../../shared/api';
import { useLanguage } from '../../../shared/lib/i18n/LanguageContext';
import {
  addEmptyModule,
  addEmptyTopicToModule,
  removeModule,
  removeTopicFromModule,
  updateModuleField,
  updateTopicFieldInModule,
} from '../lib/course-form';
import { getTeacherErrorMessage } from '../lib/errors';
import { INITIAL_COURSE_DATA } from '../lib/factories';
import { normalizeCourse } from '../lib/normalize';
import { buildCourseFormData } from '../lib/payloads';
import type { TeacherCourseFormData, TeacherPageProps, TeacherRouteParams } from '../model/types';
import TeacherCourseBasicsSection from './components/TeacherCourseBasicsSection';
import TeacherCourseModulesSection from './components/TeacherCourseModulesSection';
import TeacherEditorPage from './components/TeacherEditorPage';
import '../styles/teacher.css';

function TeacherCourseEditPage({ user }: TeacherPageProps) {
  const { id } = useParams<TeacherRouteParams>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courseData, setCourseData] = useState<TeacherCourseFormData>(INITIAL_COURSE_DATA);

  const fetchCourse = useCallback(async () => {
    if (!id) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/teacher/courses/${id}/`);
      setCourseData(normalizeCourse(response.data));
    } catch (requestError) {
      setError(getTeacherErrorMessage(requestError, t('pages.teacher.failedToLoadCourse')));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    if (user.role !== 'teacher') {
      navigate('/home', { replace: true });
      return;
    }

    if (isEditMode && id) {
      void fetchCourse();
    }
  }, [user.role, navigate, isEditMode, id, fetchCourse]);

  const imagePreviewUrl = useMemo(() => {
    if (courseData.image instanceof File) {
      return URL.createObjectURL(courseData.image);
    }

    return courseData.image_url;
  }, [courseData.image, courseData.image_url]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl && courseData.image instanceof File) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl, courseData.image]);

  const updateCourseField = <K extends keyof TeacherCourseFormData>(field: K, value: TeacherCourseFormData[K]) => {
    setCourseData((previous) => ({ ...previous, [field]: value }));
  };

  const updateModules = (nextModules: TeacherCourseFormData['modules']) => {
    updateCourseField('modules', nextModules);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const dataToSend = buildCourseFormData(courseData);
      if (isEditMode && id) {
        await api.put(`/api/teacher/courses/${id}/`, dataToSend);
        await fetchCourse();
      } else {
        const response = await api.post('/api/teacher/courses/', dataToSend);
        navigate(`/teacher/courses/${response.data.id}/edit`);
        return;
      }
    } catch (requestError) {
      console.error('Save error:', requestError);
      setError(getTeacherErrorMessage(requestError, t('pages.teacher.failedToSaveCourse')));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) {
      return;
    }

    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    setSaving(true);
    try {
      await api.delete(`/api/teacher/courses/${id}/`);
      navigate('/teacher/courses');
    } catch (requestError) {
      setError(getTeacherErrorMessage(requestError, 'Failed to delete course.'));
    } finally {
      setSaving(false);
    }
  };

  const handleEditModule = (moduleIndex: number) => {
    const moduleItem = courseData.modules[moduleIndex];
    if (moduleItem.id) {
      navigate(`/teacher/courses/${id}/modules/${moduleItem.id}/edit`);
      return;
    }

    setError(t('pages.teacher.saveCourseFirst'));
  };

  const handleEditTopic = (moduleIndex: number, topicIndex: number) => {
    const moduleItem = courseData.modules[moduleIndex];
    const topic = moduleItem.topics[topicIndex];

    if (moduleItem.id && topic.id) {
      navigate(`/teacher/courses/${id}/modules/${moduleItem.id}/topics/${topic.id}/edit`);
      return;
    }

    setError(t('pages.teacher.saveModuleAndTopicFirst'));
  };

  if (user.role !== 'teacher') {
    return null;
  }

  if (loading) {
    return (
      <div className="page page-enter">
        <h1 className="page__title">{isEditMode ? t('pages.teacher.editCourse') : t('pages.teacher.createCourseTitle')}</h1>
        <p>{t('pages.teacher.loadingGeneric')}</p>
      </div>
    );
  }

  return (
    <TeacherEditorPage
      title={isEditMode ? t('pages.teacher.editCourse') : t('pages.teacher.createCourseTitle')}
      backLabel={t('pages.teacher.back')}
      onBack={() => navigate('/teacher/courses')}
      backDisabled={saving}
      error={error}
      actions={(
        <>
          <button className="teacher-save-btn" type="button" onClick={handleSave} disabled={saving}>
            {saving ? t('pages.teacher.saving') : t('pages.teacher.save')}
          </button>
          {isEditMode ? (
            <button className="teacher-delete-btn" type="button" onClick={handleDelete} disabled={saving}>
              {t('pages.teacher.delete')}
            </button>
          ) : null}
        </>
      )}
    >
      <TeacherCourseBasicsSection
        courseData={courseData}
        imagePreviewUrl={imagePreviewUrl}
        onTitleChange={(value) => updateCourseField('title', value)}
        onDescriptionChange={(value) => updateCourseField('description', value)}
        onProgrammingLanguagesChange={(value) => updateCourseField('programming_languages', value)}
        onFrameworksChange={(value) => updateCourseField('frameworks', value)}
        onImageChange={(file) => updateCourseField('image', file)}
      />

      <TeacherCourseModulesSection
        modules={courseData.modules}
        onAddModule={() => updateModules(addEmptyModule(courseData.modules))}
        onModuleTitleChange={(moduleIndex, value) =>
          updateModules(updateModuleField(courseData.modules, moduleIndex, 'title', value))
        }
        onEditModule={handleEditModule}
        onDeleteModule={(moduleIndex) => updateModules(removeModule(courseData.modules, moduleIndex))}
        onAddTopic={(moduleIndex) => updateModules(addEmptyTopicToModule(courseData.modules, moduleIndex))}
        onTopicTitleChange={(moduleIndex, topicIndex, value) =>
          updateModules(updateTopicFieldInModule(courseData.modules, moduleIndex, topicIndex, 'title', value))
        }
        onEditTopic={handleEditTopic}
        onDeleteTopic={(moduleIndex, topicIndex) =>
          updateModules(removeTopicFromModule(courseData.modules, moduleIndex, topicIndex))
        }
      />
    </TeacherEditorPage>
  );
}

export default TeacherCourseEditPage;
