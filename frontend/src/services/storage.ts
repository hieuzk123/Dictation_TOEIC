import type { DictationMode } from '../types';

export interface DictationDraft {
  itemId: number;
  mode: DictationMode;
  activeSegmentIndex: number;
  userInputs: Record<number, Record<number, string>>;
  fullTextInputs: Record<number, string>;
  checkedSegmentIds: number[];
  revealedSegmentIds: number[];
  updatedAt: number;
}

const STORAGE_PREFIX = 'toeic_dictation_draft_';

export const storage = {
  saveDraft: (
    itemId: number,
    data: {
      mode: DictationMode;
      activeSegmentIndex: number;
      userInputs: Record<number, Record<number, string>>;
      fullTextInputs: Record<number, string>;
      checkedSegmentIds: Set<number> | number[];
      revealedSegmentIds: Set<number> | number[];
    }
  ): void => {
    try {
      const draft: DictationDraft = {
        itemId,
        mode: data.mode,
        activeSegmentIndex: data.activeSegmentIndex,
        userInputs: data.userInputs,
        fullTextInputs: data.fullTextInputs,
        checkedSegmentIds: Array.isArray(data.checkedSegmentIds)
          ? data.checkedSegmentIds
          : Array.from(data.checkedSegmentIds),
        revealedSegmentIds: Array.isArray(data.revealedSegmentIds)
          ? data.revealedSegmentIds
          : Array.from(data.revealedSegmentIds),
        updatedAt: Date.now(),
      };
      localStorage.setItem(`${STORAGE_PREFIX}${itemId}`, JSON.stringify(draft));
    } catch (err) {
      console.warn('Failed to save dictation draft to LocalStorage:', err);
    }
  },

  getDraft: (itemId: number): DictationDraft | null => {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${itemId}`);
      if (!raw) return null;
      const draft = JSON.parse(raw) as DictationDraft;
      // Invalidate drafts older than 7 days
      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - draft.updatedAt > SEVEN_DAYS_MS) {
        localStorage.removeItem(`${STORAGE_PREFIX}${itemId}`);
        return null;
      }
      return draft;
    } catch (err) {
      console.warn('Failed to load dictation draft from LocalStorage:', err);
      return null;
    }
  },

  clearDraft: (itemId: number): void => {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${itemId}`);
    } catch (err) {
      console.warn('Failed to clear dictation draft from LocalStorage:', err);
    }
  },

  hasDraft: (itemId: number): boolean => {
    return localStorage.getItem(`${STORAGE_PREFIX}${itemId}`) !== null;
  },

  // Onboarding modal persistent state
  isOnboardingSeen: (): boolean => {
    return localStorage.getItem('toeic_onboarding_seen') === 'true';
  },

  setOnboardingSeen: (): void => {
    localStorage.setItem('toeic_onboarding_seen', 'true');
  },
};
