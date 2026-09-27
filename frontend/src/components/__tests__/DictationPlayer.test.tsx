import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
});
