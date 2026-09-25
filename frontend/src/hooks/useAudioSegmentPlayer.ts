import { useState, useEffect, useRef, useCallback } from 'react';

interface UseAudioSegmentPlayerProps {
  audioUrl: string;
  startTime: number;
  endTime: number;
  onSegmentEnd?: () => void;
}

export function useAudioSegmentPlayer({
  audioUrl,
  startTime,
  endTime,
  onSegmentEnd,
}: UseAudioSegmentPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(startTime);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [autoLoop, setAutoLoop] = useState<boolean>(false);
  const [replayCount, setReplayCount] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);

  // Initialize and update audio element
  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.preload = 'auto';
    audio.playbackRate = playbackRate;
    audio.volume = volume;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsReady(true);
      audio.currentTime = startTime;
      setCurrentTime(startTime);
    };

    const handleTimeUpdate = () => {
      const current = audio.currentTime;
      setCurrentTime(current);

      // Check if playback reached the segment end
      if (current >= endTime) {
        if (autoLoop) {
          audio.currentTime = startTime;
          audio.play().catch(() => {});
          setReplayCount((prev) => prev + 1);
        } else {
          audio.pause();
          setIsPlaying(false);
          audio.currentTime = startTime;
          setCurrentTime(startTime);
          if (onSegmentEnd) {
            onSegmentEnd();
          }
        }
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      audio.currentTime = startTime;
      setCurrentTime(startTime);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audioRef.current = null;
    };
  }, [audioUrl]);

  // Update segment boundaries when segment changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      audioRef.current.currentTime = startTime;
      setCurrentTime(startTime);
    }
  }, [startTime, endTime]);

  // Play active segment from start
  const playSegment = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = startTime;
    audioRef.current
      .play()
      .then(() => {
        setIsPlaying(true);
        setReplayCount((prev) => prev + 1);
      })
      .catch((err) => console.warn('Audio play prevented:', err));
  }, [startTime]);

  // Pause audio
  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      playSegment();
    }
  }, [isPlaying, pause, playSegment]);

  // Replay from segment startTime
  const replay = useCallback(() => {
    playSegment();
  }, [playSegment]);

  // Change playback speed
  const changeSpeed = useCallback((rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, []);

  // Skip 2 seconds forward/backward within segment bounds
  const seekRelative = useCallback((seconds: number) => {
    if (!audioRef.current) return;
    const newTime = Math.min(Math.max(audioRef.current.currentTime + seconds, startTime), endTime);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [startTime, endTime]);

  // Volume control
  const changeVolume = useCallback((newVol: number) => {
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
      setIsMuted(newVol === 0);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  return {
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    autoLoop,
    replayCount,
    volume,
    isMuted,
    isReady,
    playSegment,
    pause,
    togglePlay,
    replay,
    changeSpeed,
    setAutoLoop,
    seekRelative,
    changeVolume,
    toggleMute,
    setReplayCount,
  };
}
