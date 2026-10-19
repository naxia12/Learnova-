import { GoogleGenAI, GenerateContentParameters } from '@google/genai';

if (!process.env.GEMINI_API_KEY) {
  console.warn('[Learnova AI] Warning: GEMINI_API_KEY is not set in environment.');
}

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Primary model alias supported by Google AI Studio
export const MODEL_NAME = 'gemini-3.8-flash';

// Fallback models in order of preference if primary experiences high traffic / 503
export const FALLBACK_MODELS = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite'
];

/**
 * Checks if an error is a transient, retryable error (503 UNAVAILABLE, 429 RATE LIMIT, timeout, etc.)
 */
export function isRetryableError(error: any): boolean {
  if (!error) return false;

  const status = error.status || error.statusCode || error.response?.status;
  if (status === 503 || status === 429 || status === 502 || status === 504 || status === 500) {
    return true;
  }

  const msg = (error.message || '').toLowerCase();
  return (
    msg.includes('503') ||
    msg.includes('unavailable') ||
    msg.includes('overloaded') ||
    msg.includes('high traffic') ||
    msg.includes('resource_exhausted') ||
    msg.includes('429') ||
    msg.includes('rate limit') ||
    msg.includes('quota') ||
    msg.includes('try again later') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('fetch failed')
  );
}

/**
 * Executes a Gemini API call with exponential backoff, jitter, and automatic model fallback.
 * Maximum of 3 retries (4 total attempts) with jittered backoff delays (1s, 2s, 4s).
 */
export async function generateContentWithRetry(
  params: GenerateContentParameters,
  maxRetries: number = 3
): Promise<{ text: string; modelUsed: string; attempts: number }> {
  const modelsToAttempt = params.model
    ? [params.model, ...FALLBACK_MODELS.filter((m) => m !== params.model)]
    : FALLBACK_MODELS;

  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Alternate or fallback to candidate models if repeated retries
    const currentModel = modelsToAttempt[Math.min(attempt, modelsToAttempt.length - 1)];

    try {
      const response = await ai.models.generateContent({
        ...params,
        model: currentModel,
      });

      const text = response.text?.trim() || '';
      return {
        text,
        modelUsed: currentModel,
        attempts: attempt + 1,
      };
    } catch (error: any) {
      lastError = error;
      const retryable = isRetryableError(error);

      console.warn(
        `[Gemini API] Attempt ${attempt + 1}/${maxRetries + 1} with model "${currentModel}" failed:`,
        error?.message || error
      );

      if (attempt < maxRetries && retryable) {
        // Exponential backoff with jitter: delay = 2^attempt * 1000 + random(0, 500) ms
        const baseBackoff = Math.pow(2, attempt) * 1000;
        const jitter = Math.floor(Math.random() * 500);
        const delayMs = Math.min(baseBackoff + jitter, 5000);

        console.log(`[Gemini API] Retrying in ${delayMs}ms (exponential backoff + jitter)...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      } else if (!retryable) {
        // Non-transient error (e.g. invalid arguments); do not retry fruitlessly
        break;
      }
    }
  }

  throw lastError;
}
