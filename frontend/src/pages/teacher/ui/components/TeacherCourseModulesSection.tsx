import type { TeacherEditableModule } from '../../model/types';
import TeacherCourseModuleCard from './TeacherCourseModuleCard';

interface TeacherCourseModulesSectionProps {
  modules: TeacherEditableModule[];
  onAddModule: () => void;
  onModuleTitleChange: (moduleIndex: number, value: string) => void;
  onDeleteModule: (moduleIndex: number) => void;
  onAddTopic: (moduleIndex: number) => void;
  onTopicTitleChange: (moduleIndex: number, topicIndex: number, value: string) => void;
  onEditTopic: (moduleIndex: number, topicIndex: number) => void;
  onDeleteTopic: (moduleIndex: number, topicIndex: number) => void;
}

function TeacherCourseModulesSection({
  modules,
  onAddModule,
  onModuleTitleChange,
  onDeleteModule,
  onAddTopic,
  onTopicTitleChange,
  onEditTopic,
  onDeleteTopic,
}: TeacherCourseModulesSectionProps) {

  return (
    <div className="teacher-course-modules">
      <div className="teacher-modules-header">
        <h2 className="teacher-modules-title">{"Modules"}</h2>
        <div className="teacher-modules-actions">
          <button className="teacher-add-module-btn" type="button" onClick={onAddModule}>
            + {"Add Module"}
          </button>
        </div>
      </div>

      {modules.length > 0 ? (
        <div className="teacher-modules-list">
          {modules.map((moduleItem, moduleIndex) => (
            <TeacherCourseModuleCard
              key={moduleItem.id || moduleIndex}
              moduleItem={moduleItem}
              moduleIndex={moduleIndex}
              onModuleTitleChange={onModuleTitleChange}
              onDeleteModule={onDeleteModule}
              onAddTopic={onAddTopic}
              onTopicTitleChange={onTopicTitleChange}
              onEditTopic={onEditTopic}
              onDeleteTopic={onDeleteTopic}
            />
          ))}
        </div>
      ) : (
        <p className="teacher-empty-text">{"No modules yet. Click \"Add Module\" to create one."}</p>
      )}
    </div>
  );
}

export default TeacherCourseModulesSection;
