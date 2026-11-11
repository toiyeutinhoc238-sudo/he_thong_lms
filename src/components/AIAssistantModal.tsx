import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  BookOpen, 
  Lightbulb, 
  HelpCircle,
  CheckCircle2
} from 'lucide-react';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  sender: 'ai' | 'user';
  text: string;
  time: string;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose }) => {
  const { activeCourse, currentUser } = useApp();

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: `Xin chào ${currentUser.name}! Tôi là Trợ lý AI của Canvas LMS. Tôi có thể giúp bạn tóm tắt bài học, giải thích các khái niệm trong khóa học "${activeCourse?.name || 'Khóa học'}", hoặc hướng dẫn bạn làm bài tập. Bạn cần hỗ trợ gì?`,
      time: 'Vừa xong'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  if (!isOpen) return null;

  const quickPrompts = [
    'Tóm tắt nội dung bài học này',
    'Giải thích khái niệm cốt lõi',
    'Tạo 3 câu hỏi trắc nghiệm ôn tập',
    'Kiểm tra hạn nộp bài tập sắp tới'
  ];

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg: Message = {
      sender: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);

    setTimeout(() => {
      let reply = '';
      const lower = text.toLowerCase();
      if (lower.includes('tóm tắt')) {
        reply = `📖 **Tóm tắt bài học**: Nội dung tập trung vào nguồn gốc phát triển của Trí tuệ Nhân tạo (AI), các bước ngoặt lịch sử từ máy tính Turing đến mô hình học máy hiện đại, và quyền quyết định của con người trong việc ứng dụng công nghệ an toàn.`;
      } else if (lower.includes('trắc nghiệm') || lower.includes('câu hỏi')) {
        reply = `🎯 **3 Câu hỏi ôn tập nhanh:**\n1. AI truyền thống khác với Generative AI ở điểm mấu chốt nào?\n2. Ai là người đầu tiên đặt ra phép thử Turing Test vào năm 1950?\n3. Ba nguyên tắc đạo đức cốt lõi khi ứng dụng AI trong giáo dục là gì?`;
      } else if (lower.includes('hạn nộp') || lower.includes('bài tập')) {
        reply = `⏰ **Lịch trình cần làm:** Bạn có bài kiểm tra nhận thức và video tương tác trong mô-đun. Hãy hoàn thành trước hạn chót để hệ thống ghi nhận điểm tích lũy!`;
      } else {
        reply = `💡 Cảm ơn câu hỏi của bạn về "${text}". Đối với nội dung này trong chương trình học Canvas LMS, bạn nên xem kỹ các tài liệu bài giảng và tham gia thảo luận với các bạn cùng lớp để nắm vững kiến thức nhé!`;
      }

      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsThinking(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-2xs flex justify-end animate-in fade-in">
      <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-sky-50 to-indigo-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0374b5] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>Trợ lý Học tập AI</span>
                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                  Online
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Canvas LMS AI Assistant
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick prompt chips */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/70 overflow-x-auto flex gap-1.5 scrollbar-none">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p)}
              className="shrink-0 px-2.5 py-1 bg-white hover:bg-sky-50 border border-slate-200 hover:border-[#0374b5] rounded-full text-[11px] text-slate-700 font-medium transition-colors"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {messages.map((m, idx) => (
            <div 
              key={idx} 
              className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <div className="w-7 h-7 rounded-full bg-[#0374b5] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div 
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                  m.sender === 'user' 
                    ? 'bg-[#0374b5] text-white rounded-br-xs' 
                    : 'bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200/80 whitespace-pre-line'
                }`}
              >
                {m.text}
                <span className={`block text-[10px] mt-1 text-right ${m.sender === 'user' ? 'text-white/70' : 'text-slate-400'}`}>
                  {m.time}
                </span>
              </div>
              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isThinking && (
            <div className="flex items-center gap-2 text-xs text-slate-400 italic">
              <Bot className="w-4 h-4 animate-spin text-[#0374b5]" />
              <span>Trợ lý AI đang suy nghĩ...</span>
            </div>
          )}
        </div>

        {/* Input footer */}
        <div className="p-3 border-t border-slate-200 bg-white">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Nhập câu hỏi của bạn..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#0374b5] focus:bg-white"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 bg-[#0374b5] hover:bg-[#025a8c] disabled:opacity-40 text-white rounded-xl transition-colors shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
