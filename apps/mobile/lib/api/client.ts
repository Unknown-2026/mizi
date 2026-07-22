import { fetch, type FetchRequestInit } from 'expo/fetch';

type JsonBody = Record<string, unknown> | unknown[];

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly data: unknown,
  ) {
    super(`API request failed with status ${status}`);
    this.name = 'ApiError';
  }
}

function getApiUrl(path: string) {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error('EXPO_PUBLIC_API_URL is not configured. Copy .env.example to .env.');
  }

  return new URL(path.replace(/^\//, ''), `${baseUrl.replace(/\/$/, '')}/`).toString();
}

async function parseResponse(response: Response) {
  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get('content-type');
  return contentType?.includes('application/json') ? response.json() : response.text();
}

async function request<T>(path: string, init?: FetchRequestInit): Promise<T> {
  const response = await fetch(getApiUrl(path), init);
  const data = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(response.status, data);
  }

  return data as T;
}

function jsonRequest<T>(method: 'POST' | 'PUT' | 'PATCH', path: string, body?: JsonBody) {
  return request<T>(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export const apiClient = {
  get: <T>(path: string, init?: FetchRequestInit) => request<T>(path, init),
  post: <T>(path: string, body?: JsonBody) => jsonRequest<T>('POST', path, body),
  put: <T>(path: string, body?: JsonBody) => jsonRequest<T>('PUT', path, body),
  patch: <T>(path: string, body?: JsonBody) => jsonRequest<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
