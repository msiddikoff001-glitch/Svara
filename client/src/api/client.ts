/**
 * Tiny fetch wrapper.
 *
 * Today the app runs entirely on mocks (see `api/*.ts`). The wrapper is here
 * so when a real backend is wired up:
 *
 *   1. Set `VITE_API_BASE_URL` in `.env` (e.g. https://api.svara.app/v1).
 *   2. Swap the mock body of each endpoint module for `httpRequest(...)` or
 *      `httpRequestParsed(schema, ...)` calls.
 *
 * `httpRequest`         — typed at compile time, no runtime check.
 * `httpRequestParsed`   — same, plus a Zod schema validates the response
 *                          before the caller sees it. Use this for every
 *                          endpoint whose schema lives in
 *                          `src/shared/protocol/api/schemas.ts`.
 *
 * No third dependency is needed — `fetch` + zod is enough for a Mini App.
 */

import type { z } from 'zod';

import { validateApiResponse } from '../shared/protocol';

const BASE_URL: string = import.meta.env?.VITE_API_BASE_URL ?? '';

const buildUrl = (path: string): string => {
  if (/^https?:/i.test(path)) return path;
  if (!BASE_URL) return path;
  return `${BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
};

const getTelegramInitData = (): string | null => {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp?.initData ?? null;
};

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface HttpRequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export const httpRequest = async <T = unknown>(
  path: string,
  { method = 'GET', body, headers, signal }: HttpRequestOptions = {},
): Promise<T | null> => {
  const initData = getTelegramInitData();
  const response = await fetch(buildUrl(path), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(initData ? { 'X-Telegram-Init-Data': initData } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`API ${method} ${path} failed (${response.status}): ${text}`);
  }

  if (response.status === 204) return null;
  return (await response.json()) as T;
};

/**
 * Like {@link httpRequest} but validates the JSON body against `schema`
 * before returning. Throws on validation failure with the offending
 * issues attached so callers don't silently consume malformed data.
 *
 * Use this from endpoint modules:
 *   return httpRequestParsed(UserSchema, '/me');
 */
export const httpRequestParsed = async <T>(
  schema: z.ZodType<T>,
  path: string,
  options?: HttpRequestOptions,
): Promise<T | null> => {
  const raw = await httpRequest<unknown>(path, options);
  if (raw === null) return null;
  const result = validateApiResponse(schema, raw);
  if (!result.ok) {
    if (typeof console !== 'undefined') console.error('[api] schema mismatch', path, result.error.issues);
    throw new Error(`API ${path} returned invalid payload`);
  }
  return result.data;
};
