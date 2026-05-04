import { useLayoutEffect, useRef } from 'react';

import { useLanguage } from '../../../../shared/lib/i18n/LanguageContext';
import type { TeacherTimeParts, TeacherTopicFormData } from '../../model/types';

interface TeacherTopicDetailsSectionProps {
  topicData: TeacherTopicFormData;
  timeParts: TeacherTimeParts;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onToggleTimedTest: (checked: boolean) => void;
  onTimeChange: (field: 'minutes' | 'seconds', value: string) => void;
}

function TeacherTopicDetailsSection({
  topicData,
  timeParts,
  onTitleChange,
  onContentChange,
  onToggleTimedTest,
  onTimeChange,
}: TeacherTopicDetailsSectionProps) {
  const { t } = useLanguage();
  const theoryTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const syncTheoryTextareaHeight = (preservePageScroll = true) => {
    const textarea = theoryTextareaRef.current;

    if (!textarea) {
      return;
    }

    const pageScrollX = window.scrollX;
    const pageScrollY = window.scrollY;

    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;

    if (preservePageScroll && document.activeElement === textarea) {
      window.scrollTo(pageScrollX, pageScrollY);

      window.requestAnimationFrame(() => {
        window.scrollTo(pageScrollX, pageScrollY);
      });
    }
  };

  useLayoutEffect(() => {
    syncTheoryTextareaHeight();
  }, [topicData.content]);

  return (
    <>
      <div className="teacher-form-group">
        <label className="teacher-form-label">
          {t('pages.teacher.topicTitle')} <span style={{ color: 'red' }}>*</span>
        </label>
        <input
          type="text"
          className="teacher-form-input"
          value={topicData.title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder={t('pages.teacher.enterTopicTitle')}
          required
        />
      </div>

      <div className="teacher-form-group">
        <label className="teacher-form-label">{t('pages.teacher.theoryText')}</label>
        <textarea
          ref={theoryTextareaRef}
          className="teacher-form-textarea teacher-form-textarea--autogrow teacher-form-textarea--theory"
          value={topicData.content}
          onChange={(event) => onContentChange(event.target.value)}
          placeholder={t('pages.teacher.enterTheoryContent')}
          rows={8}
        />
      </div>

      <div className="teacher-form-group">
        <label className="teacher-form-checkbox-label">
          <input
            type="checkbox"
            checked={topicData.is_timed_test}
            onChange={(event) => onToggleTimedTest(event.target.checked)}
          />
          {t('pages.teacher.timedTest')}
        </label>
      </div>

      {topicData.is_timed_test ? (
        <div className="teacher-form-group">
          <label className="teacher-form-label">{t('pages.teacher.timeLimit')}</label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <label style={{ fontSize: '12px', color: '#666' }}>Minutes</label>
              <input
                type="number"
                className="teacher-form-input"
                value={timeParts.minutes}
                onChange={(event) => onTimeChange('minutes', event.target.value)}
                style={{ width: '80px', textAlign: 'center', padding: '8px 4px' }}
                min="0"
                max="29"
              />
            </div>
            <span style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '20px' }}>:</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <label style={{ fontSize: '12px', color: '#666' }}>Seconds</label>
              <input
                type="number"
                className="teacher-form-input"
                value={timeParts.seconds}
                onChange={(event) => onTimeChange('seconds', event.target.value)}
                style={{ width: '80px', textAlign: 'center', padding: '8px 4px' }}
                min="0"
                max="59"
              />
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '20px' }}>(30s - 30min)</div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default TeacherTopicDetailsSection;
