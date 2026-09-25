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

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  remove: (): void => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get();
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

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

    getMe: (): Promise<User> => {
      return request<User>('/api/auth/me');
    },
  },

  toeic: {
    getTests: (): Promise<ToeicTest[]> => {
      return request<ToeicTest[]>('/api/tests');
    },

    getTestItems: (testId: number, part?: number): Promise<AudioItemSummary[]> => {
      const query = part ? `?part=${part}` : '';
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
