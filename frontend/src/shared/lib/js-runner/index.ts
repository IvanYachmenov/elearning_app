import type { CodeRunResult } from '../../types';

const DEFAULT_TIMEOUT_MS = 5000;

// Runs JS in an isolated Web Worker so it can't touch the page.
const WORKER_SOURCE = `
self.onmessage = function (e) {
  var out = [], err = [];
  var fmt = function (args) {
    return Array.prototype.map.call(args, function (x) {
      if (typeof x === 'string') return x;
      try { return JSON.stringify(x); } catch (_) { return String(x); }
    }).join(' ');
  };
  self.console = {
    log: function () { out.push(fmt(arguments)); },
    info: function () { out.push(fmt(arguments)); },
    debug: function () { out.push(fmt(arguments)); },
    warn: function () { out.push(fmt(arguments)); },
    error: function () { err.push(fmt(arguments)); },
  };
  var ok = true;
  try {
    (0, eval)(e.data);
  } catch (ex) {
    ok = false;
    err.push(ex && ex.stack ? String(ex.stack) : String(ex));
  }
  self.postMessage({ ok: ok, stdout: out.join('\\n'), stderr: err.join('\\n') });
};
`;

export function runJavaScriptInWorker(
  code: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<CodeRunResult> {
  return new Promise((resolve) => {
    const blob = new Blob([WORKER_SOURCE], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
    let settled = false;

    const finish = (result: CodeRunResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve(result);
    };

    const timer = window.setTimeout(() => {
      finish({
        status: 'timeout',
        stdout: '',
        stderr: `Execution timed out after ${timeoutMs / 1000}s.`,
        exit_code: null,
        timed_out: true,
      });
    }, timeoutMs);

    worker.onmessage = (
      event: MessageEvent<{ ok: boolean; stdout: string; stderr: string }>,
    ) => {
      finish({
        status: event.data.ok ? 'completed' : 'runtime_error',
        stdout: event.data.stdout,
        stderr: event.data.stderr,
        exit_code: event.data.ok ? 0 : 1,
        timed_out: false,
      });
    };
    worker.onerror = (event) => {
      finish({
        status: 'runtime_error',
        stdout: '',
        stderr: event.message || 'Worker error.',
        exit_code: 1,
        timed_out: false,
      });
    };

    worker.postMessage(code);
  });
}
