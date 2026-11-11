import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Course, CourseModule, User, Activity, Certificate, NotificationItem, ForumTopic, Role, TrainingType, AppView } from '../types';
import { initialUser } from '../data/mockData';
import api from '../services/api';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  activeRole: Role;
  switchRole: (role: Role) => void;
  courses: Course[];
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  activeCourse: Course | null;
  activeActivity: Activity | null;
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  navigateToCourse: (courseId: string) => void;
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
  createForumTopic: (courseId: string, title: string, content: string) => void;
  markActivityCompleted: (courseId: string, activityId: string) => void;
  submitAssignment: (courseId: string, activityId: string, fileName: string, textSubmission?: string) => void;
  gradeAssignment: (courseId: string, activityId: string, grade: number, feedback: string) => void;
  submitQuiz: (courseId: string, activityId: string, score: number, maxScore: number, answers: Record<string, number | number[]>) => void;
  addCourseModule: (courseId: string, title: string, description?: string) => Promise<CourseModule | void>;
  updateCourseModule: (courseId: string, moduleId: string, data: Partial<CourseModule>) => Promise<void>;
  deleteCourseModule: (courseId: string, moduleId: string) => Promise<void>;
  addCourseActivity: (courseId: string, moduleId: string, newAct: Partial<Activity>) => void;
  updateCourseActivity: (courseId: string, activityId: string, data: Partial<Activity>) => void;
  deleteCourseActivity: (courseId: string, activityId: string) => void;
  deleteCourse: (courseId: string) => void;
  addAnnouncement: (courseId: string, title: string, content: string, isImportant?: boolean) => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<User | void>;
}

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
        if (Array.isArray(parsed)) {
          return parsed.filter((c: any) => !c.id?.includes('sample') && c.code !== 'AI-101');
        }
      }
    } catch {}
    return [];
  });

  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [activeActivityId, setActiveActivityId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
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
      if (coursesRes && Array.isArray(coursesRes)) {
        setCourses(coursesRes);
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
      const userRes = await api.auth.getMe().catch(() => null);
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
    setCurrentView('dashboard');
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    try {
      const updated = await api.auth.updateProfile(data);
      if (updated && updated.id) {
        setCurrentUser(updated);
        localStorage.setItem('lms2_user', JSON.stringify(updated));
        return updated;
      }
    } catch (err) {
      // Local fallback
      setCurrentUser(prev => {
        const next = { ...prev, ...data };
        localStorage.setItem('lms2_user', JSON.stringify(next));
        return next;
      });
    }
  }, []);

  const switchRole = (role: Role) => {
    setActiveRole(role);
    setCurrentUser(prev => {
      if (!prev.id) return prev;
      return {
        ...prev,
        role,
        classOrPosition: role === 'admin' ? 'Quản trị viên' : role === 'lecturer' ? 'Giảng viên' : 'Học viên'
      };
    });

    if (role === 'lecturer') {
      setCurrentView('teacher-studio');
    } else if (role === 'admin') {
      setCurrentView('admin-panel');
    } else {
      setCurrentView('dashboard');
    }
  };

  const navigateToCourse = (courseId: string) => {
    setActiveCourseId(courseId);
    setActiveActivityId(null);
    setCurrentView('course-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Fetch forum topics for this course from API
    api.forum.getByCourse(courseId)
      .then(res => {
        if (Array.isArray(res)) setForumTopics(res);
      })
      .catch(() => {});
  };

  const navigateToActivity = (courseId: string, activityId: string) => {
    setActiveCourseId(courseId);
    setActiveActivityId(activityId);
    setCurrentView('activity');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeCourse = courses.find(c => c.id === activeCourseId) || null;
  
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
    api.activities.markCompleted(courseId, activityId).catch(() => {});
  };

  const submitAssignment = (courseId: string, activityId: string, fileName: string, textSubmission?: string) => {
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
                fileSize: '2.4 MB',
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
    api.activities.submitAssignment(courseId, activityId, { fileName, textSubmission }).catch(() => {});
  };

  const gradeAssignment = (courseId: string, activityId: string, grade: number, feedback: string) => {
    setCourses(prev => prev.map(course => {
      if (course.id !== courseId) return course;
      const updatedModules = (course.modules || []).map(m => ({
        ...m,
        activities: (m.activities || []).map(act => {
          if (act.id === activityId && act.submission) {
            return {
              ...act,
              isCompleted: true,
              score: grade,
              submission: {
                ...act.submission,
                status: 'graded' as const,
                grade,
                feedback
              }
            };
          }
          return act;
        })
      }));
      return calculateCourseProgress({ ...course, modules: updatedModules });
    }));

    // Call API backend
    api.activities.gradeAssignment(courseId, activityId, { grade, feedback }).catch(() => {});
  };

  const submitQuiz = (courseId: string, activityId: string, score: number, maxScore: number, answers: Record<string, number | number[]>) => {
    const passed = score >= (maxScore * 0.5);
    setCourses(prev => prev.map(course => {
      if (course.id !== courseId) return course;
      const updatedModules = (course.modules || []).map(m => ({
        ...m,
        activities: (m.activities || []).map(act => {
          if (act.id === activityId) {
            return {
              ...act,
              isCompleted: passed,
              score,
              maxScore,
              quizResult: {
                score,
                maxScore,
                passed,
                submittedAt: new Date().toLocaleString('vi-VN'),
                answers
              }
            };
          }
          return act;
        })
      }));
      return calculateCourseProgress({ ...course, modules: updatedModules });
    }));

    // Call API backend
    api.activities.submitQuiz(courseId, activityId, { answers, score, maxScore }).catch(() => {});
  };

  const addCourseActivity = (courseId: string, moduleId: string, newAct: Partial<Activity>) => {
    setCourses(prev => prev.map(course => {
      if (course.id !== courseId) return course;
      const updatedModules = (course.modules || []).map(m => {
        if (m.id !== moduleId) return m;
        const completeAct: Activity = {
          id: newAct.id || `act-${Date.now()}`,
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
        return {
          ...m,
          activities: [...(m.activities || []), completeAct]
        };
      });
      return calculateCourseProgress({ ...course, modules: updatedModules });
    }));

    // Call API backend
    api.activities.create(courseId, moduleId, newAct).catch(() => {});
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
      return { ...c, modules: [...(c.modules || []), newMod] };
    }));

    api.modules.create(courseId, { title, description }).catch(() => {});
    return newMod;
  };

  const updateCourseModule = async (courseId: string, moduleId: string, data: Partial<CourseModule>) => {
    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      const modules = (c.modules || []).map(m => m.id === moduleId ? { ...m, ...data } : m);
      return { ...c, modules };
    }));

    api.modules.update(courseId, moduleId, data).catch(() => {});
  };

  const deleteCourseModule = async (courseId: string, moduleId: string) => {
    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      const modules = (c.modules || []).filter(m => m.id !== moduleId);
      return calculateCourseProgress({ ...c, modules });
    }));

    api.modules.delete(courseId, moduleId).catch(() => {});
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

    api.activities.update(courseId, activityId, data).catch(() => {});
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

    api.activities.delete(courseId, activityId).catch(() => {});
  };

  const deleteCourse = (courseId: string) => {
    setCourses(prev => prev.filter(c => c.id !== courseId));
    if (activeCourseId === courseId) {
      setActiveCourseId(null);
      setCurrentView('dashboard');
    }
    api.courses.delete(courseId).catch(() => {});
  };

  const addAnnouncement = (courseId: string, title: string, content: string, isImportant: boolean = false) => {
    const newAnc = {
      id: `anc-${Date.now()}`,
      title,
      content,
      author: currentUser.name,
      authorRole: currentUser.role === 'lecturer' ? 'Giảng viên' : 'Quản trị viên',
      createdAt: new Date().toLocaleString('vi-VN'),
      isImportant
    };

    setCourses(prev => prev.map(course => {
      if (course.id !== courseId) return course;
      return {
        ...course,
        announcements: [newAnc, ...(course.announcements || [])]
      };
    }));
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
    api.forum.postReply(topicId, { content }).catch(() => {});
  };

  const createForumTopic = (courseId: string, title: string, content: string) => {
    const newTopic: ForumTopic = {
      id: `topic-${Date.now()}`,
      courseId,
      title,
      content,
      author: {
        name: currentUser.name,
        avatar: currentUser.avatar,
        role: currentUser.role === 'student' ? 'Học sinh' : 'Giáo viên'
      },
      createdAt: 'Vừa xong',
      replies: [],
      views: 1,
      likes: 0
    };

    setForumTopics(prev => [newTopic, ...prev]);

    // Call API backend
    api.forum.createTopic(courseId, { title, content }).catch(() => {});
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
        submitAssignment,
        gradeAssignment,
        submitQuiz,
        addCourseModule,
        updateCourseModule,
        deleteCourseModule,
        addCourseActivity,
        updateCourseActivity,
        deleteCourseActivity,
        deleteCourse,
        addAnnouncement,
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
