// ai6SeedData.js
// Toàn bộ nội dung 8 bài học khóa 6AIAB01 — chỉnh sửa, thêm/xóa hoạt động trực tiếp tại đây

export const OFFICIAL_AI_GRADE6_LESSONS = [
  'BÀI 1: NGUỒN GỐC CỦA AI VÀ QUYỀN QUYẾT ĐỊNH',
  'BÀI 2: LỢI ÍCH VÀ CÁCH SỬ DỤNG CÔNG CỤ AI PHÙ HỢP',
  'BÀI 3: THỰC CHỨNG THÔNG TIN - LÀM CHỦ AI',
  'BÀI 4: KHÁM PHÁ MẶT TÍCH CỰC VÀ TIÊU CỰC CỦA MỘT SỐ TÍNH NĂNG AI',
  'BÀI 5: ĐÁNH GIÁ ĐỘ AN TOÀN CỦA TRÍ TUỆ NHÂN TẠO',
  'BÀI 6: DỮ LIỆU CÁ NHÂN LÀ TÀI SẢN CỦA MỖI CON NGƯỜI',
  'BÀI 7: QUYỀN RIÊNG TƯ VÀ KỸ NĂNG TỰ VỆ SỐ',
  'BÀI 8: CON NGƯỜI LÀM CHỦ TRÍ TUỆ NHÂN TẠO'
];

// Mỗi lần bạn sửa/xóa hoạt động bên dưới, hãy đổi số phiên bản này (vd: v16, v17...)
// rồi khởi động lại server để hệ thống tự động cập nhật vào MongoDB / db.json
export const AI6_BAI12_REVISION = 'v16-restore-bai1';

export function buildAi6Bai12SeedData() {
  const bai1Module = {
    id: 'module-lesson-1',
    courseId: '6AIAB01',
    order: 1,
    title: 'BÀI 1: NGUỒN GỐC CỦA AI VÀ QUYỀN QUYẾT ĐỊNH',
    description: 'Thời lượng: 02 tiết (Tiết 1: Trực tuyến trên LMS – Mức Hiểu 6.A1.1 | Tiết 2: Trực tiếp tại lớp – Mức Vận dụng 6.A1.2).',
    learningObjectives: '• (6.A1.1) Giải thích được AI là sản phẩm do con người tạo ra, lập trình và điều khiển để thực hiện những nhiệm vụ cụ thể; AI không tự sinh ra và không hoạt động độc lập; nêu ví dụ công cụ AI quen thuộc và vai trò con người (Dữ liệu – Thuật toán – Điều khiển).\n• (6.A1.2) Trình bày được vai trò của AI chỉ là công cụ hỗ trợ; con người luôn giám sát (Humans in the Loop / EU AI Act 2024), đưa ra quyết định cuối cùng và chịu trách nhiệm 100%.',
    ownerName: '',
    activities: [
      {
        id: 'ai6-b1-act-1',
        moduleId: 'module-lesson-1',
        title: 'Tài liệu đọc: Giới thiệu tổng quan Bài 1 – Nguồn gốc của AI và quyền quyết định',
        type: 'document',
        durationMinutes: 5,
        isCompleted: false,
        isRequired: true,
        fileUrl: '/hoc-lieu/6aiab01/bai1/0.GioiThieuTongQuan.html',
        description: 'Tài liệu đọc giới thiệu tổng quan kèm sơ đồ cấu trúc 4 mạch nội dung Bài 1: Nguồn gốc của AI và quyền quyết định (YCCĐ 6.A1.1 & 6.A1.2 · 02 tiết Blended).'
      },
      {
        id: 'ai6-b1-act-2',
        moduleId: 'module-lesson-1',
        title: 'Hoạt động 1 (Khởi động): Tình huống ba bạn An, Minh, Khoa & Khảo sát nguồn gốc AI',
        type: 'forum',
        durationMinutes: 5,
        isCompleted: false,
        isRequired: true,
        description: 'SỔ TAY HƯỚNG DẪN 4 BƯỚC (TIẾT 1 – 45 PHÚT): (1) Khởi động 5p → (2) Xem sơ đồ trực quan & Video có 3 câu neo chặn 25p → (3) Chốt chặn kiểm tra ≥ 8/10đ (10p) → (4) Nhiệm vụ cầu nối bạn Minh (5p).\n\nKIẾN THỨC NỀN (Tin học 6): Máy tính xử lí thông tin dựa trên dữ liệu đầu vào và thực hiện chương trình do con người viết ra.\n\nTÌNH HUỐNG KHỞI ĐỘNG (Hình 1.1 SGK Bài 1): Sau giờ Tin học, bạn An thắc mắc liệu rô-bốt AI ngoài đời thật có thể “tự thức tỉnh” như trong phim khoa học viễn tưởng không; bạn Minh băn khoăn ai đã dạy YouTube gợi ý đúng bài hát và điện thoại mở khóa khuôn mặt.\n\nEm hãy trả lời 2 câu hỏi lên Diễn đàn:\n1. Theo em, AI ngoài đời thực tự sinh ra trong vi mạch hay do con người thu thập dữ liệu, lập trình và điều khiển?\n2. Hãy kể tên ít nhất 01 ứng dụng hoặc thiết bị có AI mà em hoặc gia đình từng sử dụng.'
      },
      {
        id: 'ai6-b1-act-3',
        moduleId: 'module-lesson-1',
        title: 'Hoạt động 2.1 (Video – Code.org): How AI Works – AI hoạt động như thế nào? (01:30 · 3 câu neo chặn)',
        type: 'video',
        durationMinutes: 4,
        isCompleted: false,
        isRequired: true,
        videoUrl: 'https://www.youtube.com/watch?v=Ok-xpKjKp2g',
        videoDuration: 90,
        preventVideoSkip: true,
        description: 'Xem video hoạt hình ngắn về cách AI hoạt động (bật phụ đề tiếng Việt nếu cần) theo đúng KHBD Bài 1 (không khóa tua phức tạp). 3 câu hỏi định hướng khi xem:\n(1) Vì sao công nghệ này được gọi là Trí tuệ “Nhân tạo”?\n(2) Máy tính cần có gì do con người cung cấp để có thể học và nhận diện?\n(3) Ghi chú 3 bước con người tạo ra AI (Thu thập & xử lí dữ liệu → Thiết kế thuật toán & lập trình → Triển khai, điều khiển) vào SGK Bài 1.\nVideo sẽ tự dừng ở 3 điểm để em trả lời câu hỏi; em cần trả lời đúng mới xem tiếp được và không tua nhanh qua đoạn chưa xem.',
        videoCheckpoints: [
          {
            id: 'b1-cp1',
            timeSeconds: 18,
            question: 'Theo video, AI đang có mặt ở đâu trong đời sống?',
            options: [
              'Chỉ có trong phim khoa học viễn tưởng.',
              'Chỉ có trong phòng thí nghiệm, học sinh chưa từng dùng.',
              'Trong y tế, giáo dục, lớp học, nhà ở – em đã và đang dùng nhiều ứng dụng AI hằng ngày.'
            ],
            correctAnswer: 2,
            explanation: 'AI đã có mặt quanh em: gợi ý video, dịch ngôn ngữ, trợ lý ảo, mở khóa bằng khuôn mặt… Đó đều là công cụ do con người tạo ra.',
            requireCorrect: true
          },
          {
            id: 'b1-cp2',
            timeSeconds: 42,
            question: 'Theo video, nhờ đâu máy tính có thể học cách nhận ra đồ vật?',
            options: [
              'Con người dùng dữ liệu để huấn luyện máy tính và lập trình cách máy tính học.',
              'Máy tính tự sinh ra trí thông minh mà không cần con người.',
              'Máy tính chỉ cần được cắm điện là tự biết.'
            ],
            correctAnswer: 0,
            explanation: 'AI không tự sinh ra: con người thu thập dữ liệu, thiết kế thuật toán để huấn luyện máy tính, rồi điều khiển nó (6.A1.1).',
            requireCorrect: true
          },
          {
            id: 'b1-cp3',
            timeSeconds: 69,
            question: 'Video nhắc chúng ta cần đặt ra câu hỏi khó nào khi dùng AI?',
            options: [
              'Máy tính có thể chạy nhanh đến mức nào?',
              'Không chỉ máy tính làm được gì, mà máy tính NÊN làm gì.',
              'Làm sao để AI tự quyết định thay con người?'
            ],
            correctAnswer: 1,
            explanation: 'Con người quyết định AI nên được dùng vào việc gì, giám sát và chịu trách nhiệm về kết quả – AI chỉ là công cụ hỗ trợ (6.A1.2).',
            requireCorrect: true
          }
        ]
      },
      {
        id: 'ai6-b1-act-4',
        moduleId: 'module-lesson-1',
        title: 'Hoạt động 3A (Chốt chặn kiểm tra ≥ 8/10đ): Phân loại công cụ AI & Vai trò con người (5 câu · 10 phút)',
        type: 'quiz',
        durationMinutes: 10,
        isCompleted: false,
        isRequired: true,
        maxScore: 10,
        passScore: 8,
        timeLimitMinutes: 10,
        shuffleQuestions: false,
        description: 'Bài kiểm tra chốt chặn Tiết 1 (5 câu, thang 10 điểm, điều kiện đạt ≥ 8/10 điểm theo KHBD Bài 1). Sau khi nộp bài, hệ thống chấm tự động và hiển thị phản hồi riêng cho từng phương án em chọn.',
        quizQuestions: [
          {
            id: 'ai6-b1-q1',
            question: 'Câu 1 (Phân loại công cụ AI): Trong các thiết bị và ứng dụng sau, công cụ nào CÓ ứng dụng Trí tuệ nhân tạo (AI)?',
            options: [
              'Chiếc quạt điện có điều khiển hẹn giờ tự tắt theo số phút cài sẵn',
              'Ứng dụng dịch ngôn ngữ qua giọng nói và chữ trên hình ảnh (như Google Dịch)',
              'Chiếc máy tính bỏ túi khoa học thực hiện nhanh các phép tính công thức cố định',
              'Chiếc nồi cơm điện tử tự chuyển sang chế độ giữ ấm khi cảm biến đủ nhiệt độ'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Quạt hẹn giờ chỉ đếm lùi thời gian theo bộ đếm cố định chứ không học từ dữ liệu — không phải AI.',
              'Chính xác! Ứng dụng dịch ngôn ngữ dùng AI để học từ dữ liệu ngôn ngữ, nhận diện giọng nói, mặt chữ và dịch nghĩa theo ngữ cảnh.',
              'Rất dễ nhầm! Máy tính bỏ túi dù tính rất nhanh nhưng chỉ chạy theo công thức cài sẵn cố định, không học từ dữ liệu.',
              'Nồi cơm điện chỉ hoạt động theo cảm biến/rơ-le nhiệt lập trình sẵn mức nhiệt cố định, không phải AI.'
            ],
            explanation: 'Theo Infographic 2 (Hình 1.3 SGK Bài 1): Công cụ AI có khả năng học từ dữ liệu để nhận dạng, dự đoán, dịch thuật hoặc gợi ý thông minh.'
          },
          {
            id: 'ai6-b1-q2',
            question: 'Câu 2 (Phân loại thiết bị thông thường): Thiết bị hoặc tính năng nào dưới đây KHÔNG phải là công cụ ứng dụng Trí tuệ nhân tạo (AI)?',
            options: [
              'Tính năng mở khóa điện thoại bằng nhận diện khuôn mặt chủ nhân (Face ID)',
              'Hệ thống tự động đề xuất video trên YouTube dựa theo lịch sử xem',
              'Chiếc máy tính bỏ túi cầm tay thực hiện phép cộng, trừ, nhân, chia cơ bản',
              'Trợ lý ảo nghe hiểu câu lệnh giọng nói (Google Assistant, Siri) để tìm kiếm thông tin'
            ],
            correctAnswer: 2,
            optionFeedback: [
              'Face ID có ứng dụng AI để học và phân tích đặc điểm khuôn mặt nhằm nhận diện đúng chủ nhân.',
              'Hệ thống gợi ý YouTube sử dụng AI phân tích lịch sử xem để dự đoán nội dung phù hợp.',
              'Chính xác! Máy tính bỏ túi thông thường chỉ hoạt động theo mạch điện tử và công thức cố định, không học từ dữ liệu.',
              'Trợ lý ảo giọng nói ứng dụng AI để nhận dạng âm thanh và hiểu ngôn ngữ tự nhiên.'
            ],
            explanation: 'Không phải mọi thiết bị điện tử đều là AI: máy tính bỏ túi, quạt cơ, đèn pin chỉ thực hiện thao tác cố định.'
          },
          {
            id: 'ai6-b1-q3',
            question: 'Câu 3 (Vai trò con người – Dữ liệu): Để một hệ thống AI có thể nhận diện chính xác hình ảnh con mèo, bước đầu tiên các kĩ sư con người phải thực hiện là gì?',
            options: [
              'Cài đặt công cụ AI lên điện thoại rồi chờ máy tính tự chụp và tự suy ra hình ảnh con mèo',
              'Thu thập, phân loại và làm sạch hàng nghìn bức ảnh mẫu về các loài mèo để dạy máy tính học',
              'Chỉ cần viết một câu lệnh điều kiện kiểm tra kích thước tệp ảnh mà không cần ảnh mẫu',
              'Bật nguồn máy tính và để hệ thống AI tự sinh ra cơ sở dữ liệu mẫu trong bộ nhớ'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'AI không thể tự biết con mèo là gì nếu chưa được con người cung cấp dữ liệu mẫu để huấn luyện trước.',
              'Chính xác! Thu thập và xử lí dữ liệu là bước nền tảng đầu tiên do con người thực hiện (Hình 1.2 SGK Bài 1, UNESCO 2024).',
              'Kích thước tệp ảnh không thể giúp máy tính phân biệt được con mèo với các vật thể khác.',
              'Máy tính không thể tự sinh ra dữ liệu chuẩn nếu không có con người lựa chọn và làm sạch.'
            ],
            explanation: 'Bước 1 trong 3 bước tạo ra AI: Con người lựa chọn, thu thập và làm sạch lượng lớn dữ liệu làm nguồn học cho máy tính.'
          },
          {
            id: 'ai6-b1-q4',
            question: 'Câu 4 (Vai trò con người – Thuật toán): Trong quy trình phát triển công cụ AI, công việc “viết chương trình máy tính và hướng dẫn máy tính cách học từ dữ liệu, nhận diện mẫu” thuộc bước nào?',
            options: [
              'Thiết kế thuật toán và lập trình',
              'Thu thập và làm sạch dữ liệu đầu vào',
              'Triển khai, bật tắt và vận hành thiết bị cuối',
              'Giám sát đạo đức sau khi người dùng sử dụng'
            ],
            correctAnswer: 0,
            optionFeedback: [
              'Chính xác! Con người thiết kế thuật toán và viết chương trình để dẫn dắt cách máy tính học từ dữ liệu.',
              'Thu thập và làm sạch dữ liệu là Bước 1 (chuẩn bị nguồn học), chưa phải bước viết thuật toán lập trình.',
              'Triển khai và điều khiển là Bước 3 (đưa AI vào thiết bị, bật/tắt, cập nhật khi có sai sót).',
              'Giám sát trong quá trình sử dụng thuộc vai trò người dùng vận hành AI ở bước triển khai.'
            ],
            explanation: 'Theo Hình 1.2 SGK Bài 1: Bước 2 là Thiết kế thuật toán và lập trình do các kĩ sư thực hiện.'
          },
          {
            id: 'ai6-b1-q5',
            question: 'Câu 5 (Bản chất nguồn gốc & Quyền quyết định): Phát biểu nào sau đây là CHÍNH XÁC nhất về nguồn gốc và vai trò của Trí tuệ nhân tạo (AI)?',
            options: [
              'AI có ý thức độc lập sau khi được huấn luyện xong và có thể tự chịu trách nhiệm nếu đưa kết quả sai',
              'AI là sản phẩm do con người tạo ra, lập trình và điều khiển; con người luôn giữ quyền quyết định cuối cùng',
              'Mọi thiết bị điện tử thông minh chạy bằng điện trong gia đình đều là hệ thống Trí tuệ nhân tạo',
              'AI do con người tạo ra nhưng một khi đã cài đặt vào thiết bị thì con người không thể kiểm soát hay điều chỉnh nữa'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'AI chỉ là phần mềm/công cụ, không có ý thức riêng và không có tư cách pháp lí để chịu trách nhiệm thay con người.',
              'Xuất sắc! Em đã nắm vững yêu cầu 6.A1.1 & 6.A1.2: Con người tạo ra, dẫn dắt, giám sát và chịu trách nhiệm 100% khi dùng AI.',
              'Nhiều thiết bị chạy điện như quạt cơ, đèn bàn, máy tính bỏ túi hoạt động cố định, không phải AI.',
              'Ở Bước 3 (Triển khai & điều khiển), con người luôn trực tiếp bật, tắt, kiểm tra và cập nhật khi AI sai sót.'
            ],
            explanation: 'Kiến thức trọng tâm Bài 1: AI do con người tạo ra, lập trình và điều khiển; AI chỉ là công cụ hỗ trợ — con người luôn ở trong vòng lặp (Humans in the Loop).'
          }
        ]
      },
      {
        id: 'ai6-b1-act-5',
        moduleId: 'module-lesson-1',
        title: 'Hoạt động 3B (Nhiệm vụ cầu nối chuẩn bị Tiết 2): Tình huống bạn Minh nộp bài Lịch sử sai năm sinh',
        type: 'assignment',
        durationMinutes: 5,
        isCompleted: false,
        isRequired: true,
        maxScore: 10,
        programmingLanguage: 'Tài liệu & Dự án',
        description: 'Nhiệm vụ cầu nối cuối Tiết 1 chuẩn bị cho Tiết 2 trực tiếp tại lớp (trích Luyện tập 3 SGK Bài 1).',
        assignmentPrompt: 'NHIỆM VỤ CẦU NỐI CHUẨN BỊ TIẾT 2 (Luyện tập 3 – SGK Bài 1)\n\nTình huống: Trong giờ học Lịch sử, bạn Minh nhờ một công cụ AI tóm tắt thông tin về một nhân vật lịch sử và chép nguyên văn vào bài nộp mà không kiểm tra lại với sách giáo khoa. Kết quả là bài làm của Minh bị sai năm sinh của nhân vật đó.\n\nEm hãy trả lời ngắn gọn (nhập trực tiếp bên dưới):\n1. Nếu là bạn Minh, em sẽ làm gì trước khi nộp bài cho cô giáo?\n2. Theo em, khi bài nộp bị sai thông tin như vậy thì ai là người phải chịu trách nhiệm? Vì sao?\n\n(Thầy/Cô sẽ tổng hợp các ý kiến tiêu biểu để cả lớp thảo luận mở đầu Tiết 2!)'
      },
      {
        id: 'ai6-b1-act-6',
        moduleId: 'module-lesson-1',
        title: 'Hoạt động 5 & 6 (Tiết 2 – Vận dụng): Tòa án công nghệ giả định & Lập “Tuyên ngôn làm chủ AI” (Rubric 10đ)',
        type: 'assignment',
        durationMinutes: 15,
        isCompleted: false,
        isRequired: true,
        maxScore: 10,
        programmingLanguage: 'Tài liệu & Dự án',
        description: 'Hoàn thành tình huống Vận dụng 1 (Tòa án công nghệ giả định) và Vận dụng 2 (Tuyên ngôn làm chủ AI: 1 điều NÊN – 1 điều KHÔNG NÊN) kèm Rubric 10 điểm.',
        assignmentPrompt: 'NHIỆM VỤ VẬN DỤNG TIẾT 2 (SGK BÀI 1)\n\nPhần 1 – Tình huống “Tòa án công nghệ giả định” (Vận dụng 1):\nMột chiếc ô tô có tích hợp tính năng AI hỗ trợ lái tự động. Người lái xe đã bật chế độ tự lái rồi bỏ tay khỏi vô-lăng để chơi trò chơi trên điện thoại, dẫn đến việc xe không kịp phanh khi gặp chướng ngại vật bất ngờ.\n→ Nếu là thành viên hội đồng phân xử, em kết luận trách nhiệm thuộc về ai và rút ra bài học gì về nguyên tắc “Con người trong vòng lặp” (Humans in the Loop / EU AI Act 2024)?\n\nPhần 2 – Lập “Tuyên ngôn làm chủ AI” (Vận dụng 2):\nHãy chọn 01 công việc học tập hằng ngày của em (VD: học từ vựng Tiếng Anh, lập dàn ý bài văn, tìm ý tưởng vẽ tranh...) và viết rõ:\n• Công việc học tập em chọn:\n• 1 điều em NÊN làm (tận dụng AI hỗ trợ đúng cách):\n• 1 điều em KHÔNG NÊN làm (giữ quyền quyết định, bước kiểm chứng và tính trung thực):\n\nTIÊU CHÍ CHẤM ĐIỂM (RUBRIC 10 ĐIỂM – KHBD BÀI 1):\n- Phân định rõ vai trò hỗ trợ của AI – Quy tắc NÊN (4,0đ)\n- Thể hiện quyền quyết định & trách nhiệm – Quy tắc KHÔNG NÊN (4,0đ)\n- Trình bày mạch lạc, chính tả chuẩn và tính thực tiễn (2,0đ)'
      }
    ]
  };

  const bai2Module = {
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
    ]
  };

  const bai3Module = {
    id: 'module-lesson-3',
    courseId: '6AIAB01',
    order: 3,
    title: 'BÀI 3: THỰC CHỨNG THÔNG TIN - LÀM CHỦ AI',
    description: 'Thời lượng: 01 tiết – 45 phút (Trực tiếp tại lớp kết hợp hỗ trợ trên hệ thống LMS – Mức Phân tích – Vận dụng, YCCĐ 6.A1.3).',
    learningObjectives: '• (6.A1.3) Giải thích được vì sao kết quả do AI cung cấp có thể không chính xác (hiện tượng “Ảo giác AI” / nguyên lý “Con vẹt ngẫu nhiên” – UNESCO 2023).\n• Thực hiện được việc kiểm tra, đối chiếu kết quả của AI qua 3 kênh đáng tin cậy (Sách giáo khoa, nguồn uy tín .gov.vn/.edu.vn, hỏi thầy cô hoặc cha mẹ).\n• Rèn thói quen chủ động thực chứng, giữ vai trò “con người quyết định cuối cùng” và không tin mù quáng vào kết quả AI.',
    ownerName: '',
    activities: [
      {
        id: 'ai6-b3-act-1',
        moduleId: 'module-lesson-3',
        title: 'Tài liệu đọc: Giới thiệu tổng quan Bài 3 – Thực chứng thông tin – Làm chủ AI',
        type: 'document',
        durationMinutes: 5,
        isCompleted: false,
        isRequired: true,
        fileUrl: '/hoc-lieu/6aiab01/bai3/0.GioiThieuTongQuan.html',
        description: 'Tài liệu đọc giới thiệu tổng quan kèm sơ đồ cấu trúc 4 mạch nội dung Bài 3: Thực chứng thông tin – Làm chủ AI (YCCĐ 6.A1.3 · 01 tiết Blended).'
      },
      {
        id: 'ai6-b3-act-2',
        moduleId: 'module-lesson-3',
        title: 'Hoạt động 1 (Khởi động – Diễn đàn): Trò chơi “Tin hay Không tin?” (Đoạn văn A & B về Trái Đất)',
        type: 'forum',
        durationMinutes: 5,
        isCompleted: false,
        isRequired: true,
        description: 'SỔ TAY HƯỚNG DẪN BÀI 3 (45 PHÚT TRỰC TIẾP + LMS): Trước giờ đọc Sổ tay hướng dẫn & Kiến thức nền → Tại lớp (Khởi động 5p, Hình thành kiến thức 12p, Trò chơi biểu quyết “Phòng thí nghiệm thực chứng” & Phiếu Bạch Đằng 18p, Vận dụng 10p) → Sau giờ làm bài trắc nghiệm chốt chặn (≥ 8/10đ) & nộp bài Vận dụng.\n\nTÌNH HUỐNG KHỞI ĐỘNG (Hình 3.1 SGK Bài 3): Bạn Khoa hỏi công cụ AI về Trái Đất và nhận được hai đoạn văn:\n• Đoạn văn A: “Trái Đất có dạng hình cầu, quay quanh Mặt Trời và tự quay quanh trục hết khoảng 24 giờ tạo ra ngày và đêm.”\n• Đoạn văn B: “Trái Đất có dạng hình vuông, quay quanh Mặt Trăng và mỗi ngày dài đúng 36 giờ.”\n\nEm hãy thảo luận trên Diễn đàn:\n1. Đoạn văn nào chính xác, đoạn văn nào có lỗi sai? Dựa vào kiến thức đã học nào em nhận ra?\n2. Theo em, vì sao một công cụ AI đôi khi vẫn có thể viết ra những câu nghe rất trôi chảy nhưng lại sai sự thật?'
      },
      {
        id: 'ai6-b3-act-3',
        moduleId: 'module-lesson-3',
        title: 'Hoạt động 2 (Kiến thức trọng tâm): “Ảo giác AI”, nguyên lý “Con vẹt ngẫu nhiên” & 3 Kênh kiểm chứng thông tin',
        type: 'document',
        durationMinutes: 12,
        isCompleted: false,
        isRequired: true,
        description: '1. VÌ SAO KẾT QUẢ CỦA AI CÓ THỂ KHÔNG CHÍNH XÁC? (SGK Bài 3 & UNESCO 2023):\n• AI hoạt động theo nguyên lý “Con vẹt ngẫu nhiên” (Stochastic Parrots): hệ thống dự đoán và ghép nối từ ngữ dựa trên xác suất thống kê từ kho dữ liệu đã học, chứ không thực sự hiểu ý nghĩa hay kiểm chứng sự thật như con người.\n• “Ảo giác AI” (AI Hallucination): là hiện tượng AI tự bịa đặt thông tin, mốc thời gian, nhân vật hoặc công thức sai sự thật nhưng diễn đạt bằng giọng điệu rất tự tin, trôi chảy.\n• Ngoài ra, dữ liệu huấn luyện có thể cũ, thiếu hụt, chưa cập nhật hoặc câu lệnh (Prompt) của người dùng chưa rõ ngữ cảnh.\n\n2. QUY TẮC 3 KÊNH KIỂM CHỨNG THÔNG TIN KHI DÙNG AI (Hình 3.3 SGK):\n• Kênh 1 – Sách giáo khoa & tài liệu chính thống: Đối chiếu ngay các mốc lịch sử, định nghĩa, công thức với SGK và tài liệu học tập chính thức.\n• Kênh 2 – Nguồn thông tin tin cậy trên Internet: Kiểm tra trên trang của cơ quan nhà nước (.gov.vn), tổ chức giáo dục (.edu.vn), viện nghiên cứu, bách khoa uy tín.\n• Kênh 3 – Hỏi thầy cô, cha mẹ hoặc tự kiểm tra lại: Hỏi người có chuyên môn; với bài toán cần thay kết quả vào đề để thử lại phép tính.\n\nNguyên tắc vàng: AI chỉ là công cụ tham khảo — con người luôn kiểm chứng và giữ quyền quyết định cuối cùng.'
      },
      {
        id: 'ai6-b3-act-4',
        moduleId: 'module-lesson-3',
        title: 'Hoạt động 4A (Trắc nghiệm chốt chặn ≥ 8/10đ): Ảo giác AI & 3 Kênh thực chứng thông tin (5 câu · 10 phút)',
        type: 'quiz',
        durationMinutes: 10,
        isCompleted: false,
        isRequired: true,
        maxScore: 10,
        passScore: 8,
        timeLimitMinutes: 10,
        shuffleQuestions: false,
        description: 'Bài kiểm tra chốt chặn Bài 3 gồm 5 câu trắc nghiệm (thang 10 điểm, điều kiện đạt ≥ 8/10 điểm theo KHBD Bài 3). Đọc kĩ các phương án gần giống nhau trước khi chọn.',
        quizQuestions: [
          {
            id: 'ai6-b3-q1',
            question: 'Câu 1: Hiện tượng công cụ AI tự tạo ra thông tin sai sự thật, bịa đặt mốc thời gian hoặc sự kiện nhưng trình bày với văn phong rất tự tin, trôi chảy được gọi là gì?',
            options: [
              'Lỗi hiển thị phông chữ tiếng Việt của hệ thống AI khi bị nghẽn đường truyền mạng',
              'Hiện tượng “Ảo giác AI” (AI Hallucination) do AI ghép từ theo xác suất thay vì hiểu bản chất sự thật',
              'Quá trình AI tự động sáng tạo thêm chi tiết nghệ thuật nhằm giúp người đọc dễ ghi nhớ bài học hơn',
              'Hiện tượng “Bong bóng thông tin” (Filter Bubble) khiến AI chỉ trả lời lặp lại một chủ đề duy nhất'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Lỗi phông chữ hay nghẽn mạng chỉ ảnh hưởng cách hiển thị kí tự, không phải nguyên nhân khiến AI bịa đặt sự kiện sai sự thật.',
              'Chính xác! “Ảo giác AI” (AI Hallucination) xảy ra khi AI tự tạo thông tin không có thật nhưng viết nghe rất mạch lạc, thuyết phục.',
              'Trong học tập khoa học và lịch sử, việc AI bịa chi tiết không có thật là lỗi sai nghiêm trọng, không phải sáng tạo hữu ích.',
              '“Bong bóng thông tin” là hiện tượng của thuật toán gợi ý nội dung (Bài 4), khác với hiện tượng bịa đặt thông tin của AI.'
            ],
            explanation: 'Theo Mục 1 SGK Bài 3: “Ảo giác AI” là hiện tượng hệ thống AI tạo ra nội dung sai sự thật hoặc không tồn tại nhưng diễn đạt rất tự tin.'
          },
          {
            id: 'ai6-b3-q2',
            question: 'Câu 2: Theo báo cáo của UNESCO (2023), vì sao mô hình ngôn ngữ AI đôi khi được ví như “Con vẹt ngẫu nhiên” (Stochastic Parrots)?',
            options: [
              'Vì công cụ AI chỉ có khả năng đọc to văn bản bằng giọng nói giả lập chứ không hiển thị được chữ viết',
              'Vì AI chủ yếu dự đoán và ghép nối từ ngữ theo xác suất từ dữ liệu đã học mà không thực sự hiểu ý nghĩa hay kiểm chứng sự thật',
              'Vì AI tự động ghi nhớ nguyên văn từng trang sách giáo khoa mới nhất nên câu trả lời luôn khớp 100% thực tế',
              'Vì AI có khả năng suy luận độc lập như con người nhưng cố tình chọn đáp án ngẫu nhiên để kiểm tra người học'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'AI tạo sinh chủ yếu sinh văn bản; phép ẩn dụ “Con vẹt ngẫu nhiên” nói về cơ chế xử lí ngôn ngữ, không phải tính năng đọc thành tiếng.',
              'Chính xác! AI ghép các chuỗi từ hợp lí về mặt xác suất ngôn ngữ, chứ không hiểu bản chất thế giới thực hay tự đi xác minh sự thật.',
              'AI không lưu nguyên văn toàn bộ SGK mới nhất và rất dễ trộn lẫn hoặc làm sai lệch các con số, mốc lịch sử.',
              'AI không có ý thức hay ý định chủ quan để cố tình đánh đố người học.'
            ],
            explanation: 'Nguyên lý “Con vẹt ngẫu nhiên” (UNESCO 2023): AI dự đoán từ tiếp theo theo xác suất thống kê mà không có sự thấu hiểu thực tế.'
          },
          {
            id: 'ai6-b3-q3',
            question: 'Câu 3: Khi AI cung cấp một đoạn tóm tắt về Chiến thắng Bạch Đằng năm 938 có vài chi tiết khiến em nghi ngờ, nguồn nào dưới đây là ĐÁNG TIN CẬY NHẤT để kiểm chứng trước tiên?',
            options: [
              'Hỏi lại chính công cụ AI đó xem thông tin nó vừa viết có chính xác hay không',
              'Đối chiếu trực tiếp với Sách giáo khoa Lịch sử và Địa lí 6 hoặc trang thông tin chính thống có tên miền .gov.vn, .edu.vn',
              'Đọc các bình luận có nhiều lượt thích nhất dưới một video ngắn trên mạng xã hội',
              'Dùng một công cụ AI miễn phí khác viết lại đoạn văn đó cho mượt mà hơn rồi tin theo bản mới'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Hỏi lại chính công cụ AI đó không đảm bảo loại bỏ ảo giác vì AI vẫn có thể tự khẳng định sai hoặc tiếp tục bịa chi tiết khác.',
              'Chính xác! Sách giáo khoa và các cổng thông tin chính thống (.gov.vn, .edu.vn) đã qua thẩm định khoa học, là kênh kiểm chứng chuẩn nhất.',
              'Số lượt thích trên mạng xã hội không phản ánh độ chính xác khoa học hay lịch sử.',
              'Chuyển sang công cụ AI khác để viết lại mượt hơn không thay thế được việc đối chiếu với nguồn tri thức chính thống.'
            ],
            explanation: 'Trong 3 kênh kiểm chứng thông tin (SGK Bài 3), Sách giáo khoa và nguồn chính thống (.gov.vn, .edu.vn) là căn cứ đáng tin cậy hàng đầu.'
          },
          {
            id: 'ai6-b3-q4',
            question: 'Câu 4: Bộ “3 kênh kiểm chứng thông tin” cơ bản dành cho học sinh lớp 6 khi đối chiếu kết quả do AI cung cấp gồm những kênh nào?',
            options: [
              'Hỏi lại AI lần hai – Kiểm tra độ dài câu trả lời – Đếm số từ khóa chuyên môn trong bài',
              'Sách giáo khoa & tài liệu chính thống – Nguồn tin cậy (.gov.vn, .edu.vn, từ điển) – Hỏi thầy cô, cha mẹ hoặc tự kiểm tra lại',
              'Mạng xã hội nhiều người theo dõi – Hội nhóm trò chơi trực tuyến – Ý kiến đoán của bạn cùng lớp',
              'Gõ lại câu lệnh bằng tiếng Anh – Dùng công cụ dịch tự động – Lưu lại màn hình để nộp ngay'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Độ dài câu trả lời hay số từ chuyên môn không chứng minh được tính đúng đắn của thông tin.',
              'Chính xác! Em đã ghi nhớ trọn vẹn 3 kênh thực chứng thông tin chuẩn theo Hình 3.3 SGK Bài 3.',
              'Mạng xã hội và suy đoán cảm tính chưa qua thẩm định dễ lan truyền thông tin sai lệch.',
              'Dịch sang ngôn ngữ khác không làm biến mất sai sót về mặt kiến thức nếu AI đã bịa dữ kiện.'
            ],
            explanation: '3 kênh kiểm chứng chuẩn (SGK Bài 3): (1) Sách giáo khoa; (2) Nguồn tin cậy (.gov.vn, .edu.vn, tài liệu chính thống); (3) Thầy cô, cha mẹ và tự thử lại.'
          },
          {
            id: 'ai6-b3-q5',
            question: 'Câu 5: Khi giải một bài toán tìm x, công cụ AI giải thích các bước rất dài và kết luận x = 10. Tuy nhiên, khi em thay x = 10 vào biểu thức ban đầu thì hai vế KHÔNG bằng nhau. Cách xử lí nào thể hiện đúng năng lực làm chủ AI?',
            options: [
              'Vẫn chép kết quả x = 10 vào vở vì AI là phần mềm máy tính nên chắc chắn tính đúng hơn học sinh lớp 6',
              'Tin vào phép kiểm tra lại của bản thân, tìm chỗ sai trong lời giải của AI, tự tính lại và nhờ thầy cô xác nhận nếu cần',
              'Thay đổi đề bài ban đầu sao cho khi thay x = 10 vào thì hai vế bằng nhau để khớp với AI',
              'Hỏi lại AI nhưng không chỉ ra chỗ sai rồi chép nguyên văn con số mới AI đưa ra mà không thử lại'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'AI vẫn thường mắc lỗi trong các bước suy luận toán học nhiều bước; không bao giờ được tin mù quáng khi phép thử đã chứng minh sai.',
              'Xuất sắc! Phép thử lại bằng chính tư duy toán học của em là bằng chứng thực chứng rõ ràng nhất — con người luôn giữ quyền quyết định cuối cùng.',
              'Sửa đề bài để chiều theo kết quả sai của AI là sai nguyên tắc học tập trung thực và khoa học.',
              'Nếu không tự kiểm tra lại kết quả mới, em vẫn có nguy cơ tiếp tục chép đáp án sai từ AI.'
            ],
            explanation: 'SGK Bài 3 (Luyện tập & Vận dụng): Khi tự kiểm chứng phát hiện AI sai, học sinh phải tin kết quả kiểm chứng đúng, rà lại phép tính và trao đổi với thầy cô.'
          }
        ]
      },
      {
        id: 'ai6-b3-act-5',
        moduleId: 'module-lesson-3',
        title: 'Hoạt động 3 & 4B (Thực hành & Vận dụng): Đính chính Bạch Đằng 938, Quy tắc thực chứng & Cầu nối Bài 4 (Rubric 10đ)',
        type: 'assignment',
        durationMinutes: 15,
        isCompleted: false,
        isRequired: true,
        maxScore: 10,
        programmingLanguage: 'Tài liệu & Dự án',
        description: 'Hoàn thành Phiếu đính chính đoạn văn AI viết sai về Chiến thắng Bạch Đằng năm 938 (3 lỗi sai), viết Quy tắc thực chứng cá nhân, kiểm chứng 01 thông tin địa phương và trả lời câu hỏi cầu nối chuẩn bị Bài 4.',
        assignmentPrompt: 'NHIỆM VỤ THỰC HÀNH & VẬN DỤNG BÀI 3 (SGK & KHBD BÀI 3)\n\nPhần 1 – Đính chính đoạn văn AI viết sai về Chiến thắng Bạch Đằng năm 938:\nĐoạn văn do AI tạo: “Năm 938, dưới sự lãnh đạo của Lý Thường Kiệt, quân dân ta đã cắm cọc gỗ trên sông Hồng và đánh tan quân xâm lược Mông Cổ, mở ra thời kì độc lập lâu dài.”\n→ Em hãy chỉ rõ ĐỦ 3 LỖI SAI trong đoạn văn trên, sửa lại cho chính xác theo SGK Lịch sử và Địa lí 6 và ghi rõ kênh em đã dùng để kiểm chứng.\n\nPhần 2 – Quy tắc thực chứng thông tin cá nhân & Kiểm chứng thực tế địa phương:\n1. Viết 01 Quy tắc thực chứng ngắn gọn (1–2 câu) để nhắc bản thân luôn kiểm tra thông tin do AI đưa ra trước khi sử dụng.\n2. Chọn 01 thông tin lịch sử, địa lí hoặc khoa học quen thuộc ở địa phương em (hoặc bài học lớp 6), nêu rõ 02 kênh đáng tin cậy em sẽ dùng để đối chiếu nếu AI đưa ra kết quả về thông tin đó.\n\nPhần 3 – Nhiệm vụ cầu nối chuẩn bị Bài 4 (Mặt tích cực và tiêu cực của tính năng AI):\nKhi em xem video hoặc tìm kiếm thông tin trên mạng, các nền tảng có AI thường tự động đề xuất hàng loạt nội dung giống sở thích của em. Theo em, tính năng gợi ý đó mang lại lợi ích gì và có thể gây ra hạn chế nào?\n\nRUBRIC CHẤM ĐIỂM (10 ĐIỂM – KHBD BÀI 3):\n- Phát hiện & đính chính chính xác đủ 3 lỗi Bạch Đằng 938 kèm nguồn đối chiếu (4,0đ)\n- Quy tắc thực chứng cá nhân & kế hoạch kiểm chứng 2 kênh thực tế rõ ràng, khả thi (4,0đ)\n- Hoàn thành câu hỏi cầu nối Bài 4, trình bày mạch lạc, đúng chính tả (2,0đ)'
      }
    ]
  };

  const bai4Module = {
    id: 'module-lesson-4',
    courseId: '6AIAB01',
    order: 4,
    title: 'BÀI 4: KHÁM PHÁ MẶT TÍCH CỰC VÀ TIÊU CỰC CỦA MỘT SỐ TÍNH NĂNG AI',
    description: 'Thời lượng: 01 tiết – 45 phút (Dạy học trực tuyến trên hệ thống LMS – Mức Phân tích – Vận dụng, YCCĐ 6.B1.1).',
    learningObjectives: '• (6.B1.1) Chỉ ra được mặt tích cực và hạn chế của một số tính năng AI phổ biến: thu thập dữ liệu để gợi ý nội dung (Recommender Systems vs Filter Bubbles), nhận diện khuôn mặt/giọng nói, tạo sinh văn bản/hình ảnh.\n• Hiểu cơ chế thuật toán gợi ý hình thành “bong bóng thông tin” (DP-REG 2023) và nguy cơ đối với quyền riêng tư cá nhân.\n• Đề xuất được ít nhất 02 thao tác kĩ thuật khả thi giúp kiểm soát thuật toán gợi ý và bảo vệ quyền riêng tư số.',
    ownerName: '',
    activities: [
      {
        id: 'ai6-b4-act-1',
        moduleId: 'module-lesson-4',
        title: 'Tài liệu đọc: Giới thiệu tổng quan Bài 4 – Khám phá mặt tích cực và tiêu cực của một số tính năng AI',
        type: 'document',
        durationMinutes: 5,
        isCompleted: false,
        isRequired: true,
        fileUrl: '/hoc-lieu/6aiab01/bai4/0.GioiThieuTongQuan.html',
        description: 'Tài liệu đọc giới thiệu tổng quan kèm sơ đồ cấu trúc 4 mạch nội dung Bài 4: Mặt tích cực và tiêu cực của một số tính năng AI (YCCĐ 6.B1.1 · 01 tiết Trực tuyến).'
      },
      {
        id: 'ai6-b4-act-2',
        moduleId: 'module-lesson-4',
        title: 'Hoạt động 1 (Khởi động – Diễn đàn): Quan sát “Trang chủ video của em” & Tình huống An–Minh–Khoa (Hình 4.1)',
        type: 'forum',
        durationMinutes: 5,
        isCompleted: false,
        isRequired: true,
        description: 'SỔ TAY HƯỚNG DẪN 4 CHẶNG (45 PHÚT TRỰC TUYẾN): (1) Khởi động 5p → (2) Video có 3 câu neo chặn, sơ đồ trực quan & Kiến thức trọng tâm 15p → (3) Trắc nghiệm chốt chặn 5 câu ≥ 8/10đ (15p) → (4) Vận dụng 2 thao tác kĩ thuật & Cầu nối Bài 5 (10p).\n\nNHIỆM VỤ KHỞI ĐỘNG (Gắn tình huống An, Minh, Khoa – Hình 4.1 SGK Bài 4):\n1. Mở trang chủ YouTube của em và quan sát 10 video đầu tiên: có bao nhiêu video trùng khớp với chủ đề em vừa xem hoặc tìm kiếm gần đây?\n2. Em hãy viết 1–2 câu chia sẻ cảm nhận của bản thân: tính năng tự động đề xuất video đúng sở thích mang lại sự tiện lợi gì, và có khiến em băn khoăn điều gì không?'
      },
      {
        id: 'ai6-b4-act-video',
        moduleId: 'module-lesson-4',
        title: 'Hoạt động 2 – Nhiệm vụ 1 (Video): Cơ chế thuật toán gợi ý – Vì sao ứng dụng biết em muốn gì? (05:47 · 3 câu neo chặn)',
        type: 'video',
        durationMinutes: 7,
        isCompleted: false,
        isRequired: true,
        videoUrl: 'https://www.youtube.com/watch?v=Wl5Hb2cfIh0',
        videoDuration: 347,
        preventVideoSkip: true,
        description: 'Em xem video giải thích cách thuật toán gợi ý thu thập hành vi người dùng (lượt nhấp, thời gian dừng màn hình, lượt thích, lịch sử tìm kiếm) để đoán em muốn gì. Video sẽ tự dừng ở 3 điểm để em trả lời câu hỏi; em cần trả lời đúng mới xem tiếp được. Xem xong, em đối chiếu với Mục 1 và Mục 2 SGK Bài 4 về hai mặt của tính năng AI.',
        videoCheckpoints: [
          {
            id: 'b4-cp1',
            timeSeconds: 88,
            question: 'Vì sao ứng dụng mua sắm gợi ý đúng món đồ em đang cần?',
            options: [
              'Vì ứng dụng nghe lén cuộc trò chuyện của em qua micro.',
              'Vì hệ thống phân tích hành vi của em như tìm kiếm, nhấp xem, thời gian dừng lại và những món đã mua trước đó.',
              'Vì đó là sự trùng hợp ngẫu nhiên.'
            ],
            correctAnswer: 1,
            explanation: 'Thuật toán gợi ý không cần nghe lén: nó học từ dữ liệu hành vi em để lại khi dùng ứng dụng để dự đoán nhu cầu của em.',
            requireCorrect: true
          },
          {
            id: 'b4-cp2',
            timeSeconds: 171,
            question: 'Hệ thống kết nối các sản phẩm với nhau để làm gì?',
            options: [
              'Để xóa bớt những sản phẩm em không mua.',
              'Để tăng giá các sản phẩm được nhiều người xem.',
              'Để từ món em đã xem hoặc đã mua, gợi ý thêm những món có liên quan.'
            ],
            correctAnswer: 2,
            explanation: 'Nhờ “bản đồ” kết nối giữa các sản phẩm, hệ thống tìm ra những món liên quan đến điều em quan tâm để gợi ý tiếp.',
            requireCorrect: true
          },
          {
            id: 'b4-cp3',
            timeSeconds: 335,
            question: 'Tính năng gợi ý cá nhân hóa có hai mặt. Ý nào nêu đúng cả hai mặt đó?',
            options: [
              'Giúp em tìm đúng thứ cần nhanh hơn, nhưng hệ thống thu thập nhiều dữ liệu hành vi và có thể khiến em xem hoặc mua nhiều hơn dự định.',
              'Chỉ có lợi, không có hạn chế nào.',
              'Chỉ có hại, nên không bao giờ dùng ứng dụng có gợi ý.'
            ],
            correctAnswer: 0,
            explanation: 'Mọi tính năng AI đều có hai mặt: tiết kiệm thời gian, nhưng ảnh hưởng quyền riêng tư và dễ tạo “bong bóng thông tin” nếu em không tự kiểm soát.',
            requireCorrect: true
          }
        ]
      },
      {
        id: 'ai6-b4-act-3',
        moduleId: 'module-lesson-4',
        title: 'Hoạt động 2 (Kiến thức trọng tâm): Hệ thống gợi ý, “Bong bóng thông tin” (Filter Bubbles) & Hai mặt của 3 tính năng AI',
        type: 'document',
        durationMinutes: 15,
        isCompleted: false,
        isRequired: true,
        description: '1. HỆ THỐNG GỢI Ý NỘI DUNG & “BONG BÓNG THÔNG TIN” (SGK Bài 4 & DP-REG 2023):\n• Hệ thống gợi ý (Recommender Systems) thu thập dữ liệu hành vi (lịch sử xem, thời gian dừng lại, lượt thích, tìm kiếm) để dự đoán và đề xuất nội dung phù hợp sở thích.\n• Mặt tích cực: Tiết kiệm thời gian tìm kiếm, nhanh chóng tiếp cận bài giảng, tài liệu và nội dung giải trí phù hợp nhu cầu.\n• Mặt hạn chế: Dễ tạo “Bong bóng thông tin” (Filter Bubbles) khiến người dùng bị thu hẹp góc nhìn trong một chiều thông tin; dễ cuốn vào chuỗi xem liên tục gây mất thời gian và tiềm ẩn nguy cơ thu thập dữ liệu hành vi quá mức, ảnh hưởng quyền riêng tư.\n\n2. HAI MẶT CỦA HAI TÍNH NĂNG AI PHỔ BIẾN KHÁC (Hình 4.2 SGK Bài 4):\n• Nhận diện khuôn mặt và giọng nói: Tích cực = mở khóa nhanh, tìm kiếm bằng giọng nói, hỗ trợ người khuyết tật; Hạn chế = dữ liệu sinh trắc học nếu rò rỉ hoặc thu thập không phép có thể bị lợi dụng giả mạo, xâm phạm quyền riêng tư.\n• AI tạo sinh văn bản và hình ảnh: Tích cực = hỗ trợ gợi ý ý tưởng, giải thích khái niệm, minh họa học tập nhanh; Hạn chế = có thể tạo thông tin sai lệch (ảo giác AI), tin giả, ảnh cắt ghép giả mạo hoặc khiến người học ỷ lại, giảm tư duy nếu lạm dụng.'
      },
      {
        id: 'ai6-b4-act-4',
        moduleId: 'module-lesson-4',
        title: 'Hoạt động 3 (Trắc nghiệm chốt chặn ≥ 8/10đ): Phân tích hai mặt tính năng AI & Bong bóng thông tin (5 câu · 10 phút)',
        type: 'quiz',
        durationMinutes: 10,
        isCompleted: false,
        isRequired: true,
        maxScore: 10,
        passScore: 8,
        timeLimitMinutes: 10,
        shuffleQuestions: false,
        description: 'Bài kiểm tra chốt chặn Bài 4 (5 câu, thang 10 điểm, ngưỡng đạt ≥ 8/10 điểm) bao quát cơ chế thuật toán gợi ý, Filter Bubbles, phân loại hai mặt của 3 tính năng AI và thao tác kiểm soát thuật toán.',
        quizQuestions: [
          {
            id: 'ai6-b4-q1',
            question: 'Câu 1: Hệ thống gợi ý nội dung (Recommender Systems) trên YouTube hoặc nền tảng học tập dựa vào nguồn dữ liệu nào là chủ yếu để đoán sở thích của người dùng?',
            options: [
              'Chỉ dựa vào tên thương hiệu điện thoại và dung lượng pin còn lại của thiết bị người dùng',
              'Dữ liệu hành vi tương tác như lịch sử video đã xem, từ khóa tìm kiếm, lượt thích và thời gian dừng lại trên từng nội dung',
              'Chỉ dựa vào điểm số các môn học ở trường được lưu trong sổ liên lạc điện tử',
              'Lựa chọn hoàn toàn ngẫu nhiên các video mới tải lên trong ngày mà không cần ghi nhận lịch sử xem'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Hãng điện thoại hay phần trăm pin không cho biết người dùng thích xem nội dung khoa học, âm nhạc hay thể thao.',
              'Chính xác! Thuật toán gợi ý học trực tiếp từ dữ liệu hành vi (xem, tìm kiếm, thích, thời gian xem) để dự đoán và đề xuất nội dung tương tự.',
              'Các nền tảng video không có quyền truy cập vào sổ điểm nhà trường của học sinh.',
              'Nếu chọn ngẫu nhiên hoàn toàn thì trang chủ sẽ không trùng khớp với các chủ đề em vừa xem gần đây.'
            ],
            explanation: 'Cơ chế Recommender Systems (SGK Bài 4): Thu thập và phân tích dữ liệu hành vi người dùng để cá nhân hóa danh sách nội dung đề xuất.'
          },
          {
            id: 'ai6-b4-q2',
            question: 'Câu 2: Hiện tượng “Bong bóng thông tin” (Filter Bubble – DP-REG 2023) xảy ra khi sử dụng hệ thống gợi ý AI được hiểu chính xác nhất là gì?',
            options: [
              'Màn hình điện thoại hiển thị nhiều khung thông báo quảng cáo che kín phần nội dung video đang xem',
              'Thuật toán liên tục đẩy các nội dung lặp lại một chiều theo sở thích cũ khiến người dùng ít có cơ hội tiếp cận kiến thức và góc nhìn đa dạng khác',
              'Hệ thống AI tự động lọc bỏ toàn bộ tin giả và chỉ giữ lại các bài giảng sách giáo khoa chuẩn xác trên Internet',
              'Đường truyền Internet bị quá tải khiến danh sách video gợi ý không thể tải tiếp các nội dung mới'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Khung quảng cáo che màn hình là vấn đề giao diện quảng cáo, không phải bản chất của “Bong bóng thông tin”.',
              'Chính xác! “Bong bóng thông tin” (Filter Bubble) bao bọc người dùng trong một nhóm chủ đề hẹp lặp đi lặp lại, làm thu hẹp góc nhìn.',
              'Thuật toán gợi ý tối ưu theo mức độ thu hút sự chú ý chứ không tự động lọc sạch tin giả hay chỉ giữ lại bài giảng SGK.',
              'Filter Bubble là hiện tượng do thuật toán cá nhân hóa tạo ra, không phải lỗi đường truyền mạng.'
            ],
            explanation: 'Theo DP-REG (2023) & SGK Bài 4: “Bong bóng thông tin” khiến người dùng chỉ thấy những nội dung giống sở thích đã xem, hạn chế tư duy đa chiều.'
          },
          {
            id: 'ai6-b4-q3',
            question: 'Câu 3: Trong các tình huống sau đây, trường hợp nào phản ánh MẶT HẠN CHẾ của tính năng nhận diện khuôn mặt hoặc giọng nói bằng AI?',
            options: [
              'Người khiếm thị sử dụng tính năng điều khiển bằng giọng nói để nghe đọc tài liệu học tập thuận tiện hơn',
              'Mở khóa điện thoại nhanh chóng bằng khuôn mặt chủ nhân mà không cần gõ mật khẩu mỗi lần sử dụng',
              'Một ứng dụng giải trí miễn phí thu thập ảnh khuôn mặt và mẫu giọng nói không rõ mục đích, tiềm ẩn nguy cơ bị đánh cắp hoặc giả mạo',
              'Ứng dụng học ngoại ngữ nghe giọng đọc của học sinh để góp ý cách phát âm chuẩn từng từ vựng'
            ],
            correctAnswer: 2,
            optionFeedback: [
              'Hỗ trợ người khiếm thị tiếp cận tri thức là mặt tích cực rất nhân văn của AI nhận diện giọng nói.',
              'Tiện lợi khi mở khóa thiết bị cá nhân là mặt tích cực của tính năng nhận diện khuôn mặt.',
              'Chính xác! Dữ liệu khuôn mặt và giọng nói gắn liền với danh tính cá nhân; nếu bị thu thập mập mờ sẽ gây rủi ro lớn về quyền riêng tư và giả mạo.',
              'Hỗ trợ rèn luyện phát âm ngoại ngữ là mặt tích cực của AI trong học tập.'
            ],
            explanation: 'Mục 2 SGK Bài 4: Tính năng nhận diện khuôn mặt/giọng nói rất tiện ích nhưng tiềm ẩn rủi ro lộ dữ liệu sinh trắc học và giả mạo nếu thiếu kiểm soát.'
          },
          {
            id: 'ai6-b4-q4',
            question: 'Câu 4: Nhận định nào sau đây đánh giá ĐÚNG VÀ CÂN BẰNG NHẤT về hai mặt của công cụ AI tạo sinh văn bản, hình ảnh trong học tập?',
            options: [
              'AI tạo sinh chỉ mang lại lợi ích tuyệt đối vì giúp rút ngắn thời gian hoàn thành mọi bài tập mà không có rủi ro nào',
              'AI tạo sinh hoàn toàn có hại nên học sinh cần tránh sử dụng mọi tính năng gợi ý hay minh họa từ AI',
              'AI tạo sinh giúp gợi ý ý tưởng và trực quan hóa kiến thức nhanh, nhưng có thể tạo thông tin sai lệch hoặc làm giảm năng lực tự tư duy nếu học sinh lạm dụng',
              'AI tạo sinh chỉ có hạn chế ở tốc độ xử lí chậm, còn nội dung văn bản và hình ảnh tạo ra luôn đảm bảo độ chính xác khoa học'
            ],
            correctAnswer: 2,
            optionFeedback: [
              'Đánh giá một chiều! AI tạo sinh vẫn có rủi ro ảo giác thông tin, ảnh giả mạo và nguy cơ khiến người học lệ thuộc.',
              'Đánh giá cực đoan! Nếu sử dụng có kiểm chứng và đúng mục đích (Bài 2–3), AI tạo sinh là công cụ hỗ trợ học tập rất tốt.',
              'Chính xác! Đánh giá khách quan cả hai mặt giúp học sinh tận dụng ưu điểm đồng thời chủ động phòng ngừa mặt hạn chế.',
              'Hạn chế lớn của AI tạo sinh không phải tốc độ, mà là nguy cơ sai sự thật (ảo giác AI) và thói quen ỷ lại.'
            ],
            explanation: 'Kiến thức trọng tâm Bài 4: Mỗi tính năng AI đều có hai mặt tích cực và hạn chế; người dùng thông minh cần nhận diện rõ để sử dụng an toàn, hiệu quả.'
          },
          {
            id: 'ai6-b4-q5',
            question: 'Câu 5: Khi nhận thấy trang chủ video của mình chỉ toàn các clip trò chơi lặp đi lặp lại khiến em dễ mất tập trung học tập, nhóm thao tác kĩ thuật nào sau đây giúp kiểm soát thuật toán gợi ý và phá vỡ “bong bóng thông tin” HIỆU QUẢ NHẤT?',
            options: [
              'Tăng âm lượng thiết bị và nhấp xem thật nhanh nhiều video trò chơi khác nhau để làm mới danh sách',
              'Xóa lịch sử xem/tìm kiếm định kì, tắt Tự động phát (Autoplay) và chủ động gõ từ khóa tìm kiếm các chủ đề khoa học, học tập đa dạng',
              'Đăng xuất rồi tạo thêm nhiều tài khoản mới nhưng vẫn tiếp tục xem lại các video trò chơi cũ ngay sau đó',
              'Tắt kết nối Wi-Fi trong 5 phút rồi bật lại để thuật toán tự động xóa sạch dữ liệu hành vi cũ'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Càng nhấp xem thêm nhiều video trò chơi, thuật toán càng ghi nhận tín hiệu quan tâm và đẩy nội dung trò chơi dày đặc hơn.',
              'Xuất sắc! Xóa lịch sử làm sạch dữ liệu đầu vào, tắt Autoplay ngắt chuỗi cuốn hút liên hoàn, và tìm kiếm đa chiều giúp mở rộng luồng gợi ý.',
              'Nếu hành vi xem vẫn lặp lại một chiều thì tài khoản mới cũng sẽ nhanh chóng hình thành bong bóng thông tin tương tự.',
              'Tắt rồi bật lại Wi-Fi không xóa lịch sử hành vi vốn đã được lưu trên tài khoản của nền tảng.'
            ],
            explanation: '5 thao tác kĩ thuật chuẩn (KHBD Bài 4): Xóa lịch sử xem/tìm kiếm, tắt Autoplay, dùng Chế độ Ẩn danh khi cần, chủ động tìm kiếm đa chiều, tắt cá nhân hóa quảng cáo.'
          }
        ]
      },
      {
        id: 'ai6-b4-act-5',
        moduleId: 'module-lesson-4',
        title: 'Hoạt động 4 (Vận dụng & Cầu nối Bài 5): Đề xuất 2 thao tác kĩ thuật kiểm soát thuật toán gợi ý & bảo vệ quyền riêng tư (Rubric 10đ)',
        type: 'assignment',
        durationMinutes: 10,
        isCompleted: false,
        isRequired: true,
        maxScore: 10,
        programmingLanguage: 'Tài liệu & Dự án',
        description: 'Đề xuất 02 thao tác kĩ thuật khả thi kiểm soát thuật toán gợi ý / bảo vệ quyền riêng tư kèm giải thích cơ sở khoa học và hoàn thành câu hỏi cầu nối chuẩn bị Bài 5 (Rubric 10 điểm).',
        assignmentPrompt: 'NHIỆM VỤ VẬN DỤNG BÀI 4 & CẦU NỐI BÀI 5 (KHBD BÀI 4)\n\nTình huống: Bạn của em chia sẻ rằng mỗi tối lên mạng tìm tài liệu học tập chỉ định xem 10 phút, nhưng cứ bị cuốn theo danh sách video giải trí tự động gợi ý đến khuya và còn thường xuyên thấy quảng cáo bám đuổi theo các từ khóa vừa tìm.\n\nEm hãy trình bày bài nộp gồm đầy đủ 3 phần:\n1. Thao tác kĩ thuật số 1 & Cơ sở khoa học: Nêu rõ tên thao tác, cách thực hiện trên thiết bị/ứng dụng và giải thích vì sao thao tác đó giúp kiểm soát thuật toán gợi ý hoặc bảo vệ quyền riêng tư.\n2. Thao tác kĩ thuật số 2 & Cơ sở khoa học: Nêu rõ thao tác kĩ thuật khả thi thứ hai kèm giải thích khoa học.\n3. Nhiệm vụ cầu nối chuẩn bị Bài 5 (Đánh giá độ an toàn của AI): Trước khi cài đặt hoặc đăng nhập một ứng dụng AI mới, em sẽ đặt câu hỏi kiểm tra nào để biết ứng dụng đó có an toàn và minh bạch về dữ liệu hay không?\n\nRUBRIC CHẤM ĐIỂM (10 ĐIỂM – KHBD BÀI 4):\n- Đề xuất đủ 02 thao tác kĩ thuật cụ thể, khả thi trên thiết bị/tài khoản (4,0đ)\n- Giải thích rõ cơ sở khoa học gắn với cơ chế thu thập dữ liệu, bong bóng thông tin hoặc quyền riêng tư (4,0đ)\n- Hoàn thành câu hỏi cầu nối Bài 5, trình bày mạch lạc, đúng chính tả (2,0đ)'
      }
    ]
  };

  const bai5Module = {
    id: 'module-lesson-5',
    courseId: '6AIAB01',
    order: 5,
    title: 'BÀI 5: ĐÁNH GIÁ ĐỘ AN TOÀN CỦA TRÍ TUỆ NHÂN TẠO',
    description: 'Thời lượng: 01 tiết – 45 phút (Trực tiếp tại lớp kết hợp hỗ trợ trên hệ thống LMS – Mức Đánh giá – Vận dụng, YCCĐ 6.B2.1).',
    learningObjectives: '• (6.B2.1) Đặt được Bộ 4 câu hỏi kiểm tra tính an toàn và minh bạch của công cụ AI trước khi sử dụng (UNICEF 2021, U.S. Dept. of Education 2023).\n• Đọc hiểu được mục “An toàn dữ liệu” (Data Safety) / “Quyền riêng tư” (App Privacy) trên kho ứng dụng để nhận diện yêu cầu cấp quyền bất hợp lí (ví dụ ứng dụng chỉnh ảnh đòi Danh bạ và Vị trí chính xác).\n• So sánh và đưa ra nhận xét, quyết định lựa chọn công cụ AI an toàn, phù hợp lứa tuổi học sinh lớp 6.',
    ownerName: '',
    activities: [
      {
        id: 'ai6-b5-act-1',
        moduleId: 'module-lesson-5',
        title: 'Tài liệu đọc: Giới thiệu tổng quan Bài 5 – Đánh giá độ an toàn của Trí tuệ nhân tạo',
        type: 'document',
        durationMinutes: 5,
        isCompleted: false,
        isRequired: true,
        fileUrl: '/hoc-lieu/6aiab01/bai5/0.GioiThieuTongQuan.html',
        description: 'Tài liệu đọc giới thiệu tổng quan kèm sơ đồ cấu trúc 4 mạch nội dung Bài 5: Đánh giá độ an toàn của Trí tuệ nhân tạo (YCCĐ 6.B2.1 · 01 tiết Blended).'
      },
      {
        id: 'ai6-b5-act-2',
        moduleId: 'module-lesson-5',
        title: 'Hoạt động 1 (Khởi động – Diễn đàn): “Cài đặt hay Không cài đặt?” – Tình huống Ứng dụng A vs B (Hình 5.1 SGK)',
        type: 'forum',
        durationMinutes: 5,
        isCompleted: false,
        isRequired: true,
        description: 'TÌNH HUỐNG KHỞI ĐỘNG (Hình 5.1 SGK Bài 5): An muốn cài một ứng dụng AI hỗ trợ học tiếng Anh trên điện thoại và thấy hai lựa chọn:\n• Ứng dụng A: Ghi rõ tên nhà phát triển giáo dục uy tín, công khai mục “An toàn dữ liệu” chỉ xin quyền Micro khi luyện nói, cho phép tắt lưu lịch sử giọng nói.\n• Ứng dụng B: Không rõ nhà phát triển, miễn phí kèm nhiều quảng cáo, vừa mở lên đã đòi quyền truy cập Danh bạ, Vị trí GPS chính xác và toàn bộ Thư viện ảnh.\n\nEm hãy thảo luận trên Diễn đàn:\n1. Nếu là An, em chọn cài đặt ứng dụng nào? Vì sao?\n2. Trước khi bấm “Cài đặt” một ứng dụng có tích hợp AI, em cần kiểm tra những dấu hiệu nào đầu tiên?'
      },
      {
        id: 'ai6-b5-act-3',
        moduleId: 'module-lesson-5',
        title: 'Hoạt động 2 (Kiến thức trọng tâm): Tính an toàn, Tính minh bạch (UNICEF 2021), Bộ 4 câu hỏi kiểm tra & Mục “An toàn dữ liệu”',
        type: 'document',
        durationMinutes: 12,
        isCompleted: false,
        isRequired: true,
        description: '1. HAI TIÊU CHÍ CỐT LÕI KHI ĐÁNH GIÁ CÔNG CỤ AI (UNICEF 2021 & SGK Bài 5):\n• Tính an toàn (Safety): Nội dung và cách hoạt động phù hợp lứa tuổi, không chứa nội dung độc hại, không gây rủi ro lộ lọt thông tin cá nhân hay thiệt hại cho người dùng.\n• Tính minh bạch (Transparency): Nhà phát triển công khai rõ ràng danh tính, mục đích sử dụng dữ liệu, quyền truy cập ứng dụng yêu cầu và cơ chế kiểm soát của người dùng.\n\n2. BỘ 4 CÂU HỎI KIỂM TRA TRƯỚC KHI SỬ DỤNG CÔNG CỤ AI (Hình 5.3 SGK):\n• Câu hỏi 1: Công cụ AI này có an toàn và phù hợp với lứa tuổi học sinh lớp 6 không?\n• Câu hỏi 2: Ứng dụng có yêu cầu thu thập thông tin cá nhân không cần thiết cho chức năng chính hay không?\n• Câu hỏi 3: Người dùng có thể chủ động tắt tính năng theo dõi hoặc xóa lịch sử hoạt động không?\n• Câu hỏi 4: Nhà phát triển và chính sách quyền riêng tư có được công khai rõ ràng, minh bạch không?\n\n3. KĨ NĂNG ĐỌC MỤC “AN TOÀN DỮ LIỆU” (DATA SAFETY / APP PRIVACY):\nLuôn kiểm tra phần “An toàn dữ liệu” (Google Play) hoặc “Quyền riêng tư của ứng dụng” (App Store) trước khi tải để phát hiện ngay các yêu cầu quyền bất hợp lí (ví dụ: ứng dụng chỉnh ảnh lại đòi quyền Danh bạ và Vị trí GPS chính xác).'
      },
      {
        id: 'ai6-b5-act-4',
        moduleId: 'module-lesson-5',
        title: 'Hoạt động 4A (Trắc nghiệm chốt chặn ≥ 8/10đ): Kiểm định độ an toàn và minh bạch của ứng dụng AI (5 câu · 10 phút)',
        type: 'quiz',
        durationMinutes: 10,
        isCompleted: false,
        isRequired: true,
        maxScore: 10,
        passScore: 8,
        timeLimitMinutes: 10,
        shuffleQuestions: false,
        description: 'Ngân hàng 5 câu trắc nghiệm chốt chặn chuẩn theo Học liệu số Bài 5 (thang 10 điểm, ngưỡng đạt ≥ 8/10 điểm). Đọc kĩ các phương án nhiễu gần giống nhau để chọn đáp án chuẩn xác nhất.',
        quizQuestions: [
          {
            id: 'ai6-b5-q1',
            question: 'Câu 1: Theo hướng dẫn của UNICEF (2021) và SGK Bài 5, “Tính minh bạch” (Transparency) của một công cụ AI được hiểu chính xác nhất là gì?',
            options: [
              'Ứng dụng có giao diện màu trắng trong suốt, hiển thị rõ chữ viết và không chứa hình nền phức tạp',
              'Công cụ công khai rõ ràng nhà phát triển, mục đích thu thập – sử dụng dữ liệu và cho người dùng biết AI đang hoạt động như thế nào',
              'Ứng dụng cho phép mọi người dùng tải về hoàn toàn miễn phí mà không cần tạo tài khoản đăng nhập',
              'Công cụ công khai toàn bộ tin nhắn và lịch sử học tập của người dùng này cho những người dùng khác cùng xem'
            ],
            correctAnswer: 1,
            optionFeedback: [
              '“Minh bạch” trong đạo đức AI nói về sự rõ ràng về nhà phát triển và cách xử lí dữ liệu, không phải màu sắc giao diện.',
              'Chính xác! Tính minh bạch giúp người dùng và phụ huynh biết rõ ai tạo ra công cụ, thu thập dữ liệu gì và nhằm mục đích gì.',
              'Nhiều ứng dụng miễn phí không cần đăng nhập vẫn có thể thu thập dữ liệu ngầm thiếu minh bạch.',
              'Công khai lịch sử riêng tư của người dùng cho người khác xem là hành vi vi phạm nghiêm trọng quyền riêng tư!'
            ],
            explanation: 'UNICEF (2021) & SGK Bài 5: Tính minh bạch đòi hỏi công cụ AI công khai rõ ràng nhà phát triển, cơ chế hoạt động và mục đích xử lí dữ liệu.'
          },
          {
            id: 'ai6-b5-q2',
            question: 'Câu 2: Một ứng dụng chỉnh sửa ảnh tích hợp AI (ví dụ ứng dụng tạo hiệu ứng ảnh chân dung) yêu cầu cấp quyền truy cập “Danh bạ điện thoại” và “Vị trí GPS chính xác liên tục”. Em nên đánh giá yêu cầu này như thế nào?',
            options: [
              'Hợp lí vì mọi ứng dụng trên điện thoại đều cần danh bạ và vị trí để hoạt động ổn định, không bị thoát đột ngột',
              'Bất hợp lí vì chức năng chỉnh sửa ảnh chỉ cần quyền truy cập ảnh được chọn; đòi Danh bạ và Vị trí là thu thập dữ liệu vượt quá mục đích cần thiết',
              'Chỉ bất hợp lí nếu ứng dụng thu phí hằng tháng, còn với ứng dụng miễn phí thì việc cấp toàn bộ quyền là hoàn toàn bình thường',
              'Nên bấm Đồng ý hết lúc cài đặt để dùng thử cho nhanh rồi mấy tháng sau mới xem lại trong phần Cài đặt'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Sai! Mỗi ứng dụng chỉ nên được cấp đúng quyền tối thiểu phục vụ chức năng chính của nó.',
              'Chính xác! Áp dụng Câu hỏi 2 trong Bộ 4 câu hỏi kiểm tra: Danh bạ và Vị trí GPS không liên quan đến chức năng chỉnh ảnh nên cần từ chối hoặc không cài đặt.',
              'Dù miễn phí hay trả phí, việc thu thập dữ liệu nhạy cảm vượt quá mục đích chức năng đều tiềm ẩn rủi ro mất an toàn.',
              'Nếu bấm Đồng ý ngay từ đầu, dữ liệu danh bạ và vị trí có thể đã bị ứng dụng thu thập ngay khi vừa mở.'
            ],
            explanation: 'Bài học kiểm định ứng dụng Meitu / chỉnh ảnh (SGK & KHBD Bài 5): Cảnh giác với mọi ứng dụng yêu cầu quyền truy cập không liên quan tới chức năng chính.'
          },
          {
            id: 'ai6-b5-q3',
            question: 'Câu 3: Trước khi tải một ứng dụng AI mới trên Google Play hoặc App Store, em nên kiểm tra mục nào ngay trên trang giới thiệu ứng dụng để biết ứng dụng đó thu thập và chia sẻ những dữ liệu gì?',
            options: [
              'Mục “An toàn dữ liệu” (Data Safety) hoặc “Quyền riêng tư của ứng dụng” (App Privacy)',
              'Mục “Dung lượng tệp tải xuống” và danh sách các màu chủ đề giao diện của ứng dụng',
              'Chỉ cần xem ảnh quảng cáo đầu trang và số lượt tải xuống nhiều nhất trong tuần',
              'Mục “Ứng dụng tương tự có thể bạn thích” ở phía cuối trang kho ứng dụng'
            ],
            correctAnswer: 0,
            optionFeedback: [
              'Chính xác! Mục “An toàn dữ liệu” / “Quyền riêng tư của ứng dụng” liệt kê cụ thể các loại dữ liệu ứng dụng thu thập, mục đích và khả năng xóa dữ liệu.',
              'Dung lượng tệp hay màu sắc giao diện không cho biết ứng dụng có thu thập dữ liệu cá nhân hay chia sẻ cho bên thứ ba hay không.',
              'Ảnh quảng cáo đẹp hay số lượt tải cao không đồng nghĩa với việc ứng dụng an toàn và ít thu thập dữ liệu.',
              'Danh sách ứng dụng tương tự chỉ là gợi ý quảng cáo của kho ứng dụng.'
            ],
            explanation: 'Kĩ năng thực hành Bài 5: Luôn đọc mục “An toàn dữ liệu” (Data Safety) / “Quyền riêng tư của ứng dụng” (App Privacy) trước khi quyết định cài đặt.'
          },
          {
            id: 'ai6-b5-q4',
            question: 'Câu 4: Trong Bộ 4 câu hỏi kiểm tra độ an toàn của công cụ AI, câu hỏi “Em có thể tắt tính năng này hoặc xóa lịch sử hoạt động không?” có ý nghĩa quan trọng nhất là gì?',
            options: [
              'Giúp kiểm tra xem thiết bị của em có đủ dung lượng bộ nhớ trống để lưu ảnh chụp màn hình hay không',
              'Giúp xác định xem người dùng có giữ được quyền chủ động kiểm soát dữ liệu và dừng chia sẻ lịch sử khi không muốn tiếp tục sử dụng hay không',
              'Giúp kiểm tra xem ứng dụng có hỗ trợ chế độ ban đêm để giảm mỏi mắt khi học buổi tối hay không',
              'Giúp so sánh tốc độ phản hồi của công cụ AI này nhanh hơn hay chậm hơn so với các ứng dụng khác'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Câu hỏi này tập trung vào quyền kiểm soát dữ liệu cá nhân của người dùng, không phải dung lượng lưu ảnh của máy.',
              'Chính xác! Một công cụ AI an toàn, tôn trọng người dùng luôn cho phép tắt cá nhân hóa/thu thập dữ liệu và xóa lịch sử hoạt động.',
              'Chế độ ban đêm là tiện ích hiển thị, khác với quyền kiểm soát dữ liệu và lịch sử tương tác.',
              'Khả năng tắt tính năng hoặc xóa lịch sử không đo lường tốc độ phản hồi của máy chủ.'
            ],
            explanation: 'Bộ 4 câu hỏi kiểm tra (SGK Bài 5): Câu hỏi 3 bảo đảm quyền chủ động kiểm soát (User Control) của người học đối với công cụ AI.'
          },
          {
            id: 'ai6-b5-q5',
            question: 'Câu 5: So sánh hai công cụ AI hỗ trợ luyện tiếng Anh cho học sinh lớp 6: Công cụ X công khai tổ chức giáo dục phát triển, chỉ xin quyền Micro khi bấm luyện nói, có nút xóa lịch sử; Công cụ Y không rõ nhà phát triển, bắt nhập số điện thoại phụ huynh và quyền Danh bạ mới cho học thử. Nhận xét nào ĐÚNG NHẤT?',
            options: [
              'Nên chọn Công cụ X (và hỏi ý kiến cha mẹ trước khi cài) vì đáp ứng tốt các tiêu chí an toàn, minh bạch và thu thập dữ liệu tối thiểu',
              'Nên chọn Công cụ Y vì yêu cầu càng nhiều thông tin thì ứng dụng càng bảo mật chặt chẽ hơn cho học sinh',
              'Cả hai công cụ đều có mức độ an toàn như nhau vì cùng phục vụ mục đích học môn Tiếng Anh lớp 6',
              'Nên cài đặt song song cả Công cụ X và Công cụ Y rồi cấp toàn bộ quyền để so sánh trực tiếp'
            ],
            correctAnswer: 0,
            optionFeedback: [
              'Xuất sắc! Công cụ X đáp ứng đầy đủ Bộ 4 câu hỏi kiểm tra: rõ nhà phát triển, phù hợp lứa tuổi, quyền truy cập tối thiểu và cho phép xóa lịch sử.',
              'Hoàn toàn ngược lại! Thu thập thông tin vượt quá chức năng (Danh bạ, SĐT phụ huynh) từ nguồn không rõ ràng là dấu hiệu rủi ro cao.',
              'Cùng mục đích học tiếng Anh nhưng mức độ an toàn và minh bạch dữ liệu giữa hai công cụ hoàn toàn khác nhau.',
              'Cài đặt và cấp toàn bộ quyền cho Công cụ Y sẽ khiến dữ liệu cá nhân của em và gia đình lập tức gặp rủi ro.'
            ],
            explanation: 'Vận dụng Bộ 4 câu hỏi kiểm tra Bài 5 để đối chiếu và lựa chọn công cụ AI an toàn, minh bạch, phù hợp lứa tuổi.'
          }
        ]
      },
      {
        id: 'ai6-b5-act-5',
        moduleId: 'module-lesson-5',
        title: 'Hoạt động 3 & 4B (Thực hành & Vận dụng): Phiếu kiểm duyệt ứng dụng AI theo Bộ 4 câu hỏi & Cầu nối Bài 6 (Rubric 10đ)',
        type: 'assignment',
        durationMinutes: 15,
        isCompleted: false,
        isRequired: true,
        maxScore: 10,
        programmingLanguage: 'Tài liệu & Dự án',
        description: 'Hoàn thành đánh giá 01 công cụ AI quen thuộc theo đủ 4 câu hỏi kiểm tra an toàn & minh bạch (4–5 dòng), nêu nhận xét mục Data Safety và trả lời câu hỏi cầu nối chuẩn bị Bài 6 (Rubric 10 điểm).',
        assignmentPrompt: 'NHIỆM VỤ VẬN DỤNG BÀI 5 & CẦU NỐI BÀI 6 (SGK & KHBD BÀI 5)\n\nPhần 1 – Đánh giá 01 công cụ AI quen thuộc theo Bộ 4 câu hỏi (4–5 dòng):\nChọn 01 công cụ/ứng dụng có tích hợp AI mà em hoặc gia đình biết (VD: Google Dịch, Duolingo, YouTube, ứng dụng chỉnh ảnh AI...) và trả lời rõ đủ 4 câu hỏi kiểm tra:\n  1. Công cụ này có an toàn và phù hợp lứa tuổi học sinh lớp 6 không?\n  2. Qua mục “An toàn dữ liệu” / “Quyền riêng tư”, ứng dụng yêu cầu những dữ liệu hoặc quyền nào? Có quyền nào bất hợp lí không?\n  3. Người dùng có thể tắt tính năng gợi ý/theo dõi hoặc xóa lịch sử hoạt động không?\n  4. Nhà phát triển và chính sách quyền riêng tư có được công khai minh bạch không?\n→ Kết luận của em: Nên dùng / Cần cài đặt lại quyền hạn / Không nên dùng (nêu rõ lí do).\n\nPhần 2 – Nhiệm vụ cầu nối chuẩn bị Bài 6 (Dữ liệu cá nhân là tài sản của mỗi con người):\nTheo em, vì sao hình ảnh khuôn mặt, giọng nói, địa chỉ nhà hay lịch sử tìm kiếm của mỗi người lại cần được xem như “tài sản riêng” không ai được tự ý lấy khi chưa xin phép?\n\nRUBRIC CHẤM ĐIỂM (10 ĐIỂM – KHBD BÀI 5):\n- Vận dụng đầy đủ và chính xác cả 4 câu hỏi kiểm tra vào 01 công cụ cụ thể (5,0đ)\n- Đưa ra kết luận đánh giá hợp lí, có căn cứ từ quyền truy cập / tính minh bạch (3,0đ)\n- Hoàn thành câu hỏi cầu nối Bài 6, trình bày rõ ràng, đúng chính tả (2,0đ)'
      }
    ]
  };

  const bai6Module = {
    id: 'module-lesson-6',
    courseId: '6AIAB01',
    order: 6,
    title: 'BÀI 6: DỮ LIỆU CÁ NHÂN LÀ TÀI SẢN CỦA MỖI CON NGƯỜI',
    description: 'Thời lượng: 01 tiết – 45 phút (Dạy học trực tuyến trên hệ thống LMS – Mức Thông hiểu – Vận dụng, YCCĐ 6.A3.3).',
    learningObjectives: '• (6.A3.3) Giải thích được dữ liệu cá nhân (hình ảnh, giọng nói, họ tên, địa chỉ, thông tin học tập, thói quen sử dụng mạng,...) là tài sản quý giá của mỗi con người.\n• Phân biệt được Dữ liệu cá nhân cơ bản và Dữ liệu cá nhân nhạy cảm theo Điều 2 Nghị định số 13/2023/NĐ-CP của Chính phủ.\n• Trình bày được các quyền của chủ thể dữ liệu (Điều 9) và quy định “sự đồng ý kép” đối với trẻ em từ đủ 7 tuổi trở lên (Điều 20 Nghị định 13/2023/NĐ-CP & UNICEF 2021).',
    ownerName: '',
    activities: [
      {
        id: 'ai6-b6-act-1',
        moduleId: 'module-lesson-6',
        title: 'Tài liệu đọc: Giới thiệu tổng quan Bài 6 – Dữ liệu cá nhân là tài sản của mỗi con người',
        type: 'document',
        durationMinutes: 5,
        isCompleted: false,
        isRequired: true,
        fileUrl: '/hoc-lieu/6aiab01/bai6/0.GioiThieuTongQuan.html',
        description: 'Tài liệu đọc giới thiệu tổng quan kèm sơ đồ cấu trúc 4 mạch nội dung Bài 6: Dữ liệu cá nhân là tài sản của mỗi con người (YCCĐ 6.A3.3 · 01 tiết Trực tuyến).'
      },
      {
        id: 'ai6-b6-act-2',
        moduleId: 'module-lesson-6',
        title: 'Hoạt động 1 (Khởi động – Diễn đàn): “Tài sản số của em là gì?” – Tình huống trang web chuyển ảnh AI (Hình 6.1 SGK)',
        type: 'forum',
        durationMinutes: 5,
        isCompleted: false,
        isRequired: true,
        description: 'SỔ TAY HƯỚNG DẪN 4 CHẶNG (45 PHÚT TRỰC TUYẾN): (1) Khởi động 5p → (2) Video “Dấu chân kỹ thuật số” có 3 câu neo chặn, sơ đồ trực quan & Kiến thức trọng tâm, tự trả lời 3 tình huống pháp lí cùng bạn Minh (20p) → (3) Trắc nghiệm chốt chặn “Bảo vệ Kho báu dữ liệu” 5 câu đạt ≥ 8/10đ (10p) → (4) Xử lí tình huống “Lời mời hấp dẫn” & Cầu nối Bài 7 (10p).\n\nTÌNH HUỐNG KHỞI ĐỘNG (Hình 6.1 SGK Bài 6): Bạn Khoa tìm thấy một trang web AI miễn phí chuyển ảnh chân dung thành tranh vẽ, nhưng trang web đòi lưu trữ hình ảnh khuôn mặt, giọng nói và địa chỉ trường học.\n\nEm hãy trả lời 2 câu hỏi lên Diễn đàn:\n1. Trong tình huống của bạn Khoa, em sẽ chọn Đồng ý ngay, Từ chối cấp quyền không cần thiết hay Dừng lại hỏi ý kiến cha mẹ? Vì sao?\n2. Hãy kể tên 02 loại thông tin cá nhân của bản thân mà em cho rằng cần được giữ kín như tài sản riêng khi dùng Internet.'
      },
      {
        id: 'ai6-b6-act-video',
        moduleId: 'module-lesson-6',
        title: 'Hoạt động 2.1 (Video): Dấu chân kỹ thuật số – Dữ liệu cá nhân là gì? (02:34 · 3 câu neo chặn)',
        type: 'video',
        durationMinutes: 5,
        isCompleted: false,
        isRequired: true,
        videoUrl: 'https://www.youtube.com/watch?v=RNac5ZDIN-g',
        videoDuration: 154,
        preventVideoSkip: true,
        description: 'Em xem video “Dấu chân kỹ thuật số” để biết những dấu vết em để lại khi hoạt động trên mạng. Video sẽ tự dừng ở 3 điểm để em trả lời câu hỏi; em cần trả lời đúng mới xem tiếp được. Xem xong, em đọc Mục 1 SGK Bài 6 để phân biệt dữ liệu cá nhân cơ bản và dữ liệu cá nhân nhạy cảm.',
        videoCheckpoints: [
          {
            id: 'b6-cp1',
            timeSeconds: 55,
            question: 'Dấu chân kỹ thuật số được hình thành từ những hoạt động nào của em trên mạng?',
            options: [
              'Từ toàn bộ hoạt động trực tuyến như xem video, tìm kiếm, thích, bình luận và chia sẻ.',
              'Chỉ hình thành khi em nhập số căn cước công dân hoặc số tài khoản ngân hàng.',
              'Là các tệp virus tự sinh ra khi tắt máy tính.',
              'Chỉ xuất hiện khi em bị mất mật khẩu.'
            ],
            correctAnswer: 0,
            explanation: 'Mọi hoạt động trên mạng đều để lại dấu vết. Lịch sử hoạt động trên không gian mạng là dữ liệu cá nhân cơ bản (Nghị định 13/2023/NĐ-CP).',
            requireCorrect: true
          },
          {
            id: 'b6-cp2',
            timeSeconds: 105,
            question: 'Các nền tảng số thu thập dấu vết hành vi của người dùng chủ yếu để làm gì?',
            options: [
              'Tự động xóa toàn bộ lịch sử người dùng sau mỗi 24 giờ.',
              'Chỉ lưu trong bộ nhớ mà không bao giờ sử dụng.',
              'Phân tích sở thích, huấn luyện thuật toán gợi ý nội dung và hiển thị quảng cáo nhắm đúng người dùng.'
            ],
            correctAnswer: 2,
            explanation: 'Dữ liệu hành vi giúp nền tảng đoán sở thích của em để gợi ý nội dung và quảng cáo, vì vậy đó là tài sản cần được bảo vệ.',
            requireCorrect: true
          },
          {
            id: 'b6-cp3',
            timeSeconds: 150,
            question: 'Để bảo vệ dấu chân số và hạn chế rủi ro cho bản thân, em cần ghi nhớ điều gì?',
            options: [
              'Công khai số điện thoại, địa chỉ nhà trên các hội nhóm mạng xã hội.',
              'Suy nghĩ kĩ trước khi đăng tải, cài đặt quyền riêng tư và chia sẻ thông tin có trách nhiệm.',
              'Cho phép mọi ứng dụng lạ truy cập danh bạ và vị trí.'
            ],
            correctAnswer: 1,
            explanation: 'Những gì đã đăng lên mạng rất khó xóa hết. Em cần nghĩ trước khi đăng, bật quyền riêng tư và chỉ chia sẻ thông tin cần thiết.',
            requireCorrect: true
          }
        ]
      },
      {
        id: 'ai6-b6-act-3',
        moduleId: 'module-lesson-6',
        title: 'Hoạt động 2 (Kiến thức trọng tâm): Phân loại Dữ liệu cá nhân & 4 Quyền của chủ thể dữ liệu (Nghị định 13/2023/NĐ-CP)',
        type: 'document',
        durationMinutes: 15,
        isCompleted: false,
        isRequired: true,
        description: '1. KHÁI NIỆM & PHÂN LOẠI DỮ LIỆU CÁ NHÂN (Điều 2 Nghị định 13/2023/NĐ-CP – Hình 6.2 SGK):\n• Dữ liệu cá nhân là thông tin dưới dạng kí hiệu, chữ viết, chữ số, hình ảnh, âm thanh... gắn liền hoặc giúp xác định một con người cụ thể (bao gồm cả “Dấu chân kỹ thuật số”).\n• Nhóm 1 – Dữ liệu cá nhân cơ bản (Khoản 3 Điều 2): Họ tên khai sinh, ngày sinh, giới tính, quê quán, địa chỉ liên hệ, hình ảnh cá nhân, giọng nói, số điện thoại, số định danh, thông tin học tập, tài khoản số và lịch sử hoạt động trên không gian mạng (điểm k).\n• Nhóm 2 – Dữ liệu cá nhân nhạy cảm (Khoản 4 Điều 2): Tình trạng sức khỏe và hồ sơ bệnh án, dữ liệu vị trí địa lí qua định vị GPS, thông tin tài khoản ngân hàng/tài chính, dữ liệu sinh trắc học đặc thù (vân tay, đặc điểm sinh học riêng), quan điểm tôn giáo và đời tư.\n\n2. DỮ LIỆU CÁ NHÂN LÀ TÀI SẢN & QUYỀN CỦA CHỦ SỞ HỮU (Điều 9 & Điều 20 Nghị định 13/2023/NĐ-CP – Hình 6.3 SGK):\n• Dữ liệu cá nhân gắn liền với danh tính, sự an toàn cá nhân và có giá trị lớn với các hệ thống AI.\n• 4 quyền cơ bản của chủ thể dữ liệu (Điều 9): (1) Quyền được biết; (2) Quyền đồng ý hoặc không đồng ý; (3) Quyền rút lại sự đồng ý; (4) Quyền yêu cầu xóa dữ liệu.\n• Bảo vệ trẻ em (Khoản 2 Điều 20 NĐ 13/2023 & UNICEF 2021): Xử lí dữ liệu cá nhân của trẻ em từ đủ 7 tuổi trở lên BẮT BUỘC phải có sự đồng ý kép của cả trẻ em VÀ cha, mẹ hoặc người giám hộ.'
      },
      {
        id: 'ai6-b6-act-4',
        moduleId: 'module-lesson-6',
        title: 'Hoạt động 3 (Trắc nghiệm chốt chặn ≥ 8/10đ): Phân loại Dữ liệu cá nhân & Quyền chủ thể dữ liệu (5 câu · 10 phút)',
        type: 'quiz',
        durationMinutes: 10,
        isCompleted: false,
        isRequired: true,
        maxScore: 10,
        passScore: 8,
        timeLimitMinutes: 10,
        shuffleQuestions: false,
        description: 'Bài kiểm tra chốt chặn Bài 6 (5 câu, thang 10 điểm, điều kiện đạt ≥ 8/10 điểm) căn cứ trực tiếp Nghị định số 13/2023/NĐ-CP, Video “Dấu chân kỹ thuật số” và 3 tình huống pháp lí cùng bạn Minh.',
        quizQuestions: [
          {
            id: 'ai6-b6-q1',
            question: 'Câu 1: Theo nội dung Video “Dấu chân kỹ thuật số” và Điểm k Khoản 3 Điều 2 Nghị định 13/2023/NĐ-CP, lịch sử tìm kiếm, xem video và hoạt động của em trên không gian mạng được xếp vào nhóm nào?',
            options: [
              'Thông tin kiến thức chung công cộng nên mọi nền tảng đều có quyền thu thập tự do',
              'Dữ liệu cá nhân cơ bản thuộc tài sản gắn liền với mỗi cá nhân trên không gian mạng',
              'Dữ liệu kĩ thuật tạm thời của trình duyệt, tự động biến mất hoàn toàn sau khi tắt máy',
              'Chỉ được xem là dữ liệu cá nhân nếu người dùng có nhập kèm số tài khoản ngân hàng'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Sai! Thông tin kiến thức chung là công thức toán học hay tên hành tinh, còn lịch sử duyệt web gắn với hành vi riêng của từng người.',
              'Chính xác! Điểm k Khoản 3 Điều 2 Nghị định 13/2023/NĐ-CP quy định rõ lịch sử hoạt động trên không gian mạng là dữ liệu cá nhân cơ bản.',
              'Dấu chân kỹ thuật số vẫn được lưu trên máy chủ nền tảng ngay cả khi em đã tắt máy tính hoặc điện thoại.',
              'Lịch sử hoạt động mạng tự nó đã là dữ liệu cá nhân cơ bản, không phụ thuộc việc có nhập số ngân hàng hay không.'
            ],
            explanation: 'Căn cứ điểm k khoản 3 Điều 2 Nghị định 13/2023/NĐ-CP: Lịch sử hoạt động trên không gian mạng là dữ liệu cá nhân cơ bản.'
          },
          {
            id: 'ai6-b6-q2',
            question: 'Câu 2: Theo Khoản 4 Điều 2 Nghị định số 13/2023/NĐ-CP, nhóm thông tin nào sau đây gồm toàn bộ các DỮ LIỆU CÁ NHÂN NHẠY CẢM cần được bảo vệ đặc biệt chặt chẽ?',
            options: [
              'Họ tên khai sinh, ngày tháng năm sinh, hình ảnh chân dung và kết quả học tập ở trường',
              'Vị trí địa lí hiện tại qua định vị GPS, tình trạng sức khỏe – hồ sơ bệnh án và thông tin tài khoản ngân hàng gia đình',
              'Công thức tính diện tích hình tam giác, tên các hành tinh trong Hệ Mặt Trời và lịch thi học kì chung của trường',
              'Lịch sử tìm kiếm video học tập, tên tài khoản đăng nhập số và địa chỉ trường học'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Cẩn thận! Họ tên, ngày sinh, hình ảnh cá nhân và thông tin học tập thuộc nhóm Dữ liệu cá nhân CƠ BẢN (Khoản 3 Điều 2).',
              'Chính xác! Vị trí GPS, tình trạng sức khỏe/bệnh án và thông tin tài chính ngân hàng đều thuộc nhóm Dữ liệu cá nhân NHẠY CẢM (Khoản 4 Điều 2).',
              'Công thức toán học và tên hành tinh là thông tin kiến thức chung, không phải dữ liệu cá nhân.',
              'Lịch sử hoạt động mạng, tài khoản số và địa chỉ liên hệ thuộc nhóm Dữ liệu cá nhân cơ bản.'
            ],
            explanation: 'Phân loại theo Điều 2 Nghị định 13/2023/NĐ-CP (Hình 6.2 SGK Bài 6): Nhạy cảm gồm sức khỏe/bệnh án, vị trí GPS, tài chính ngân hàng, sinh trắc học đặc thù.'
          },
          {
            id: 'ai6-b6-q3',
            question: 'Câu 3 (Tình huống pháp lí 1 – Bạn Minh): Minh đăng kí tài khoản trên một ứng dụng chơi cờ vua trực tuyến. Theo Điều 9 Nghị định 13/2023/NĐ-CP, ai là chủ thể có quyền quyết định cho phép hoặc từ chối chia sẻ dữ liệu cá nhân của Minh?',
            options: [
              'Nhà phát triển trò chơi cờ vua vì họ là đơn vị cung cấp phần mềm miễn phí cho Minh sử dụng',
              'Chính bản thân Minh (chủ thể dữ liệu) cùng cha, mẹ hoặc người giám hộ hợp pháp',
              'Quản trị viên phòng chơi trực tuyến hoặc người chơi cùng bàn với Minh trên hệ thống',
              'Bất kì công ty quảng cáo nào có liên kết đối tác với ứng dụng cờ vua đó'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Nhà phát triển cung cấp ứng dụng nhưng không có quyền sở hữu dữ liệu cá nhân của người dùng nếu chưa được sự đồng ý hợp lệ.',
              'Chính xác! Chỉ chủ thể dữ liệu (và cha mẹ/người giám hộ đối với trẻ em) mới có quyền quyết định chia sẻ dữ liệu cá nhân.',
              'Người chơi cùng hay quản trị viên phòng game tuyệt đối không có quyền quyết định đối với dữ liệu của Minh.',
              'Bên quảng cáo thứ ba không được tự ý khai thác dữ liệu nếu không có sự đồng ý rõ ràng từ chủ thể dữ liệu.'
            ],
            explanation: 'Căn cứ Khoản 1 & 2 Điều 9 Nghị định 13/2023/NĐ-CP: Chủ thể dữ liệu có quyền được biết và quyền đồng ý/không đồng ý việc xử lí dữ liệu của mình.'
          },
          {
            id: 'ai6-b6-q4',
            question: 'Câu 4 (Tình huống pháp lí 2 – Bạn Minh): Sau 2 tuần cài ứng dụng “Đèn pin”, Minh phát hiện ứng dụng âm thầm truy cập vị trí GPS và danh bạ. Theo Khoản 4, 5 Điều 9 Nghị định 13/2023/NĐ-CP, Minh có quyền gì?',
            options: [
              'Phải tiếp tục chấp nhận vô điều kiện vì lúc cài đặt ban đầu Minh đã lỡ bấm nút Đồng ý',
              'Có quyền rút lại sự đồng ý, tắt ngay quyền truy cập trong Cài đặt, yêu cầu ngừng xử lí và xóa dữ liệu đã thu thập',
              'Chỉ được quyền thu hồi quyền truy cập sau khi sử dụng đủ 1 năm hoặc trả phí nâng cấp tài khoản',
              'Chỉ có thể tắt định vị GPS tạm thời khi đi ngủ, không có quyền yêu cầu xóa dữ liệu cá nhân'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Sai! Việc từng đồng ý trước đó không làm mất quyền thu hồi của chủ thể dữ liệu.',
              'Chính xác! Khoản 4 và 5 Điều 9 Nghị định 13/2023/NĐ-CP bảo đảm quyền rút lại sự đồng ý và quyền yêu cầu xóa dữ liệu bất kì lúc nào.',
              'Pháp luật không đặt điều kiện thời hạn hay thu phí khi chủ thể dữ liệu thực hiện quyền rút lại sự đồng ý.',
              'Chủ thể dữ liệu hoàn toàn có quyền thu hồi hẳn quyền truy cập, gỡ ứng dụng và yêu cầu xóa dữ liệu.'
            ],
            explanation: 'Điều 9 Nghị định 13/2023/NĐ-CP: Chủ sở hữu có quyền rút lại sự đồng ý và quyền yêu cầu xóa dữ liệu cá nhân của mình.'
          },
          {
            id: 'ai6-b6-q5',
            question: 'Câu 5 (Tình huống pháp lí 3 – Bạn Minh 12 tuổi): Một trang web muốn thu thập họ tên, số điện thoại và địa chỉ nhà của Minh (học sinh lớp 6, 12 tuổi). Theo Khoản 2 Điều 20 Nghị định 13/2023/NĐ-CP, điều kiện pháp lí BẮT BUỘC là gì?',
            options: [
              'Chỉ cần Minh tự bấm nút Đồng ý trên màn hình là đã đầy đủ giá trị pháp lí vì Minh đã đủ 7 tuổi',
              'Chỉ cần trang web tặng điểm thưởng học tập và hiển thị điều khoản bằng chữ nhỏ ở cuối trang',
              'Bắt buộc phải có sự đồng ý kép của CẢ bản thân Minh VÀ cha, mẹ hoặc người giám hộ hợp pháp',
              'Chỉ cần một người bạn cùng lớp trên 12 tuổi xác nhận đồng ý thay cho Minh'
            ],
            correctAnswer: 2,
            optionFeedback: [
              'Rất dễ nhầm! Với trẻ em từ đủ 7 tuổi trở lên, chỉ riêng trẻ em đồng ý là CHƯA ĐỦ — cần thêm sự đồng ý của cha mẹ hoặc người giám hộ.',
              'Quà tặng hay điều khoản chữ nhỏ không thể thay thế sự đồng ý hợp lệ theo quy định pháp luật bảo vệ trẻ em.',
              'Xuất sắc! Khoản 2 Điều 20 Nghị định 13/2023/NĐ-CP quy định xử lí dữ liệu trẻ em từ đủ 7 tuổi trở lên bắt buộc phải có sự đồng ý của cả trẻ em VÀ cha, mẹ/người giám hộ.',
              'Bạn cùng lớp không phải là người giám hộ hợp pháp nên không có quyền quyết định thay.'
            ],
            explanation: 'Điều 20 Khoản 2 Nghị định 13/2023/NĐ-CP & UNICEF (2021): Bảo vệ trẻ em bằng nguyên tắc sự đồng ý kép (trẻ em từ đủ 7 tuổi + cha mẹ/người giám hộ).'
          }
        ]
      },
      {
        id: 'ai6-b6-act-5',
        moduleId: 'module-lesson-6',
        title: 'Hoạt động 4 (Vận dụng & Cầu nối Bài 7): Xử lí tình huống “Lời mời hấp dẫn” & Kiểm tra quyền ứng dụng cùng gia đình (Rubric 10đ)',
        type: 'assignment',
        durationMinutes: 10,
        isCompleted: false,
        isRequired: true,
        maxScore: 10,
        programmingLanguage: 'Tài liệu & Dự án',
        description: 'Giải quyết tình huống “Lời mời hấp dẫn” (ứng dụng học Toán miễn phí đòi quyền Danh bạ), trả lời câu hỏi cầu nối chuẩn bị Bài 7 và ghi nhận xét kiểm tra mục Permissions cùng cha mẹ (Rubric 10 điểm).',
        assignmentPrompt: 'NHIỆM VỤ VẬN DỤNG BÀI 6 & CẦU NỐI BÀI 7 (KHBD BÀI 6)\n\nPhần 1 – Giải quyết tình huống “Lời mời hấp dẫn”:\nMột ứng dụng học Toán miễn phí yêu cầu em cấp quyền truy cập Danh bạ điện thoại mới cho dùng thử.\n  (a) Em sẽ quyết định Đồng ý hay Từ chối? Hãy giải thích dựa trên kiến thức về Dữ liệu cá nhân và Quyền của chủ thể dữ liệu.\n  (b) Nếu trước đó em đã lỡ bấm Đồng ý, theo Nghị định 13/2023/NĐ-CP em có quyền gì và sẽ thực hiện những thao tác nào để sửa sai?\n\nPhần 2 – Nhiệm vụ cầu nối chuẩn bị Bài 7 (Quyền riêng tư và kỹ năng tự vệ số):\nNếu một tài khoản lạ tự ý lấy ảnh chân dung và số điện thoại của em đăng lên mạng để trêu chọc hoặc giả mạo bằng AI, theo em việc đầu tiên em cần làm là gì?\n\nPhần 3 (Mở rộng cùng gia đình – Mục Vận dụng SGK Bài 6):\nCùng cha mẹ kiểm tra mục “Quyền truy cập ứng dụng” (Permissions) của 2 ứng dụng trên điện thoại/máy tính bảng gia đình và ghi ngắn gọn nhận xét xem các quyền đang bật đã hợp lí chưa.\n\nRUBRIC CHẤM ĐIỂM (10 ĐIỂM – KHBD BÀI 6):\n- Giải quyết chính xác cả hai vế tình huống (từ chối & thao tác rút lại sự đồng ý) (5,0đ)\n- Lập luận sử dụng chính xác thuật ngữ & cơ sở pháp lí (Chủ thể dữ liệu, Quyền đồng ý/rút lại sự đồng ý, vai trò cha mẹ) (3,0đ)\n- Hoàn thành câu hỏi cầu nối Bài 7, trình bày mạch lạc, đúng chính tả (2,0đ)'
      }
    ]
  };

  const bai7Module = {
    id: 'module-lesson-7',
    courseId: '6AIAB01',
    order: 7,
    title: 'BÀI 7: QUYỀN RIÊNG TƯ VÀ KỸ NĂNG TỰ VỆ SỐ',
    description: 'Thời lượng: 01 tiết – 45 phút (Dạy học trực tuyến trên hệ thống LMS – Mức Nhận biết – Thông hiểu – Vận dụng, YCCĐ 6.A3.4).',
    learningObjectives: '• (6.A3.4) Trình bày được khái niệm quyền riêng tư ở mức đơn giản và ý nghĩa đối với sự an toàn, danh dự và tự do của con người trong môi trường số.\n• Nêu được các tác hại nghiêm trọng khi dữ liệu cá nhân bị AI xấu lạm dụng: Doxing, Deepfake, bắt nạt/quấy rối tự động, lừa đảo giả mạo (Spoofing/Scams – DP-REG 2023, UNICEF 2021).\n• Vận dụng đúng Quy tắc 3 Không, Quy trình 3 Bước tự vệ số (Dừng chia sẻ → Báo cha mẹ, thầy cô / Tổng đài 111 → Chặn và Báo cáo trên nền tảng) vào các tình huống thực tế.',
    ownerName: '',
    activities: [
      {
        id: 'ai6-b7-act-1',
        moduleId: 'module-lesson-7',
        title: 'Tài liệu đọc: Giới thiệu tổng quan Bài 7 – Quyền riêng tư và kỹ năng tự vệ số',
        type: 'document',
        durationMinutes: 5,
        isCompleted: false,
        isRequired: true,
        fileUrl: '/hoc-lieu/6aiab01/bai7/0.GioiThieuTongQuan.html',
        description: 'Tài liệu đọc giới thiệu tổng quan kèm sơ đồ cấu trúc 4 mạch nội dung Bài 7: Quyền riêng tư và kỹ năng tự vệ số (YCCĐ 6.A3.4 · 01 tiết Trực tuyến).'
      },
      {
        id: 'ai6-b7-act-2',
        moduleId: 'module-lesson-7',
        title: 'Hoạt động 1 (Khởi động – Diễn đàn): “Cảnh giác trước yêu cầu thu thập dữ liệu” (Hình 7.1 SGK)',
        type: 'forum',
        durationMinutes: 5,
        isCompleted: false,
        isRequired: true,
        description: 'SỔ TAY HƯỚNG DẪN 4 CHẶNG (45 PHÚT TRỰC TUYẾN): (1) Khởi động 5p → (2) Sơ đồ trực quan 1–2 & Kiến thức trọng tâm, tự luyện 3 câu đọc hiểu và sắp xếp 3 bước tự vệ (20p) → (3) Trắc nghiệm chốt chặn tình huống 5 câu đạt ≥ 8/10đ (10p) → (4) Tư vấn “Hỗ trợ bạn bè” & Cầu nối Bài 8 (10p).\n\nTÌNH HUỐNG KHỞI ĐỘNG (SGK & KHBD Bài 7): Một ứng dụng AI biến ảnh thành nhân vật hoạt hình (hoặc tài khoản lạ báo trúng thưởng như tình huống của An – Hình 7.1) yêu cầu em cung cấp họ tên thật, ngày sinh, số điện thoại, tên trường và toàn bộ thư viện ảnh/giọng nói.\n\nEm hãy chia sẻ lên Diễn đàn:\n1. Em cảm thấy thế nào và quyết định ra sao trước yêu cầu thu thập thông tin quá mức như vậy?\n2. Viết 01 câu ngắn gọn giải thích lí do cho lựa chọn của mình.'
      },
      {
        id: 'ai6-b7-act-3',
        moduleId: 'module-lesson-7',
        title: 'Hoạt động 2 (Kiến thức trọng tâm): Quyền riêng tư, 4 Hiểm họa từ AI xấu, Quy tắc 3 Không, 3 Bước tự vệ số & Tổng đài 111',
        type: 'document',
        durationMinutes: 15,
        isCompleted: false,
        isRequired: true,
        description: '1. QUYỀN RIÊNG TƯ & Ý NGHĨA (Hình 7.2 SGK Bài 7):\n• Quyền riêng tư trong môi trường số là quyền mỗi cá nhân được giữ kín, bảo vệ và tự quyết định việc chia sẻ thông tin, hình ảnh, dữ liệu cá nhân của mình.\n• Ý nghĩa đối với 3 phương diện cốt lõi: Bảo vệ SỰ AN TOÀN – Giữ gìn DANH DỰ, UY TÍN – Bảo đảm SỰ TỰ DO.\n\n2. BỐN HIỂM HỌA KHI DỮ LIỆU BỊ AI XẤU LẠM DỤNG (DP-REG 2023, UNICEF 2021, eSafety 2023):\n• Deepfake: Dùng AI ghép khuôn mặt hoặc bắt chước giọng nói vào video, cuộc gọi giả mạo để bôi nhọ danh dự hoặc lừa đảo người thân.\n• Doxing: Thu thập và tung công khai trái phép tên thật, địa chỉ nhà, số điện thoại để quấy rối, đe dọa.\n• Bắt nạt, quấy rối tự động: Tài khoản tự động gửi tin nhắn đe dọa, lan truyền tin giả.\n• Lừa đảo & giả mạo (Scams / Spoofing): Chatbot hoặc tài khoản giả danh dụ nhập mật khẩu, chiếm đoạt tài khoản.\n\n3. QUY TẮC 3 KHÔNG & QUY TRÌNH 3 BƯỚC TỰ VỆ SỐ (Hình 7.3 SGK Bài 7):\n• Phòng ngừa (3 Không): Không nhập thông tin định danh – Không tải ảnh riêng tư/thẻ học sinh – Không tự ý dùng công cụ AI khi chưa đủ tuổi hoặc chưa được cha mẹ cho phép.\n• Ứng phó ban đầu theo đúng thứ tự 3 Bước:\n  + Bước 1 – Dừng chia sẻ ngay: Ngừng tương tác (tuyệt đối không đôi co), đóng ứng dụng, đổi mật khẩu nếu lỡ lộ, chụp màn hình làm bằng chứng.\n  + Bước 2 – Báo cho người lớn tin cậy: Kể ngay sự việc và đưa bằng chứng cho cha mẹ, thầy cô giáo; ghi nhớ Tổng đài Quốc gia Bảo vệ Trẻ em miễn phí 111 hoạt động 24/7.\n  + Bước 3 – Chặn và Báo cáo trên nền tảng: Nhấn Chặn (Block) và Báo cáo vi phạm (Report) để gỡ nội dung và khóa tài khoản xấu.'
      },
      {
        id: 'ai6-b7-act-4',
        moduleId: 'module-lesson-7',
        title: 'Hoạt động 3 (Trắc nghiệm chốt chặn ≥ 8/10đ): Quyền riêng tư, Hiểm họa AI xấu & 3 Bước tự vệ số (5 câu · 10 phút)',
        type: 'quiz',
        durationMinutes: 10,
        isCompleted: false,
        isRequired: true,
        maxScore: 10,
        passScore: 8,
        timeLimitMinutes: 10,
        shuffleQuestions: false,
        description: 'Bài kiểm tra chốt chặn Bài 7 (5 câu, thang 10 điểm, điều kiện đạt ≥ 8/10 điểm) tích hợp kiến thức sơ đồ trực quan 1–2 và 3 tình huống xử lí sự cố an toàn dữ liệu.',
        quizQuestions: [
          {
            id: 'ai6-b7-q1',
            question: 'Câu 1: Việc bảo vệ quyền riêng tư trong môi trường số có ý nghĩa trực tiếp đối với ba phương diện cốt lõi nào của mỗi con người?',
            options: [
              'Tốc độ đường truyền Internet, dung lượng bộ nhớ máy tính và thời lượng pin của thiết bị',
              'Sự an toàn thân thể – tài sản, danh dự – uy tín và sự tự do học tập, giao tiếp lành mạnh',
              'Số lượng bạn bè kết nối trên mạng xã hội, lượt thích bài viết và tốc độ tải ứng dụng',
              'Khả năng truy cập miễn phí các trang web giải trí và không phải cập nhật mật khẩu định kì'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Tốc độ mạng, bộ nhớ hay pin là thông số kĩ thuật phần cứng, không phải ý nghĩa xã hội của quyền riêng tư.',
              'Chính xác! Bảo vệ quyền riêng tư giữ vững sự an toàn, danh dự – uy tín và sự tự do của con người trên môi trường số (Mục 1 SGK Bài 7).',
              'Lượt thích hay số bạn bè trên mạng không phải là giá trị cốt lõi mà quyền riêng tư bảo vệ.',
              'Bảo vệ quyền riêng tư đòi hỏi luôn đặt mật khẩu mạnh và cẩn trọng trước các trang web miễn phí không rõ nguồn gốc.'
            ],
            explanation: 'SGK Bài 7 (Hình 7.2): Bảo vệ quyền riêng tư có ý nghĩa đặc biệt đối với sự an toàn, danh dự và tự do của mỗi con người.'
          },
          {
            id: 'ai6-b7-q2',
            question: 'Câu 2: Hành vi kẻ xấu thu thập trái phép họ tên thật, địa chỉ nhà, số điện thoại của một cá nhân rồi tung công khai lên mạng nhằm quấy rối, đe dọa được gọi bằng thuật ngữ nào?',
            options: [
              'Deepfake (Giả mạo hình ảnh, giọng nói bằng AI)',
              'Doxing (Thu thập và phơi bày trái phép thông tin bí mật cá nhân)',
              'Filter Bubble (Bong bóng thông tin từ thuật toán gợi ý)',
              'Hallucination (Hiện tượng ảo giác thông tin của AI)'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Rất dễ nhầm! Deepfake là ghép khuôn mặt/giả giọng nói bằng AI, còn tung công khai địa chỉ/SĐT bí mật là Doxing.',
              'Chính xác! Doxing (DP-REG 2023) là hành vi thu thập và phát tán công khai thông tin cá nhân bí mật để quấy rối hoặc đe dọa.',
              'Filter Bubble là hiện tượng thuật toán gợi ý nội dung lặp lại một chiều (Bài 4).',
              'Hallucination là hiện tượng AI tự bịa đặt kiến thức sai sự thật (Bài 3).'
            ],
            explanation: 'Thuật ngữ Bài 7 (DP-REG 2023): Phân biệt rõ Doxing (phơi bày dữ liệu bí mật) và Deepfake (giả mạo khuôn mặt, giọng nói).'
          },
          {
            id: 'ai6-b7-q3',
            question: 'Câu 3: Khi phát hiện hình ảnh cá nhân bị tài khoản lạ tự ý đăng tải lên mạng xã hội kèm lời trêu chọc, thứ tự ĐÚNG NHẤT của Quy trình 3 bước ứng phó ban đầu là gì?',
            options: [
              'Nhắn tin tranh cãi yêu cầu xóa bài → Xóa hết lịch sử trò chuyện → Chờ vài ngày xem sao',
              '(1) Dừng chia sẻ, chụp màn hình làm bằng chứng → (2) Báo ngay cho cha mẹ, thầy cô giáo (hoặc Tổng đài 111) → (3) Chặn (Block) và Báo cáo (Report) trên nền tảng',
              '(1) Tự tạo tài khoản khác đăng bài nói xấu lại → (2) Gửi mật khẩu cho bạn nhờ báo cáo hộ → (3) Tắt nguồn điện thoại',
              '(1) Xóa ứng dụng ngay mà không lưu bằng chứng → (2) Giấu kín không kể với cha mẹ vì sợ bị mắng → (3) Bỏ qua sự việc'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Tuyệt đối không đôi co với kẻ xấu và không xóa mất bằng chứng cần thiết để người lớn xử lí.',
              'Chính xác! Đúng trình tự 3 bước tự vệ số chuẩn theo Hình 7.3 SGK Bài 7.',
              'Trả đũa trên mạng hoặc chia sẻ mật khẩu cho người khác chỉ khiến rủi ro mất an toàn nghiêm trọng hơn.',
              'Cần chụp màn hình lưu bằng chứng và báo ngay cho cha mẹ, thầy cô thay vì âm thầm giấu kín.'
            ],
            explanation: 'Quy trình 3 Bước tự vệ số (SGK Bài 7): Bước 1 Dừng chia sẻ & lưu bằng chứng → Bước 2 Báo người lớn tin cậy / Tổng đài 111 → Bước 3 Chặn & Báo cáo.'
          },
          {
            id: 'ai6-b7-q4',
            question: 'Câu 4 (Tình huống 1 & 2): Một ứng dụng AI yêu cầu bật GPS và chụp ảnh góc bàn học có đặt thẻ học sinh; ngay sau đó một chatbot lạ nhắn tin báo trúng quà trò chơi đòi mật khẩu trong 3 phút. Em chọn cách ứng xử nào AN TOÀN NHẤT?',
            options: [
              'Chỉ chụp góc bàn học có thẻ học sinh (không bật GPS) và gửi tên đăng nhập game nhưng không gửi số điện thoại',
              'Từ chối cấp quyền ứng dụng soi phòng, dừng trả lời chatbot giả mạo, chụp màn hình bằng chứng, báo cha mẹ và Chặn/Báo cáo tài khoản lừa đảo',
              'Bật GPS một phút cho ứng dụng chụp nhanh rồi tắt ngay, còn với chatbot thì nhắn tin hỏi lại xem có đúng nhà phát hành thật không',
              'Cung cấp thông tin giả nhưng vẫn bấm vào đường link nhận quà của chatbot để kiểm tra thử'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Công nghệ thị giác máy tính vẫn đọc được họ tên, trường lớp trên thẻ học sinh, còn gửi tên đăng nhập cho chatbot lạ tạo nguy cơ chiếm đoạt tài khoản.',
              'Xuất sắc! Em vừa bảo vệ dữ liệu vị trí/thẻ học sinh, vừa ngăn chặn hoàn toàn chiêu trò giả mạo (Spoofing – UNICEF 2021).',
              'Bật GPS dù ngắn vẫn làm lộ dữ liệu vị trí nhạy cảm, và tiếp tục nhắn tin với chatbot lừa đảo là vi phạm bước 1 (Dừng chia sẻ).',
              'Bấm vào đường link lạ từ chatbot giả mạo có thể dẫn tới trang đánh cắp tài khoản hoặc mã độc.'
            ],
            explanation: 'Kết hợp Quy tắc 3 Không và 3 Bước tự vệ số để phòng tránh lộ dữ liệu sinh trắc/định danh và lừa đảo giả mạo (Spoofing).'
          },
          {
            id: 'ai6-b7-q5',
            question: 'Câu 5 (Tình huống 3 – Deepfake & Tổng đài khẩn cấp): Em nhận cuộc gọi video mờ giật 5 giây có khuôn mặt giống giáo viên chủ nhiệm rồi tắt máy, kèm tin nhắn giục chụp hai mặt thẻ ngân hàng của bố mẹ gửi gấp. Cách xử lí nào ĐÚNG NHẤT, và số Tổng đài Quốc gia Bảo vệ Trẻ em miễn phí 24/7 tại Việt Nam là số nào?',
            options: [
              'Gửi trước mặt trước thẻ ngân hàng để xác nhận rồi hỏi bố mẹ sau; Tổng đài là 115',
              'Nhắn tin mắng lại tài khoản lừa đảo để cảnh cáo rồi chặn sau; Tổng đài là 114',
              'Dừng ngay giao dịch, không gửi bất kì ảnh nào, gọi trực tiếp số điện thoại của cha mẹ/giáo viên để xác minh và báo cáo tài khoản giả mạo; Tổng đài là 111',
              'Gọi video lại cho tài khoản lạ đó để xem rõ khuôn mặt thêm lần nữa trước khi quyết định; Tổng đài là 113'
            ],
            correctAnswer: 2,
            optionFeedback: [
              'Tuyệt đối không bao giờ chụp gửi thông tin thẻ ngân hàng; ngoài ra 115 là số cấp cứu y tế, không phải Tổng đài Bảo vệ Trẻ em.',
              'Không tự đôi co với kẻ lừa đảo; ngoài ra 114 là số cứu hỏa, không phải Tổng đài Bảo vệ Trẻ em.',
              'Xuất sắc! Nhận diện đúng thủ đoạn lừa đảo Deepfake, xác minh qua kênh trực tiếp đáng tin cậy và ghi nhớ chính xác Tổng đài Quốc gia Bảo vệ Trẻ em 111.',
              'Không tương tác tiếp với tài khoản giả mạo; số Tổng đài Quốc gia Bảo vệ Trẻ em miễn phí 24/7 là 111 (113 là cảnh sát phản ứng nhanh).'
            ],
            explanation: 'Cảnh giác Deepfake (Mục 1–2 SGK Bài 7) và ghi nhớ số Tổng đài Quốc gia Bảo vệ Trẻ em miễn phí 24/7 tại Việt Nam: 111.'
          }
        ]
      },
      {
        id: 'ai6-b7-act-5',
        moduleId: 'module-lesson-7',
        title: 'Hoạt động 4 (Vận dụng & Cầu nối Bài 8): Tư vấn “Hỗ trợ bạn bè” xử lí lộ mật khẩu & Cầu nối Bài 8 (Rubric 10đ)',
        type: 'assignment',
        durationMinutes: 10,
        isCompleted: false,
        isRequired: true,
        maxScore: 10,
        programmingLanguage: 'Tài liệu & Dự án',
        description: 'Viết tin nhắn an ủi và hướng dẫn bạn thân thực hiện đúng thứ tự 3 bước tự vệ số khi lỡ lộ mật khẩu vào trang AI giả mạo, đồng thời trả lời câu hỏi cầu nối chuẩn bị Bài 8 (Rubric 10 điểm).',
        assignmentPrompt: 'NHIỆM VỤ VẬN DỤNG BÀI 7 & CẦU NỐI BÀI 8 (KHBD BÀI 7)\n\nPhần 1 – Tin nhắn tư vấn “Hỗ trợ bạn bè”:\nTình huống: Một người bạn thân của em rất lo lắng vì vừa lỡ nhập họ tên thật, số điện thoại và mật khẩu tài khoản mạng xã hội vào một trang web AI giải trí không rõ nguồn gốc (dự đoán điểm thi tương lai). Hiện tài khoản của bạn đang tự động nhắn tin vay tiền khắp danh sách bạn bè.\n→ Em hãy viết một tin nhắn ngắn gọn với lời lẽ an ủi, động viên (không trách móc) và hướng dẫn bạn thực hiện đầy đủ, ĐÚNG THỨ TỰ 3 BƯỚC ứng phó ngay lập tức (có nhắc số Tổng đài Quốc gia Bảo vệ Trẻ em 111 khi cần hỗ trợ khẩn cấp).\n\nPhần 2 – Nhiệm vụ cầu nối chuẩn bị Bài 8 (Con người làm chủ Trí tuệ nhân tạo):\nTrong đời sống hằng ngày (ví dụ khi đi đường có bản đồ AI gợi ý hoặc khi đi khám bệnh có AI hỗ trợ bác sĩ), em hãy nêu 01 tình huống cụ thể mà AI đưa ra gợi ý nhưng con người phải tự cân nhắc điều kiện thực tế để ra quyết định cuối cùng.\n\nRUBRIC CHẤM ĐIỂM (10 ĐIỂM – KHBD BÀI 7):\n- Đề xuất đầy đủ và đúng thứ tự Quy trình 3 bước tự vệ số (6,0đ)\n- Văn phong an ủi, nhân ái, mạch lạc và đúng chính tả (2,0đ)\n- Hoàn thành câu hỏi cầu nối Bài 8 và nộp bài đúng quy cách (2,0đ)'
      }
    ]
  };

  const bai8Module = {
    id: 'module-lesson-8',
    courseId: '6AIAB01',
    order: 8,
    title: 'BÀI 8: CON NGƯỜI LÀM CHỦ TRÍ TUỆ NHÂN TẠO',
    description: 'Thời lượng: 01 tiết – 45 phút (Trực tiếp tại lớp kết hợp hỗ trợ trên LMS – Mức Vận dụng tổng hợp toàn chuyên đề, YCCĐ 6.A3.1).',
    learningObjectives: '• (6.A3.1) Nêu được ví dụ thực tiễn về tình huống con người ra quyết định với sự hỗ trợ của AI trong y tế, giao thông, học tập và đời sống.\n• Giải thích được giới hạn phán đoán theo ngữ cảnh của AI (U.S. Dept. of Education 2023) và quyền không sử dụng, bỏ qua hoặc điều chỉnh đầu ra AI (Điều 14 Khoản 4(d) EU AI Act 2024).\n• Thực hành thành thạo Quy trình 3 bước ra quyết định khi có gợi ý của AI (Nêu lại gợi ý AI → Cân nhắc điều kiện thực tế → Đưa ra lựa chọn kèm lí do) và viết Cam kết tổng kết 8 bài học.',
    ownerName: '',
    activities: [
      {
        id: 'ai6-b8-act-1',
        moduleId: 'module-lesson-8',
        title: 'Tài liệu đọc: Giới thiệu tổng quan Bài 8 – Con người làm chủ Trí tuệ nhân tạo',
        type: 'document',
        durationMinutes: 5,
        isCompleted: false,
        isRequired: true,
        fileUrl: '/hoc-lieu/6aiab01/bai8/0.GioiThieuTongQuan.html',
        description: 'Tài liệu đọc giới thiệu tổng quan kèm sơ đồ cấu trúc 4 mạch nội dung Bài 8: Con người làm chủ Trí tuệ nhân tạo (YCCĐ 6.A3.1 · 01 tiết Blended).'
      },
      {
        id: 'ai6-b8-act-2',
        moduleId: 'module-lesson-8',
        title: 'Hoạt động 1 (Khởi động – Diễn đàn): “Lộ trình nào an toàn?” – Tình huống gia đình bạn An (Hình 8.1 SGK)',
        type: 'forum',
        durationMinutes: 5,
        isCompleted: false,
        isRequired: true,
        description: 'KIẾN THỨC NỀN TỔNG HỢP (BÀI 1–7): AI là công cụ do con người tạo ra (Bài 1), sử dụng hiệu quả bằng Prompt rõ ràng (Bài 2), luôn thực chứng thông tin (Bài 3), nhận diện hai mặt thuật toán và kiểm định an toàn (Bài 4–5), bảo vệ tài sản dữ liệu và tự vệ số (Bài 6–7).\n\nTÌNH HUỐNG KHỞI ĐỘNG (Hình 8.1 SGK Bài 8): Cuối tuần gia đình bạn An đi ngoại thành. Ứng dụng bản đồ AI gợi ý 2 lộ trình: Tuyến đường A qua quốc lộ mất 50 phút; Tuyến đường B đi tắt qua đường đê ven sông chỉ mất 35 phút. Tuy nhiên, đêm qua trời vừa mưa rất lớn khiến đường đê nhỏ dễ trơn trượt và ngập nước.\n\nEm hãy trả lời trên Diễn đàn:\n1. Theo em, bố của bạn An nên chọn đi Tuyến đường A hay Tuyến đường B? Vì sao?\n2. Điều kiện thực tế nào mà ứng dụng bản đồ AI chưa thể phán đoán toàn diện như người lái xe?'
      },
      {
        id: 'ai6-b8-act-3',
        moduleId: 'module-lesson-8',
        title: 'Hoạt động 2 (Kiến thức trọng tâm): Vai trò AI – Con người, Điều 14 EU AI Act (2024) & Quy trình 3 bước ra quyết định',
        type: 'document',
        durationMinutes: 12,
        isCompleted: false,
        isRequired: true,
        description: '1. CON NGƯỜI RA QUYẾT ĐỊNH VỚI SỰ HỖ TRỢ CỦA AI (Hình 8.2 SGK Bài 8):\n• Trong y tế: AI phân tích ảnh X-quang và khoanh vùng điểm bất thường giúp sàng lọc nhanh; bác sĩ trực tiếp thăm khám tổng thể, xem xét tiền sử bệnh để quyết định phác đồ điều trị cuối cùng.\n• Trong giao thông: Bản đồ AI tính toán tuyến đường ngắn nhất; người lái xe quan sát thời tiết, biển báo sửa đường và mặt đường thực tế để quyết định lộ trình an toàn.\n• Cơ sở khoa học & pháp lí: Theo Bộ Giáo dục Hoa Kỳ (2023), AI không có khả năng phán đoán theo ngữ cảnh rộng về đạo đức, cảm xúc và thực tế biến đổi như con người. Theo Điều 14 Khoản 4(d) Đạo luật AI châu Âu (EU AI Act, 2024), con người luôn có quyền không sử dụng, bỏ qua, điều chỉnh hoặc đảo ngược đầu ra của AI.\n\n2. QUY TRÌNH 3 BƯỚC RA QUYẾT ĐỊNH KHI CÓ GỢI Ý CỦA AI (Hình 8.3 SGK Bài 8):\n• Bước 1 – Nêu lại gợi ý của AI: Xác định rõ phương án hoặc lời khuyên mà công cụ AI đề xuất.\n• Bước 2 – Cân nhắc điều kiện thực tế (Phán đoán ngữ cảnh): Đối chiếu với quy định an toàn, sức khỏe, thời gian, môi trường xung quanh và quyền riêng tư.\n• Bước 3 – Đưa ra lựa chọn của bản thân kèm lí do: Chủ động chọn ĐỒNG Ý, ĐIỀU CHỈNH hoặc TỪ CHỐI gợi ý của AI và giải thích rõ lí do.'
      },
      {
        id: 'ai6-b8-act-4',
        moduleId: 'module-lesson-8',
        title: 'Hoạt động 4A (Trắc nghiệm chốt chặn tổng kết ≥ 8/10đ): Con người làm chủ Trí tuệ nhân tạo (5 câu · 10 phút)',
        type: 'quiz',
        durationMinutes: 10,
        isCompleted: false,
        isRequired: true,
        maxScore: 10,
        passScore: 8,
        timeLimitMinutes: 10,
        shuffleQuestions: false,
        description: 'Bài kiểm tra chốt chặn Bài 8 – Tổng kết Chuyên đề AI lớp 6 (5 câu, thang 10 điểm, điều kiện đạt ≥ 8/10 điểm theo KHBD & Học liệu số Bài 8).',
        quizQuestions: [
          {
            id: 'ai6-b8-q1',
            question: 'Câu 1: Trong tình huống bác sĩ sử dụng hệ thống AI phân tích ảnh chụp X-quang phổi, vai trò của hệ thống AI và vai trò của bác sĩ được phân định ĐÚNG NHẤT như thế nào?',
            options: [
              'Hệ thống AI tự động kết luận bệnh và kê đơn thuốc, còn bác sĩ chỉ có nhiệm vụ in đơn thuốc giao cho người bệnh',
              'Hệ thống AI hỗ trợ phân tích ảnh và gợi ý vùng nghi vấn; bác sĩ thăm khám tổng thể người bệnh và đưa ra quyết định điều trị cuối cùng',
              'Bác sĩ không được phép điều chỉnh gợi ý của hệ thống AI vì phần mềm đã phân tích hàng nghìn ảnh chụp trước đó',
              'Hệ thống AI chịu hoàn toàn trách nhiệm pháp lí và y khoa nếu phương án điều trị xảy ra sai sót'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Sai! AI không được tự ý kê đơn thay bác sĩ vì không thể khám trực tiếp và nắm toàn bộ bối cảnh lâm sàng của từng bệnh nhân.',
              'Chính xác! AI đóng vai trò công cụ sàng lọc và gợi ý; bác sĩ luôn là người tổng hợp bối cảnh thực tế và quyết định phương án điều trị cuối cùng.',
              'Theo Điều 14 EU AI Act (2024), con người luôn có quyền kiểm tra, điều chỉnh hoặc bỏ qua đầu ra của AI.',
              'Công cụ AI không có tư cách pháp lí; trách nhiệm chuyên môn luôn thuộc về con người vận hành và ra quyết định.'
            ],
            explanation: 'Mục 1 SGK Bài 8 (Hình 8.2): Trong y tế, AI hỗ trợ sàng lọc nhanh còn bác sĩ thăm khám và chịu trách nhiệm quyết định phác đồ điều trị.'
          },
          {
            id: 'ai6-b8-q2',
            question: 'Câu 2: Theo Bộ Giáo dục Hoa Kỳ (U.S. Department of Education, 2023), lí do CỐT LÕI khiến con người luôn phải giữ vai trò quyết định cuối cùng thay vì phó mặc cho AI là gì?',
            options: [
              'Vì hệ thống AI không thể xử lí các phép tính số học hay tìm kiếm dữ liệu nhanh bằng con người',
              'Vì AI không có khả năng phán đoán theo ngữ cảnh rộng về điều kiện thực tế biến đổi, đạo đức, cảm xúc và sự an toàn như con người',
              'Vì các hệ thống AI chỉ hoạt động ổn định trong môi trường phòng thí nghiệm và không thể đưa ra bất kì gợi ý nào',
              'Vì việc tự ra quyết định giúp tiết kiệm dung lượng điện năng tiêu thụ của các trung tâm dữ liệu'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Thực tế máy tính và AI tính toán số học, sàng lọc dữ liệu nhanh hơn con người rất nhiều; điểm yếu của AI nằm ở phán đoán ngữ cảnh.',
              'Chính xác! Phán đoán theo ngữ cảnh rộng (an toàn, đạo đức, cảm xúc, tình huống bất ngờ) là năng lực đặc trưng của con người mà AI không thể thay thế.',
              'AI đã và đang đưa ra nhiều gợi ý hữu ích trong y tế, giao thông, học tập — nhưng vẫn cần con người giám sát.',
              'Tiết kiệm điện năng không phải lí do cốt lõi của nguyên tắc “Human in the Loop” (Con người trong vòng lặp).'
            ],
            explanation: 'U.S. Dept. of Education (2023, tr. 17): Con người giữ quyền quyết định cuối cùng vì AI thiếu khả năng phán đoán theo ngữ cảnh rộng.'
          },
          {
            id: 'ai6-b8-q3',
            question: 'Câu 3: Thứ tự ĐÚNG của Quy trình 3 bước ra quyết định khi nhận được gợi ý từ một công cụ AI (Hình 8.3 SGK Bài 8) là gì?',
            options: [
              'Bước 1: Làm theo ngay gợi ý của AI → Bước 2: Chờ kết quả xảy ra → Bước 3: Điều chỉnh lại nếu thấy sai',
              'Bước 1: Nêu lại gợi ý của AI → Bước 2: Cân nhắc điều kiện thực tế → Bước 3: Đưa ra lựa chọn của bản thân (Đồng ý/Điều chỉnh/Từ chối) kèm lí do',
              'Bước 1: Từ chối ngay mọi gợi ý của AI → Bước 2: Không cần xem xét dữ kiện → Bước 3: Tự đoán ngẫu nhiên phương án khác',
              'Bước 1: Hỏi ý kiến nhiều bạn bè → Bước 2: Bỏ qua điều kiện sức khỏe, thời gian → Bước 3: Chép nguyên văn đề xuất của AI'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Làm theo ngay rồi mới chờ sai để sửa có thể gây hậu quả nguy hiểm về an toàn giao thông, sức khỏe hoặc bảo mật.',
              'Chính xác! Đủ và đúng trình tự 3 bước chuẩn theo Hình 8.3 SGK Bài 8.',
              'Không nên từ chối cực đoan mà cần xem xét gợi ý của AI rồi đối chiếu với điều kiện thực tế.',
              'Bỏ qua điều kiện sức khỏe, thời gian hay quy định thực tế là đi ngược lại bước quan trọng nhất của quy trình.'
            ],
            explanation: 'Quy trình 3 bước (SGK Bài 8): (1) Nêu lại gợi ý của AI → (2) Cân nhắc điều kiện thực tế → (3) Đưa ra lựa chọn kèm lí do.'
          },
          {
            id: 'ai6-b8-q4',
            question: 'Câu 4: Theo tinh thần Điều 14 Khoản 4(d) Đạo luật AI của Liên minh châu Âu (EU AI Act, 2024), khi nhận thấy gợi ý của hệ thống AI không phù hợp hoặc tiềm ẩn rủi ro trong tình huống thực tế, con người có quyền gì?',
            options: [
              'Bắt buộc phải tuân theo đúng đầu ra của AI để bảo đảm tính thống nhất của thuật toán',
              'Có quyền quyết định không sử dụng, bỏ qua, điều chỉnh hoặc đảo ngược đầu ra của hệ thống AI nhằm bảo đảm an toàn',
              'Chỉ được phép điều chỉnh gợi ý của AI sau khi gửi đơn xin phép nhà phát triển phần mềm',
              'Phải chờ hệ thống AI tự phát hiện lỗi và cập nhật phiên bản mới rồi mới được ra quyết định'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Sai! Mục đích của giám sát con người (Human Oversight) là tránh lệ thuộc mù quáng vào đầu ra của thuật toán.',
              'Chính xác! Điều 14 Khoản 4(d) EU AI Act (2024) khẳng định quyền chủ động không sử dụng, bỏ qua, điều chỉnh hoặc đảo ngược đầu ra của AI.',
              'Người sử dụng (như bác sĩ, phi công, lái xe, học sinh) cần hành động kịp thời ngay tại thời điểm ra quyết định chứ không chờ nhà phát triển.',
              'Chờ hệ thống tự sửa lỗi trong tình huống khẩn cấp có thể gây mất an toàn nghiêm trọng.'
            ],
            explanation: 'Điều 14 Khoản 4(d) EU AI Act (2024): Con người luôn nắm quyền giám sát và quyền từ chối, bỏ qua hoặc điều chỉnh đầu ra của AI.'
          },
          {
            id: 'ai6-b8-q5',
            question: 'Câu 5 (Tổng kết Chuyên đề 8 bài): Nguyên tắc cốt lõi nào sau đây thể hiện ĐÚNG NHẤT tinh thần “Con người làm chủ Trí tuệ nhân tạo” sau toàn bộ 8 bài học (Chủ đề A & B)?',
            options: [
              'Tin tưởng hoàn toàn mọi câu trả lời của AI để tiết kiệm thời gian và nhờ AI làm thay toàn bộ bài tập',
              'Sử dụng AI có mục đích rõ ràng, luôn thực chứng thông tin, kiểm định độ an toàn, bảo vệ dữ liệu cá nhân – quyền riêng tư và tự chịu trách nhiệm với quyết định cuối cùng',
              'Chia sẻ đầy đủ họ tên, địa chỉ, lịch trình cá nhân cho mọi ứng dụng AI miễn phí để nhận được gợi ý chính xác hơn',
              'Tuyệt đối không bao giờ sử dụng bất kì ứng dụng công nghệ hay công cụ AI nào trong học tập và đời sống'
            ],
            correctAnswer: 1,
            optionFeedback: [
              'Tin tuyệt đối và để AI làm thay bài tập vừa có nguy cơ dính ảo giác AI, vừa vi phạm tính trung thực và làm giảm năng lực tư duy.',
              'Xuất sắc! Em đã tổng hợp trọn vẹn tinh thần của cả 8 bài học Chuyên đề Trí tuệ nhân tạo lớp 6 (Chủ đề A & Chủ đề B).',
              'Chia sẻ thông tin định danh bừa bãi cho ứng dụng miễn phí vi phạm nguyên tắc bảo vệ tài sản dữ liệu cá nhân và quyền riêng tư.',
              'Mục tiêu của chuyên đề không phải né tránh công nghệ, mà là làm chủ AI một cách an toàn, thông minh và có trách nhiệm.'
            ],
            explanation: 'Thông điệp tổng kết Chuyên đề AI lớp 6: AI hỗ trợ gợi ý – Con người kiểm chứng, bảo vệ dữ liệu, phán đoán ngữ cảnh và làm chủ quyết định cuối cùng.'
          }
        ]
      },
      {
        id: 'ai6-b8-act-5',
        moduleId: 'module-lesson-8',
        title: 'Hoạt động 4B (Vận dụng & Tổng kết chuyên đề 8 bài): Ra quyết định chuyến tham quan lớp 6A & Cam kết làm chủ AI (Rubric 10đ)',
        type: 'assignment',
        durationMinutes: 15,
        isCompleted: false,
        isRequired: true,
        maxScore: 10,
        programmingLanguage: 'Tài liệu & Dự án',
        description: 'Thực hành Quy trình 3 bước ra quyết định cho tình huống chuyến tham quan lớp 6A (SGK Bài 8) và viết Cam kết cá nhân tổng kết Chuyên đề AI lớp 6 (Rubric 10 điểm).',
        assignmentPrompt: 'NHIỆM VỤ VẬN DỤNG BÀI 8 & TỔNG KẾT CHUYÊN ĐỀ 8 BÀI (SGK & KHBD BÀI 8)\n\nPhần 1 – Thực hành Quy trình 3 bước (Tình huống chuyến tham quan lớp 6A):\nLớp 6A dự định tổ chức chuyến tham quan học tập. An nhờ công cụ AI gợi ý và AI đề xuất: “Tổ chức cắm trại qua đêm tại khu rừng cách trường 70 km”. Tuy nhiên, theo quy định của nhà trường, học sinh lớp 6 chỉ được tham quan trong ngày và nhiều bạn trong lớp dễ bị say xe khi đi đường dài.\n\nEm hãy trình bày đầy đủ theo đúng 3 bước:\n• Bước 1 – Nêu lại gợi ý của công cụ AI.\n• Bước 2 – Cân nhắc đầy đủ các điều kiện thực tế của lớp 6A.\n• Bước 3 – Đưa ra lựa chọn của em (Đồng ý / Điều chỉnh / Từ chối), đề xuất địa điểm tham quan cụ thể phù hợp và nêu rõ lí do thuyết phục.\n\nPhần 2 – Phản tư & Cam kết tổng kết Chuyên đề 8 bài (Chủ đề A & Chủ đề B):\nViết 01 cam kết cá nhân ngắn gọn (2–3 câu) về điều em tâm đắc nhất và cách em sẽ sử dụng, làm chủ công cụ AI an toàn, trung thực, có trách nhiệm trong học tập sắp tới.\n\nRUBRIC CHẤM ĐIỂM (10 ĐIỂM – KHBD BÀI 8):\n- Cấu trúc đủ 3 bước tình huống lớp 6A, chỉ rõ cả 2 điều kiện thực tế (4,0đ)\n- Phương án thay thế hợp lí, an toàn và lí do thuyết phục (4,0đ)\n- Cam kết tổng kết chuyên đề sâu sắc, đúng chính tả và nộp đúng hạn (2,0đ)'
      }
    ]
  };

  const officialFiles = [
    ...OFFICIAL_AI_GRADE6_LESSONS.map((lessonTitle, idx) => ({
      id: `file-ai6-b${idx + 1}-tongquan`,
      name: `0.GioiThieuTongQuan_Bai${idx + 1}.html`,
      filename: '0.GioiThieuTongQuan.html',
      url: `/hoc-lieu/6aiab01/bai${idx + 1}/0.GioiThieuTongQuan.html`,
      size: idx === 2 ? '25 KB' : '26 KB',
      mimetype: 'text/html',
      fileType: 'code',
      folder: lessonTitle,
      moduleId: `module-lesson-${idx + 1}`,
      description: `Tài liệu đọc Giới thiệu tổng quan kèm sơ đồ 4 mạch nội dung chuẩn mẫu M9 cho ${lessonTitle}.`,
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    })),
    {
      id: 'file-ai6-b1-sgk',
      name: '0.SGK_Bai1_NguonGocAI_QuyenQuyetDinh.docx',
      filename: '0.SGK.docx',
      url: '/hoc-lieu/6aiab01/bai1/0.SGK.docx',
      size: '70 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 1: NGUỒN GỐC CỦA AI VÀ QUYỀN QUYẾT ĐỊNH',
      moduleId: 'module-lesson-1',
      description: 'Giáo trình / Sách giáo khoa Bài 1: Nguồn gốc của AI và quyền quyết định (Tin học 6 – Chuyên đề AI).',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b1-khbd',
      name: '1.KHBD_Bai1_NguonGocAI_QuyenQuyetDinh.docx',
      filename: '1.KHBD.docx',
      url: '/hoc-lieu/6aiab01/bai1/1.KHBD.docx',
      size: '72 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 1: NGUỒN GỐC CỦA AI VÀ QUYỀN QUYẾT ĐỊNH',
      moduleId: 'module-lesson-1',
      description: 'Kế hoạch bài dạy (2 tiết: Tiết 1 Trực tuyến LMS, Tiết 2 Trực tiếp tại lớp) – Bài 1.',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b1-hoclieuso',
      name: '2.HocLieuSo_Bai1_NguonGocAI.docx',
      filename: '2.HocLieuSo.docx',
      url: '/hoc-lieu/6aiab01/bai1/2.HocLieuSo.docx',
      size: '51 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 1: NGUỒN GỐC CỦA AI VÀ QUYỀN QUYẾT ĐỊNH',
      moduleId: 'module-lesson-1',
      description: 'Trọn bộ kịch bản Học liệu số Bài 1 (Study Guide, Infographic 1 & 2, Quiz 5 câu, 7 Slide, Game & Rubric 10đ).',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
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
    },
    {
      id: 'file-ai6-b3-sgk',
      name: '0.SGK_Bai3_ThucChungThongTin_LamChuAI.docx',
      filename: '0.SGK.docx',
      url: '/hoc-lieu/6aiab01/bai3/0.SGK.docx',
      size: '19 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 3: THỰC CHỨNG THÔNG TIN - LÀM CHỦ AI',
      moduleId: 'module-lesson-3',
      description: 'Sách giáo khoa Bài 3: Thực chứng thông tin – Làm chủ AI (Tin học 6 – Chuyên đề AI).',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b3-khbd',
      name: '1.KHBD_Bai3_ThucChungThongTin_LamChuAI.docx',
      filename: '1.KHBD.docx',
      url: '/hoc-lieu/6aiab01/bai3/1.KHBD.docx',
      size: '73 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 3: THỰC CHỨNG THÔNG TIN - LÀM CHỦ AI',
      moduleId: 'module-lesson-3',
      description: 'Kế hoạch bài dạy chuẩn CV 5512 (01 tiết trực tiếp kết hợp LMS) – Bài 3.',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b3-hoclieuso',
      name: '2.HocLieuSo_Bai3_ThucChungThongTin.docx',
      filename: '2.HocLieuSo.docx',
      url: '/hoc-lieu/6aiab01/bai3/2.HocLieuSo.docx',
      size: '390 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 3: THỰC CHỨNG THÔNG TIN - LÀM CHỦ AI',
      moduleId: 'module-lesson-3',
      description: 'Trọn bộ kịch bản Học liệu số Bài 3 (8 Slide, Infographic 3 kênh kiểm chứng, Game Phòng thí nghiệm, Phiếu Bạch Đằng 938, Quiz 5 câu & Rubric).',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b4-sgk',
      name: '0.SGK_Bai4_MatTichCuc_TieuCuc_TinhNangAI.docx',
      filename: '0.SGK.docx',
      url: '/hoc-lieu/6aiab01/bai4/0.SGK.docx',
      size: '18 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 4: KHÁM PHÁ MẶT TÍCH CỰC VÀ TIÊU CỰC CỦA MỘT SỐ TÍNH NĂNG AI',
      moduleId: 'module-lesson-4',
      description: 'Sách giáo khoa Bài 4: Khám phá mặt tích cực và tiêu cực của một số tính năng AI.',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b4-khbd',
      name: '1.KHBD_Bai4_MatTichCuc_TieuCuc_TinhNangAI.docx',
      filename: '1.KHBD.docx',
      url: '/hoc-lieu/6aiab01/bai4/1.KHBD.docx',
      size: '80 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 4: KHÁM PHÁ MẶT TÍCH CỰC VÀ TIÊU CỰC CỦA MỘT SỐ TÍNH NĂNG AI',
      moduleId: 'module-lesson-4',
      description: 'Kế hoạch bài dạy trực tuyến 45 phút trên LMS (YCCĐ 6.B1.1, DP-REG 2023) – Bài 4.',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b4-hoclieuso',
      name: '2.HocLieuSo_Bai4_HaiMatTinhNangAI.docx',
      filename: '2.HocLieuSo.docx',
      url: '/hoc-lieu/6aiab01/bai4/2.HocLieuSo.docx',
      size: '263 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 4: KHÁM PHÁ MẶT TÍCH CỰC VÀ TIÊU CỰC CỦA MỘT SỐ TÍNH NĂNG AI',
      moduleId: 'module-lesson-4',
      description: 'Trọn bộ kịch bản Học liệu số Bài 4 (Mô phỏng Thuật toán gợi ý, Infographic Hai mặt AI, Game kéo – thả 10 thẻ & Rubric 10đ).',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b5-sgk',
      name: '0.SGK_Bai5_DanhGiaDoAnToanAI.docx',
      filename: '0.SGK.docx',
      url: '/hoc-lieu/6aiab01/bai5/0.SGK.docx',
      size: '18 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 5: ĐÁNH GIÁ ĐỘ AN TOÀN CỦA TRÍ TUỆ NHÂN TẠO',
      moduleId: 'module-lesson-5',
      description: 'Sách giáo khoa Bài 5: Đánh giá độ an toàn của Trí tuệ nhân tạo (Tin học 6 – Chuyên đề AI).',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b5-khbd',
      name: '1.KHBD_Bai5_DanhGiaDoAnToanAI.docx',
      filename: '1.KHBD.docx',
      url: '/hoc-lieu/6aiab01/bai5/1.KHBD.docx',
      size: '84 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 5: ĐÁNH GIÁ ĐỘ AN TOÀN CỦA TRÍ TUỆ NHÂN TẠO',
      moduleId: 'module-lesson-5',
      description: 'Kế hoạch bài dạy chuẩn CV 5512 (01 tiết trực tiếp kết hợp LMS, YCCĐ 6.B2.1) – Bài 5.',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b5-hoclieuso',
      name: '2.HocLieuSo_Bai5_DanhGiaDoAnToanAI.docx',
      filename: '2.HocLieuSo.docx',
      url: '/hoc-lieu/6aiab01/bai5/2.HocLieuSo.docx',
      size: '256 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 5: ĐÁNH GIÁ ĐỘ AN TOÀN CỦA TRÍ TUỆ NHÂN TẠO',
      moduleId: 'module-lesson-5',
      description: 'Trọn bộ kịch bản Học liệu số Bài 5 (8 Slide, Data Safety Meitu, Infographic 4 Tiêu chí – 4 Câu hỏi, Game Trạm kiểm định & Quiz 5 câu).',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b6-sgk',
      name: '0.SGK_Bai6_DuLieuCaNhanLaTaiSan.docx',
      filename: '0.SGK.docx',
      url: '/hoc-lieu/6aiab01/bai6/0.SGK.docx',
      size: '18 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 6: DỮ LIỆU CÁ NHÂN LÀ TÀI SẢN CỦA MỖI CON NGƯỜI',
      moduleId: 'module-lesson-6',
      description: 'Sách giáo khoa Bài 6: Dữ liệu cá nhân là tài sản của mỗi con người (Nghị định 13/2023/NĐ-CP).',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b6-khbd',
      name: '1.KHBD_Bai6_DuLieuCaNhanLaTaiSan.docx',
      filename: '1.KHBD.docx',
      url: '/hoc-lieu/6aiab01/bai6/1.KHBD.docx',
      size: '83 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 6: DỮ LIỆU CÁ NHÂN LÀ TÀI SẢN CỦA MỖI CON NGƯỜI',
      moduleId: 'module-lesson-6',
      description: 'Kế hoạch bài dạy trực tuyến 45 phút trên LMS (YCCĐ 6.A3.3, Nghị định 13/2023/NĐ-CP) – Bài 6.',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b6-hoclieuso',
      name: '2.HocLieuSo_Bai6_DuLieuCaNhanLaTaiSan.docx',
      filename: '2.HocLieuSo.docx',
      url: '/hoc-lieu/6aiab01/bai6/2.HocLieuSo.docx',
      size: '264 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 6: DỮ LIỆU CÁ NHÂN LÀ TÀI SẢN CỦA MỖI CON NGƯỜI',
      moduleId: 'module-lesson-6',
      description: 'Trọn bộ kịch bản Học liệu số Bài 6 (Video Dấu chân số, Infographic Hình 6.2 & 6.3, Module 3 tình huống bạn Minh & Game Kho báu dữ liệu).',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b7-sgk',
      name: '0.SGK_Bai7_QuyenRiengTu_KyNangTuVeSo.docx',
      filename: '0.SGK.docx',
      url: '/hoc-lieu/6aiab01/bai7/0.SGK.docx',
      size: '19 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 7: QUYỀN RIÊNG TƯ VÀ KỸ NĂNG TỰ VỆ SỐ',
      moduleId: 'module-lesson-7',
      description: 'Sách giáo khoa Bài 7: Quyền riêng tư và kỹ năng tự vệ số (Deepfake, Doxing, 3 bước tự vệ số & Tổng đài 111).',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b7-khbd',
      name: '1.KHBD_Bai7_QuyenRiengTu_KyNangTuVeSo.docx',
      filename: '1.KHBD.docx',
      url: '/hoc-lieu/6aiab01/bai7/1.KHBD.docx',
      size: '88 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 7: QUYỀN RIÊNG TƯ VÀ KỸ NĂNG TỰ VỆ SỐ',
      moduleId: 'module-lesson-7',
      description: 'Kế hoạch bài dạy trực tuyến 45 phút trên LMS (YCCĐ 6.A3.4, Trắc nghiệm chốt chặn tình huống) – Bài 7.',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b7-hoclieuso',
      name: '2.HocLieuSo_Bai7_QuyenRiengTu_TuVeSo.docx',
      filename: '2.HocLieuSo.docx',
      url: '/hoc-lieu/6aiab01/bai7/2.HocLieuSo.docx',
      size: '250 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 7: QUYỀN RIÊNG TƯ VÀ KỸ NĂNG TỰ VỆ SỐ',
      moduleId: 'module-lesson-7',
      description: 'Trọn bộ kịch bản Học liệu số Bài 7 (Infographic 1 & 2, Quiz 3 câu, Kéo thả 6 thẻ, Game phân nhánh 3 màn & Rubric 10đ).',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b8-sgk',
      name: '0.SGK_Bai8_ConNguoiLamChuAI.docx',
      filename: '0.SGK.docx',
      url: '/hoc-lieu/6aiab01/bai8/0.SGK.docx',
      size: '21 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 8: CON NGƯỜI LÀM CHỦ TRÍ TUỆ NHÂN TẠO',
      moduleId: 'module-lesson-8',
      description: 'Sách giáo khoa Bài 8: Con người làm chủ Trí tuệ nhân tạo (Quy trình 3 bước ra quyết định & Điều 14 EU AI Act 2024).',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b8-khbd',
      name: '1.KHBD_Bai8_ConNguoiLamChuAI.docx',
      filename: '1.KHBD.docx',
      url: '/hoc-lieu/6aiab01/bai8/1.KHBD.docx',
      size: '82 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 8: CON NGƯỜI LÀM CHỦ TRÍ TUỆ NHÂN TẠO',
      moduleId: 'module-lesson-8',
      description: 'Kế hoạch bài dạy chuẩn CV 5512 (01 tiết trực tiếp kết hợp LMS, YCCĐ 6.A3.1, tổng kết chuyên đề 8 bài) – Bài 8.',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    },
    {
      id: 'file-ai6-b8-hoclieuso',
      name: '2.HocLieuSo_Bai8_ConNguoiLamChuAI.docx',
      filename: '2.HocLieuSo.docx',
      url: '/hoc-lieu/6aiab01/bai8/2.HocLieuSo.docx',
      size: '245 KB',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileType: 'word',
      folder: 'BÀI 8: CON NGƯỜI LÀM CHỦ TRÍ TUỆ NHÂN TẠO',
      moduleId: 'module-lesson-8',
      description: 'Trọn bộ kịch bản Học liệu số Bài 8 (8 Slide, Infographic 3 bước, Game Ngã rẽ thông minh, 4 Thẻ tình huống, Quiz 5 câu & Phiếu Vận dụng 6A).',
      uploadedBy: { id: 'admin', name: 'Phan Phi Phú', email: 'phanphiphu04@gmail.com' },
      uploadedAt: '27/11/2026'
    }
  ];

  const officialSyllabus = [
    'Bài 1 – Nguồn gốc của AI và quyền quyết định (2 tiết Blended – 6.A1.1 & 6.A1.2): AI do con người tạo ra (Dữ liệu – Thuật toán – Điều khiển), con người giám sát và giữ quyền quyết định cuối cùng.',
    'Bài 2 – Lợi ích và cách sử dụng công cụ AI phù hợp (1 tiết Trực tuyến – 6.A3.2): 3 lợi ích của AI trong học tập, công thức câu lệnh (Prompt) 3 thành phần và Cẩm nang 4 KHÔNG.',
    'Bài 3 – Thực chứng thông tin – Làm chủ AI (1 tiết Blended – 6.A1.3): Ảo giác AI (Hallucination), nguyên lý Con vẹt ngẫu nhiên (UNESCO 2023) và 3 kênh kiểm chứng thông tin.',
    'Bài 4 – Khám phá mặt tích cực và tiêu cực của một số tính năng AI (1 tiết Trực tuyến – 6.B1.1): Hệ thống gợi ý, Bong bóng thông tin (Filter Bubbles), hai mặt của 3 tính năng AI và thao tác kiểm soát thuật toán.',
    'Bài 5 – Đánh giá độ an toàn của Trí tuệ nhân tạo (1 tiết Blended – 6.B2.1): Tính an toàn, Tính minh bạch (UNICEF 2021), Bộ 4 câu hỏi kiểm tra và đọc mục An toàn dữ liệu (Data Safety).',
    'Bài 6 – Dữ liệu cá nhân là tài sản của mỗi con người (1 tiết Trực tuyến – 6.A3.3): Phân loại dữ liệu cơ bản vs nhạy cảm, 4 quyền của chủ thể dữ liệu và sự đồng ý kép cho trẻ em (Nghị định 13/2023/NĐ-CP).',
    'Bài 7 – Quyền riêng tư và kỹ năng tự vệ số (1 tiết Trực tuyến – 6.A3.4): Ý nghĩa quyền riêng tư, 4 hiểm họa (Deepfake, Doxing, Quấy rối, Scams), Quy tắc 3 Không, 3 bước tự vệ số và Tổng đài 111.',
    'Bài 8 – Con người làm chủ Trí tuệ nhân tạo (1 tiết Blended – 6.A3.1): Phán đoán ngữ cảnh (U.S. Dept. of Education 2023), Điều 14 EU AI Act (2024), Quy trình 3 bước ra quyết định và Cam kết tổng kết chuyên đề.'
  ];

  return {
    lessonModules: [bai1Module, bai2Module, bai3Module, bai4Module, bai5Module, bai6Module, bai7Module, bai8Module],
    officialFiles,
    officialSyllabus
  };
}
