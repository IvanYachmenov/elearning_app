import { isAxiosError } from 'axios';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { api } from '../../../shared/api';
import { useLanguage } from '../../../shared/lib/i18n/LanguageContext';
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
const codeTokenPattern =
  /(\/\/.*|#.*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:const|let|var|function|return|if|else|for|while|class|import|from|export|default|async|await|try|catch|finally|throw|new|true|false|null|undefined|def|print|in|not|and|or|elif|None|True|False|self|public|private|protected|static|void|int|string|boolean|number)\b|\b\d+(?:\.\d+)?\b)/g;

function getCodeTokenClass(token: string) {
  if (token.startsWith('//') || token.startsWith('#') || token.startsWith('/*')) {
    return 'topic-theory__code-token--comment';
  }

  if (
    token.startsWith('"') ||
    token.startsWith("'") ||
    token.startsWith('`')
  ) {
    return 'topic-theory__code-token--string';
  }

  if (/^\d/.test(token)) {
    return 'topic-theory__code-token--number';
  }

  return 'topic-theory__code-token--keyword';
}

function renderHighlightedCodeLine(line: string, lineIndex: number): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  codeTokenPattern.lastIndex = 0;

  while ((match = codeTokenPattern.exec(line)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(line.slice(lastIndex, match.index));
    }

    nodes.push(
      <span className={getCodeTokenClass(match[0])} key={`token-${lineIndex}-${match.index}`}>
        {match[0]}
      </span>,
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < line.length) {
    nodes.push(line.slice(lastIndex));
  }

  return nodes;
}

function renderHighlightedCode(code: string) {
  const lines = code.split('\n');

  return lines.map((line, index) => (
    <span className="topic-theory__code-line" key={`line-${index}`}>
      {renderHighlightedCodeLine(line, index)}
      {index < lines.length - 1 ? '\n' : null}
    </span>
  ));
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
        content: content.slice(lastIndex, match.index),
      });
    }

    blocks.push({
      type: 'code',
      language: match[1] || undefined,
      content: match[2].replace(/\n$/, ''),
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    blocks.push({
      type: 'text',
      content: content.slice(lastIndex),
    });
  }

  return blocks.filter((block) => block.content.length > 0);
}

function TopicTheoryPage() {
  const { courseId, topicId } = useParams<TopicRouteParams>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [topic, setTopic] = useState<TopicTheory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadTopic = async () => {
      if (!topicId) {
        if (isActive) {
          setError(t('pages.learning.topicNotFound'));
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
          setError(t('pages.learning.topicNotFound'));
        } else if (status === 403) {
          setError(t('pages.learning.notEnrolled'));
        } else {
          setError(t('pages.learning.failedToLoadTopic'));
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
  }, [topicId, t]);

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
        <LoadingIndicator label={t('common.loading')} />
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="page page-enter">
        <p style={{ color: '#dc2626' }}>{error || t('pages.learning.topicNotFound')}</p>
        <button
          type="button"
          className="learning-back-link"
          onClick={() => navigate('/learning')}
          style={{ marginTop: '16px' }}
        >
          {t('pages.learning.backToMyLearning')}
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
          {t('pages.learning.backToCourse')}
        </button>

        <div className="topic-meta">
          {topic.course_title} | {topic.module_title}
          {topic.is_timed_test && (
            <span className="topic-meta__timed-badge" title={`${t('pages.learning.timedTest')}${timedLabel}`}>
              {t('pages.learning.timedTest')}
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
        <h2 className="topic-section-title">{t('pages.learning.theory')}</h2>
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
          {t('pages.learning.goToPractice')}
        </button>
      </div>
    </div>
  );
}

export default TopicTheoryPage;
