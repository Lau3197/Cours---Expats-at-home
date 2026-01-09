
import React, { useState } from 'react';
import Navbar from './components/Navbar';
import CourseLibrary from './pages/CourseLibrary';
import CoursePlayer from './pages/CoursePlayer';
import Dashboard from './pages/Dashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import ProfilePage from './pages/ProfilePage';
import AuthPage from './pages/AuthPage';
import { useAuth } from './context/AuthContext';
import { CoursePackage } from './types';

const App: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('library');
  const [selectedCourse, setSelectedCourse] = useState<CoursePackage | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F7F2]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#dd8b8b]"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleSelectCourse = (course: CoursePackage, lessonId?: string) => {
    setSelectedCourse(course);
    setSelectedLessonId(lessonId);
    setCurrentPage('player');
  };

  const handleNavigate = (page: string) => {
    if (page === 'logout') {
      logout();
      return;
    }
    setCurrentPage(page);
    if (page !== 'player') {
      setSelectedCourse(null);
      setSelectedLessonId(undefined);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar 
        onNavigate={handleNavigate} 
        currentPage={currentPage} 
        user={user}
        onSearch={setSearchTerm}
        onSelectCourse={handleSelectCourse}
      />
      
      <main className="flex-1 overflow-auto bg-[#F9F7F2]">
        {currentPage === 'library' && (
          <CourseLibrary 
            searchTerm={searchTerm}
            onSelectCourse={handleSelectCourse} 
          />
        )}
        
        {currentPage === 'dashboard' && (
          <Dashboard />
        )}

        {currentPage === 'instructor' && (
          <InstructorDashboard courses={[]} />
        )}

        {currentPage === 'profile' && (
          <ProfilePage user={user} />
        )}
        
        {currentPage === 'player' && selectedCourse && (
          <CoursePlayer 
            course={selectedCourse} 
            onBack={() => setCurrentPage('library')}
            initialLessonId={selectedLessonId}
          />
        )}
      </main>
      
      {currentPage !== 'player' && (
        <footer className="bg-white border-t border-[#dd8b8b]/10 py-16">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="mb-8 h-12 flex justify-center">
               <img src="https://i.ibb.co/chry57j9/Logo-Expatsathome-forlightmode.png" alt="ExpatsatHome.be" className="h-full object-contain" />
            </div>
            <p className="text-[#5A6B70]/40 text-sm font-bold sans-geometric uppercase tracking-widest">
              ExpatsatHome.be - Your Mastery Journey. © 2024
            </p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;
