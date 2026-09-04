export function getAIErrorMessage(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  const lower = message.toLowerCase();

  if (lower.includes('rate limit reached')) {
    return message;
  }

  if (lower.includes('api key') && lower.includes('invalid')) {
    return 'Gemini API key is invalid. Update GEMINI_API_KEY in .env.local.';
  }

  if (
    lower.includes('daily ai limit') ||
    lower.includes('quota') ||
    lower.includes('resource_exhausted') ||
    lower.includes('too many requests')
  ) {
    return 'Gemini quota is unavailable for this API key/model. Try again shortly, or update GEMINI_API_KEY / enable billing in Google AI Studio.';
  }

  return fallback;
}
