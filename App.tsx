
import React, { useState } from 'react';
import Navbar from './components/Navbar';
import CourseLibrary from './pages/CourseLibrary';
import CoursePlayer from './pages/CoursePlayer';
import GrammairePage from './pages/GrammairePage';
import LessonsPage from './pages/LessonsPage';
import TrenteJoursPage from './pages/TrenteJoursPage';
import Dashboard from './pages/Dashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import ProfilePage from './pages/ProfilePage';
import AuthPage from './pages/AuthPage';
import CarnetPage from './pages/CarnetPage';
import ProgrammePage from './pages/ProgrammePage';
import CoachingSpace from './components/CoachingSpace';
import VocabularyLayout from './components/VocabularyLayout';
import { useAuth } from './context/AuthContext';
import { CoursePackage } from './types';

const App: React.FC = () => {
  const { user, loading, logout, isImpersonating, stopImpersonation } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('library');
  const [selectedCourse, setSelectedCourse] = useState<CoursePackage | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [grammarKey, setGrammarKey] = useState(0);
  const [lessonsKey, setLessonsKey] = useState(0);

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
    if (page === 'grammaire') {
      setGrammarKey(prev => prev + 1);
    }
    if (page === 'lessons') {
      setLessonsKey(prev => prev + 1);
    }
    if (page !== 'player') {
      setSelectedCourse(null);
      setSelectedLessonId(undefined);
    }
  };


  return (
    <div className="min-h-screen flex flex-col">
      {isImpersonating && (
        <div className="bg-red-500 text-white px-4 py-2 text-center text-sm font-bold flex justify-center items-center gap-4 sticky top-0 z-50 shadow-lg">
          <span>👁️ Mode: Vue en tant que {user.name}</span>
          <button
            onClick={() => {
              stopImpersonation();
              handleNavigate('dashboard');
            }}
            className="bg-white text-red-500 px-3 py-1 rounded-full text-xs hover:bg-red-50 uppercase tracking-wider"
          >
            Quitter le mode
          </button>
        </div>
      )}
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

        {currentPage === 'grammaire' && (
          <GrammairePage key={grammarKey} />
        )}

        {currentPage === 'vocabulary' && (
          <VocabularyLayout />
        )}

        {currentPage === 'programme' && (
          <ProgrammePage />
        )}

        {currentPage === 'lessons' && (
          <LessonsPage key={lessonsKey} />
        )}

        {currentPage === '30jours' && (
          <TrenteJoursPage />
        )}

        {currentPage === 'dashboard' && (
          <Dashboard onNavigate={handleNavigate} />
        )}

        {currentPage === 'instructor' && (
          <InstructorDashboard />
        )}

        {currentPage === 'profile' && (
          <ProfilePage user={user} />
        )}

        {currentPage === 'carnet' && (
          <CarnetPage onBack={() => handleNavigate('library')} />
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
