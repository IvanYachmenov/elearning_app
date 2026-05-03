import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { api } from '../../../shared/api';
import { useLanguage } from '../../../shared/lib/i18n/LanguageContext';
import { LoadingIndicator } from '../../../shared/ui';
import { getTeacherErrorMessage } from '../lib/errors';
import { INITIAL_TOPIC_DATA } from '../lib/factories';
import { normalizeTopicForm } from '../lib/normalize';
import { buildTopicPayload } from '../lib/payloads';
import {
  addEmptyOptionToQuestion,
  addEmptyQuestion,
  removeOption,
  removeQuestion,
  secondsToTimeParts,
  setOptionCorrectState,
  timePartsToSeconds,
  updateOptionField,
  updateQuestionField,
} from '../lib/topic-form';
import type { TeacherPageProps, TeacherRouteParams, TeacherTopicFormData } from '../model/types';
import TeacherEditorPage from './components/TeacherEditorPage';
import TeacherTopicDetailsSection from './components/TeacherTopicDetailsSection';
import TeacherTopicQuestionsSection from './components/TeacherTopicQuestionsSection';
import '../styles/teacher.css';

function TeacherTopicEditPage({ user }: TeacherPageProps) {
  const { courseId, moduleId, topicId } = useParams<TeacherRouteParams>();
  const isEditMode = Boolean(topicId);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topicData, setTopicData] = useState<TeacherTopicFormData>(INITIAL_TOPIC_DATA);

  const fetchTopic = useCallback(async () => {
    if (!topicId) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/teacher/topics/${topicId}/`);
      setTopicData(normalizeTopicForm(response.data));
    } catch (requestError) {
      setError(getTeacherErrorMessage(requestError, t('pages.teacher.failedToLoadTopic')));
    } finally {
      setLoading(false);
    }
  }, [topicId, t]);

  useEffect(() => {
    if (user.role !== 'teacher') {
      navigate('/courses', { replace: true });
      return;
    }

    if (isEditMode && topicId) {
      void fetchTopic();
      return;
    }

    if (!moduleId) {
      return;
    }

    void api
      .get(`/api/teacher/modules/${moduleId}/`)
      .then((response) => {
        const maxOrder = Array.isArray(response.data.topics) && response.data.topics.length > 0
          ? Math.max(
              ...response.data.topics.map((topic: { order?: number }) =>
                typeof topic.order === 'number' ? topic.order : -1,
              ),
            )
          : -1;

        setTopicData((previous) => ({ ...previous, order: maxOrder + 1 }));
      })
      .catch((requestError) => {
        console.error('Failed to fetch module:', requestError);
      });
  }, [user.role, navigate, isEditMode, topicId, moduleId, fetchTopic]);

  const timeParts = useMemo(() => secondsToTimeParts(topicData.time_limit_seconds), [topicData.time_limit_seconds]);

  const updateTopicField = <K extends keyof TeacherTopicFormData>(field: K, value: TeacherTopicFormData[K]) => {
    setTopicData((previous) => ({ ...previous, [field]: value }));
  };

  const updateQuestions = (updater: (questions: TeacherTopicFormData['questions']) => TeacherTopicFormData['questions']) => {
    setTopicData((previous) => ({ ...previous, questions: updater(previous.questions) }));
  };

  const handleSave = async () => {
    if (!topicData.title.trim()) {
      setError('Topic title is required');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = buildTopicPayload(topicData, !isEditMode && moduleId ? Number(moduleId) : undefined);
      if (isEditMode && topicId) {
        await api.put(`/api/teacher/topics/${topicId}/`, payload);
      } else {
        await api.post('/api/teacher/topics/', payload);
      }
      navigate(`/teacher/courses/${courseId}/edit`);
    } catch (requestError) {
      console.error('Save error:', requestError);
      setError(getTeacherErrorMessage(requestError, t('pages.teacher.failedToSaveTopic')));
    } finally {
      setSaving(false);
    }
  };

  if (user.role !== 'teacher') {
    return null;
  }

  if (loading) {
    return (
      <div className="page page-enter">
        <h1 className="page__title">{isEditMode ? t('pages.teacher.editTopic') : t('pages.teacher.createTopic')}</h1>
        <LoadingIndicator label={t('common.loading')} />
      </div>
    );
  }

  return (
    <TeacherEditorPage
      title={isEditMode ? t('pages.teacher.editTopic') : t('pages.teacher.createTopic')}
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
      <TeacherTopicDetailsSection
        topicData={topicData}
        timeParts={timeParts}
        onTitleChange={(value) => updateTopicField('title', value)}
        onContentChange={(value) => updateTopicField('content', value)}
        onToggleTimedTest={(checked) =>
          setTopicData((previous) => ({
            ...previous,
            is_timed_test: checked,
            time_limit_seconds: checked && !previous.time_limit_seconds ? 30 : previous.time_limit_seconds,
          }))
        }
        onTimeChange={(field, value) => {
          const nextMinutes = field === 'minutes'
            ? Math.max(0, Math.min(29, Number(value) || 0))
            : timeParts.minutes;
          const nextSeconds = field === 'seconds'
            ? Math.max(0, Math.min(59, Number(value) || 0))
            : timeParts.seconds;

          updateTopicField('time_limit_seconds', timePartsToSeconds(nextMinutes, nextSeconds));
        }}
      />

      <TeacherTopicQuestionsSection
        questions={topicData.questions}
        onAddQuestion={() => updateQuestions(addEmptyQuestion)}
        onDeleteQuestion={(questionIndex) => updateQuestions((questions) => removeQuestion(questions, questionIndex))}
        onQuestionTextChange={(questionIndex, value) =>
          updateQuestions((questions) => updateQuestionField(questions, questionIndex, 'text', value))
        }
        onQuestionTypeChange={(questionIndex, value) =>
          updateQuestions((questions) => updateQuestionField(questions, questionIndex, 'question_type', value))
        }
        onQuestionScoreChange={(questionIndex, value) =>
          updateQuestions((questions) => updateQuestionField(questions, questionIndex, 'max_score', value))
        }
        onAddOption={(questionIndex) =>
          updateQuestions((questions) => addEmptyOptionToQuestion(questions, questionIndex))
        }
        onOptionTextChange={(questionIndex, optionIndex, value) =>
          updateQuestions((questions) => updateOptionField(questions, questionIndex, optionIndex, 'text', value))
        }
        onOptionCorrectChange={(questionIndex, optionIndex, checked) =>
          updateQuestions((questions) => setOptionCorrectState(questions, questionIndex, optionIndex, checked))
        }
        onDeleteOption={(questionIndex, optionIndex) =>
          updateQuestions((questions) => removeOption(questions, questionIndex, optionIndex))
        }
      />
    </TeacherEditorPage>
  );
}

export default TeacherTopicEditPage;
