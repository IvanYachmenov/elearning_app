import { useState } from 'react';
import { isAxiosError } from 'axios';

import { api } from '../../../shared/api';
import { runJavaScriptInWorker } from '../../../shared/lib/js-runner';
import { parseRunError } from '../../../shared/lib/parseRunError';
import { AppSelect, CodeEditor } from '../../../shared/ui';
import type { ApiErrorResponse, CodeRunResult } from '../../../shared/types';
import '../styles/playground.css';

type RunResult = CodeRunResult;

type Language = 'python' | 'javascript';

const STARTER: Record<Language, string> = {
  python: 'print("Hello from the playground!")\n',
  javascript: 'console.log("Hello from the playground!");\n',
};

function PlaygroundPage() {
  const [language, setLanguage] = useState<Language>('python');
  const [codeByLanguage, setCodeByLanguage] = useState<Record<Language, string>>({
    python: STARTER.python,
    javascript: STARTER.javascript,
  });
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const code = codeByLanguage[language];

  const handleLanguageChange = (next: Language) => {
    setLanguage(next);
    setResult(null);
    setError(null);
  };

  const handleRun = async () => {
    if (isRunning) return;

    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      if (language === 'javascript') {
        setResult(await runJavaScriptInWorker(code));
        return;
      }

      const response = await api.post<RunResult>('/api/playground/run/', {
        language,
        code,
      });
      setResult(response.data);
    } catch (requestError: unknown) {
      const detail = isAxiosError<ApiErrorResponse>(requestError)
        ? requestError.response?.data?.detail
        : undefined;
      setError(detail || 'Failed to run the code. Please try again.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="page page-enter playground-page">
      <div className="playground">
        <div className="playground__toolbar">
          <h1 className="playground__title">Playground</h1>
          <div className="playground__controls">
            <AppSelect
              ariaLabel="Language"
              value={language}
              options={[
                { value: 'python', label: 'Python' },
                { value: 'javascript', label: 'JavaScript' },
              ]}
              onChange={(next) => handleLanguageChange(next as Language)}
            />
            <button
              type="button"
              className="playground__run-btn"
              onClick={handleRun}
              disabled={isRunning}
            >
              {isRunning ? 'Running…' : 'Run'}
            </button>
          </div>
        </div>

        <div className="playground__editor">
          <CodeEditor
            value={code}
            onChange={(next) => {
              setCodeByLanguage((prev) => ({ ...prev, [language]: next }));
            }}
            placeholder="Write your code here…"
            minRows={14}
            ariaLabel="Playground code editor"
          />
        </div>

        {error && <div className="playground__error">{error}</div>}

        {result && (
          <div className="playground__output">
            <div className="playground__output-head">
              <span>Output</span>
              {result.timed_out && <span className="playground__badge">timed out</span>}
              {typeof result.exit_code === 'number' && (
                <span className="playground__exit">exit {result.exit_code}</span>
              )}
            </div>
            <pre className="playground__stream">{result.stdout || '(no output)'}</pre>
            {result.stderr && (() => {
              const parsed = parseRunError(result.stderr);
              return (
                <div className="playground__error-block">
                  <div className="playground__output-head playground__output-head--err">Error</div>
                  {parsed.type ? (
                    <div className="playground__error-detail">
                      <div className="playground__error-title">
                        <strong>{parsed.type}</strong>
                        {parsed.message ? `: ${parsed.message}` : ''}
                      </div>
                      {parsed.line !== undefined && (
                        <div className="playground__error-line">
                          on line {parsed.line}
                          {parsed.codeLine ? (
                            <>
                              {': '}
                              <code>{parsed.codeLine}</code>
                            </>
                          ) : null}
                        </div>
                      )}
                    </div>
                  ) : (
                    <pre className="playground__stream playground__stream--err">{result.stderr}</pre>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

export default PlaygroundPage;
