// public/hoc-lieu/6aiab01/bai4/data.js
export const bai4Module = {
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
  ],
  syllabusLine: 'Bài 4 – Khám phá mặt tích cực và tiêu cực của một số tính năng AI (1 tiết Trực tuyến – 6.B1.1): Hệ thống gợi ý, Bong bóng thông tin (Filter Bubbles), hai mặt của 3 tính năng AI và thao tác kiểm soát thuật toán.',
  officialFiles: [
    {
      id: 'file-ai6-b4-sgk',
      name: '0.SGK_Bai4_MatTichCuc_TieuCuc_TinhNangAI.pdf',
      filename: '0.SGK.pdf',
      url: '/hoc-lieu/6aiab01/bai4/0.SGK.pdf',
      size: '515 KB',
      mimetype: 'application/pdf',
      fileType: 'pdf',
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
    }
  ]
};
