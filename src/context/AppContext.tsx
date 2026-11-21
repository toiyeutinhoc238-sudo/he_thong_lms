import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Course, CourseModule, User, Activity, Certificate, NotificationItem, ForumTopic, Role, TrainingType, AppView, QuizQuestion, CourseFile } from '../types';
import { initialUser, defaultGrade6Course } from '../data/mockData';
import api from '../services/api';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  activeRole: Role;
  switchRole: (role: Role) => void;
  courses: Course[];
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  activeCourse: Course | null;
  activeModuleId: string | null;
  setActiveModuleId: (moduleId: string | null) => void;
  activeActivity: Activity | null;
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  navigateToCourse: (courseId: string, moduleId?: string | null) => void;
  navigateToActivity: (courseId: string, activityId: string) => void;
  trainingProgramFilter: TrainingType | 'all';
  setTrainingProgramFilter: (filter: TrainingType | 'all') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  certificates: Certificate[];
  activeCertificate: Certificate | null;
  setActiveCertificate: (cert: Certificate | null) => void;
  forumTopics: ForumTopic[];
  addForumReply: (topicId: string, content: string) => void;
  createForumTopic: (courseId: string, title: string, content: string) => Promise<boolean>;
  markActivityCompleted: (courseId: string, activityId: string) => void;
  updateLocalVideoProgress: (courseId: string, activityId: string, videoProgress: NonNullable<Activity['videoProgress']>, isCompleted: boolean) => void;
  submitAssignment: (courseId: string, activityId: string, fileName: string, textSubmission?: string, fileSize?: string, fileUrl?: string) => void;
  gradeAssignment: (courseId: string, activityId: string, studentId: string, grade: number, feedback: string) => Promise<void>;
  submitQuiz: (courseId: string, activityId: string, answers: Record<string, number>, durationSeconds?: number) => Promise<{ result: NonNullable<Activity['quizResult']>; questions?: QuizQuestion[] } | null>;
  addCourseModule: (courseId: string, title: string, description?: string) => Promise<CourseModule | void>;
  updateCourseModule: (courseId: string, moduleId: string, data: Partial<CourseModule>) => Promise<void>;
  deleteCourseModule: (courseId: string, moduleId: string) => Promise<void>;
  addCourseActivity: (courseId: string, moduleId: string, newAct: Partial<Activity>) => void;
  updateCourseActivity: (courseId: string, activityId: string, data: Partial<Activity>) => void;
  deleteCourseActivity: (courseId: string, activityId: string) => void;
  updateCourse: (courseId: string, data: Partial<Course>) => Promise<void>;
  deleteCourse: (courseId: string) => void;
  enrollCourse: (courseId: string) => Promise<boolean>;
  addAnnouncement: (courseId: string, title: string, content: string, isImportant?: boolean) => Promise<boolean>;
  uploadCourseFile: (courseId: string, file: File, description?: string) => Promise<CourseFile | null>;
  deleteCourseFile: (courseId: string, fileId: string) => Promise<boolean>;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<User | void>;
}

const cleanDummyActivities = (courseList: Course[]): Course[] => {
  return courseList.map(c => ({
    ...c,
    modules: (c.modules || []).map(m => ({
      ...m,
      activities: (m.activities || []).filter(a => !a?.id || !/^act-\d+-[1234]$/.test(a.id))
    }))
  }));
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRole, setActiveRole] = useState<Role>('student');
  const [currentUser, setCurrentUser] = useState<User>(() => {
    if (typeof window !== 'undefined') {
      ['hcmue_vle_user', 'hcmue_vle_courses', 'hcmue_vle_notifs', 'hcmue_vle_certs', 'hcmue_vle_token'].forEach(k => {
        try { localStorage.removeItem(k); } catch (e) {}
      });
    }
    const saved = localStorage.getItem('lms2_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && !parsed.email?.includes('hcmue') && !parsed.name?.includes('HCMUE')) {
          return parsed;
        }
      } catch (e) {}
    }
    return { ...initialUser, name: '', code: '' };
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const saved = localStorage.getItem('lms2_courses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter((c: any) => !c.id?.includes('sample') && c.code !== 'AI-101');
          if (valid.length > 0) return cleanDummyActivities(valid);
        }
      }
    } catch {}
    return [defaultGrade6Course];
  });

  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('courses-list');
  const [trainingProgramFilter, setTrainingProgramFilter] = useState<TrainingType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('lms2_notifs');
    return saved ? JSON.parse(saved) : [];
  });

  const [certificates, setCertificates] = useState<Certificate[]>(() => {
    const saved = localStorage.getItem('lms2_certs');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeCertificate, setActiveCertificate] = useState<Certificate | null>(null);
  const [forumTopics, setForumTopics] = useState<ForumTopic[]>([]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync state to local storage cache
  useEffect(() => {
    localStorage.setItem('lms2_courses', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem('lms2_certs', JSON.stringify(certificates));
  }, [certificates]);

  useEffect(() => {
    localStorage.setItem('lms2_notifs', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('lms2_user', JSON.stringify(currentUser));
  }, [currentUser]);

  // Fetch initial data from Backend API
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch courses from API
      const coursesRes = await api.courses.getAll().catch(() => null);
      if (coursesRes && Array.isArray(coursesRes) && coursesRes.length > 0) {
        setCourses(cleanDummyActivities(coursesRes));
      } else {
        setCourses(prev => (prev && prev.length > 0) ? cleanDummyActivities(prev) : [defaultGrade6Course]);
      }

      // 2. Fetch notifications
      const notifsRes = await api.notifications.getAll().catch(() => null);
      if (notifsRes && Array.isArray(notifsRes)) {
        setNotifications(notifsRes);
      }

      // 3. Fetch certificates
      const certsRes = await api.certificates.getMyCertificates().catch(() => null);
      if (certsRes && Array.isArray(certsRes)) {
        setCertificates(certsRes);
      }

      // 4. Fetch current user profile
      const hasSession = !!localStorage.getItem('lms2_token');
      const userRes = await api.auth.getMe().catch((err: any) => {
        // Phiên đăng nhập không còn hợp lệ (hết hạn hoặc token đời cũ): đăng xuất để người dùng đăng nhập lại,
        // tránh tình trạng giao diện báo "đã đăng nhập" nhưng mọi thao tác đều bị server từ chối.
        if (err?.status === 401 && (hasSession || /"id":"[^"]/.test(localStorage.getItem('lms2_user') || ''))) {
          api.auth.logout();
          setCurrentUser({ ...initialUser, name: '', code: '' });
          setActiveRole('student');
          if (hasSession) setIsLoginModalOpen(true);
        }
        return null;
      });
      if (userRes && userRes.id) {
        setCurrentUser(userRes);
        setActiveRole(userRes.role);
      }
    } catch (err) {
      console.log('Chờ backend API sẵn sàng:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const logout = useCallback(async () => {
    await api.auth.logout();
    setCurrentUser({ ...initialUser, name: '', code: '' });
    setActiveRole('student');
    setCurrentView('courses-list');
    // Tải lại dữ liệu ở chế độ khách để xóa tiến độ cá nhân của tài khoản vừa đăng xuất
    refreshData();
  }, [refreshData]);

  // Thao tác học tập không lưu được lên máy chủ: báo rõ cho người dùng và đồng bộ lại dữ liệu thật
  const reportSyncFailure = useCallback((action: string, err: any) => {
    console.warn(`[LMS] ${action} thất bại:`, err);
    window.alert(`${action} CHƯA được lưu lên hệ thống.
${err?.message || 'Vui lòng kiểm tra kết nối và thử lại.'}`);
    refreshData();
  }, [refreshData]);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    // Cập nhật ngay lập tức vào state và localStorage để đóng modal và giao diện phản hồi tức thì
    const immediateUser: User = {
      ...currentUser,
      ...data,
      isProfileCompleted: true,
      school: data.school || currentUser.school || '',
      department: data.school || currentUser.department || '',
      className: data.className || currentUser.className || '',
      classOrPosition: data.className || currentUser.classOrPosition || ''
    };
    setCurrentUser(immediateUser);
    localStorage.setItem('lms2_user', JSON.stringify(immediateUser));

    try {
      const payload = {
        ...data,
        email: currentUser.email || immediateUser.email,
        isProfileCompleted: true
      };
      const updated = await api.auth.updateProfile(payload);
      if (updated && updated.id) {
        const merged: User = { 
          ...immediateUser, 
          ...updated, 
          isProfileCompleted: true,
          school: updated.school || immediateUser.school,
          className: updated.className || immediateUser.className
        };
        setCurrentUser(merged);
        localStorage.setItem('lms2_user', JSON.stringify(merged));
        return merged;
      }
    } catch (err) {
      console.warn('API updateProfile ghi nhận ngoại tuyến, lưu trữ cục bộ:', err);
    }
    return immediateUser;
  }, [currentUser]);

  const switchRole = (role: Role) => {
    setActiveRole(role);
    setCurrentUser(prev => {
      if (!prev.id) return prev;
      return {
        ...prev,
        role,
        classOrPosition: role === 'admin' ? 'Quản trị viên' : role === 'lecturer' ? 'Giáo viên' : 'Học viên'
      };
    });

    // Sau khi đăng nhập, chuyển tới danh sách khóa học
    setCurrentView('courses-list');
  };

  // Đảm bảo tài khoản phanphiphu04@gmail.com luôn có vai trò admin toàn quyền
  useEffect(() => {
    if (currentUser?.email?.toLowerCase().trim() === 'phanphiphu04@gmail.com' && currentUser.role !== 'admin') {
      setCurrentUser(prev => ({
        ...prev,
        role: 'admin',
        classOrPosition: 'Quản trị viên'
      }));
    }
  }, [currentUser?.email, currentUser?.role]);

  const navigateToCourse = (courseId: string, moduleId?: string | null) => {
    const target = courses.find(c => 
      c.id === courseId || 
      c.code === courseId || 
      (c.code === '6AIAB01' && (courseId === 'course-6aiab01' || courseId === '6AIAB01' || courseId.includes('6AIAB01')))
    ) || courses[0] || defaultGrade6Course;

    setActiveCourseId(target.id);
    setActiveModuleId(moduleId ?? null);
    setActiveActivityId(null);
    setCurrentView('course-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Fetch forum topics for this course from API
    api.forum.getByCourse(target.id)
      .then(res => {
        if (Array.isArray(res)) setForumTopics(res);
      })
      .catch(() => {});
  };

  const navigateToActivity = (courseId: string, activityId: string) => {
    const target = courses.find(c => 
      c.id === courseId || 
      c.code === courseId || 
      (c.code === '6AIAB01' && (courseId === 'course-6aiab01' || courseId === '6AIAB01' || courseId.includes('6AIAB01')))
    ) || courses[0] || defaultGrade6Course;

    setActiveCourseId(target.id);
    setActiveActivityId(activityId);
    setCurrentView('activity');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeCourse: Course = courses.find(c => 
    c.id === activeCourseId || 
    c.code === activeCourseId ||
    (c.code === '6AIAB01' && (activeCourseId === 'course-6aiab01' || activeCourseId === '6AIAB01' || activeCourseId?.includes('6AIAB01')))
  ) || courses[0] || defaultGrade6Course;
  
  let activeActivity: Activity | null = null;
  if (activeCourse && activeActivityId) {
    for (const m of activeCourse.modules || []) {
      const act = m.activities?.find(a => a.id === activeActivityId);
      if (act) {
        activeActivity = act;
        break;
      }
    }
  }

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    api.notifications.markRead(id).catch(() => {});
  };

  const calculateCourseProgress = (course: Course): Course => {
    let total = 0;
    let completed = 0;
    (course.modules || []).forEach(m => {
      (m.activities || []).forEach(a => {
        total++;
        if (a.isCompleted) completed++;
      });
    });
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      ...course,
      totalActivities: total,
      completedActivities: completed,
      progress
    };
  };

  const markActivityCompleted = (courseId: string, activityId: string) => {
    setCourses(prev => prev.map(course => {
      if (course.id !== courseId) return course;

      const updatedModules = (course.modules || []).map(module => ({
        ...module,
        activities: (module.activities || []).map(act => {
          if (act.id === activityId) {
            return { ...act, isCompleted: true };
          }
          return act;
        })
      }));

      const updatedCourse = calculateCourseProgress({ ...course, modules: updatedModules });
      return updatedCourse;
    }));

    // Call API backend
    api.activities.markCompleted(courseId, activityId).catch(err => reportSyncFailure('Đánh dấu hoàn thành', err));
  };

  const updateLocalVideoProgress = useCallback((courseId: string, activityId: string, videoProgress: NonNullable<Activity['videoProgress']>, isCompleted: boolean) => {
    setCourses(prev => prev.map(course => {
      if (course.id !== courseId) return course;
      const updatedModules = (course.modules || []).map(module => ({
        ...module,
        activities: (module.activities || []).map(act => {
          if (act.id !== activityId) return act;
          return {
            ...act,
            isCompleted: act.isCompleted || isCompleted,
            watchedSeconds: videoProgress.watchedSeconds,
            videoDuration: videoProgress.totalSeconds || act.videoDuration,
            videoProgress
          };
        })
      }));
      return calculateCourseProgress({ ...course, modules: updatedModules });
    }));
  }, []);

  const submitAssignment = (courseId: string, activityId: string, fileName: string, textSubmission?: string, fileSize?: string, fileUrl?: string) => {
    setCourses(prev => prev.map(course => {
      if (course.id !== courseId) return course;
      const updatedModules = (course.modules || []).map(m => ({
        ...m,
        activities: (m.activities || []).map(act => {
          if (act.id === activityId) {
            return {
              ...act,
              isCompleted: true,
              submission: {
                status: 'submitted' as const,
                fileName,
                fileSize: fileSize || '',
                fileUrl: fileUrl || '',
                submittedAt: new Date().toLocaleString('vi-VN'),
                textSubmission
              }
            };
          }
          return act;
        })
      }));
      return calculateCourseProgress({ ...course, modules: updatedModules });
    }));

    // Call API backend
    api.activities.submitAssignment(courseId, activityId, { fileName, fileSize, fileUrl, textSubmission }).catch(err => reportSyncFailure('Bài nộp', err));
  };

  // Giáo viên chấm điểm cho MỘT học sinh cụ thể (dữ liệu nằm trên máy chủ, không nằm trong state của giáo viên)
  const gradeAssignment = async (courseId: string, activityId: string, studentId: string, grade: number, feedback: string) => {
    await api.activities.gradeAssignment(courseId, activityId, { studentId, grade, feedback });
  };

  // Bài trắc nghiệm do máy chủ chấm; giao diện chỉ hiển thị kết quả máy chủ trả về
  const submitQuiz = async (courseId: string, activityId: string, answers: Record<string, number>, durationSeconds?: number) => {
    try {
      const res = await api.activities.submitQuiz(courseId, activityId, { answers, score: 0, maxScore: 10, durationSeconds });
      setCourses(prev => prev.map(course => {
        if (course.id !== courseId) return course;
        const updatedModules = (course.modules || []).map(m => ({
          ...m,
          activities: (m.activities || []).map(act => act.id === activityId
            ? {
                ...act,
                isCompleted: act.isCompleted || res.result.passed,
                score: act.score !== undefined ? Math.max(act.score, res.result.score) : res.result.score,
                quizResult: res.result,
                quizQuestions: res.questions || act.quizQuestions
              }
            : act)
        }));
        return calculateCourseProgress({ ...course, modules: updatedModules });
      }));
      return { result: res.result, questions: res.questions };
    } catch (err) {
      reportSyncFailure('Kết quả bài kiểm tra', err);
      return null;
    }
  };

  const addCourseActivity = (courseId: string, moduleId: string, newAct: Partial<Activity>) => {
    const actId = newAct.id || `act-${Date.now()}`;
    const completeAct: Activity = {
      id: actId,
      moduleId,
      title: newAct.title || 'Hoạt động mới',
      type: newAct.type || 'document',
      durationMinutes: newAct.durationMinutes || 15,
      isCompleted: false,
      isRequired: newAct.isRequired !== undefined ? newAct.isRequired : true,
      description: newAct.description || '',
      videoUrl: newAct.videoUrl || '',
      fileUrl: newAct.fileUrl || '',
      dueDate: newAct.dueDate || '',
      maxScore: newAct.maxScore || 10,
      assignmentPrompt: newAct.assignmentPrompt || '',
      quizQuestions: newAct.quizQuestions || [],
      ...newAct
    };


    setCourses(prev => prev.map(course => {
      if (course.id !== courseId) return course;
      const updatedModules = (course.modules || []).map(m => {
        if (m.id !== moduleId) return m;
        return {
          ...m,
          activities: [...(m.activities || []), completeAct]
        };
      });
      return calculateCourseProgress({ ...course, modules: updatedModules });
    }));

    api.activities.create(courseId, moduleId, completeAct).catch(err => reportSyncFailure('Thêm hoạt động', err));
  };

  const addCourseModule = async (courseId: string, title: string, description?: string) => {
    const newMod: CourseModule = {
      id: `mod-${Date.now()}`,
      courseId,
      title,
      order: 1,
      description: description || '',
      activities: []
    };


    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      const modules = [...(c.modules || []), newMod];
      return { ...c, modules };
    }));

    api.modules.create(courseId, newMod).catch(err => reportSyncFailure('Thêm mô-đun', err));
    return newMod;
  };

  const updateCourseModule = async (courseId: string, moduleId: string, data: Partial<CourseModule>) => {
    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      const modules = (c.modules || []).map(m => m.id === moduleId ? { ...m, ...data } : m);
      return { ...c, modules };
    }));

    api.modules.update(courseId, moduleId, data).catch(err => reportSyncFailure('Cập nhật mô-đun', err));
  };

  const deleteCourseModule = async (courseId: string, moduleId: string) => {
    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      const modules = (c.modules || []).filter(m => m.id !== moduleId);
      return calculateCourseProgress({ ...c, modules });
    }));

    api.modules.delete(courseId, moduleId).catch(err => reportSyncFailure('Xóa mô-đun', err));
  };

  const updateCourseActivity = (courseId: string, activityId: string, data: Partial<Activity>) => {
    setCourses(prev => prev.map(course => {
      if (course.id !== courseId) return course;
      const updatedModules = (course.modules || []).map(m => {
        const activities = (m.activities || []).map(a => a.id === activityId ? { ...a, ...data } : a);
        return { ...m, activities };
      });
      return { ...course, modules: updatedModules };
    }));

    api.activities.update(courseId, activityId, data).catch(err => reportSyncFailure('Cập nhật hoạt động', err));
  };

  const deleteCourseActivity = (courseId: string, activityId: string) => {
    setCourses(prev => prev.map(course => {
      if (course.id !== courseId) return course;
      const updatedModules = (course.modules || []).map(m => ({
        ...m,
        activities: (m.activities || []).filter(a => a.id !== activityId)
      }));
      return calculateCourseProgress({ ...course, modules: updatedModules });
    }));

    api.activities.delete(courseId, activityId).catch(err => reportSyncFailure('Xóa hoạt động', err));
  };

  const updateCourse = async (courseId: string, data: Partial<Course>) => {
    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c,
        ...data,
        instructor: data.instructor ? { ...c.instructor, ...data.instructor } : c.instructor
      };
    }));
    try {
      await api.courses.update(courseId, data);
    } catch (err) {
      reportSyncFailure('Cập nhật khóa học', err);
    }
  };

  const deleteCourse = (courseId: string) => {
    setCourses(prev => prev.filter(c => c.id !== courseId));
    if (activeCourseId === courseId) {
      setActiveCourseId(null);
      setCurrentView('courses-list');
    }
    api.courses.delete(courseId).catch(err => reportSyncFailure('Xóa khóa học', err));
  };

  const enrollCourse = async (courseId: string): Promise<boolean> => {
    const studentInfo = {
      id: currentUser.id || `user-${Date.now()}`,
      name: currentUser.name || 'Học viên',
      email: currentUser.email || 'hocvien@lms2.edu.vn',
      className: currentUser.className || currentUser.classOrPosition || 'Lớp học',
      school: currentUser.school || currentUser.department || 'LMS Nhóm 2',
      avatar: currentUser.avatar || '',
      enrolledAt: new Date().toLocaleDateString('vi-VN'),
      status: 'Đang học'
    };

    // Update local state immediately
    setCurrentUser(prev => ({
      ...prev,
      enrolledCourses: [...(prev.enrolledCourses || []).filter(cid => cid !== courseId), courseId]
    }));

    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      const enrolled = c.enrolledStudents || [];
      const already = enrolled.some(s => s.id === studentInfo.id || (studentInfo.email && s.email === studentInfo.email));
      if (already) return c;
      const updatedList = [...enrolled, studentInfo];
      return {
        ...c,
        enrolledStudents: updatedList,
        enrolledStudentsCount: updatedList.length
      };
    }));

    // Call API backend
    try {
      await api.courses.enroll(courseId);
      return true;
    } catch (err: any) {
      reportSyncFailure('Đăng ký khóa học', err);
      return false;
    }
  };

  const addAnnouncement = async (courseId: string, title: string, content: string, isImportant: boolean = false) => {
    try {
      const saved = await api.courses.addAnnouncement(courseId, { title, content, isImportant });
      setCourses(prev => prev.map(course => course.id !== courseId
        ? course
        : { ...course, announcements: [saved, ...(course.announcements || [])] }));
      return true;
    } catch (err) {
      reportSyncFailure('Thông báo', err);
      return false;
    }
  };

  const uploadCourseFile = async (courseId: string, file: File, description?: string): Promise<CourseFile | null> => {
    try {
      // 1. Upload file vật lý lên server
      const uploaded = await api.files.upload(file);

      // 2. Lưu thông tin file vào khóa học
      const fileData: Partial<CourseFile> = {
        name: uploaded.name,
        filename: uploaded.filename,
        url: uploaded.url,
        size: uploaded.size,
        sizeBytes: uploaded.sizeBytes,
        mimetype: uploaded.mimetype,
        fileType: uploaded.fileType,
        description: description || '',
        uploadedBy: {
          id: currentUser.id,
          name: currentUser.name || 'Người dùng',
          email: currentUser.email,
          avatar: currentUser.avatar
        }
      };

      const saved = await api.files.addToCourse(courseId, fileData);

      // 3. Cập nhật state
      setCourses(prev => prev.map(c => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          files: [saved, ...(c.files || [])]
        };
      }));

      return saved;
    } catch (err: any) {
      reportSyncFailure('Tải tệp lên', err);
      return null;
    }
  };

  const deleteCourseFile = async (courseId: string, fileId: string): Promise<boolean> => {
    try {
      await api.files.deleteFromCourse(courseId, fileId);
      setCourses(prev => prev.map(c => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          files: (c.files || []).filter(f => f.id !== fileId)
        };
      }));
      return true;
    } catch (err: any) {
      reportSyncFailure('Xóa tệp', err);
      return false;
    }
  };

  const addForumReply = (topicId: string, content: string) => {
    const newReply = {
      id: `reply-${Date.now()}`,
      author: {
        name: currentUser.name,
        avatar: currentUser.avatar,
        role: currentUser.role === 'lecturer' ? 'Giáo viên' : currentUser.role === 'admin' ? 'Quản trị viên' : 'Học sinh'
      },
      content,
      createdAt: 'Vừa xong',
      isInstructorAnswer: currentUser.role === 'lecturer'
    };

    setForumTopics(prev => prev.map(t => {
      if (t.id !== topicId) return t;
      return {
        ...t,
        replies: [...(t.replies || []), newReply]
      };
    }));

    // Call API backend
    api.forum.postReply(topicId, { content }).catch(err => reportSyncFailure('Phản hồi thảo luận', err));
  };

  const createForumTopic = async (courseId: string, title: string, content: string) => {
    try {
      const saved = await api.forum.createTopic(courseId, { title, content });
      setForumTopics(prev => [saved, ...prev]);
      return true;
    } catch (err) {
      reportSyncFailure('Chủ đề thảo luận', err);
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        activeRole,
        switchRole,
        courses,
        setCourses,
        activeCourse,
        activeModuleId,
        setActiveModuleId,
        activeActivity,
        currentView,
        setCurrentView,
        navigateToCourse,
        navigateToActivity,
        trainingProgramFilter,
        setTrainingProgramFilter,
        searchQuery,
        setSearchQuery,
        notifications,
        markNotificationRead,
        certificates,
        activeCertificate,
        setActiveCertificate,
        forumTopics,
        addForumReply,
        createForumTopic,
        markActivityCompleted,
        updateLocalVideoProgress,
        submitAssignment,
        gradeAssignment,
        submitQuiz,
        addCourseModule,
        updateCourseModule,
        deleteCourseModule,
        addCourseActivity,
        updateCourseActivity,
        deleteCourseActivity,
        updateCourse,
        deleteCourse,
        enrollCourse,
        addAnnouncement,
        uploadCourseFile,
        deleteCourseFile,
        isLoginModalOpen,
        setIsLoginModalOpen,
        isLoading,
        refreshData,
        logout,
        updateProfile
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
