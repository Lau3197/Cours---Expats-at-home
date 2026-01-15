
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
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
import allCoursesRaw from './data/allCourses.json';

const allCourses = allCoursesRaw as unknown as CoursePackage[];

const App: React.FC = () => {
  const { user, loading, logout, isImpersonating, stopImpersonation } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Backwards compatibility: Derive currentPage from path
  const getCurrentPage = (path: string) => {
    if (path === '/' || path.startsWith('/library')) return 'library';
    if (path.startsWith('/grammar')) return 'grammaire';
    if (path.startsWith('/vocabulary')) return 'vocabulary';
    if (path.startsWith('/curriculum')) return 'programme';
    if (path.startsWith('/all-lessons')) return 'lessons';
    if (path.startsWith('/30-days')) return '30jours';
    if (path.startsWith('/dashboard')) return 'dashboard';
    if (path.startsWith('/instructor')) return 'instructor';
    if (path.startsWith('/profile')) return 'profile';
    if (path.startsWith('/notebook')) return 'carnet';
    if (path.startsWith('/learn') || path.startsWith('/course')) return 'player';
    return 'library';
  };

  const currentPage = getCurrentPage(location.pathname);

  // Keep these for internal component keys if needed
  const [selectedCourse, setSelectedCourse] = useState<CoursePackage | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [grammarKey, setGrammarKey] = useState(0);
  const [lessonsKey, setLessonsKey] = useState(0);

  // Wrapper to handle course loading from URL
  const CourseViewer = () => {
    const { courseId, lessonId, tab } = useParams();
    const navigate = useNavigate();
    // Find course by ID (normalize lowercase just in case)
    const course = allCourses.find(c => c.id.toLowerCase() === courseId?.toLowerCase());

    if (!course) {
      return <Navigate to="/library" replace />;
    }

    return (
      <CoursePlayer
        course={course}
        initialLessonId={lessonId}
        initialTab={tab}
        onBack={() => navigate('/library')}
      />
    );
  };

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
    let path = `/course/${course.id}`;
    if (lessonId) path += `/${lessonId}`;
    navigate(path);
  };

  const handleNavigate = (page: string) => {
    if (page === 'logout') {
      logout();
      return;
    }

    // Map internal page names to routes
    const routeMap: Record<string, string> = {
      'library': '/library',
      'grammaire': '/grammaire',
      'vocabulary': '/vocabulary',
      'programme': '/curriculum',
      'lessons': '/all-lessons',
      '30jours': '/30-days',
      'dashboard': '/dashboard',
      'instructor': '/instructor',
      'profile': '/profile',
      'carnet': '/notebook',
      'player': '/learn' // Though usually we navigate to specific course
    };

    const targetPath = routeMap[page] || '/library';
    navigate(targetPath);

    if (page === 'grammaire') {
      setGrammarKey(prev => prev + 1);
    }
    if (page === 'lessons') {
      setLessonsKey(prev => prev + 1);
    }
    // Cleanup selection state if leaving player context
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
        <Routes>
          <Route path="/" element={<Navigate to="/library" replace />} />
          <Route path="/library" element={
            <CourseLibrary
              searchTerm={searchTerm}
              onSelectCourse={handleSelectCourse}
            />
          } />
          <Route path="/grammar" element={<GrammairePage key={grammarKey} />} />
          <Route path="/vocabulary" element={<VocabularyLayout />} />
          <Route path="/curriculum" element={<ProgrammePage />} />
          <Route path="/all-lessons" element={<LessonsPage key={lessonsKey} />} />
          <Route path="/30-days" element={<TrenteJoursPage />} />
          <Route path="/dashboard" element={<Dashboard onNavigate={handleNavigate} />} />
          <Route path="/instructor" element={<InstructorDashboard />} />
          <Route path="/profile" element={<ProfilePage user={user} />} />
          <Route path="/notebook" element={<CarnetPage onBack={() => handleNavigate('library')} />} />

          {/* Dynamic Course Routes */}
          <Route path="/course/:courseId/:lessonId/:tab?" element={<CourseViewer />} />
          <Route path="/course/:courseId" element={<CourseViewer />} />

          {/* Granular Routes */}
          <Route path="/grammaire/:level?/:subLevel?/:lessonId?" element={<GrammairePage key={grammarKey} />} />
          <Route path="/vocabulary/:tab?/:themeId?" element={<VocabularyLayout />} />
          <Route path="/30-days/:dayId?" element={<TrenteJoursPage />} />

          <Route path="/learn" element={<Navigate to="/library" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/library" replace />} />
        </Routes>
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
