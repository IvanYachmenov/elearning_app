import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../../../shared/api';
import { LoadingIndicator } from '../../../shared/ui';
import { getTeacherErrorMessage } from '../lib/errors';
import { normalizeTeacherCourseList } from '../lib/normalize';
import type { TeacherCourseListItem, TeacherPageProps } from '../model/types';
import TeacherCourseGrid from './components/TeacherCourseGrid';
import '../styles/teacher.css';

function TeacherCoursesPage({ user }: TeacherPageProps) {
  const [courses, setCourses] = useState<TeacherCourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalCourseId, setDeleteModalCourseId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/teacher/courses/');
      setCourses(normalizeTeacherCourseList(response.data));
    } catch (requestError) {
      setError(getTeacherErrorMessage(requestError, "Failed to load your courses. Please try again."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user.role !== 'teacher') {
      navigate('/courses', { replace: true });
      return;
    }

    void fetchCourses();
  }, [user.role, navigate, fetchCourses]);

  const handleDeleteConfirm = async () => {
    if (!deleteModalCourseId) {
      return;
    }

    setDeleting(true);
    try {
      await api.delete(`/api/teacher/courses/${deleteModalCourseId}/`);
      setCourses((previous) => previous.filter((course) => course.id !== deleteModalCourseId));
      setDeleteModalCourseId(null);
    } catch (requestError) {
      setError(getTeacherErrorMessage(requestError, "Failed to delete course. Please try again."));
    } finally {
      setDeleting(false);
    }
  };

  if (user.role !== 'teacher') {
    return null;
  }

  if (loading) {
    return (
      <div className="page page-enter teacher-page">
        <h1 className="page__title">{"Teacher's cabinet"}</h1>
        <LoadingIndicator label={"Loading..."} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page page-enter teacher-page">
        <h1 className="page__title">{"Teacher's cabinet"}</h1>
        <p className="teacher-error-inline">{error}</p>
      </div>
    );
  }

  return (
    <div className="page page-enter teacher-page">
      <div className="teacher-courses-header">
        <h1 className="page__title">{"Teacher's cabinet"}</h1>
        <button type="button" className="teacher-create-btn" onClick={() => navigate('/teacher/courses/new')}>
          + {"Create New Course"}
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="teacher-empty">
          <p>{"You haven't created any courses yet."}</p>
          <button type="button" className="teacher-create-btn" onClick={() => navigate('/teacher/courses/new')}>
            {"Create Your First Course"}
          </button>
        </div>
      ) : (
        <TeacherCourseGrid
          courses={courses}
          onEdit={(courseId) => navigate(`/teacher/courses/${courseId}/edit`)}
          onRequestDelete={(courseId) => setDeleteModalCourseId(courseId)}
        />
      )}

      {deleteModalCourseId !== null && (
        <div
          className="teacher-delete-modal-overlay"
          onClick={() => !deleting && setDeleteModalCourseId(null)}
          role="presentation"
        >
          <div
            className="teacher-delete-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="teacher-delete-modal-title"
          >
            <h3 id="teacher-delete-modal-title" className="teacher-delete-modal__title">
              {"Do you really want to delete this course?"}
            </h3>
            <div className="teacher-delete-modal__actions">
              <button
                type="button"
                className="teacher-delete-modal__btn teacher-delete-modal__btn--cancel"
                onClick={() => setDeleteModalCourseId(null)}
                disabled={deleting}
              >
                {"Cancel"}
              </button>
              <button
                type="button"
                className="teacher-delete-modal__btn teacher-delete-modal__btn--confirm"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? '...' : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherCoursesPage;
