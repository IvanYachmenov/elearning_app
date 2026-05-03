import { useEffect, useMemo, useState } from 'react';

import { CourseCard } from '../../../features/courses';
import { api } from '../../../shared/api';
import { useLanguage } from '../../../shared/lib/i18n/LanguageContext';
import type { CourseListItem } from '../../../shared/types';
import { LoadingIndicator } from '../../../shared/ui';
import type { CourseListResponse } from '../model/types';
import '../styles/courses.css';

function normalizeCourseList(data: CourseListResponse): CourseListItem[] {
  return Array.isArray(data) ? data : data.results || [];
}

function CoursesPage() {
  const { t } = useLanguage();
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadCourses = async () => {
      try {
        setError(null);
        const response = await api.get<CourseListResponse>('/api/courses/');
        if (!isActive) {
          return;
        }

        setCourses(normalizeCourseList(response.data));
      } catch (requestError) {
        console.error(requestError);
        if (isActive) {
          setError(t('pages.courses.catalogNotFoundText'));
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadCourses();

    return () => {
      isActive = false;
    };
  }, [t]);

  const filteredCourses = useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    return courses.filter((course) => (
      !normalizedSearchQuery || course.title.toLowerCase().includes(normalizedSearchQuery)
    ));
  }, [courses, searchQuery]);

  const hasActiveFilters = Boolean(searchQuery.trim());
  const showCatalogState = !loading && (Boolean(error) || courses.length === 0);

  return (
    <div className={`page page-enter${showCatalogState ? ' courses-page--state' : ''}`}>
      {!showCatalogState && (
        <>
          <h1 className="page__title">{t('pages.courses.title')}</h1>
          <p className="page__subtitle">{t('pages.courses.subtitle')}</p>
        </>
      )}

      {loading && <LoadingIndicator label={t('common.loading')} />}
      {!loading && error && (
        <section className="courses-state courses-state--error" aria-live="polite">
          <div className="courses-state__code">404</div>
          <h2 className="courses-state__title">{t('pages.courses.catalogNotFoundTitle')}</h2>
          <p className="courses-state__text">{error}</p>
          <button type="button" className="courses-state__button" onClick={() => window.location.reload()}>
            {t('pages.courses.tryAgain')}
          </button>
        </section>
      )}

      {!loading && !error && courses.length === 0 && (
        <section className="courses-state" aria-live="polite">
          <div className="courses-state__code">404</div>
          <h2 className="courses-state__title">{t('pages.courses.catalogEmptyTitle')}</h2>
          <p className="courses-state__text">{t('pages.courses.noCourses')}</p>
        </section>
      )}

      {!loading && !error && courses.length > 0 && (
        <>
          <section className="courses-filter-panel" aria-label={t('pages.courses.filters')}>
            <div className="courses-filter-panel__field courses-filter-panel__field--search">
              <label className="courses-filter-panel__label" htmlFor="courses-search">
                {t('pages.courses.searchByTitle')}
              </label>
              <input
                id="courses-search"
                className="courses-filter-panel__input"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t('pages.courses.searchPlaceholder')}
              />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                className="courses-filter-panel__reset"
                onClick={() => setSearchQuery('')}
              >
                {t('pages.courses.clearFilters')}
              </button>
            )}
          </section>

          {filteredCourses.length === 0 ? (
            <p className="courses-filter-empty">{t('pages.courses.noFilteredCourses')}</p>
          ) : (
            <div className="courses-list">
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default CoursesPage;
