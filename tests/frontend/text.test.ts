/**
 * Unit tests for the text helper from features/learning/lib/text.ts.
 * Covers normalization of answer-option text returned by the backend.
 */
import { describe, expect, it } from 'vitest';

import { cleanOptionText } from '../../frontend/src/features/learning/lib/text';

describe('cleanOptionText', () => {
  it('strips leading whitespace', () => {
    expect(cleanOptionText('   answer')).toBe('answer');
  });

  it('strips leading dots and whitespace', () => {
    expect(cleanOptionText('... answer')).toBe('answer');
  });

  it('trims trailing whitespace', () => {
    expect(cleanOptionText('answer   ')).toBe('answer');
  });

  it('returns an empty string for input containing only dots and whitespace', () => {
    expect(cleanOptionText('. . . ')).toBe('');
  });

  it('leaves correctly formatted text unchanged', () => {
    expect(cleanOptionText('Correct answer.')).toBe('Correct answer.');
  });
});
