import { isAxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { api } from '../../../shared/api';
import { renderHighlightedCode } from '../../../shared/lib/highlightCode';
import type { TopicTheory } from '../../../shared/types';
import { LoadingIndicator } from '../../../shared/ui';
import type { TopicRouteParams } from '../model/types';
import '../styles/learning.css';

type TheoryBlock =
  | {
      type: 'text';
      content: string;
    }
  | {
      type: 'code';
      content: string;
      language?: string;
    };

const codeFencePattern = /```([a-zA-Z0-9_+-]*)?[ \t]*\n?([\s\S]*?)```/g;
/** Trim surrounding blank lines and collapse 3+ newlines into a single
 *  blank line so prose around code fences doesn't render with big gaps. */
function normalizeText(text: string): string {
  return text.replace(/^\s*\n/, '').replace(/\n\s*$/, '').replace(/\n{3,}/g, '\n\n');
}

function parseTheoryContent(content: string): TheoryBlock[] {
  const blocks: TheoryBlock[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  codeFencePattern.lastIndex = 0;

  while ((match = codeFencePattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({
        type: 'text',
        content: normalizeText(content.slice(lastIndex, match.index)),
      });
    }

    blocks.push({
      type: 'code',
      language: match[1] || undefined,
      // Trim blank lines around the snippet so it doesn't add huge gaps.
      content: match[2].replace(/^\n+/, '').replace(/\s+$/, ''),
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    blocks.push({
      type: 'text',
      content: normalizeText(content.slice(lastIndex)),
    });
  }

  return blocks.filter((block) => block.content.length > 0);
}

function TopicTheoryPage() {
  const { courseId, topicId } = useParams<TopicRouteParams>();
  const navigate = useNavigate();

  const [topic, setTopic] = useState<TopicTheory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadTopic = async () => {
      if (!topicId) {
        if (isActive) {
          setError("Topic not found or you are not enrolled.");
          setLoading(false);
        }
        return;
      }

      try {
        setError(null);
        const response = await api.get<TopicTheory>(`/api/learning/topics/${topicId}/`);
        if (!isActive) {
          return;
        }

        setTopic(response.data);
      } catch (requestError: unknown) {
        console.error(requestError);
        if (!isActive) {
          return;
        }

        const status = isAxiosError(requestError) ? requestError.response?.status : undefined;
        if (status === 404) {
          setError("Topic not found or you are not enrolled.");
        } else if (status === 403) {
          setError("You are not enrolled in this course.");
        } else {
          setError("Failed to load topic.");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadTopic();

    return () => {
      isActive = false;
    };
  }, [topicId]);

  const handleBackToCourse = () => {
    if (courseId) {
      navigate(`/learning/courses/${courseId}/`);
    } else if (topic?.course_id) {
      navigate(`/learning/courses/${topic.course_id}/`);
    } else {
      navigate('/learning');
    }
  };

  const handleGoToPractice = () => {
    if (!topic) {
      return;
    }

    const resolvedCourseId = courseId || String(topic.course_id);
    navigate(`/learning/courses/${resolvedCourseId}/topics/${topic.id}/practice`);
  };

  if (loading) {
    return (
      <div className="page page-enter">
        <LoadingIndicator label={"Loading..."} />
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="page page-enter">
        <p style={{ color: '#dc2626' }}>{error || "Topic not found or you are not enrolled."}</p>
        <button
          type="button"
          className="learning-back-link"
          onClick={() => navigate('/learning')}
          style={{ marginTop: '16px' }}
        >
          {"Back to My Learning"}
        </button>
      </div>
    );
  }

  const progressPercent = topic.progress_percent ?? 0;
  const timedLabel =
    topic.time_limit_seconds != null ? ` (${Math.floor(topic.time_limit_seconds / 60)} min)` : '';
  const theoryBlocks = parseTheoryContent(topic.content);

  return (
    <div className="page page-enter">
      <header className="topic-page-header">
        <button type="button" className="learning-back-link" onClick={handleBackToCourse}>
          {"Back to course"}
        </button>

        <div className="topic-meta">
          {topic.course_title} | {topic.module_title}
          {topic.is_timed_test && (
            <span className="topic-meta__timed-badge" title={`${"Timed test"}${timedLabel}`}>
              {"Timed test"}
            </span>
          )}
        </div>

        <h1 className="page__title">{topic.title}</h1>
      </header>

      <div className="topic-theory-progress">
        <div className="learning-progress-bar">
          <div className="learning-progress-bar__fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <section className="topic-theory">
        <h2 className="topic-section-title">{"Theory"}</h2>
        <div className="topic-theory__content">
          {theoryBlocks.map((block, index) => {
            if (block.type === 'code') {
              return (
                <figure className="topic-theory__code-block" key={`${block.type}-${index}`}>
                  <figcaption>
                    <span className="topic-theory__code-window-dots" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </span>
                    <span>{block.language || 'code'}</span>
                  </figcaption>
                  <pre>
                    <code>{renderHighlightedCode(block.content)}</code>
                  </pre>
                </figure>
              );
            }

            return (
              <div className="topic-theory__text-block" key={`${block.type}-${index}`}>
                {block.content}
              </div>
            );
          })}
        </div>
      </section>

      <div className="topic-theory__actions">
        <button type="button" className="topic-theory__practice-btn" onClick={handleGoToPractice}>
          {"Start test"}
        </button>
      </div>
    </div>
  );
}

export default TopicTheoryPage;
