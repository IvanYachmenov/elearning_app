import { useEffect, useMemo, useState } from 'react';

import { CourseCard } from '../../../features/courses';
import { api } from '../../../shared/api';
import { FRAMEWORK_OPTIONS, PROGRAMMING_LANGUAGE_OPTIONS } from '../../../shared/lib/courseTags';
import { useLanguage } from '../../../shared/lib/i18n/LanguageContext';
import type { CourseListItem } from '../../../shared/types';
import type { CourseListResponse } from '../model/types';
import '../styles/courses.css';

interface CourseFilterDropdownProps {
  id: string;
  label: string;
  allLabel: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

function normalizeCourseList(data: CourseListResponse): CourseListItem[] {
  return Array.isArray(data) ? data : data.results || [];
}

function getTagOptions(
  courses: CourseListItem[],
  field: 'programming_languages' | 'frameworks',
  presetOptions: string[],
): string[] {
  const tags = new Map<string, string>();

  presetOptions.forEach((tag) => {
    tags.set(tag.toLowerCase(), tag);
  });

  courses.forEach((course) => {
    (course[field] || []).forEach((tag) => {
      const normalizedTag = tag.trim();
      if (normalizedTag) {
        tags.set(normalizedTag.toLowerCase(), normalizedTag);
      }
    });
  });

  return Array.from(tags.values()).sort((firstTag, secondTag) => firstTag.localeCompare(secondTag));
}

function CourseFilterDropdown({ id, label, allLabel, options, value, onChange }: CourseFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = value || allLabel;
  const dropdownOptions = ['', ...options];

  return (
    <div
      className="courses-filter-dropdown"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <button
        id={id}
        type="button"
        className={`courses-filter-dropdown__button ${isOpen ? 'is-open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={label}
        onClick={() => setIsOpen((previous) => !previous)}
      >
        <span>{selectedLabel}</span>
        <span className="courses-filter-dropdown__chevron" aria-hidden="true">
          {isOpen ? '−' : '+'}
        </span>
      </button>

      {isOpen && (
        <div className="courses-filter-dropdown__menu" role="listbox" aria-labelledby={id}>
          {dropdownOptions.map((option) => {
            const optionLabel = option || allLabel;
            const isSelected = option === value;

            return (
              <button
                key={optionLabel}
                type="button"
                className={`courses-filter-dropdown__option ${isSelected ? 'is-selected' : ''}`}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
              >
                {optionLabel}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CoursesPage() {
  const { t } = useLanguage();
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedFramework, setSelectedFramework] = useState('');
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
          setError('Failed to load courses.');
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

  const languageOptions = useMemo(
    () => getTagOptions(courses, 'programming_languages', PROGRAMMING_LANGUAGE_OPTIONS),
    [courses],
  );
  const frameworkOptions = useMemo(() => getTagOptions(courses, 'frameworks', FRAMEWORK_OPTIONS), [courses]);
  const filteredCourses = useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesSearch = !normalizedSearchQuery || course.title.toLowerCase().includes(normalizedSearchQuery);
      const matchesLanguage =
        !selectedLanguage ||
        (course.programming_languages || []).some((tag) => tag.toLowerCase() === selectedLanguage.toLowerCase());
      const matchesFramework =
        !selectedFramework ||
        (course.frameworks || []).some((tag) => tag.toLowerCase() === selectedFramework.toLowerCase());

      return matchesSearch && matchesLanguage && matchesFramework;
    });
  }, [courses, searchQuery, selectedFramework, selectedLanguage]);

  const hasActiveFilters = Boolean(searchQuery.trim() || selectedLanguage || selectedFramework);

  return (
    <div className="page page-enter">
      <h1 className="page__title">{t('pages.courses.title')}</h1>
      <p className="page__subtitle">{t('pages.courses.subtitle')}</p>

      {loading && <p>{t('pages.courses.loading')}</p>}
      {error && <p style={{ color: '#dc2626' }}>{error}</p>}

      {!loading && !error && courses.length === 0 && <p>{t('pages.courses.noCourses')}</p>}

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

            <div className="courses-filter-panel__field">
              <label className="courses-filter-panel__label" id="courses-language-filter-label">
                {t('pages.courses.programmingLanguage')}
              </label>
              <CourseFilterDropdown
                id="courses-language-filter"
                label={t('pages.courses.programmingLanguage')}
                allLabel={t('pages.courses.allLanguages')}
                options={languageOptions}
                value={selectedLanguage}
                onChange={setSelectedLanguage}
              />
            </div>

            <div className="courses-filter-panel__field">
              <label className="courses-filter-panel__label" id="courses-framework-filter-label">
                {t('pages.courses.framework')}
              </label>
              <CourseFilterDropdown
                id="courses-framework-filter"
                label={t('pages.courses.framework')}
                allLabel={t('pages.courses.allFrameworks')}
                options={frameworkOptions}
                value={selectedFramework}
                onChange={setSelectedFramework}
              />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                className="courses-filter-panel__reset"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedLanguage('');
                  setSelectedFramework('');
                }}
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
