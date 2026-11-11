import React, { useState, useEffect } from 'react';
import { Activity, QuizQuestion } from '../types';
import { useApp } from '../context/AppContext';
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  Sparkles, 
  RotateCcw,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuizEngineProps {
  activity: Activity;
  courseId: string;
  onFinish?: () => void;
}

export const QuizEngine: React.FC<QuizEngineProps> = ({ activity, courseId, onFinish }) => {
  const { submitQuiz, markActivityCompleted } = useApp();

  const questions: QuizQuestion[] = activity.quizQuestions || [];
  const timeLimitSeconds = (activity.timeLimitMinutes || 15) * 60;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(timeLimitSeconds);
  const [isSubmitted, setIsSubmitted] = useState(!!activity.quizResult);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [quizResult, setQuizResult] = useState(activity.quizResult || null);

  // Countdown timer
  useEffect(() => {
    if (isSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted]);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const toggleFlag = (questionId: string) => {
    setFlaggedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const handleSubmitQuiz = () => {
    let correctCount = 0;
    questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const maxScore = 10;
    const score = Number(((correctCount / (questions.length || 1)) * maxScore).toFixed(1));
    const passed = score >= (activity.passScore || 5.0);

    const result = {
      score,
      maxScore,
      passed,
      submittedAt: new Date().toLocaleString('vi-VN'),
      answers: selectedAnswers
    };

    setQuizResult(result);
    setIsSubmitted(true);
    setShowConfirmModal(false);

    // Persist to context
    submitQuiz(courseId, activity.id, score, maxScore, selectedAnswers);
    if (passed) {
      markActivityCompleted(courseId, activity.id);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(selectedAnswers).length;

  if (questions.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        Chưa có câu hỏi trắc nghiệm nào cho hoạt động này.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quiz Top bar: Info and Timer */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800">
            {activity.title}
          </h2>
          <p className="text-xs text-slate-500">
            Tổng cộng: {questions.length} câu • Điểm tối thiểu đạt: {activity.passScore || 5.0}/10
          </p>
        </div>

        {/* Timer Box */}
        {!isSubmitted ? (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm font-bold shadow-xs ${
            timeLeft < 180 
              ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse' 
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}>
            <Clock className="w-4 h-4" />
            <span>Thời gian còn lại: {formatTime(timeLeft)}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
            <CheckCircle2 className="w-4 h-4" />
            <span>Đã hoàn thành nộp bài</span>
          </div>
        )}
      </div>

      {/* Main Layout: Question Canvas & Palette Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Active Question */}
        <div className="lg:col-span-3 space-y-4">
          {/* Result Banner if Submitted */}
          {isSubmitted && quizResult && (
            <div className={`p-6 rounded-2xl border text-center space-y-2 ${
              quizResult.passed 
                ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 text-emerald-900' 
                : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200 text-red-900'
            }`}>
              <div className="w-12 h-12 mx-auto rounded-full bg-white flex items-center justify-center shadow-sm">
                <Award className={`w-7 h-7 ${quizResult.passed ? 'text-emerald-600' : 'text-red-500'}`} />
              </div>
              <h3 className="text-xl font-extrabold">
                {quizResult.passed ? 'Chúc mừng! Bạn đã ĐẠT bài kiểm tra' : 'Bạn chưa đạt điểm sàn tối thiểu'}
              </h3>
              <p className="text-sm">
                Điểm số đạt được: <strong className="text-2xl font-black">{quizResult.score}</strong> / {quizResult.maxScore}
              </p>
              <p className="text-xs opacity-75">
                Nộp bài lúc: {quizResult.submittedAt}
              </p>
            </div>
          )}

          {/* Question Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-hcmue-700 bg-hcmue-50 px-2.5 py-1 rounded-lg">
                Câu hỏi {currentIndex + 1} / {questions.length}
              </span>

              <button
                onClick={() => toggleFlag(currentQ.id)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg border transition-colors ${
                  flaggedQuestions[currentQ.id]
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{flaggedQuestions[currentQ.id] ? 'Đã đánh dấu xem lại' : 'Đánh dấu'}</span>
              </button>
            </div>

            {/* Question Text */}
            <h3 className="text-sm sm:text-base font-bold text-slate-800 leading-relaxed">
              {currentQ.question}
            </h3>

            {/* Options */}
            <div className="space-y-3">
              {currentQ.options.map((option, optIdx) => {
                const isSelected = selectedAnswers[currentQ.id] === optIdx;
                const isCorrect = currentQ.correctAnswer === optIdx;

                let optionStyle = 'border-slate-200 hover:border-hcmue-400 hover:bg-blue-50/30';
                if (isSelected) {
                  optionStyle = 'border-hcmue-600 bg-blue-50 text-hcmue-900 font-semibold ring-2 ring-hcmue-600/20';
                }

                if (isSubmitted) {
                  if (isCorrect) {
                    optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                  } else if (isSelected && !isCorrect) {
                    optionStyle = 'border-red-500 bg-red-50 text-red-900';
                  } else {
                    optionStyle = 'border-slate-200 opacity-60';
                  }
                }

                return (
                  <label
                    key={optIdx}
                    onClick={() => handleSelectOption(currentQ.id, optIdx)}
                    className={`flex items-start gap-3 p-3.5 sm:p-4 rounded-xl border cursor-pointer transition-all ${optionStyle}`}
                  >
                    <div className="w-6 h-6 rounded-full border flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                      {String.fromCharCode(65 + optIdx)}
                    </div>
                    <span className="text-xs sm:text-sm leading-relaxed flex-1">
                      {option}
                    </span>
                    {isSubmitted && isCorrect && (
                      <span className="text-xs font-bold text-emerald-600 shrink-0">✓ Đáp án đúng</span>
                    )}
                  </label>
                );
              })}
            </div>

            {/* Explanation box when submitted */}
            {isSubmitted && currentQ.explanation && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                <span className="font-bold text-hcmue-800">Giải thích chi tiết:</span>
                <p className="leading-relaxed">{currentQ.explanation}</p>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <button
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Câu trước</span>
              </button>

              <div className="flex items-center gap-2">
                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-hcmue-700 text-white hover:bg-hcmue-800"
                  >
                    <span>Câu tiếp theo</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : !isSubmitted ? (
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                  >
                    Nộp bài thi
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Question Palette Navigation */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Danh sách câu hỏi
            </h4>

            {/* Grid of question buttons */}
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = selectedAnswers[q.id] !== undefined;
                const isFlagged = flaggedQuestions[q.id];
                const isCurrent = currentIndex === idx;

                let btnStyle = 'bg-slate-100 text-slate-600 hover:bg-slate-200';
                if (isCurrent) {
                  btnStyle = 'ring-2 ring-hcmue-700 bg-hcmue-700 text-white font-bold';
                } else if (isFlagged) {
                  btnStyle = 'bg-amber-100 text-amber-800 font-bold border border-amber-300';
                } else if (isAnswered) {
                  btnStyle = 'bg-blue-100 text-hcmue-800 font-bold';
                }

                if (isSubmitted && quizResult) {
                  const isCorrect = selectedAnswers[q.id] === q.correctAnswer;
                  btnStyle = isCorrect ? 'bg-emerald-500 text-white font-bold' : 'bg-red-500 text-white font-bold';
                  if (isCurrent) btnStyle += ' ring-2 ring-slate-800';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${btnStyle}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Palette legend */}
            <div className="space-y-1.5 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-blue-100 border border-blue-300 inline-block" />
                <span>Đã trả lời ({answeredCount}/{questions.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-100 inline-block" />
                <span>Chưa trả lời</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300 inline-block" />
                <span>Đánh dấu xem lại</span>
              </div>
            </div>

            {/* Final Submit CTA */}
            {!isSubmitted && (
              <button
                onClick={() => setShowConfirmModal(true)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
              >
                Nộp bài kết thúc ({answeredCount}/{questions.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-slate-800 text-lg">
                Xác nhận nộp bài kiểm tra?
              </h3>
              <p className="text-xs text-slate-500">
                Bạn đã trả lời <strong>{answeredCount} / {questions.length}</strong> câu hỏi. Hệ thống sẽ ghi nhận và tính điểm trực tiếp.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
              >
                Tiếp tục làm bài
              </button>
              <button
                onClick={handleSubmitQuiz}
                className="flex-1 py-2.5 rounded-xl bg-hcmue-700 hover:bg-hcmue-800 text-white font-bold text-xs shadow-md shadow-hcmue-900/20"
              >
                Đồng ý nộp bài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

