import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FullPassageDictation } from '../FullPassageDictation';
import type { AudioItemDetail } from '../../types';

describe('FullPassageDictation', () => {
  const mockItem: AudioItemDetail = {
    id: 1,
    testId: 1,
    part: 3,
    itemNumber: 32,
    title: 'Office Supply Toner Order',
    audioUrl: '/audio/test.mp3',
    totalDuration: 30,
    totalSegments: 2,
    segments: [
      {
        id: 101,
        itemId: 1,
        segmentIndex: 1,
        speaker: 'Woman',
        startTime: 0,
        endTime: 5,
        fullTranscript: 'Mark, did you order toner?',
        totalWords: 5,
        keywordCount: 2,
        tokens: [
          { word: 'Mark', isKeyword: true },
          { word: 'did', isKeyword: false },
          { word: 'you', isKeyword: false },
          { word: 'order', isKeyword: true },
          { word: 'toner?', isKeyword: true },
        ],
      },
    ],
    questions: [
      {
        id: 1,
        questionNumber: 32,
        questionText: 'What are the speakers discussing?',
        optionA: 'Ordering toner',
        optionB: 'Repairing elevator',
        optionC: 'Hiring consultant',
        optionD: 'Organizing slides',
      },
      {
        id: 2,
        questionNumber: 33,
        questionText: 'Why cannot items be delivered?',
        optionA: 'Fee expensive',
        optionB: 'Supplier out of stock',
        optionC: 'Store closed',
        optionD: 'Account expired',
      },
      {
        id: 3,
        questionNumber: 34,
        questionText: 'What does the man offer to do?',
        optionA: 'Call local store',
        optionB: 'Print brochures',
        optionC: 'Cancel meeting',
        optionD: 'Submit expense',
      },
    ],
  };

  it('should render questions and disable submit button when not all questions answered', () => {
    const handleSubmit = vi.fn();
    const handleAnswerQuestion = vi.fn();

    render(
      <FullPassageDictation
        item={mockItem}
        clozeDensity={50}
        onChangeDensity={vi.fn()}
        userInputs={{}}
        onChangeWord={vi.fn()}
        questionAnswers={{ 1: 'A', 2: 'B' }} // Question 3 is missing!
        onChangeQuestionAnswer={handleAnswerQuestion}
        onSubmit={handleSubmit}
        onBack={vi.fn()}
      />
    );

    expect(screen.getByText(/Câu hỏi trắc nghiệm TOEIC/)).toBeInTheDocument();
    expect(screen.getByText('What are the speakers discussing?')).toBeInTheDocument();
    expect(screen.getByText('Why cannot items be delivered?')).toBeInTheDocument();
    expect(screen.getByText('What does the man offer to do?')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Nộp bài/i });
    expect(submitBtn).toBeDisabled();
  });

  it('should enable submit button and call onSubmit when all 3 questions are answered', () => {
    const handleSubmit = vi.fn();

    render(
      <FullPassageDictation
        item={mockItem}
        clozeDensity={50}
        onChangeDensity={vi.fn()}
        userInputs={{}}
        onChangeWord={vi.fn()}
        questionAnswers={{ 1: 'A', 2: 'B', 3: 'A' }} // All 3 answered
        onChangeQuestionAnswer={vi.fn()}
        onSubmit={handleSubmit}
        onBack={vi.fn()}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Nộp bài/i });
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });
});
