import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AudioPlayerBar } from '../AudioPlayerBar';

describe('AudioPlayerBar Component', () => {
  const defaultProps = {
    isPlaying: false,
    onTogglePlay: vi.fn(),
    onReplay: vi.fn(),
    replayCount: 2,
    autoLoop: false,
    onToggleAutoLoop: vi.fn(),
    playbackRate: 1.0,
    onChangeSpeed: vi.fn(),
    currentTime: 10.5,
    startTime: 10.0,
    endTime: 15.0,
    volume: 0.8,
    isMuted: false,
    onToggleMute: vi.fn(),
    onChangeVolume: vi.fn(),
    onSeekRelative: vi.fn(),
  };

  it('renders segment time stamps accurately', () => {
    render(<AudioPlayerBar {...defaultProps} />);
    expect(screen.getByText(/Đoạn: 10.0s - 15.0s/)).toBeInTheDocument();
    expect(screen.getByText('x2')).toBeInTheDocument();
  });

  it('triggers onTogglePlay when play button is clicked', () => {
    const onTogglePlay = vi.fn();
    render(<AudioPlayerBar {...defaultProps} onTogglePlay={onTogglePlay} isPlaying={false} />);

    const playBtn = screen.getByTitle('Phát / Tạm dừng (Phím Space)');
    fireEvent.click(playBtn);
    expect(onTogglePlay).toHaveBeenCalledTimes(1);
  });

  it('triggers onReplay when Nghe lại button is clicked', () => {
    const onReplay = vi.fn();
    render(<AudioPlayerBar {...defaultProps} onReplay={onReplay} />);

    const replayBtn = screen.getByTitle('Nghe lại câu này từ đầu');
    fireEvent.click(replayBtn);
    expect(onReplay).toHaveBeenCalledTimes(1);
  });

  it('triggers relative seek when -2s and +2s buttons are clicked', () => {
    const onSeekRelative = vi.fn();
    render(<AudioPlayerBar {...defaultProps} onSeekRelative={onSeekRelative} />);

    const backBtn = screen.getByTitle('Tua lùi 2s');
    fireEvent.click(backBtn);
    expect(onSeekRelative).toHaveBeenCalledWith(-2);

    const forwardBtn = screen.getByTitle('Tua tới 2s');
    fireEvent.click(forwardBtn);
    expect(onSeekRelative).toHaveBeenCalledWith(2);
  });

  it('triggers onChangeSpeed when a speed pill is clicked', () => {
    const onChangeSpeed = vi.fn();
    render(<AudioPlayerBar {...defaultProps} onChangeSpeed={onChangeSpeed} />);

    const speedBtn = screen.getByText('0.75x');
    fireEvent.click(speedBtn);
    expect(onChangeSpeed).toHaveBeenCalledWith(0.75);
  });

  it('toggles auto-loop mode when clicked', () => {
    const onToggleAutoLoop = vi.fn();
    render(<AudioPlayerBar {...defaultProps} onToggleAutoLoop={onToggleAutoLoop} />);

    const loopBtn = screen.getByTitle('Tự động lặp lại câu này khi phát hết');
    fireEvent.click(loopBtn);
    expect(onToggleAutoLoop).toHaveBeenCalledTimes(1);
  });
});
