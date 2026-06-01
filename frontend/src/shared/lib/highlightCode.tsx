import type { ReactNode } from 'react';

const codeTokenPattern =
  /(\/\/.*|#.*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:const|let|var|function|return|if|else|for|while|class|import|from|export|default|async|await|try|catch|finally|throw|new|true|false|null|undefined|def|print|in|not|and|or|elif|None|True|False|self|public|private|protected|static|void|int|string|boolean|number)\b|\b\d+(?:\.\d+)?\b)/g;

function getCodeTokenClass(token: string, classPrefix: string) {
  if (token.startsWith('//') || token.startsWith('#') || token.startsWith('/*')) {
    return `${classPrefix}--comment`;
  }

  if (
    token.startsWith('"') ||
    token.startsWith("'") ||
    token.startsWith('`')
  ) {
    return `${classPrefix}--string`;
  }

  if (/^\d/.test(token)) {
    return `${classPrefix}--number`;
  }

  return `${classPrefix}--keyword`;
}

export function tokenizeCodeLine(
  line: string,
  lineIndex: number,
  classPrefix = 'topic-theory__code-token',
): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  codeTokenPattern.lastIndex = 0;

  while ((match = codeTokenPattern.exec(line)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(line.slice(lastIndex, match.index));
    }

    nodes.push(
      <span className={getCodeTokenClass(match[0], classPrefix)} key={`token-${lineIndex}-${match.index}`}>
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

export function renderHighlightedCode(code: string) {
  const lines = code.split('\n');

  return lines.map((line, index) => (
    <span className="topic-theory__code-line" key={`line-${index}`}>
      <span className="topic-theory__code-ln" aria-hidden="true">{index + 1}</span>
      <span className="topic-theory__code-content">
        {tokenizeCodeLine(line, index)}
      </span>
    </span>
  ));
}
