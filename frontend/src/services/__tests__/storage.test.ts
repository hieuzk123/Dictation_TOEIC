import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storage } from '../storage';

describe('Storage Service (Auto-Save & Onboarding)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should save draft and retrieve it correctly', () => {
    const draftData = {
      mode: 'MEDIUM' as const,
      activeSegmentIndex: 2,
      userInputs: { 1: { 0: 'hello', 1: 'world' } },
      fullTextInputs: { 1: 'hello world' },
      checkedSegmentIds: new Set([1]),
      revealedSegmentIds: new Set([1]),
    };

    storage.saveDraft(101, draftData);
    expect(storage.hasDraft(101)).toBe(true);

    const retrieved = storage.getDraft(101);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.itemId).toBe(101);
    expect(retrieved?.mode).toBe('MEDIUM');
    expect(retrieved?.activeSegmentIndex).toBe(2);
    expect(retrieved?.userInputs[1][0]).toBe('hello');
    expect(retrieved?.checkedSegmentIds).toEqual([1]);
  });

  it('should return null when retrieving non-existent draft', () => {
    const draft = storage.getDraft(999);
    expect(draft).toBeNull();
    expect(storage.hasDraft(999)).toBe(false);
  });

  it('should clear an existing draft', () => {
    storage.saveDraft(102, {
      mode: 'HARD',
      activeSegmentIndex: 0,
      userInputs: {},
      fullTextInputs: {},
      checkedSegmentIds: [],
      revealedSegmentIds: [],
    });

    expect(storage.hasDraft(102)).toBe(true);
    storage.clearDraft(102);
    expect(storage.hasDraft(102)).toBe(false);
    expect(storage.getDraft(102)).toBeNull();
  });

  it('should expire and remove draft older than 7 days', () => {
    const EIGHT_DAYS_AGO = Date.now() - 8 * 24 * 60 * 60 * 1000;
    const oldDraft = {
      itemId: 103,
      mode: 'MEDIUM',
      activeSegmentIndex: 0,
      userInputs: {},
      fullTextInputs: {},
      checkedSegmentIds: [],
      revealedSegmentIds: [],
      updatedAt: EIGHT_DAYS_AGO,
    };

    localStorage.setItem('toeic_dictation_draft_103', JSON.stringify(oldDraft));

    // getDraft should detect age > 7 days and prune it
    const result = storage.getDraft(103);
    expect(result).toBeNull();
    expect(localStorage.getItem('toeic_dictation_draft_103')).toBeNull();
  });

  it('should manage onboarding seen flag correctly', () => {
    expect(storage.isOnboardingSeen()).toBe(false);

    storage.setOnboardingSeen();
    expect(storage.isOnboardingSeen()).toBe(true);
  });
});
