import { createPortal } from 'react-dom';
import type { CSSProperties } from 'react';

import { useLanguage } from '../../../../shared/lib/i18n/LanguageContext';
import type { TeacherCourseListItem } from '../../model/types';

const IMAGE_HEIGHT = 160;

export interface TeacherFloatingCardPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TeacherCourseActionsOverlayProps {
  openCourse: TeacherCourseListItem | null;
  cardPosition: TeacherFloatingCardPosition | null;
  deleteModalCourseId: number | null;
  deleting: boolean;
  onEditCourse: (courseId: number) => void;
  onRequestDelete: (courseId: number) => void;
  onCloseDropdown: () => void;
  onCloseDeleteModal: () => void;
  onDeleteConfirm: () => void;
}

function TeacherCourseActionsOverlay({
  openCourse,
  cardPosition,
  deleteModalCourseId,
  deleting,
  onEditCourse,
  onRequestDelete,
  onCloseDropdown,
  onCloseDeleteModal,
  onDeleteConfirm,
}: TeacherCourseActionsOverlayProps) {
  const { t } = useLanguage();

  const floatingCardStyle: CSSProperties | undefined = cardPosition
    ? {
        top: cardPosition.top,
        left: cardPosition.left,
        width: cardPosition.width,
        height: cardPosition.height * 2 + 2,
      }
    : undefined;

  const floatingInnerStyle: CSSProperties | undefined = cardPosition
    ? {
        ['--teacher-card-height' as string]: `${cardPosition.height}px`,
        ['--teacher-image-height' as string]: `${IMAGE_HEIGHT}px`,
      }
    : undefined;

  return (
    <>
      {openCourse
        ? createPortal(
            <>
              <div className="teacher-dropdown-backdrop" aria-hidden="true" />
              {cardPosition ? (
                <div className="teacher-dropdown-floating" style={floatingCardStyle}>
                  <div className="teacher-course-card teacher-course-card--floating" style={floatingInnerStyle}>
                    <div className="teacher-course-card__image-wrap">
                      {openCourse.image_url ? (
                        <img src={openCourse.image_url} alt="" className="teacher-course-card__image" />
                      ) : null}
                    </div>
                    <div className="teacher-course-card__body">
                      <h3 className="teacher-course-card__title">{openCourse.title}</h3>
                      <div className="teacher-course-card__meta">
                        <span>Modules: {openCourse.modules.length}</span>
                        <span>|</span>
                        <span>Topics: {openCourse.modules.reduce((sum, moduleItem) => sum + moduleItem.topics.length, 0)}</span>
                      </div>
                    </div>
                  </div>
                  <div
                    className="teacher-dropdown-modal teacher-dropdown-modal--under-card"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="teacher-dropdown-title"
                    style={{ width: cardPosition.width, height: cardPosition.height }}
                  >
                    <div className="teacher-dropdown-modal__header" />
                    <div className="teacher-dropdown-modal__options">
                      <button
                        type="button"
                        className="teacher-dropdown-modal__opt"
                        onClick={() => onEditCourse(openCourse.id)}
                      >
                        {t('pages.teacher.edit')}
                      </button>
                      <button
                        type="button"
                        className="teacher-dropdown-modal__opt teacher-dropdown-modal__opt--delete"
                        onClick={() => onRequestDelete(openCourse.id)}
                      >
                        {t('pages.teacher.delete')}
                      </button>
                      <button
                        type="button"
                        className="teacher-dropdown-modal__opt teacher-dropdown-modal__opt--close"
                        onClick={onCloseDropdown}
                      >
                        {t('pages.teacher.close')}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </>,
            document.body,
          )
        : null}

      {deleteModalCourseId
        ? createPortal(
            <div className="teacher-delete-modal-overlay" onClick={onCloseDeleteModal} role="presentation">
              <div
                className="teacher-delete-modal"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="teacher-delete-modal-title"
              >
                <h3 id="teacher-delete-modal-title" className="teacher-delete-modal__title">
                  {t('pages.teacher.deleteConfirm')}
                </h3>
                <div className="teacher-delete-modal__actions">
                  <button
                    type="button"
                    className="teacher-delete-modal__btn teacher-delete-modal__btn--cancel"
                    onClick={onCloseDeleteModal}
                    disabled={deleting}
                  >
                    {t('pages.teacher.deleteCancel')}
                  </button>
                  <button
                    type="button"
                    className="teacher-delete-modal__btn teacher-delete-modal__btn--confirm"
                    onClick={onDeleteConfirm}
                    disabled={deleting}
                  >
                    {deleting ? '...' : t('pages.teacher.delete')}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export default TeacherCourseActionsOverlay;
