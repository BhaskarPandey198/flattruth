const SERPAPI_ENDPOINT = 'https://serpapi.com/search.json';
const DEFAULT_TIMEOUT_MS = 12_000;

export type SerpApiParameter = string | number | boolean | undefined;
export type SerpApiParameters = Record<string, SerpApiParameter>;

export class SerpApiError extends Error {
  readonly code: 'missing_key' | 'timeout' | 'upstream_error' | 'invalid_response';
  readonly status: number | null;

  constructor(code: SerpApiError['code'], message: string, status: number | null = null) {
    super(message);
    this.name = 'SerpApiError';
    this.code = code;
    this.status = status;
  }
}

function configuredTimeout(): number {
  const parsed = Number(process.env.SERPAPI_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed >= 1_000 && parsed <= 30_000
    ? parsed
    : DEFAULT_TIMEOUT_MS;
}

export async function searchSerpApi(
  parameters: SerpApiParameters
): Promise<Record<string, unknown>> {
  const apiKey = process.env.SERPAPI_API_KEY?.trim();
  if (!apiKey) {
    throw new SerpApiError('missing_key', 'SERPAPI_API_KEY is not configured on the server.');
  }

  const url = new URL(SERPAPI_ENDPOINT);
  Object.entries(parameters).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, String(value));
  });
  url.searchParams.set('api_key', apiKey);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), configuredTimeout());

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new SerpApiError(
        'upstream_error',
        `SerpApi request failed with HTTP ${response.status}.`,
        response.status
      );
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new SerpApiError(
        'invalid_response',
        'SerpApi returned a non-JSON response.',
        response.status
      );
    }

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new SerpApiError(
        'invalid_response',
        'SerpApi returned an invalid response body.',
        response.status
      );
    }

    const result = payload as Record<string, unknown>;
    if (typeof result.error === 'string' && result.error.trim()) {
      throw new SerpApiError('upstream_error', result.error.trim(), response.status);
    }

    return result;
  } catch (error) {
    if (error instanceof SerpApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new SerpApiError('timeout', 'SerpApi request timed out.');
    }
    throw new SerpApiError('upstream_error', 'Unable to reach SerpApi.');
  } finally {
    clearTimeout(timeout);
  }
}
