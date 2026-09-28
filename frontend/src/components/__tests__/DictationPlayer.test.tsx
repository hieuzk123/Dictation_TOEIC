import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DictationPlayer } from '../DictationPlayer';
import type { AudioItemDetail } from '../../types';

describe('DictationPlayer Component', () => {
  const mockItem: AudioItemDetail = {
    id: 1,
    testId: 1,
    part: 3,
    itemNumber: 32,
    title: 'Office Supply Toner Order',
    audioUrl: '/audio/test.mp3',
    totalDuration: 45.0,
    totalSegments: 2,
    segments: [
      {
        id: 10,
        itemId: 1,
        segmentIndex: 1,
        speaker: 'Man',
        startTime: 0.0,
        endTime: 4.5,
        fullTranscript: 'Hello world from TOEIC dictation',
        totalWords: 5,
        keywordCount: 2,
        tokens: [
          { word: 'Hello', start: 0.0, end: 0.8, isKeyword: true },
          { word: 'world', start: 0.9, end: 1.5, isKeyword: false },
          { word: 'from', start: 1.6, end: 2.0, isKeyword: false },
          { word: 'TOEIC', start: 2.1, end: 3.0, isKeyword: true },
          { word: 'dictation', start: 3.1, end: 4.5, isKeyword: false },
        ],
      },
      {
        id: 11,
        itemId: 1,
        segmentIndex: 2,
        speaker: 'Woman',
        startTime: 4.6,
        endTime: 8.0,
        fullTranscript: 'Thank you very much',
        totalWords: 4,
        keywordCount: 1,
        tokens: [
          { word: 'Thank', start: 4.6, end: 5.2, isKeyword: true },
          { word: 'you', start: 5.3, end: 5.8, isKeyword: false },
          { word: 'very', start: 5.9, end: 6.5, isKeyword: false },
          { word: 'much', start: 6.6, end: 7.9, isKeyword: false },
        ],
      },
    ],
  };

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders segment counter and speaker tag', () => {
    render(
      <DictationPlayer
        item={mockItem}
        onFinishSession={vi.fn()}
        onBack={vi.fn()}
        onOpenShortcuts={vi.fn()}
      />
    );

    expect(screen.getByText('Câu 1 / 2')).toBeInTheDocument();
    expect(screen.getByText('Man')).toBeInTheDocument();
  });

  it('toggles reveal transcript when Hiện đáp án button is clicked', () => {
    render(
      <DictationPlayer
        item={mockItem}
        onFinishSession={vi.fn()}
        onBack={vi.fn()}
        onOpenShortcuts={vi.fn()}
      />
    );

    const revealBtn = screen.getByText('Hiện đáp án');
    fireEvent.click(revealBtn);

    // Full transcript should now be visible
    expect(screen.getByText(/"Hello world from TOEIC dictation"/)).toBeInTheDocument();

    const hideBtn = screen.getByText('Ẩn đáp án');
    fireEvent.click(hideBtn);
  });

  it('switches to FULL_SENTENCE mode and renders full textarea', () => {
    render(
      <DictationPlayer
        item={mockItem}
        onFinishSession={vi.fn()}
        onBack={vi.fn()}
        onOpenShortcuts={vi.fn()}
      />
    );

    const fullSentenceBtn = screen.getByText('Cả câu');
    fireEvent.click(fullSentenceBtn);

    const textarea = screen.getByPlaceholderText('Gõ toàn bộ câu nghe được vào đây...');
    expect(textarea).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: 'Hello world from TOEIC' } });
    expect(textarea).toHaveValue('Hello world from TOEIC');
  });

  it('triggers onOpenShortcuts when Phím tắt button is clicked', () => {
    const onOpenShortcuts = vi.fn();
    render(
      <DictationPlayer
        item={mockItem}
        onFinishSession={vi.fn()}
        onBack={vi.fn()}
        onOpenShortcuts={onOpenShortcuts}
      />
    );

    const shortcutBtn = screen.getByText('Phím tắt');
    fireEvent.click(shortcutBtn);
    expect(onOpenShortcuts).toHaveBeenCalledTimes(1);
  });

  it('triggers onBack when return navigation button is clicked', () => {
    const onBack = vi.fn();
    render(
      <DictationPlayer
        item={mockItem}
        onFinishSession={vi.fn()}
        onBack={onBack}
        onOpenShortcuts={vi.fn()}
      />
    );

    const backBtn = screen.getByText(/Chọn bài khác/);
    fireEvent.click(backBtn);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('correctly blanks keywords in MEDIUM mode when tokens use snake_case is_keyword', () => {
    const snakeCaseItem: AudioItemDetail = {
      ...mockItem,
      segments: [
        {
          ...mockItem.segments[0],
          tokens: [
            { word: 'Mark', is_keyword: true } as any,
            { word: 'did', is_keyword: false } as any,
            { word: 'order', is_keyword: true } as any,
          ],
        },
      ],
    };

    render(
      <DictationPlayer
        item={snakeCaseItem}
        onFinishSession={vi.fn()}
        onBack={vi.fn()}
      />
    );

    // Stopword 'did' should be visible text
    expect(screen.getByText('did')).toBeInTheDocument();
    // Keywords 'Mark' and 'order' should be inputs, not static text spans
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBe(2);
    // Placeholder should be empty string
    expect(inputs[0]).toHaveAttribute('placeholder', '');
  });

  it('blanks words in HARD mode without first-letter hint placeholders', () => {
    render(
      <DictationPlayer
        item={mockItem}
        onFinishSession={vi.fn()}
        onBack={vi.fn()}
      />
    );

    const hardBtn = screen.getByText('Nâng cao');
    fireEvent.click(hardBtn);

    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThanOrEqual(3);
    inputs.forEach((input: HTMLElement) => {
      expect(input).toHaveAttribute('placeholder', '');
    });
  });

  it('allows changing cloze density between 30%, 50%, and 70%', () => {
    render(
      <DictationPlayer
        item={mockItem}
        onFinishSession={vi.fn()}
        onBack={vi.fn()}
      />
    );

    const btn30 = screen.getByRole('button', { name: '30%' });
    const btn70 = screen.getByRole('button', { name: '70%' });
    expect(btn30).toBeInTheDocument();
    expect(btn70).toBeInTheDocument();

    fireEvent.click(btn30);
    expect(btn30).toHaveClass('bg-brand-500');

    fireEvent.click(btn70);
    expect(btn70).toHaveClass('bg-brand-500');
  });
});
