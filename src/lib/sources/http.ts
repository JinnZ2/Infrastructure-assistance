/**
 * Ontology: every claim in this module is dX/dt under bounds.
 * See DIFFERENTIAL_FRAME.md before extracting nouns out of context.
 */

import { requestTimeoutMs } from './config';

/** Error carrying the HTTP status so callers can distinguish 4xx from 5xx. */
export class UpstreamError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly url?: string
  ) {
    super(message);
    this.name = 'UpstreamError';
  }
}

interface RequestOptions {
  headers?: Record<string, string>;
  /** Retries for transient failures (timeouts, 5xx, 429). Default 2. */
  retries?: number;
  timeoutMs?: number;
}

const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

async function requestText(url: string, options: RequestOptions = {}): Promise<string> {
  const { headers = {}, retries = 2, timeoutMs = requestTimeoutMs() } = options;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      // Exponential backoff: 500ms, 1s, 2s...
      await new Promise(resolve => setTimeout(resolve, 500 * 2 ** (attempt - 1)));
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json', ...headers },
        signal: controller.signal,
        // These are polled on a 30-minute server-side cache; Next's own fetch
        // cache would only add a second, harder-to-reason-about layer.
        cache: 'no-store',
      });

      if (!response.ok) {
        const error = new UpstreamError(
          `${response.status} ${response.statusText}`,
          response.status,
          url
        );
        if (RETRYABLE_STATUSES.has(response.status) && attempt < retries) {
          lastError = error;
          continue;
        }
        throw error;
      }

      return await response.text();
    } catch (error) {
      // A non-retryable UpstreamError should surface immediately.
      if (error instanceof UpstreamError && !RETRYABLE_STATUSES.has(error.status ?? 0)) {
        throw error;
      }
      lastError = error;
      if (attempt === retries) break;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new UpstreamError(`Request failed: ${String(lastError)}`, undefined, url);
}

/** GET a URL and parse the body as JSON. */
export async function fetchJson<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const body = await requestText(url, options);
  try {
    return JSON.parse(body) as T;
  } catch {
    throw new UpstreamError('Response was not valid JSON', undefined, url);
  }
}

/** GET a URL and return the raw body (used for CSV endpoints). */
export async function fetchText(url: string, options: RequestOptions = {}): Promise<string> {
  return requestText(url, { headers: { Accept: 'text/plain' }, ...options });
}
