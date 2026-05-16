import { useEffect, useMemo, useState } from 'react';

import { CourseCard } from '../../../features/courses';
import { api } from '../../../shared/api';
import type { CourseListItem } from '../../../shared/types';
import { LoadingIndicator } from '../../../shared/ui';
import type { CourseListResponse } from '../model/types';
import '../styles/courses.css';

function normalizeCourseList(data: CourseListResponse): CourseListItem[] {
  return Array.isArray(data) ? data : data.results || [];
}

function CoursesPage() {
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
          setError("The course catalog could not be loaded. The page may be unavailable or the server did not return courses.");
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
  }, []);

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
          <h1 className="page__title">{"Courses"}</h1>
          <p className="page__subtitle">{"Browse available courses. After you enroll, they will appear on the Learning page."}</p>
        </>
      )}

      {loading && <LoadingIndicator label={"Loading..."} />}
      {!loading && error && (
        <section className="courses-state courses-state--error" aria-live="polite">
          <div className="courses-state__code">404</div>
          <h2 className="courses-state__title">{"Courses not found"}</h2>
          <p className="courses-state__text">{error}</p>
          <button type="button" className="courses-state__button" onClick={() => window.location.reload()}>
            {"Try again"}
          </button>
        </section>
      )}

      {!loading && !error && courses.length === 0 && (
        <section className="courses-state" aria-live="polite">
          <div className="courses-state__code">404</div>
          <h2 className="courses-state__title">{"Catalog is empty"}</h2>
          <p className="courses-state__text">{"No courses available yet. Check back soon!"}</p>
        </section>
      )}

      {!loading && !error && courses.length > 0 && (
        <>
          <section className="courses-filter-panel" aria-label={"Course filters"}>
            <div className="courses-filter-panel__field courses-filter-panel__field--search">
              <label className="courses-filter-panel__label" htmlFor="courses-search">
                {"Search by title"}
              </label>
              <input
                id="courses-search"
                className="courses-filter-panel__input"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={"Search courses..."}
              />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                className="courses-filter-panel__reset"
                onClick={() => setSearchQuery('')}
              >
                {"Clear filters"}
              </button>
            )}
          </section>

          {filteredCourses.length === 0 ? (
            <p className="courses-filter-empty">{"No courses match these filters."}</p>
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
