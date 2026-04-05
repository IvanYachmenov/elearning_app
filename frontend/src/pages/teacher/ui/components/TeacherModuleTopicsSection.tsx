import { useLanguage } from '../../../../shared/lib/i18n/LanguageContext';
import type { TeacherEditableTopic } from '../../model/types';

interface TeacherModuleTopicsSectionProps {
  topics: TeacherEditableTopic[];
  canAddTopic: boolean;
  onAddTopic: () => void;
  onEditTopic: (topicIndex: number) => void;
  onDeleteTopic: (topicIndex: number) => void;
}

function TeacherModuleTopicsSection({
  topics,
  canAddTopic,
  onAddTopic,
  onEditTopic,
  onDeleteTopic,
}: TeacherModuleTopicsSectionProps) {
  const { t } = useLanguage();

  return (
    <div className="teacher-topics-section">
      <div className="teacher-topics-header">
        <h4 className="teacher-topics-title">{t('pages.teacher.topics')}</h4>
        <button
          className="teacher-add-topic-btn"
          type="button"
          onClick={onAddTopic}
          disabled={!canAddTopic}
          title={!canAddTopic ? t('pages.teacher.saveModuleFirst') : ''}
        >
          + {t('pages.teacher.addTopic')}
        </button>
      </div>

      {topics.length > 0 ? (
        <div className="teacher-topics-list">
          {topics.map((topic, topicIndex) => (
            <div key={topic.id || topicIndex} className="teacher-topic-item">
              <div className="teacher-topic-header">
                <h5 className="teacher-topic-title">{topic.title || `Topic ${topicIndex + 1}`}</h5>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="teacher-topic-edit-btn"
                    type="button"
                    onClick={() => onEditTopic(topicIndex)}
                    disabled={!canAddTopic || !topic.id}
                    title={!canAddTopic || !topic.id ? t('pages.teacher.saveModuleFirst') : ''}
                  >
                    {t('pages.teacher.edit')}
                  </button>
                  <button className="teacher-topic-delete-btn" type="button" onClick={() => onDeleteTopic(topicIndex)}>
                    {t('pages.teacher.delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="teacher-empty-text">{t('pages.teacher.noTopicsYet')}</p>
      )}
    </div>
  );
}

export default TeacherModuleTopicsSection;
