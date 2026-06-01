export type ParsedRunError = {
  type?: string;
  message?: string;
  line?: number;
  codeLine?: string;
  raw: string;
};

const ERROR_TYPE_PATTERN = /^([A-Z]\w*(?:Error|Exception|Warning)):\s*(.*)$/;
const PYTHON_FILE_LINE_PATTERN = /File\s+"[^"]+",\s+line\s+(\d+)/;

export function parseRunError(stderr: string | null | undefined): ParsedRunError {
  const raw = stderr ?? '';
  if (!raw.trim()) return { raw };

  const lines = raw.trim().split('\n');

  let typeMatch: RegExpMatchArray | null = null;
  for (let i = lines.length - 1; i >= 0; i--) {
    const m = lines[i].trim().match(ERROR_TYPE_PATTERN);
    if (m) {
      typeMatch = m;
      break;
    }
  }

  const lineMatch = raw.match(PYTHON_FILE_LINE_PATTERN);
  const line = lineMatch ? Number(lineMatch[1]) : undefined;

  let codeLine: string | undefined;
  const fileIdx = lines.findIndex((l) => PYTHON_FILE_LINE_PATTERN.test(l));
  if (fileIdx !== -1 && fileIdx + 1 < lines.length) {
    const candidate = lines[fileIdx + 1].trim();
    if (candidate && candidate !== '^') {
      codeLine = candidate;
    }
  }

  return {
    type: typeMatch?.[1],
    message: typeMatch?.[2]?.trim() || undefined,
    line,
    codeLine,
    raw,
  };
}
