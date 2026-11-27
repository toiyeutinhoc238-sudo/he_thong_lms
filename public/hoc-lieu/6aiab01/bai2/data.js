// public/hoc-lieu/6aiab01/bai2/data.js
export const bai2Module = {
  id: 'module-lesson-2',
  courseId: '6AIAB01',
  order: 2,
  title: 'BÀI 2: LỢI ÍCH VÀ CÁCH SỬ DỤNG CÔNG CỤ AI PHÙ HỢP',
  description: 'Thời lượng: 01 tiết – 45 phút (Dạy học trực tuyến trên hệ thống LMS theo chu trình 5 thành phần – Yêu cầu cần đạt 6.A3.2).',
  learningObjectives: '• (6.A3.2) Trình bày được 3 lợi ích của AI trong học tập (học hỏi kiến thức mới, rèn luyện kĩ năng, mở rộng hiểu biết) khi sử dụng đúng mục đích.\n• Nắm công thức viết câu lệnh (Prompt) 3 thành phần: Bối cảnh (Ngữ cảnh) + Vai trò + Yêu cầu & định dạng cụ thể; tuân thủ Cẩm nang “4 KHÔNG” bảo vệ dữ liệu cá nhân.\n• Sử dụng công cụ AI phù hợp lứa tuổi hỗ trợ 1 nhiệm vụ học tập lớp 6 và tự tóm tắt 3–5 câu bằng ngôn ngữ riêng kèm đối chiếu SGK chuẩn bị Bài 3.',
  ownerName: '',
  activities: [
    {
      id: 'ai6-b2-act-1',
      moduleId: 'module-lesson-2',
      title: 'Tài liệu đọc: Giới thiệu tổng quan Bài 2 – Lợi ích và cách sử dụng công cụ AI phù hợp',
      type: 'document',
      durationMinutes: 5,
      isCompleted: false,
      isRequired: true,
      fileUrl: '/hoc-lieu/6aiab01/bai2/0.GioiThieuTongQuan.html',
      description: 'Tài liệu đọc giới thiệu tổng quan kèm sơ đồ cấu trúc 4 mạch nội dung Bài 2: Lợi ích và cách sử dụng công cụ AI phù hợp (YCCĐ 6.A3.2 · 01 tiết Trực tuyến).'
    },
    {
      id: 'ai6-b2-act-2',
      moduleId: 'module-lesson-2',
      title: 'Hoạt động 1 (Khởi động – Diễn đàn): Công cụ AI hỗ trợ em học tập như thế nào? (Hình 2.1 SGK)',
      type: 'forum',
      durationMinutes: 5,
      isCompleted: false,
      isRequired: true,
      description: 'SỔ TAY HƯỚNG DẪN 4 BƯỚC (45 PHÚT): (1) Khởi động Diễn đàn 5p → (2) Xem Video tương tác có 3 câu neo chặn, đọc Kiến thức trọng tâm & làm trắc nghiệm củng cố ≥ 7/10đ 15p → (3) Thực hành “Hỏi đúng – Trúng đáp án” 15p → (4) Viết tóm tắt “Nhà báo nhí” & Cầu nối Bài 3 (10p).\n\nCHỦ ĐỀ THẢO LUẬN (Gắn tình huống An, Minh, Khoa – Hình 2.1 SGK Bài 2):\nBạn Khoa dùng ứng dụng AI để luyện 5 câu hội thoại tiếng Anh về bảo vệ môi trường, sửa phát âm và giải thích từ mới rất rõ ràng. Hãy chia sẻ ngắn gọn 2 câu hỏi:\n1. Khi gặp một bài tập khó hoặc một khái niệm chưa hiểu rõ ở nhà, em thường làm gì để tìm sự trợ giúp?\n2. Nếu được sử dụng một công cụ AI hỗ trợ học tập phù hợp lứa tuổi, câu hỏi học tập đầu tiên em muốn nhờ công cụ đó giải thích là gì?\n\nLưu ý: Gõ tiếng Việt có dấu, lịch sự và tuyệt đối KHÔNG chia sẻ thông tin cá nhân (họ tên đầy đủ, địa chỉ nhà, số điện thoại, mật khẩu).'
    },
    {
      id: 'ai6-b2-act-video',
      moduleId: 'module-lesson-2',
      title: 'Hoạt động 2 (Video tương tác): Bí kíp giao tiếp với AI – Bối cảnh, Vai trò, Yêu cầu (06:28 · 3 câu neo chặn)',
      type: 'video',
      durationMinutes: 15,
      isCompleted: false,
      isRequired: true,
      videoUrl: 'https://www.youtube.com/watch?v=fmQWlfG3Rcs',
      videoDuration: 388,
      preventVideoSkip: true,
      description: 'Em xem video về cách viết câu lệnh cho AI. Video sẽ tự dừng ở 3 điểm để em trả lời câu hỏi; em cần trả lời đúng mới xem tiếp được. Hoàn thành khi xem hết video và vượt qua cả 3 câu hỏi. Sau đó đối chiếu với Hình 2.2, Hình 2.3 SGK Bài 2.',
      videoCheckpoints: [
        {
          id: 'b2-cp1',
          timeSeconds: 105,
          question: 'Qua ví dụ so sánh giữa câu lệnh “Viết về măng” và “Viết 3 câu bán măng sạch”, vì sao câu lệnh thứ hai giúp AI trả lời hữu ích hơn?',
          options: [
            'Vì câu lệnh thứ hai ngắn hơn và dùng dấu chấm than.',
            'Vì câu lệnh thứ hai giao việc rõ ràng, nêu cụ thể số lượng (3 câu) và mục đích sử dụng.',
            'Vì AI tự bỏ qua câu lệnh thứ nhất do đường truyền mạng.'
          ],
          correctAnswer: 1,
          explanation: 'AI trả lời dựa trên thông tin em đưa vào; yêu cầu càng rõ mục đích và số lượng thì kết quả càng sát nhu cầu.',
          requireCorrect: true
        },
        {
          id: 'b2-cp2',
          timeSeconds: 220,
          question: 'Công thức gồm 3 thành phần để viết một câu lệnh hiệu quả cho AI là gì?',
          options: [
            'Bối cảnh + Vai trò + Yêu cầu (nhiệm vụ) cụ thể.',
            'Tên điện thoại + Họ tên người dùng + Mật khẩu tài khoản.',
            'Lời khen công cụ AI + Thời gian chờ + Lời cảm ơn.'
          ],
          correctAnswer: 0,
          explanation: 'Câu lệnh rõ ràng gồm: Bối cảnh (em là ai, cần gì) + Vai trò của AI + Yêu cầu và cách trình bày cụ thể.',
          requireCorrect: true
        },
        {
          id: 'b2-cp3',
          timeSeconds: 330,
          question: 'Trong câu lệnh “Tôi là nông dân mới trồng sâm. Hãy đóng vai một chuyên gia nông nghiệp. Viết 3 gạch đầu dòng những lưu ý quan trọng nhất về tưới nước cho cây sâm 1 năm tuổi”, cụm nào là BỐI CẢNH?',
          options: [
            '“Hãy đóng vai một chuyên gia nông nghiệp”',
            '“Tôi là nông dân mới trồng sâm”',
            '“Viết 3 gạch đầu dòng những lưu ý quan trọng nhất”'
          ],
          correctAnswer: 1,
          explanation: '“Tôi là nông dân mới trồng sâm” cho AI biết người hỏi là ai – đó là Bối cảnh. “Đóng vai chuyên gia” là Vai trò, “Viết 3 gạch đầu dòng” là Yêu cầu.',
          requireCorrect: true
        }
      ]
    },
    {
      id: 'ai6-b2-act-3',
      moduleId: 'module-lesson-2',
      title: 'Hoạt động 2A (Kiến thức trọng tâm & Cẩm nang 4 KHÔNG): 3 Lợi ích của AI & Công thức Prompt 3 thành phần',
      type: 'document',
      durationMinutes: 10,
      isCompleted: false,
      isRequired: true,
      description: '1. BA LỢI ÍCH CỦA CÔNG CỤ AI KHI SỬ DỤNG ĐÚNG CÁCH (UNESCO 2023 – Hình 2.2 SGK):\n• Hỗ trợ học hỏi kiến thức mới: Giải thích khái niệm phức tạp bằng ngôn ngữ đơn giản, dễ hiểu cho học sinh lớp 6 kèm ví dụ minh họa gần gũi.\n• Rèn luyện kĩ năng học tập: Luyện phát âm ngoại ngữ, chỉnh sửa lỗi chính tả, tạo bộ câu hỏi trắc nghiệm tự ôn tập.\n• Mở rộng hiểu biết và tư duy: Đặt câu hỏi khám phá lịch sử, địa lí, khoa học, nghệ thuật để mở mang tri thức.\nLưu ý: KHÔNG dùng AI để làm thay toàn bộ bài tập hay sao chép thụ động.\n\n2. CÔNG THỨC VIẾT CÂU LỆNH (PROMPT) 3 THÀNH PHẦN (Hình 2.3 SGK):\n[1. BỐI CẢNH (NGỮ CẢNH)] + [2. VAI TRÒ CỦA AI] + [3. YÊU CẦU & ĐỊNH DẠNG CỤ THỂ]\n• Ví dụ chưa rõ (Câu lệnh A): “Nước tuần hoàn thế nào?”\n• Ví dụ đạt chuẩn (Câu lệnh B): “Em là học sinh lớp 6. Hãy đóng vai một giáo viên Khoa học tự nhiên, giải thích ngắn gọn quá trình tuần hoàn của nước trong tự nhiên bằng ngôn ngữ dễ hiểu trong 4 câu kèm 1 ví dụ thực tế.”\n\n3. CẨM NANG “4 KHÔNG” BẢO VỆ DỮ LIỆU CÁ NHÂN KHI TƯƠNG TÁC VỚI AI:\n1. KHÔNG nhập họ tên đầy đủ và ngày tháng năm sinh của bản thân hoặc người thân.\n2. KHÔNG cung cấp số điện thoại, địa chỉ nhà riêng hoặc tên trường, lớp đang học.\n3. KHÔNG tải lên hình ảnh khuôn mặt riêng tư hoặc các thông tin bí mật của gia đình.\n4. KHÔNG nhập mật khẩu tài khoản học tập, thư điện tử hoặc mạng xã hội vào ô trò chuyện AI.'
    },
    {
      id: 'ai6-b2-act-4',
      moduleId: 'module-lesson-2',
      title: 'Hoạt động 2B (Trắc nghiệm chốt chặn ≥ 7/10đ): “Bí kíp giao tiếp với AI” & Bài tập SGK (5 câu · 8 phút)',
      type: 'quiz',
      durationMinutes: 8,
      isCompleted: false,
      isRequired: true,
      maxScore: 10,
      passScore: 7,
      timeLimitMinutes: 8,
      shuffleQuestions: false,
      description: 'Bài trắc nghiệm củng cố Hoạt động 2B (5 câu, ngưỡng đạt ≥ 7/10 điểm): 3 lợi ích của AI, công thức câu lệnh 3 thành phần, Cẩm nang 4 KHÔNG và 2 câu kiểm tra SGK Bài 2. Câu hỏi khác với 3 câu neo chặn trong video. Sau khi nộp bài, em nhận phản hồi riêng cho từng phương án.',
      quizQuestions: [
        {
          id: 'ai6-b2-q1b',
          question: 'Câu 1 (SGK Bài 2 – Mục 1): Bạn Khoa dùng công cụ AI để luyện phát âm tiếng Anh và tự sửa lỗi chính tả trong bài viết. Đây là lợi ích nào của AI trong học tập?',
          options: [
            'Hỗ trợ học hỏi kiến thức mới',
            'Rèn luyện kĩ năng học tập',
            'Mở rộng hiểu biết và tư duy',
            'Làm bài tập thay cho học sinh'
          ],
          correctAnswer: 1,
          optionFeedback: [
            'Học kiến thức mới là khi AI giải thích khái niệm khó bằng ví dụ dễ hiểu; ở đây Khoa đang luyện tập kĩ năng.',
            'Chính xác! Luyện phát âm, sửa lỗi chính tả, tự tạo câu hỏi ôn tập đều là rèn luyện kĩ năng học tập.',
            'Mở rộng hiểu biết là khám phá thêm kiến thức Khoa học, Lịch sử, Nghệ thuật…; ở đây Khoa đang luyện kĩ năng.',
            'AI không làm bài thay học sinh; Khoa vẫn tự luyện tập và tự sửa bài của mình.'
          ],
          explanation: 'Ba lợi ích của AI khi dùng đúng cách: hỗ trợ học kiến thức mới; rèn luyện kĩ năng học tập (luyện phát âm, sửa chính tả, tạo câu hỏi ôn tập); mở rộng hiểu biết và tư duy.'
        },
        {
          id: 'ai6-b2-q2b',
          question: 'Câu 2 (Công thức câu lệnh): Trong câu lệnh “Em là học sinh lớp 6. Hãy đóng vai giáo viên Toán. Giải thích phân số là gì trong 3 câu kèm 1 ví dụ.”, phần “Hãy đóng vai giáo viên Toán” là thành phần nào?',
          options: [
            'Bối cảnh (Ngữ cảnh)',
            'Vai trò của AI',
            'Yêu cầu và định dạng cụ thể',
            'Thông tin cá nhân của người học'
          ],
          correctAnswer: 1,
          optionFeedback: [
            'Bối cảnh là phần cho AI biết em là ai: “Em là học sinh lớp 6”.',
            'Chính xác! Giao cho AI đóng vai ai (giáo viên, chuyên gia…) là thành phần Vai trò.',
            'Yêu cầu và định dạng là phần “Giải thích phân số là gì trong 3 câu kèm 1 ví dụ”.',
            'Câu lệnh này không có thông tin cá nhân nào – đúng với Cẩm nang 4 KHÔNG.'
          ],
          explanation: 'Câu lệnh rõ ràng gồm 3 thành phần: Bối cảnh (em là ai) + Vai trò của AI (đóng vai ai) + Yêu cầu và định dạng cụ thể (làm gì, bao nhiêu câu).'
        },
        {
          id: 'ai6-b2-q3b',
          question: 'Câu 3 (Cẩm nang 4 KHÔNG): Khi trò chuyện với công cụ AI để học tập, thông tin nào sau đây em KHÔNG được nhập vào ô trò chuyện?',
          options: [
            '“Em là học sinh lớp 6.”',
            'Tên bài học em cần ôn tập',
            'Mật khẩu tài khoản học tập hoặc thư điện tử của em',
            'Số câu em muốn AI trả lời'
          ],
          correctAnswer: 2,
          optionFeedback: [
            'Đây là thông tin học tập chung, không làm lộ danh tính của em, nên được phép nhập.',
            'Tên bài học là thông tin học tập chung, giúp AI trả lời đúng nội dung.',
            'Chính xác! KHÔNG nhập mật khẩu tài khoản học tập, thư điện tử hoặc mạng xã hội vào ô trò chuyện AI.',
            'Số câu muốn AI trả lời là yêu cầu về định dạng, giúp câu lệnh rõ ràng hơn.'
          ],
          explanation: 'Cẩm nang 4 KHÔNG: không nhập họ tên và ngày sinh; không cung cấp số điện thoại, địa chỉ, tên trường lớp; không tải ảnh khuôn mặt hay bí mật gia đình; không nhập mật khẩu tài khoản.'
        },
        {
          id: 'ai6-b2-q4',
          question: 'Câu 4 (SGK Bài 2 – Mục 2): Câu lệnh nào được viết rõ ràng, đủ ngữ cảnh và phù hợp nhất để hỗ trợ học sinh lớp 6 ôn tập môn Tiếng Anh?',
          options: [
            '“Làm giúp em toàn bộ bài tập Tiếng Anh lớp 6 hôm nay thật nhanh và đầy đủ để em chép nộp.”',
            '“Em là học sinh lớp 6, hãy đưa ra 5 từ vựng tiếng Anh về chủ đề Trường học kèm nghĩa tiếng Việt và một câu ví dụ đơn giản cho mỗi từ.”',
            '“Cho 5 từ vựng tiếng Anh chủ đề Trường học bất kì, không cần giải thích hay lấy ví dụ.”',
            '“Em tên là Nguyễn Minh An học lớp 6A1 trường THCS A, hãy dịch giúp em bài văn Tiếng Anh.”'
          ],
          correctAnswer: 1,
          optionFeedback: [
            'Nhờ AI làm thay toàn bộ bài tập để chép nộp là lạm dụng AI, làm giảm tư duy độc lập của người học.',
            'Chính xác! Đủ ngữ cảnh (học sinh lớp 6), nhiệm vụ rõ ràng (5 từ vựng chủ đề Trường học) và định dạng cụ thể (kèm nghĩa + 1 câu ví dụ đơn giản).',
            'Câu lệnh thiếu ngữ cảnh trình độ lớp 6 và bỏ qua giải thích/ví dụ nên khó giúp học sâu và hiểu cách dùng từ.',
            'Vi phạm Cẩm nang “4 KHÔNG”: để lộ họ tên đầy đủ và tên trường, lớp đang học vào ô trò chuyện AI!'
          ],
          explanation: 'Câu lệnh hiệu quả cho HS lớp 6 phải có ngữ cảnh trình độ, yêu cầu học tập rõ ràng, định dạng cụ thể và bảo vệ dữ liệu cá nhân.'
        },
        {
          id: 'ai6-b2-q5',
          question: 'Câu 5 (SGK Bài 2 – Luyện tập 1): Trường hợp nào dưới đây KHÔNG phải là cách sử dụng công cụ AI đúng mục đích để phát triển bản thân trong học tập?',
          options: [
            'Nhờ AI giải thích khái niệm “Quang hợp” bằng ví dụ dễ hiểu cho lớp 6 rồi tự tóm tắt lại vào vở',
            'Nhờ AI tạo 4 câu hỏi trắc nghiệm về bài Lịch sử vừa học để tự ôn tập và kiểm tra kiến thức',
            'Nhập toàn bộ đề bài văn biểu cảm vào AI rồi sao chép nguyên văn bài AI viết để nộp lấy điểm',
            'Nhờ AI gợi ý dàn ý 3 phần cho bài thuyết trình nhóm để cả nhóm thảo luận và tự triển khai nội dung'
          ],
          correctAnswer: 2,
          optionFeedback: [
            'Đây là cách dùng AI ĐÚNG mục đích (hỗ trợ học hỏi kiến thức mới kết hợp tự tóm tắt lại bằng lời mình).',
            'Đây là cách dùng AI ĐÚNG mục đích (rèn luyện kĩ năng và tự kiểm tra kiến thức).',
            'Chính xác! Sao chép nguyên văn bài do AI viết thay mình là lạm dụng AI, vi phạm tính trung thực và làm thui chột khả năng tư duy.',
            'Dùng AI gợi ý dàn ý rồi tự thảo luận và phát triển là cách dùng AI đúng vai trò hỗ trợ.'
          ],
          explanation: 'Theo SGK Bài 2: Không sử dụng AI để làm thay toàn bộ nhiệm vụ học tập; người học cần chủ động suy nghĩ, kiểm chứng và rèn luyện.'
        }
      ]
    },
    {
      id: 'ai6-b2-act-5',
      moduleId: 'module-lesson-2',
      title: 'Hoạt động 3 (Luyện tập – Assignment): Thực hành “Hỏi đúng – Trúng đáp án” trên Trạm AI an toàn (Rubric 10đ)',
      type: 'assignment',
      durationMinutes: 15,
      isCompleted: false,
      isRequired: true,
      maxScore: 10,
      programmingLanguage: 'Tài liệu & Dự án',
      description: 'Thực hành viết câu lệnh 3 thành phần trên SchoolAI Space (hoặc Trạm luyện Prompt trong Bộ học liệu số Bài 2), chụp ảnh màn hình minh chứng và nộp lên LMS.',
      assignmentPrompt: 'HOẠT ĐỘNG 3 – THỰC HÀNH “HỎI ĐÚNG – TRÚNG ĐÁP ÁN” (KHBD BÀI 2)\n\nBước 1 – Tuân thủ Cẩm nang “4 KHÔNG”: Không nhập họ tên đầy đủ, ngày sinh, số điện thoại, địa chỉ, tên trường lớp, ảnh khuôn mặt hay mật khẩu.\n\nBước 2 – Chọn 01 trong 03 chủ đề học tập lớp 6 sau và soạn câu lệnh theo đúng 3 thành phần (Bối cảnh + Vai trò + Yêu cầu & định dạng cụ thể):\n  • Chủ đề 1 (Lịch sử 6): Ý nghĩa lịch sử của Chiến thắng Bạch Đằng năm 938 do Ngô Quyền lãnh đạo.\n  • Chủ đề 2 (Khoa học tự nhiên 6): Giải thích vì sao Mặt Trăng có các hình dạng khác nhau (tròn, khuyết) khi quan sát từ Trái Đất.\n  • Chủ đề 3 (Địa lí 6): Nguyên nhân xảy ra hiện tượng ngày và đêm luân phiên trên Trái Đất.\n(Mẫu gợi ý: “Em là học sinh lớp 6. Hãy đóng vai một giáo viên Lịch sử, giải thích ngắn gọn ý nghĩa của Chiến thắng Bạch Đằng năm 938 trong khoảng 4 câu dễ hiểu.”)\n\nBước 3 – Chạy câu lệnh trên SchoolAI Space (qua Room Code giáo viên cung cấp) hoặc Trạm luyện câu lệnh ở Hoạt động đầu bài, chụp ảnh màn hình hiển thị đầy đủ câu lệnh + phản hồi AI, đặt tên tệp [HoTen]_[Lop]_Prompt.png và tải lên đây (hoặc dán câu lệnh + kết quả trực tiếp).\n\nRUBRIC CHẤM ĐIỂM (10 ĐIỂM – KHBD BÀI 2):\n- Cấu trúc câu lệnh đủ 3 thành phần Bối cảnh – Vai trò – Yêu cầu/Định dạng (5,0đ)\n- Nội dung đúng chủ đề lớp 6, tiếng Việt có dấu, an toàn dữ liệu 4 KHÔNG (3,0đ)\n- Ảnh chụp minh chứng rõ nét, đúng quy cách tên tệp (2,0đ)'
    },
    {
      id: 'ai6-b2-act-6',
      moduleId: 'module-lesson-2',
      title: 'Hoạt động 4 (Vận dụng & Cầu nối Bài 3): “Nhà báo nhí tổng hợp tin tức” (Tóm tắt 3–5 câu + Đối chiếu SGK – Rubric 10đ)',
      type: 'assignment',
      durationMinutes: 10,
      isCompleted: false,
      isRequired: true,
      maxScore: 10,
      programmingLanguage: 'Tài liệu & Dự án',
      description: 'Gấp màn hình AI, tự tóm tắt 3–5 câu kiến thức học thêm được bằng văn phong cá nhân kèm dòng đối chiếu SGK chuẩn bị sang Bài 3: Thực chứng thông tin – Làm chủ AI.',
      assignmentPrompt: 'HOẠT ĐỘNG 4 – “NHÀ BÁO NHÍ TỔNG HỢP TIN TỨC” & CẦU NỐI BÀI 3 (KHBD BÀI 2)\n\nNhiệm vụ 1 – Viết bản tin tóm tắt bằng chính lời văn của em:\nĐọc kĩ câu trả lời của AI ở Hoạt động 3, sau đó đóng cửa sổ trò chuyện AI, tự suy nghĩ và viết 01 đoạn văn ngắn từ 3 đến 5 câu tóm tắt điều em vừa học thêm được bằng văn phong cá nhân.\nQuy tắc tự chủ: Tuyệt đối KHÔNG sao chép (copy-paste) nguyên văn câu chữ của AI.\n\nNhiệm vụ 2 – Cầu nối chuẩn bị Bài 3 (Thực chứng thông tin – Làm chủ AI):\nMở Sách giáo khoa Lịch sử & Địa lí 6 hoặc Khoa học tự nhiên 6 để đối chiếu lại các sự kiện, con số trong câu trả lời của AI và ghi thêm 01 dòng nhận xét cuối bài:\n  “Em đã đối chiếu với SGK [Tên môn] trang [...] và thấy thông tin của AI [chính xác / cần chỉnh sửa ở điểm...].”\n\nRUBRIC CHẤM ĐIỂM (10 ĐIỂM – KHBD BÀI 2):\n- Tính tự chủ, diễn đạt hoàn toàn bằng ngôn ngữ riêng, không copy-paste (5,0đ)\n- Dung lượng 3–5 câu, kiến thức chính xác và có ghi chú đối chiếu SGK (3,0đ)\n- Trình bày mạch lạc, viết hoa đầu câu, đúng chính tả và dấu câu (2,0đ)'
    }
  ],
  syllabusLine: 'Bài 2 – Lợi ích và cách sử dụng công cụ AI phù hợp (1 tiết Trực tuyến – 6.A3.2): 3 lợi ích của AI trong học tập, công thức câu lệnh (Prompt) 3 thành phần và Cẩm nang 4 KHÔNG.',
  officialFiles: [
    {
      id: 'file-ai6-b2-sgk',
      name: '0.SGK_Bai2_LoiIch_CachSuDungAI.docx',
      filename: '0.SGK.docx',
      url: '/hoc-lieu/6aiab01/bai2/0.SGK.docx',
      size: '65 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 2: LỢI ÍCH VÀ CÁCH SỬ DỤNG CÔNG CỤ AI PHÙ HỢP',
      moduleId: 'module-lesson-2',
      description: 'Giáo trình / Sách giáo khoa Bài 2: Lợi ích và cách sử dụng công cụ AI phù hợp (Tin học 6 – Chuyên đề AI).',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b2-khbd',
      name: '1.KHBD_Bai2_LoiIch_CachSuDungAI.docx',
      filename: '1.KHBD.docx',
      url: '/hoc-lieu/6aiab01/bai2/1.KHBD.docx',
      size: '49 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 2: LỢI ÍCH VÀ CÁCH SỬ DỤNG CÔNG CỤ AI PHÙ HỢP',
      moduleId: 'module-lesson-2',
      description: 'Kế hoạch bài dạy trực tuyến 45 phút trên LMS theo chu trình 5 thành phần + 2 bảng Rubric 10đ – Bài 2.',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b2-hoclieuso',
      name: '2.HocLieuSo_Bai2_LoiIch_CachSuDungAI.docx',
      filename: '2.HocLieuSo.docx',
      url: '/hoc-lieu/6aiab01/bai2/2.HocLieuSo.docx',
      size: '418 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 2: LỢI ÍCH VÀ CÁCH SỬ DỤNG CÔNG CỤ AI PHÙ HỢP',
      moduleId: 'module-lesson-2',
      description: 'Bộ Học liệu số Bài 2 (Study Guide, Diễn đàn, Infographic Bí kíp Prompt, 3 mốc Video tương tác, Poster 4 KHÔNG & Trạm luyện Prompt).',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    }
  ]
};
