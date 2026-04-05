import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { api } from '../../../shared/api';
import { useLanguage } from '../../../shared/lib/i18n/LanguageContext';
import { getTeacherErrorMessage } from '../lib/errors';
import { INITIAL_MODULE_DATA } from '../lib/factories';
import { normalizeModuleForm } from '../lib/normalize';
import { buildModulePayload } from '../lib/payloads';
import type { TeacherModuleFormData, TeacherPageProps, TeacherRouteParams } from '../model/types';
import TeacherEditorPage from './components/TeacherEditorPage';
import TeacherModuleTopicsSection from './components/TeacherModuleTopicsSection';
import '../styles/teacher.css';

function TeacherModuleEditPage({ user }: TeacherPageProps) {
  const { courseId, moduleId } = useParams<TeacherRouteParams>();
  const isEditMode = Boolean(moduleId);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moduleData, setModuleData] = useState<TeacherModuleFormData>(INITIAL_MODULE_DATA);

  const fetchModule = useCallback(async () => {
    if (!moduleId) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/teacher/modules/${moduleId}/`);
      setModuleData(normalizeModuleForm(response.data));
    } catch (requestError) {
      setError(getTeacherErrorMessage(requestError, t('pages.teacher.failedToLoadModule')));
    } finally {
      setLoading(false);
    }
  }, [moduleId, t]);

  useEffect(() => {
    if (user.role !== 'teacher') {
      navigate('/home', { replace: true });
      return;
    }

    if (isEditMode && moduleId) {
      void fetchModule();
      return;
    }

    if (!courseId) {
      return;
    }

    void api
      .get(`/api/teacher/courses/${courseId}/`)
      .then((response) => {
        const maxOrder = Array.isArray(response.data.modules) && response.data.modules.length > 0
          ? Math.max(
              ...response.data.modules.map((moduleItem: { order?: number }) =>
                typeof moduleItem.order === 'number' ? moduleItem.order : 0,
              ),
            )
          : -1;
        setModuleData((previous) => ({ ...previous, order: maxOrder + 1 }));
      })
      .catch((requestError) => {
        console.error('Failed to fetch course:', requestError);
      });
  }, [user.role, navigate, isEditMode, moduleId, courseId, fetchModule]);

  const handleSave = async () => {
    if (!moduleData.title.trim()) {
      setError('Module title is required');
      return;
    }

    if (!courseId) {
      setError(t('pages.teacher.failedToSaveModule'));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = buildModulePayload(moduleData, Number(courseId));
      if (isEditMode && moduleId) {
        await api.put(`/api/teacher/modules/${moduleId}/`, payload);
        navigate(`/teacher/courses/${courseId}/edit`);
      } else {
        const response = await api.post('/api/teacher/modules/', payload);
        navigate(`/teacher/courses/${courseId}/modules/${response.data.id}/edit`);
      }
    } catch (requestError) {
      console.error('Save error:', requestError);
      setError(getTeacherErrorMessage(requestError, t('pages.teacher.failedToSaveModule')));
    } finally {
      setSaving(false);
    }
  };

  const handleAddTopic = () => {
    if (moduleId && moduleId !== 'new') {
      navigate(`/teacher/courses/${courseId}/modules/${moduleId}/topics/new`);
      return;
    }

    setError('Please save the module first before adding topics.');
  };

  const handleEditTopic = (topicIndex: number) => {
    const topic = moduleData.topics[topicIndex];

    if (moduleId && moduleId !== 'new' && topic.id) {
      navigate(`/teacher/courses/${courseId}/modules/${moduleId}/topics/${topic.id}/edit`);
      return;
    }

    setError(t('pages.teacher.saveModuleAndTopicFirst'));
  };

  const handleDeleteTopic = async (topicIndex: number) => {
    const topic = moduleData.topics[topicIndex];
    if (!topic.id) {
      setModuleData((previous) => ({ ...previous, topics: previous.topics.filter((_, index) => index !== topicIndex) }));
      return;
    }

    if (!window.confirm(t('pages.teacher.deleteTopicConfirm'))) {
      return;
    }

    try {
      await api.delete(`/api/teacher/topics/${topic.id}/`);
      setModuleData((previous) => ({ ...previous, topics: previous.topics.filter((_, index) => index !== topicIndex) }));
    } catch (requestError) {
      setError(getTeacherErrorMessage(requestError, t('pages.teacher.failedToDeleteTopic')));
    }
  };

  if (user.role !== 'teacher') {
    return null;
  }

  if (loading) {
    return (
      <div className="page page-enter">
        <h1 className="page__title">{isEditMode ? t('pages.teacher.editModule') : t('pages.teacher.createModule')}</h1>
        <p>{t('pages.teacher.loadingGeneric')}</p>
      </div>
    );
  }

  return (
    <TeacherEditorPage
      title={isEditMode ? t('pages.teacher.editModule') : t('pages.teacher.createModule')}
      backLabel={t('pages.teacher.back')}
      onBack={() => navigate(`/teacher/courses/${courseId}/edit`)}
      backDisabled={saving}
      error={error}
      actions={(
        <button className="teacher-save-btn" type="button" onClick={handleSave} disabled={saving}>
          {saving ? t('pages.teacher.saving') : t('pages.teacher.save')}
        </button>
      )}
    >
      <div className="teacher-form-group">
        <label className="teacher-form-label">
          {t('pages.teacher.moduleTitle')} <span style={{ color: 'red' }}>*</span>
        </label>
        <input
          type="text"
          className="teacher-form-input"
          value={moduleData.title}
          onChange={(event) => setModuleData((previous) => ({ ...previous, title: event.target.value }))}
          placeholder={t('pages.teacher.enterModuleTitle')}
          required
        />
      </div>

      <TeacherModuleTopicsSection
        topics={moduleData.topics}
        canAddTopic={Boolean(moduleId && moduleId !== 'new')}
        onAddTopic={handleAddTopic}
        onEditTopic={handleEditTopic}
        onDeleteTopic={handleDeleteTopic}
      />
    </TeacherEditorPage>
  );
}

export default TeacherModuleEditPage;
