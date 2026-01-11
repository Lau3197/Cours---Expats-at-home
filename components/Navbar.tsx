
import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, LogOut } from 'lucide-react';
import { UserProfile, CoursePackage } from '../types';
import { db } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { getSearchSuggestions, fuzzySearchCourses, fuzzySearchLessons } from '../services/search';
import SearchSuggestions from './SearchSuggestions';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  user: UserProfile;
  onSearch: (term: string) => void;
  onSelectCourse?: (course: CoursePackage) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage, user, onSearch, onSelectCourse }) => {
  const logoUrl = "https://i.ibb.co/chry57j9/Logo-Expatsathome-forlightmode.png";
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [matchedCourses, setMatchedCourses] = useState<CoursePackage[]>([]);
  const [matchedLessons, setMatchedLessons] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [courses, setCourses] = useState<CoursePackage[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Charger les cours pour les suggestions
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'courses'));
        const fetchedCourses: CoursePackage[] = [];
        querySnapshot.forEach((doc) => {
          fetchedCourses.push({ id: doc.id, ...doc.data() } as CoursePackage);
        });
        setCourses(fetchedCourses);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };
    fetchCourses();
  }, []);

  // Générer les suggestions en temps réel
  useEffect(() => {
    if (searchValue.length >= 2) {
      const newSuggestions = getSearchSuggestions(courses, searchValue, 5);
      setSuggestions(newSuggestions);

      const courseResults = fuzzySearchCourses(courses, searchValue, 0.3);
      setMatchedCourses(courseResults.slice(0, 5).map(r => r.course));

      const lessonResults = fuzzySearchLessons(courses, searchValue, 0.3);
      setMatchedLessons(lessonResults.slice(0, 5));

      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setMatchedCourses([]);
      setMatchedLessons([]);
      setShowSuggestions(false);
    }
  }, [searchValue, courses]);

  // Fermer les suggestions quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onSearch(value);
  };

  const handleSelectSuggestion = (term: string) => {
    setSearchValue(term);
    onSearch(term);
    setShowSuggestions(false);
    if (currentPage !== 'library') {
      onNavigate('library');
    }
  };

  const handleSelectCourseFromSuggestion = (course: CoursePackage) => {
    if (onSelectCourse) {
      onSelectCourse(course);
    }
    setShowSuggestions(false);
    setSearchValue('');
    onSearch('');
  };

  const handleSelectLessonFromSuggestion = (course: CoursePackage, lessonId: string) => {
    if (onSelectCourse) {
      onSelectCourse(course, lessonId);
    }
    setShowSuggestions(false);
    setSearchValue('');
    onSearch('');
  };

  return (
    <nav className="bg-white/95 backdrop-blur-xl border-b border-[#dd8b8b]/10 sticky top-0 z-50 py-1 shadow-sm h-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between h-full items-center">
          <div className="flex items-center gap-10 h-full">
            <div
              className="flex items-center cursor-pointer group h-full relative"
              onClick={() => onNavigate('library')}
            >
              {/* Logo container: allowing it to be larger than standard icons */}
              <div className="h-20 transition-transform duration-500 group-hover:scale-105 flex items-center">
                <img
                  src={logoUrl}
                  alt="ExpatsatHome.be"
                  className="h-full w-auto object-contain py-1"
                />
              </div>
            </div>

            <div className="hidden xl:flex items-center gap-8 text-[10px] font-black text-[#5A6B70]/40 sans-geometric uppercase tracking-[0.3em]">
              <button
                onClick={() => onNavigate('library')}
                className={`hover:text-[#dd8b8b] transition-all relative py-2 ${currentPage === 'library' ? 'text-[#dd8b8b]' : ''}`}
              >
                Catalog
                {currentPage === 'library' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#dd8b8b] rounded-full" />}
              </button>
              <button
                onClick={() => onNavigate('grammaire')}
                className={`hover:text-[#dd8b8b] transition-all relative py-2 ${currentPage === 'grammaire' ? 'text-[#dd8b8b]' : ''}`}
              >
                Grammaire
                {currentPage === 'grammaire' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#dd8b8b] rounded-full" />}
              </button>
              <button
                onClick={() => onNavigate('30jours')}
                className={`hover:text-[#dd8b8b] transition-all relative py-2 ${currentPage === '30jours' ? 'text-[#dd8b8b]' : ''}`}
              >
                30 Jours
                {currentPage === '30jours' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#dd8b8b] rounded-full" />}
              </button>
              {/* <button
                onClick={() => onNavigate('lessons')}
                className={`hover:text-[#dd8b8b] transition-all relative py-2 ${currentPage === 'lessons' ? 'text-[#dd8b8b]' : ''}`}
              >
                Leçons
                {currentPage === 'lessons' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#dd8b8b] rounded-full" />}
              </button> */}
              <button
                onClick={() => onNavigate('dashboard')}
                className={`hover:text-[#dd8b8b] transition-all relative py-2 ${currentPage === 'dashboard' ? 'text-[#dd8b8b]' : ''}`}
              >
                My Path
                {currentPage === 'dashboard' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#dd8b8b] rounded-full" />}
              </button>
              {(user.role === 'admin' || user.role === 'superadmin' || user.role === 'instructor') && (
                <button
                  onClick={() => onNavigate('instructor')}
                  className={`hover:text-[#dd8b8b] transition-all relative py-2 ${currentPage === 'instructor' ? 'text-[#dd8b8b]' : ''}`}
                >
                  Admin
                  {currentPage === 'instructor' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#dd8b8b] rounded-full" />}
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 max-w-sm mx-8 hidden lg:block" ref={searchRef}>
            <div className="relative group">
              <div className="absolute inset-0 bg-[#dd8b8b]/5 rounded-full group-hover:bg-[#dd8b8b]/10 transition-colors" />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#dd8b8b] w-4 h-4 z-10" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => searchValue.length >= 2 && setShowSuggestions(true)}
                placeholder="Search mastery..."
                className="w-full bg-transparent border-none rounded-full py-3.5 pl-14 pr-6 focus:outline-none text-xs font-bold text-[#5A6B70] relative z-20 placeholder-[#5A6B70]/30 transition-all"
              />
              <SearchSuggestions
                suggestions={suggestions}
                courses={matchedCourses}
                lessons={matchedLessons}
                searchTerm={searchValue}
                onSelectSuggestion={handleSelectSuggestion}
                onSelectCourse={handleSelectCourseFromSuggestion}
                onSelectLesson={handleSelectLessonFromSuggestion}
                visible={showSuggestions}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              className="relative p-3 text-[#5A6B70]/40 hover:text-[#dd8b8b] transition-all bg-[#F9F7F2] rounded-2xl group"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#E8C586] rounded-full border border-white"></span>
            </button>
            <button
              onClick={() => onNavigate('logout')}
              className="relative p-3 text-[#5A6B70]/40 hover:text-[#dd8b8b] transition-all bg-[#F9F7F2] rounded-2xl group"
              title="Déconnexion"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <div
              className="flex items-center gap-4 pl-4 border-l border-[#dd8b8b]/10 cursor-pointer group"
              onClick={() => onNavigate('profile')}
            >
              <div className="text-right hidden sm:block">
                <div className="text-[10px] font-black text-[#5A6B70] sans-geometric uppercase tracking-widest">{user.name}</div>
                <div className="text-[9px] text-[#dd8b8b] font-black uppercase tracking-[0.2em] mt-0.5">Level {user.levelGoal}</div>
              </div>
              <div className="w-12 h-12 rounded-[18px] overflow-hidden border-2 border-transparent group-hover:border-[#dd8b8b] transition-all shadow-lg">
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
