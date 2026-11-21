import React, { useState, Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { CanvasGlobalNav } from './components/CanvasGlobalNav';
import { CanvasTopBar } from './components/CanvasTopBar';
import { CanvasCoursesList } from './components/CanvasCoursesList';
import { LoginModal } from './components/LoginModal';
import { OnboardingModal } from './components/OnboardingModal';
import { CertificateModal } from './components/CertificateModal';

// Tối ưu tải trang bằng Code-Splitting (React.lazy) cho các trang phụ và trang quản trị nặng
const CanvasDashboard = lazy(() => import('./components/CanvasDashboard').then(m => ({ default: m.CanvasDashboard })));
const CanvasCalendar = lazy(() => import('./components/CanvasCalendar').then(m => ({ default: m.CanvasCalendar })));
const CanvasInbox = lazy(() => import('./components/CanvasInbox').then(m => ({ default: m.CanvasInbox })));
const CanvasHistory = lazy(() => import('./components/CanvasHistory').then(m => ({ default: m.CanvasHistory })));
const CanvasHelp = lazy(() => import('./components/CanvasHelp').then(m => ({ default: m.CanvasHelp })));
const CourseDetail = lazy(() => import('./components/CourseDetail').then(m => ({ default: m.CourseDetail })));
const ActivityViewer = lazy(() => import('./components/ActivityViewer').then(m => ({ default: m.ActivityViewer })));
const Gradebook = lazy(() => import('./components/Gradebook').then(m => ({ default: m.Gradebook })));
const CertificatesView = lazy(() => import('./components/CertificatesView').then(m => ({ default: m.CertificatesView })));
const TeacherDashboard = lazy(() => import('./components/TeacherDashboard').then(m => ({ default: m.TeacherDashboard })));
const AdminPanel = lazy(() => import('./components/AdminPanel').then(m => ({ default: m.AdminPanel })));
const ProfileModal = lazy(() => import('./components/ProfileModal').then(m => ({ default: m.ProfileModal })));
const AIAssistantModal = lazy(() => import('./components/AIAssistantModal').then(m => ({ default: m.AIAssistantModal })));

const ViewLoader: React.FC = () => (
  <div className="flex-1 flex items-center justify-center py-20 text-slate-400 text-xs font-semibold gap-2">
    <span className="w-4 h-4 rounded-full border-2 border-[#0374b5] border-t-transparent animate-spin" />
    <span>Đang tải giao diện...</span>
  </div>
);

const MainLayout: React.FC = () => {
  const { currentView, isEmbedMode } = useApp();
  const [isCourseNavOpen, setIsCourseNavOpen] = useState(!isEmbedMode);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-white text-slate-800 antialiased font-sans overflow-hidden">
      {/* 1. Leftmost Canvas Global Nav (Ẩn khi đang nhúng iframe embed=1 vào LMS khác) */}
      {!isEmbedMode && <CanvasGlobalNav />}

      {/* 2. Main Canvas Body Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Breadcrumb Bar (Ẩn khi đang nhúng iframe embed=1) */}
        {!isEmbedMode && (
          <CanvasTopBar
            onToggleCourseNav={() => setIsCourseNavOpen(!isCourseNavOpen)}
            onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
          />
        )}

        {/* Dynamic Workspace */}
        <main className="flex-1 flex min-w-0 overflow-y-auto bg-white">
          <Suspense fallback={<ViewLoader />}>
            {currentView === 'dashboard' && <CanvasDashboard />}
            {currentView === 'courses-list' && <CanvasCoursesList />}
            {currentView === 'calendar' && <CanvasCalendar />}
            {currentView === 'inbox' && <CanvasInbox />}
            {currentView === 'history' && <CanvasHistory />}
            {currentView === 'help' && <CanvasHelp />}
            {currentView === 'course-detail' && <CourseDetail isCourseNavOpen={isEmbedMode ? false : isCourseNavOpen} />}
            {currentView === 'activity' && <ActivityViewer />}
            {currentView === 'gradebook' && <Gradebook />}
            {currentView === 'certificates' && <CertificatesView />}
            {currentView === 'teacher-studio' && <TeacherDashboard />}
            {currentView === 'admin-panel' && <AdminPanel />}
            {currentView === 'profile' && <ProfileModal />}
          </Suspense>
        </main>
      </div>

      {/* Modals & AI Drawer */}
      {isAIAssistantOpen && (
        <Suspense fallback={null}>
          <AIAssistantModal
            isOpen={isAIAssistantOpen}
            onClose={() => setIsAIAssistantOpen(false)}
          />
        </Suspense>
      )}
      <CertificateModal />
      <LoginModal />
      <OnboardingModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
