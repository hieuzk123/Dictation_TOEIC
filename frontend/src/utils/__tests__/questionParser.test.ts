import { describe, it, expect } from 'vitest';
import { parseQuickPasteQuestions } from '../questionParser';

describe('questionParser utility', () => {
  it('returns empty array for empty string or whitespace', () => {
    expect(parseQuickPasteQuestions('')).toEqual([]);
    expect(parseQuickPasteQuestions('   \n  ')).toEqual([]);
  });

  it('correctly parses standard ETS formatted questions with options and answers', () => {
    const rawText = `
32. Where does the conversation most likely take place?
A. At a hotel
B. At a library
C. At a restaurant
D. At an airport
Đáp án: B
Giải thích: Người phụ nữ nói về việc mượn sách.

33. What problem does the woman mention?
A. The computer is broken
B. The book is unavailable
C. The room is noisy
D. The door is locked
Đáp án: A
Giải thích: Hệ thống máy tính báo lỗi.

34. What will the man do next?
A. Call a technician
B. Offer a refund
C. Check the catalog
D. Give directions
Đáp án: C
Giải thích: Người đàn ông đề nghị kiểm tra danh mục trên giá.
`;

    const parsed = parseQuickPasteQuestions(rawText);
    expect(parsed).toHaveLength(3);

    expect(parsed[0].questionNumber).toBe(32);
    expect(parsed[0].questionText).toBe('Where does the conversation most likely take place?');
    expect(parsed[0].optionA).toBe('At a hotel');
    expect(parsed[0].optionB).toBe('At a library');
    expect(parsed[0].optionC).toBe('At a restaurant');
    expect(parsed[0].optionD).toBe('At an airport');
    expect(parsed[0].correctOption).toBe('B');
    expect(parsed[0].explanation).toBe('Người phụ nữ nói về việc mượn sách.');

    expect(parsed[1].questionNumber).toBe(33);
    expect(parsed[1].correctOption).toBe('A');

    expect(parsed[2].questionNumber).toBe(34);
    expect(parsed[2].correctOption).toBe('C');
  });

  it('handles variations with "Câu", parentheses, and "Answer: D"', () => {
    const rawText = `
Câu 71: Who is the speaker?
(A) A tour guide
(B) A train conductor
(C) A museum curator
(D) An architect
Answer: A
Explanation: Welcome to our historical walking tour.
`;

    const parsed = parseQuickPasteQuestions(rawText);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].questionNumber).toBe(71);
    expect(parsed[0].questionText).toBe('Who is the speaker?');
    expect(parsed[0].optionA).toBe('A tour guide');
    expect(parsed[0].optionB).toBe('A train conductor');
    expect(parsed[0].optionC).toBe('A museum curator');
    expect(parsed[0].optionD).toBe('An architect');
    expect(parsed[0].correctOption).toBe('A');
    expect(parsed[0].explanation).toBe('Welcome to our historical walking tour.');
  });
});
