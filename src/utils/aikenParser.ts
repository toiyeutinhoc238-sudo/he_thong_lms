import { QuizQuestion } from '../types';

/**
 * Phân tích nhanh bộ câu hỏi trắc nghiệm từ định dạng chuẩn Aiken (.txt)
 * hoặc văn bản Word/Google Docs copy-paste kiểu Việt Nam:
 *   Câu 1: AI học hỏi từ đâu?
 *   A. Dữ liệu huấn luyện
 *   B. Bàn phím
 *   C. Màn hình
 *   D. Chuột máy tính
 *   ANSWER: A   (hoặc "Đáp án: A", hoặc đặt dấu * trước "*A. ...")
 */
export function parseBulkQuizText(rawText: string): QuizQuestion[] {
  const lines = String(rawText || '')
    .replace(/\r\n/g, '\n')
    .replace(/^\uFEFF/, '')
    .split('\n')
    .map(l => l.trim());

  const results: QuizQuestion[] = [];
  let currentQuestion = '';
  let currentOptions: string[] = [];
  let currentCorrect = -1;
  let currentExplanation = '';

  const flush = () => {
    if (currentQuestion && currentOptions.length >= 2) {
      results.push({
        id: `q-${Date.now()}-${results.length}-${Math.floor(Math.random() * 1000)}`,
        question: currentQuestion.replace(/^(?:Câu|Question|Bài)\s*\d+\s*[:.)\-]\s*/i, '').trim(),
        options: currentOptions,
        correctAnswer: currentCorrect >= 0 && currentCorrect < currentOptions.length ? currentCorrect : 0,
        ...(currentExplanation ? { explanation: currentExplanation } : {})
      });
    }
    currentQuestion = '';
    currentOptions = [];
    currentCorrect = -1;
    currentExplanation = '';
  };

  for (const line of lines) {
    if (!line) {
      if (currentQuestion && currentOptions.length >= 2) flush();
      continue;
    }

    // Dòng đáp án: ANSWER: B / Đáp án: B / Key: B
    const ansMatch = line.match(/^(?:ANSWER|ĐÁP\s*ÁN|DAP\s*AN|KEY)\s*[:\-]\s*([A-Fa-f])/i);
    if (ansMatch) {
      currentCorrect = ansMatch[1].toUpperCase().charCodeAt(0) - 65;
      continue;
    }

    // Dòng giải thích: Giải thích: ... / Explanation: ...
    const expMatch = line.match(/^(?:GIẢI\s*THÍCH|EXPLANATION)\s*[:\-]\s*(.+)$/i);
    if (expMatch) {
      currentExplanation = expMatch[1].trim();
      continue;
    }

    // Dòng phương án: A. ... / *A. ... / B) ...
    const optMatch = line.match(/^(\*?)\s*([A-Fa-f])\s*[.)]\s+(.+)$/);
    if (optMatch && currentQuestion) {
      const isMarkedCorrect = optMatch[1] === '*';
      const optIdx = currentOptions.length;
      currentOptions.push(optMatch[3].trim());
      if (isMarkedCorrect) currentCorrect = optIdx;
      continue;
    }

    // Nếu đã có đủ options mà gặp dòng mới không phải đáp án -> bắt đầu câu hỏi mới
    if (currentQuestion && currentOptions.length >= 2) {
      flush();
    }

    currentQuestion = currentQuestion ? `${currentQuestion} ${line}` : line;
  }

  flush();
  return results;
}
