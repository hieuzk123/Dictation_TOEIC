export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  createdAt?: string;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  tokenType: string;
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  user?: User;
}

export interface ToeicTest {
  id: number;
  title: string;
  year: number;
  testNumber: number;
  description: string;
  totalItems?: number;
}

export interface TokenItem {
  raw?: string;
  word: string;
  start?: number;
  start_time?: number;
  end?: number;
  end_time?: number;
  isKeyword?: boolean;
  is_keyword?: boolean;
}

export interface AudioSegment {
  id: number;
  itemId: number;
  segmentIndex: number;
  speaker: string;
  startTime: number;
  endTime: number;
  fullTranscript: string;
  totalWords: number;
  keywordCount: number;
  tokens: TokenItem[];
}

export interface AudioItemSummary {
  id: number;
  testId: number;
  part: number;
  itemNumber: number;
  title: string;
  audioUrl: string;
  totalDuration: number;
  totalSegments: number;
}

export interface AudioItemDetail extends AudioItemSummary {
  segments: AudioSegment[];
  questions?: ToeicQuestion[];
}

export interface ToeicQuestion {
  id: number;
  questionNumber: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  explanation?: string;
}

export interface QuestionResultDto {
  questionId: number;
  questionNumber: number;
  selectedOption?: string;
  correctOption: string;
  correct: boolean;
  explanation?: string;
}

export interface WordAnswerDto {
  wordIndex: number;
  targetWord: string;
  userWord: string;
}

export interface SegmentAnswerDto {
  segmentId: number;
  wordAnswers?: WordAnswerDto[];
  fullText?: string;
}

export type DictationMode = 'MEDIUM' | 'HARD' | 'FULL_SENTENCE';

export type ClozeDensity = 30 | 50 | 70;

export interface SubmitStudyRequest {
  itemId: number;
  mode: DictationMode;
  replaysCount: number;
  answers: SegmentAnswerDto[];
  questionAnswers?: Record<number, string>;
}

export interface WordResultDto {
  wordIndex: number;
  targetWord: string;
  userWord: string;
  isCorrect: boolean;
  isKeyword: boolean;
}

export interface SegmentResultDto {
  segmentId: number;
  segmentIndex: number;
  fullTranscript: string;
  isPerfect: boolean;
  totalWords: number;
  correctWords: number;
  wordResults: WordResultDto[];
}

export interface SubmitStudyResponse {
  historyId: number;
  itemId: number;
  mode: DictationMode;
  accuracyRate: number;
  totalWords: number;
  correctWords: number;
  replaysCount: number;
  wrongSegmentsCount: number;
  completedAt?: string;
  totalQuestions?: number;
  correctQuestions?: number;
  questionResults?: QuestionResultDto[];
  segmentResults?: SegmentResultDto[];
  results?: SegmentResultDto[];
}

export interface StudyHistory {
  id: number;
  itemId: number;
  itemTitle?: string;
  part?: number;
  mode: DictationMode;
  accuracyRate: number;
  replaysCount: number;
  wrongSegmentsCount: number;
  completedAt: string;
  detailsJson?: string;
}

export interface AdminStats {
  totalTests: number;
  totalAudioItems: number;
  totalSegments: number;
  totalUsers: number;
  totalStudySessions: number;
}

export interface AdminUploadResponse {
  itemId: number;
  title: string;
  audioUrl: string;
  totalSegments: number;
  message: string;
}

export interface CreateTestRequest {
  year: string;
  testNumber: number;
  title?: string;
  description?: string;
}

