import type { TeacherEditableModule } from '../../model/types';

interface TeacherCourseModuleCardProps {
  moduleItem: TeacherEditableModule;
  moduleIndex: number;
  onModuleTitleChange: (moduleIndex: number, value: string) => void;
  onDeleteModule: (moduleIndex: number) => void;
  onAddTopic: (moduleIndex: number) => void;
  onTopicTitleChange: (moduleIndex: number, topicIndex: number, value: string) => void;
  onEditTopic: (moduleIndex: number, topicIndex: number) => void;
  onDeleteTopic: (moduleIndex: number, topicIndex: number) => void;
}

function TeacherCourseModuleCard({
  moduleItem,
  moduleIndex,
  onModuleTitleChange,
  onDeleteModule,
  onAddTopic,
  onTopicTitleChange,
  onEditTopic,
  onDeleteTopic,
}: TeacherCourseModuleCardProps) {

  return (
    <div className="teacher-module-item">
      <div className="teacher-module-header">
        <input
          type="text"
          className="teacher-form-input teacher-module-title-input"
          value={moduleItem.title}
          onChange={(event) => onModuleTitleChange(moduleIndex, event.target.value)}
          placeholder={`Module ${moduleIndex + 1}`}
        />
        <button className="teacher-module-delete-btn" type="button" onClick={() => onDeleteModule(moduleIndex)}>
          {"Delete"}
        </button>
      </div>

      <div className="teacher-topics-section">
        <div className="teacher-topics-header">
          <h4 className="teacher-topics-title">{"Topics"}</h4>
          <button className="teacher-add-topic-btn" type="button" onClick={() => onAddTopic(moduleIndex)}>
            + {"Add Topic"}
          </button>
        </div>

        {moduleItem.topics.length > 0 ? (
          <div className="teacher-topics-list">
            {moduleItem.topics.map((topic, topicIndex) => (
              <div key={topic.id || topicIndex} className="teacher-topic-item">
                <div className="teacher-topic-header">
                  <input
                    type="text"
                    className="teacher-form-input teacher-topic-title-input"
                    value={topic.title}
                    onChange={(event) => onTopicTitleChange(moduleIndex, topicIndex, event.target.value)}
                    placeholder={`Topic ${topicIndex + 1}`}
                    style={{ flex: 1, marginRight: '8px' }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="teacher-topic-edit-btn"
                      type="button"
                      onClick={() => onEditTopic(moduleIndex, topicIndex)}
                      disabled={!moduleItem.id || !topic.id}
                      title={!moduleItem.id || !topic.id ? "Save the course first to edit this module." : ''}
                    >
                      {"Edit"}
                    </button>
                    <button
                      className="teacher-topic-delete-btn"
                      type="button"
                      onClick={() => onDeleteTopic(moduleIndex, topicIndex)}
                    >
                      {"Delete"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="teacher-empty-text">{"No topics yet. Click \"Add Topic\" to create one."}</p>
        )}
      </div>
    </div>
  );
}

export default TeacherCourseModuleCard;
