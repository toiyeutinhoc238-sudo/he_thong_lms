import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { CanvasGlobalNav } from './components/CanvasGlobalNav';
import { CanvasTopBar } from './components/CanvasTopBar';
import { CanvasDashboard } from './components/CanvasDashboard';
import { CourseDetail } from './components/CourseDetail';
import { ActivityViewer } from './components/ActivityViewer';
import { Gradebook } from './components/Gradebook';
import { CertificatesView } from './components/CertificatesView';
import { TeacherDashboard } from './components/TeacherDashboard';
import { AdminPanel } from './components/AdminPanel';
import { ProfileModal } from './components/ProfileModal';
import { CertificateModal } from './components/CertificateModal';
import { LoginModal } from './components/LoginModal';
import { OnboardingModal } from './components/OnboardingModal';
import { AIAssistantModal } from './components/AIAssistantModal';

const MainLayout: React.FC = () => {
  const { currentView } = useApp();
  const [isCourseNavOpen, setIsCourseNavOpen] = useState(true);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-white text-slate-800 antialiased font-sans overflow-hidden">
      {/* 1. Leftmost Canvas Global Nav (Fixed width ~78px) */}
      <CanvasGlobalNav />

      {/* 2. Main Canvas Body Container */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Breadcrumb Bar */}
        <CanvasTopBar 
          onToggleCourseNav={() => setIsCourseNavOpen(!isCourseNavOpen)}
          onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
        />

        {/* Dynamic Workspace */}
        <main className="flex-1 flex min-w-0 overflow-y-auto bg-white">
          {currentView === 'dashboard' && <CanvasDashboard />}
          {currentView === 'course-detail' && <CourseDetail isCourseNavOpen={isCourseNavOpen} />}
          {currentView === 'activity' && <ActivityViewer />}
          {currentView === 'gradebook' && <Gradebook />}
          {currentView === 'certificates' && <CertificatesView />}
          {currentView === 'teacher-studio' && <TeacherDashboard />}
          {currentView === 'admin-panel' && <AdminPanel />}
          {currentView === 'profile' && <ProfileModal />}
        </main>
      </div>

      {/* Modals & AI Drawer */}
      <AIAssistantModal 
        isOpen={isAIAssistantOpen} 
        onClose={() => setIsAIAssistantOpen(false)} 
      />
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
