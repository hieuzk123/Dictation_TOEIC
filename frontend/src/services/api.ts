import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  ToeicTest,
  AudioItemSummary,
  AudioItemDetail,
  SubmitStudyRequest,
  SubmitStudyResponse,
  StudyHistory
} from '../types';

const TOKEN_KEY = 'toeic_dictation_token';
const REFRESH_TOKEN_KEY = 'toeic_dictation_refresh_token';

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),
  set: (token: string, refreshToken?: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },
  remove: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function performTokenRefresh(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) {
    tokenStorage.remove();
    return null;
  }

  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      tokenStorage.remove();
      return null;
    }

    const data: AuthResponse = await res.json();
    tokenStorage.set(data.token, data.refreshToken);
    return data.token;
  } catch {
    tokenStorage.remove();
    return null;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let token = tokenStorage.get();
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(endpoint, {
    ...options,
    headers,
  });

  // If 401 and not an authentication endpoint, attempt silent refresh once
  if (
    response.status === 401 &&
    !endpoint.startsWith('/api/auth/login') &&
    !endpoint.startsWith('/api/auth/register') &&
    !endpoint.startsWith('/api/auth/refresh')
  ) {
    const refreshToken = tokenStorage.getRefreshToken();
    if (refreshToken) {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = performTokenRefresh().finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;
      if (newToken) {
        const retryHeaders = new Headers(options.headers || {});
        retryHeaders.set('Content-Type', 'application/json');
        retryHeaders.set('Authorization', `Bearer ${newToken}`);
        response = await fetch(endpoint, {
          ...options,
          headers: retryHeaders,
        });
      }
    }
  }

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorBody = await response.json();
      errorMessage = errorBody.message || errorBody.error || errorMessage;
    } catch {
      // If response is not JSON
    }

    if (response.status === 401) {
      tokenStorage.remove();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('toeic:auth-expired'));
      }
    }

    throw new Error(errorMessage);
  }

  // Handle empty responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  auth: {
    login: (credentials: LoginRequest): Promise<AuthResponse> => {
      return request<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    },

    register: (data: RegisterRequest): Promise<AuthResponse> => {
      return request<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    refreshToken: (refreshToken: string): Promise<AuthResponse> => {
      return request<AuthResponse>('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    },

    getMe: (): Promise<User> => {
      return request<User>('/api/auth/me');
    },
  },

  toeic: {
    getTests: (): Promise<ToeicTest[]> => {
      return request<ToeicTest[]>('/api/tests');
    },

    getTestItems: (testId: number, part?: number, search?: string): Promise<AudioItemSummary[]> => {
      const params = new URLSearchParams();
      if (part) params.append('part', part.toString());
      if (search && search.trim()) params.append('search', search.trim());
      const query = params.toString() ? `?${params.toString()}` : '';
      return request<AudioItemSummary[]>(`/api/tests/${testId}/items${query}`);
    },

    getItemDetail: (itemId: number): Promise<AudioItemDetail> => {
      return request<AudioItemDetail>(`/api/items/${itemId}`);
    },
  },

  study: {
    submit: (data: SubmitStudyRequest): Promise<SubmitStudyResponse> => {
      return request<SubmitStudyResponse>('/api/study/submit', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    getHistory: (): Promise<StudyHistory[]> => {
      return request<StudyHistory[]>('/api/study/history');
    },

    getHistoryDetail: (id: number): Promise<StudyHistory> => {
      return request<StudyHistory>(`/api/study/history/${id}`);
    },
  },
};
