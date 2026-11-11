import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { Dashboard } from './components/Dashboard';
import { CourseDetail } from './components/CourseDetail';
import { ActivityViewer } from './components/ActivityViewer';
import { Gradebook } from './components/Gradebook';
import { CertificatesView } from './components/CertificatesView';
import { TeacherDashboard } from './components/TeacherDashboard';
import { AdminPanel } from './components/AdminPanel';
import { ProfileModal } from './components/ProfileModal';
import { CertificateModal } from './components/CertificateModal';
import { LoginModal } from './components/LoginModal';

const MainLayout: React.FC = () => {
  const { currentView } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7fb]">
      {/* Header */}
      <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      {/* Main Container with Sidebar and Content Area */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />

        {/* Dynamic Main Workspace */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          {currentView === 'dashboard' && <Dashboard />}
          {currentView === 'course-detail' && <CourseDetail />}
          {currentView === 'activity' && <ActivityViewer />}
          {currentView === 'gradebook' && <Gradebook />}
          {currentView === 'certificates' && <CertificatesView />}
          {currentView === 'teacher-studio' && <TeacherDashboard />}
          {currentView === 'admin-panel' && <AdminPanel />}
          {currentView === 'profile' && <ProfileModal />}
        </main>
      </div>

      {/* Global Modals */}
      <CertificateModal />
      <LoginModal />

      {/* Footer */}
      <Footer />
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

