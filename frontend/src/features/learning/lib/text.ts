export function cleanOptionText(text: string): string {
  return text.replace(/^[.\s]+/, '').trim();
}
