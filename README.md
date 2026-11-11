# Hệ Thống VLE HCMUE (Virtual Learning Environment)
### Cổng Thông Tin Đào Tạo Trực Tuyến - Trường Đại học Sư phạm TP. Hồ Chí Minh

Hệ thống được thiết kế hoàn toàn sạch (mock-free), sẵn sàng kết nối trực tiếp với backend API thật của bạn.

---

## ⚙️ Cấu hình API Backend

Hệ thống sử dụng service client tập trung tại `src/services/api.ts`.

### 1. File môi trường `.env`:
```env
# Đổi địa chỉ này thành URL backend của bạn (Express, Spring Boot, FastAPI, Laravel,...)
VITE_API_BASE_URL=http://localhost:5000/api
```

Mọi request từ frontend sẽ tự động đính kèm header xác thực:
```http
Authorization: Bearer <token_luu_tai_localStorage>
Content-Type: application/json
```

---

## 📡 Danh sách các Endpoint API chuẩn bị cho Backend

### 1. Xác thực & Người dùng (Auth)
| Method | Endpoint | Mô tả | Trả về |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Đăng nhập tài khoản | `{ token: string, user: User }` |
| `GET` | `/api/auth/me` | Lấy profile người dùng hiện tại | `User` |
| `GET` | `/api/users` | Danh sách người dùng (Admin) | `User[]` |
| `GET` | `/api/courses/:id/students` | Danh sách sinh viên theo môn học | `Student[]` |

### 2. Quản lý Khóa học & Bài học (Courses & Modules)
| Method | Endpoint | Mô tả | Trả về |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/courses` | Lấy danh sách khóa học | `Course[]` |
| `GET` | `/api/courses/:id` | Chi tiết khóa học (kèm modules) | `Course` |
| `POST` | `/api/courses` | Tạo khóa học mới | `Course` |
| `PUT` | `/api/courses/:id` | Cập nhật thông tin khóa học | `Course` |
| `DELETE`| `/api/courses/:id` | Xóa khóa học | `{ success: boolean }` |

### 3. Hoạt động học tập (Activities)
| Method | Endpoint | Mô tả | Trả về |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/courses/:id/activities/:actId/complete` | Đánh dấu hoàn thành bài xem video / đọc | `{ success: boolean, progress: number }` |
| `POST` | `/api/courses/:id/activities/:actId/submit` | Nộp bài tập file đính kèm | `{ success: boolean, submission: ... }` |
| `POST` | `/api/courses/:id/activities/:actId/grade` | Giảng viên chấm điểm bài nộp | `{ success: boolean }` |
| `POST` | `/api/courses/:id/activities/:actId/quiz-submit` | Nộp bài kiểm tra trắc nghiệm | `{ success: boolean, result: ... }` |
| `POST` | `/api/courses/:id/modules/:modId/activities` | Giảng viên thêm hoạt động mới | `Activity` |

### 4. Điểm số & Chứng chỉ (Grades & Certificates)
| Method | Endpoint | Mô tả | Trả về |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/grades` | Sổ điểm của sinh viên hiện tại | `GradeItem[]` |
| `GET` | `/api/certificates` | Danh sách chứng chỉ của học viên | `Certificate[]` |
| `GET` | `/api/certificates/verify/:certNumber` | Tra cứu chứng chỉ qua QR Code | `Certificate` |

### 5. Thông báo & Diễn đàn (Notifications & Forum)
| Method | Endpoint | Mô tả | Trả về |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Lấy thông báo hệ thống | `NotificationItem[]` |
| `PUT` | `/api/notifications/:id/read` | Đánh dấu đã đọc thông báo | `{ success: boolean }` |
| `GET` | `/api/courses/:id/forum` | Lấy chủ đề thảo luận môn học | `ForumTopic[]` |
| `POST` | `/api/courses/:id/forum` | Tạo chủ đề thảo luận mới | `ForumTopic` |
| `POST` | `/api/forum/:topicId/replies` | Gửi câu trả lời thảo luận | `ForumReply` |

---

## 🚀 Khởi chạy dự án

```bash
# Cài đặt thư viện
npm install

# Khởi chạy server phát triển (Dev server)
npm run dev

# Đóng gói sản phẩm (Build production)
npm run build
```
Truy cập: `http://localhost:3000`
