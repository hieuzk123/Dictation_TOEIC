import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ResultModal } from '../ResultModal';
import type { SubmitStudyResponse } from '../../types';

describe('ResultModal Component', () => {
  const mockResultWithSegmentResults: SubmitStudyResponse = {
    historyId: 101,
    itemId: 1,
    mode: 'MEDIUM',
    accuracyRate: 85.5,
    totalWords: 20,
    correctWords: 17,
    replaysCount: 2,
    wrongSegmentsCount: 1,
    segmentResults: [
      {
        segmentId: 1,
        segmentIndex: 1,
        totalWords: 10,
        correctWords: 10,
        isPerfect: true,
        fullTranscript: 'Hello world from TOEIC dictation',
        wordResults: [
          { wordIndex: 0, targetWord: 'Hello', userWord: 'Hello', isCorrect: true },
          { wordIndex: 1, targetWord: 'world', userWord: 'world', isCorrect: true },
        ],
      },
      {
        segmentId: 2,
        segmentIndex: 2,
        totalWords: 10,
        correctWords: 7,
        isPerfect: false,
        fullTranscript: 'This is a practice audio session',
        wordResults: [
          { wordIndex: 0, targetWord: 'This', userWord: 'This', isCorrect: true },
          { wordIndex: 1, targetWord: 'practice', userWord: 'practise', isCorrect: false },
        ],
      },
    ],
  };

  it('renders modal banner, accuracy rate and segment results from segmentResults', () => {
    render(
      <ResultModal
        result={mockResultWithSegmentResults}
        onClose={vi.fn()}
        onRetry={vi.fn()}
        onBackToTests={vi.fn()}
      />
    );

    expect(screen.getByText('Kết Quả Luyện Nghe Dictation')).toBeInTheDocument();
    expect(screen.getByText('85.5%')).toBeInTheDocument();
    expect(screen.getByText('17 / 20')).toBeInTheDocument();
    expect(screen.getByText('2 lần')).toBeInTheDocument();
    expect(screen.getByText('1 câu')).toBeInTheDocument();
    expect(screen.getByText('Câu 1')).toBeInTheDocument();
    expect(screen.getByText('Câu 2')).toBeInTheDocument();
  });

  it('renders correctly when given results field instead of segmentResults', () => {
    const mockLegacyResult: SubmitStudyResponse = {
      ...mockResultWithSegmentResults,
      segmentResults: undefined,
      results: mockResultWithSegmentResults.segmentResults,
    };

    render(
      <ResultModal
        result={mockLegacyResult}
        onClose={vi.fn()}
        onRetry={vi.fn()}
        onBackToTests={vi.fn()}
      />
    );

    expect(screen.getByText('85.5%')).toBeInTheDocument();
    expect(screen.getByText('Câu 1')).toBeInTheDocument();
  });

  it('triggers onOpenHistory when Xem lịch sử button is clicked', () => {
    const onOpenHistory = vi.fn();
    render(
      <ResultModal
        result={mockResultWithSegmentResults}
        onClose={vi.fn()}
        onRetry={vi.fn()}
        onBackToTests={vi.fn()}
        onOpenHistory={onOpenHistory}
      />
    );

    const historyBtn = screen.getByText('Xem lịch sử');
    fireEvent.click(historyBtn);
    expect(onOpenHistory).toHaveBeenCalledTimes(1);
  });

  it('renders 2-column score breakdown and question review when totalQuestions > 0', () => {
    const mockResultWithQuestions: SubmitStudyResponse = {
      ...mockResultWithSegmentResults,
      totalQuestions: 3,
      correctQuestions: 2,
      questionResults: [
        {
          questionId: 1,
          questionNumber: 32,
          selectedOption: 'B',
          correctOption: 'B',
          correct: true,
          explanation: 'Speaker mentions the meeting schedule.',
        },
        {
          questionId: 2,
          questionNumber: 33,
          selectedOption: 'A',
          correctOption: 'C',
          correct: false,
          explanation: 'The woman suggests ordering extra chairs.',
        },
      ],
    };

    render(
      <ResultModal
        result={mockResultWithQuestions}
        onClose={vi.fn()}
        onRetry={vi.fn()}
        onBackToTests={vi.fn()}
      />
    );

    expect(screen.getByText('Điểm Dictation')).toBeInTheDocument();
    expect(screen.getByText('Điểm Trắc Nghiệm ETS')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('/ 3')).toBeInTheDocument();
    expect(screen.getByText(/Chi tiết câu hỏi trắc nghiệm ETS/)).toBeInTheDocument();
    expect(screen.getByText('Câu 32')).toBeInTheDocument();
    expect(screen.getByText('Câu 33')).toBeInTheDocument();
    expect(screen.getByText('Speaker mentions the meeting schedule.', { exact: false })).toBeInTheDocument();
  });
});
