import type { CreateQuestionRequest } from '../types';

/**
 * Parses quick-pasted text into an array of CreateQuestionRequest objects.
 * Supports standard ETS format and Vietnamese prep book formats:
 * - Question number: "32. Question text" or "Câu 32: Question text"
 * - Options: "A. Option A", "(A) Option A", "A) Option A"
 * - Correct answer: "Đáp án: B", "Key: B", "Answer: B", "Correct: B"
 * - Explanation: "Giải thích: Reason..." or "Explanation: Reason..."
 */
export function parseQuickPasteQuestions(rawText: string): CreateQuestionRequest[] {
  if (!rawText || !rawText.trim()) {
    return [];
  }

  // Split into question blocks matching start of question:
  // e.g. "32.", "Câu 32:", "Question 32.", "32)"
  const questionBlocks = rawText
    .split(/(?=(?:^|\n)\s*(?:(?:Question|Câu)\s*)?\d+[\.\:\)])/i)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);

  const results: CreateQuestionRequest[] = [];

  for (const block of questionBlocks) {
    // 1. Match question header
    const headerMatch = block.match(/^(?:(?:Question|Câu)\s*)?(\d+)[\.\:\)]\s*(.+?)(?=\r?\n|$)/i);
    if (!headerMatch) continue;

    const questionNumber = parseInt(headerMatch[1], 10);
    const questionText = headerMatch[2].trim();

    // 2. Match Options A, B, C, D
    const optAMatch = block.match(/(?:^|\n)\s*(?:[\(\[]?A[\)\]\.]|\bA\b[\.\)])\s*([^\r\n]+)/i);
    const optBMatch = block.match(/(?:^|\n)\s*(?:[\(\[]?B[\)\]\.]|\bB\b[\.\)])\s*([^\r\n]+)/i);
    const optCMatch = block.match(/(?:^|\n)\s*(?:[\(\[]?C[\)\]\.]|\bC\b[\.\)])\s*([^\r\n]+)/i);
    const optDMatch = block.match(/(?:^|\n)\s*(?:[\(\[]?D[\)\]\.]|\bD\b[\.\)])\s*([^\r\n]+)/i);

    // 3. Match Correct Option
    const correctMatch = block.match(
      /(?:Đáp án(?: đúng)?|Answer|Key|Correct(?: Option)?)\s*[:\-\s]\s*[\(\[]?([ABCD])[\)\]]?/i
    );

    // 4. Match Explanation
    const expMatch = block.match(/(?:Giải thích|Explanation)\s*[:\-\s]\s*([^\r\n]+(?:\r?\n[^\r\n]+)*)/i);

    // Clean up explanation if it was captured inside option or block
    let explanation = expMatch ? expMatch[1].trim() : '';
    // Strip trailing answer or explanation keywords if captured in options
    const cleanOption = (opt: string | undefined): string => {
      if (!opt) return '';
      return opt
        .replace(/(?:Đáp án(?: đúng)?|Answer|Key|Correct|Giải thích|Explanation)[\s\S]*$/i, '')
        .trim();
    };

    results.push({
      questionNumber,
      questionText,
      optionA: cleanOption(optAMatch ? optAMatch[1] : ''),
      optionB: cleanOption(optBMatch ? optBMatch[1] : ''),
      optionC: cleanOption(optCMatch ? optCMatch[1] : ''),
      optionD: cleanOption(optDMatch ? optDMatch[1] : ''),
      correctOption: correctMatch ? correctMatch[1].toUpperCase() : 'A',
      explanation: explanation || undefined,
    });
  }

  return results;
}
