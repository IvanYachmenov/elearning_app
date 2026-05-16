import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { api } from '../../../shared/api';
import { LoadingIndicator } from '../../../shared/ui';
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
      setError(getTeacherErrorMessage(requestError, "Failed to load course."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (user.role !== 'teacher') {
      navigate('/courses', { replace: true });
      return;
    }

    if (isEditMode && id) {
      void fetchCourse();
    }
  }, [user.role, navigate, isEditMode, id, fetchCourse]);

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
      setError(getTeacherErrorMessage(requestError, "Failed to save course."));
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

  const handleEditTopic = (moduleIndex: number, topicIndex: number) => {
    const moduleItem = courseData.modules[moduleIndex];
    const topic = moduleItem.topics[topicIndex];

    if (moduleItem.id && topic.id) {
      navigate(`/teacher/courses/${id}/modules/${moduleItem.id}/topics/${topic.id}/edit`);
      return;
    }

    setError("Please save the module and topic first.");
  };

  if (user.role !== 'teacher') {
    return null;
  }

  if (loading) {
    return (
      <div className="page page-enter">
        <h1 className="page__title">{isEditMode ? "Edit Course" : "Create Course"}</h1>
        <LoadingIndicator label={"Loading..."} />
      </div>
    );
  }

  return (
    <TeacherEditorPage
      title={isEditMode ? "Edit Course" : "Create Course"}
      backLabel={"Back"}
      onBack={() => navigate('/teacher/courses')}
      backDisabled={saving}
      error={error}
      actions={(
        <>
          <button className="teacher-save-btn" type="button" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
          {isEditMode ? (
            <button className="teacher-delete-btn" type="button" onClick={handleDelete} disabled={saving}>
              {"Delete"}
            </button>
          ) : null}
        </>
      )}
    >
      <TeacherCourseBasicsSection
        courseData={courseData}
        onTitleChange={(value) => updateCourseField('title', value)}
        onDescriptionChange={(value) => updateCourseField('description', value)}
      />

      <TeacherCourseModulesSection
        modules={courseData.modules}
        onAddModule={() => updateModules(addEmptyModule(courseData.modules))}
        onModuleTitleChange={(moduleIndex, value) =>
          updateModules(updateModuleField(courseData.modules, moduleIndex, 'title', value))
        }
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
