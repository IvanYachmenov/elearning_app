import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../../../shared/api';
import { useLanguage } from '../../../shared/lib/i18n/LanguageContext';
import { getTeacherErrorMessage } from '../lib/errors';
import { normalizeTeacherCourseList } from '../lib/normalize';
import type { TeacherCourseListItem, TeacherPageProps } from '../model/types';
import TeacherCourseActionsOverlay, { type TeacherFloatingCardPosition } from './components/TeacherCourseActionsOverlay';
import TeacherCourseGrid from './components/TeacherCourseGrid';
import '../styles/teacher.css';

function TeacherCoursesPage({ user }: TeacherPageProps) {
  const [courses, setCourses] = useState<TeacherCourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [cardPosition, setCardPosition] = useState<TeacherFloatingCardPosition | null>(null);
  const [deleteModalCourseId, setDeleteModalCourseId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/teacher/courses/');
      setCourses(normalizeTeacherCourseList(response.data));
    } catch (requestError) {
      setError(getTeacherErrorMessage(requestError, t('pages.teacher.loadFailed')));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (user.role !== 'teacher') {
      navigate('/home', { replace: true });
      return;
    }

    void fetchCourses();
  }, [user.role, navigate, fetchCourses]);

  useLayoutEffect(() => {
    if (!openDropdownId || !cardRef.current) {
      setCardPosition(null);
      return;
    }

    const measure = () => {
      if (!cardRef.current) {
        return;
      }

      const rect = cardRef.current.getBoundingClientRect();
      setCardPosition({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(cardRef.current);
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
      setCardPosition(null);
    };
  }, [openDropdownId]);

  useEffect(() => {
    if (!openDropdownId) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [openDropdownId]);

  const openCourse = openDropdownId ? courses.find((course) => course.id === openDropdownId) || null : null;

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
      setError(getTeacherErrorMessage(requestError, t('pages.teacher.deleteFailed')));
    } finally {
      setDeleting(false);
    }
  };

  if (user.role !== 'teacher') {
    return null;
  }

  if (loading) {
    return <div className="page page-enter"><h1 className="page__title">{t('pages.teacher.title')}</h1><p>{t('pages.teacher.loading')}</p></div>;
  }

  if (error) {
    return <div className="page page-enter"><h1 className="page__title">{t('pages.teacher.title')}</h1><p className="teacher-error-inline">{error}</p></div>;
  }

  return (
    <div className="page page-enter">
      <div className="teacher-courses-header">
        <h1 className="page__title">{t('pages.teacher.title')}</h1>
        <button type="button" className="teacher-create-btn" onClick={() => navigate('/teacher/courses/new')}>
          + {t('pages.teacher.createCourse')}
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="teacher-empty">
          <p>{t('pages.teacher.noCourses')}</p>
          <button type="button" className="teacher-create-btn" onClick={() => navigate('/teacher/courses/new')}>
            {t('pages.teacher.createFirst')}
          </button>
        </div>
      ) : (
        <TeacherCourseGrid
          courses={courses}
          openDropdownId={openDropdownId}
          activeCardRef={cardRef}
          onOpenCourse={setOpenDropdownId}
        />
      )}

      <TeacherCourseActionsOverlay
        openCourse={openCourse}
        cardPosition={cardPosition}
        deleteModalCourseId={deleteModalCourseId}
        deleting={deleting}
        onEditCourse={(courseId) => {
          setOpenDropdownId(null);
          navigate(`/teacher/courses/${courseId}/edit`);
        }}
        onRequestDelete={(courseId) => {
          setOpenDropdownId(null);
          setDeleteModalCourseId(courseId);
        }}
        onCloseDropdown={() => setOpenDropdownId(null)}
        onCloseDeleteModal={() => setDeleteModalCourseId(null)}
        onDeleteConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

export default TeacherCoursesPage;
