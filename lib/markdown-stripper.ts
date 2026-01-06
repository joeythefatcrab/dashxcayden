/**
 * Strips markdown formatting symbols from text while preserving content and readability
 * Removes: #, *, -, bullet points, bold/italic markers, etc.
 */
export function stripMarkdown(text: string): string {
  if (!text) return text;

  let cleaned = text;

  // Remove markdown headers (# ## ### etc.) - keep the text, remove the hashes
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');

  // Remove bold markers (**text** or __text__)
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
  cleaned = cleaned.replace(/__([^_]+)__/g, '$1');

  // Remove italic markers (*text* or _text_)
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');
  cleaned = cleaned.replace(/_([^_]+)_/g, '$1');

  // Remove bullet points (-, *, +) at start of lines
  cleaned = cleaned.replace(/^[\*\-\+]\s+/gm, '');

  // Remove numbered list markers (1. 2. etc.)
  cleaned = cleaned.replace(/^\d+\.\s+/gm, '');

  // Remove inline code markers (`text`)
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');

  // Remove strikethrough (~~text~~)
  cleaned = cleaned.replace(/~~([^~]+)~~/g, '$1');

  // Clean up any remaining stray asterisks or underscores
  cleaned = cleaned.replace(/[\*_]{1,2}/g, '');

  // Normalize whitespace - remove excessive blank lines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
}
