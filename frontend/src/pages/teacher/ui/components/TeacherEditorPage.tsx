import type { ReactNode } from 'react';

interface TeacherEditorPageProps {
  title: string;
  backLabel?: string;
  onBack?: () => void;
  backDisabled?: boolean;
  error?: string | null;
  actions?: ReactNode;
  children: ReactNode;
}

function TeacherEditorPage({
  title,
  backLabel,
  onBack,
  backDisabled = false,
  error,
  actions,
  children,
}: TeacherEditorPageProps) {
  return (
    <div className="page page-enter">
      <div className="teacher-course-edit-top">
        <h1 className="teacher-course-edit-title">{title}</h1>
        {onBack ? (
          <div className="teacher-course-edit-back">
            <button type="button" className="btn-primary" onClick={onBack} disabled={backDisabled}>
              {backLabel}
            </button>
          </div>
        ) : null}
      </div>

      {error ? <div className="teacher-error">{error}</div> : null}

      <div className="teacher-course-edit-form">{children}</div>

      {actions ? (
        <div className="teacher-course-edit-footer">
          <div className="teacher-course-edit-actions">{actions}</div>
        </div>
      ) : null}
    </div>
  );
}

export default TeacherEditorPage;
