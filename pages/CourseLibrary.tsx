import React, { useState, useEffect, useMemo } from 'react';
import { Star, ChevronRight, CheckCircle, ShieldCheck, Loader2, Sparkles, BookOpen, ArrowDown } from 'lucide-react';
import { masterCurriculum } from '../data/mockData';
import { CoursePackage } from '../types';
import localCourses from '../data/allCourses.json';
import StyledMarkdown from '../components/StyledMarkdown';
import { fuzzySearchCourses, fuzzySearchLessons, getSearchSuggestions, SearchResult, LessonSearchResult } from '../services/search';

interface CourseLibraryProps {
  onSelectCourse: (course: CoursePackage, lessonId?: string) => void;
  searchTerm: string;
}

// Configuration for each level's display
const LEVEL_CONFIG: Record<string, { title: string; subtitle: string; color: string }> = {
  'A1': { title: 'Niveau A1', subtitle: 'LES BASES', color: '#dd8b8b' },      // Rose
  'A2': { title: 'Niveau A2', subtitle: 'ÉLÉMENTAIRE', color: '#6A994E' },  // Green
  'B1': { title: 'Niveau B1', subtitle: 'INTERMÉDIAIRE', color: '#E8C586' }, // Gold
  'B2': { title: 'Niveau B2', subtitle: 'AVANCÉ', color: '#5A6B70' },        // Slate
};

// Extracted Card Component for reusability
const CourseCard: React.FC<{
  result: SearchResult;
  idx: number;
  onSelectCourse: (course: CoursePackage, lessonId?: string) => void;
  searchTerm: string;
}> = ({ result, idx, onSelectCourse, searchTerm }) => {
  const pkg = result.course;
  return (
    <div
      onClick={() => onSelectCourse(pkg)}
      className="group relative bg-white rounded-[56px] p-10 border border-[#dd8b8b]/10 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-700 cursor-pointer overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#F9F7F2] rounded-full -mr-20 -mt-20 group-hover:bg-[#dd8b8b]/5 transition-all duration-700" />

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
        <div className="w-32 h-32 rounded-[40px] bg-[#F9F7F2] flex items-center justify-center text-5xl font-black text-[#dd8b8b] serif-display italic shadow-inner border border-[#dd8b8b]/5">
          {pkg.level}
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-2 flex-wrap">
            <div className="px-3 py-1 bg-[#E8C586] text-white text-[9px] font-black rounded-full uppercase tracking-widest">
              Étape {idx + 1}
            </div>
            {searchTerm && result.score < 1 && (
              <div className="px-3 py-1 bg-[#dd8b8b]/10 text-[#dd8b8b] text-[9px] font-black rounded-full uppercase tracking-widest border border-[#dd8b8b]/20">
                {Math.round(result.score * 100)}% de correspondance
              </div>
            )}
            <div className="flex text-[#E8C586]">
              <Star className="w-3 h-3 fill-current" />
              <Star className="w-3 h-3 fill-current" />
              <Star className="w-3 h-3 fill-current" />
            </div>
          </div>
          <h3 className="text-4xl font-bold text-[#5A6B70] serif-display italic mb-4">{pkg.title}</h3>
          {result.matchedLessons && result.matchedLessons.length > 0 && (
            <div className="mb-4 p-3 bg-[#F9F7F2] rounded-xl border border-[#dd8b8b]/10">
              <div className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/60 mb-2">Leçons correspondantes :</div>
              <div className="flex flex-wrap gap-2">
                {result.matchedLessons.map(({ lesson }) => (
                  <button
                    key={lesson.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCourse(pkg, lesson.id);
                    }}
                    className="px-2 py-1 bg-white rounded-lg text-xs font-bold text-[#5A6B70] border border-[#dd8b8b]/10 hover:bg-[#dd8b8b] hover:text-white hover:border-[#dd8b8b] transition-all cursor-pointer"
                  >
                    {lesson.title}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="text-[#5A6B70]/70 text-lg leading-relaxed mb-6 max-w-xl prose prose-lg max-w-none">
            <StyledMarkdown
              content={pkg.description}
              className="[&_p]:text-lg [&_p]:leading-relaxed [&_p]:mb-3 [&_p]:sans-handwritten [&_p]:italic [&_p]:text-[#5A6B70]/70 [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:space-y-2 [&_li]:text-[#5A6B70]/70"
            />
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40">
              <CheckCircle className="w-3 h-3 text-green-400" /> Vidéos HD
            </span>
            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40">
              <CheckCircle className="w-3 h-3 text-green-400" /> Vokabel-Trainer
            </span>
            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40">
              <CheckCircle className="w-3 h-3 text-green-400" /> PDF-Ressourcen
            </span>
          </div>
        </div>

        <div className="w-20 h-20 rounded-[30px] bg-[#F9F7F2] flex items-center justify-center text-[#dd8b8b] group-hover:bg-[#dd8b8b] group-hover:text-white transition-all transform group-hover:rotate-12 shadow-sm">
          <ChevronRight className="w-10 h-10" />
        </div>
      </div>
    </div>
  );
};

const CourseLibrary: React.FC<CourseLibraryProps> = ({ onSelectCourse, searchTerm }) => {
  const [courses, setCourses] = useState<CoursePackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load courses from local JSON
    const loadCourses = () => {
      try {
        if (localCourses && localCourses.length > 0) {
          // Sort by level A1 -> A2 -> B1 -> B2
          const levelOrder = { 'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4 };
          // We need to cast to CoursePackage[] because JSON import might be inferred loosely
          const typedCourses = localCourses as unknown as CoursePackage[];
          typedCourses.sort((a, b) => (levelOrder[a.level as keyof typeof levelOrder] || 99) - (levelOrder[b.level as keyof typeof levelOrder] || 99));
          setCourses(typedCourses);
        } else {
          setCourses(masterCurriculum);
        }
      } catch (error) {
        console.error("Error loading local courses:", error);
        setCourses(masterCurriculum);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  // Recherche fuzzy avec résultats triés par pertinence
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) {
      return courses.map(course => ({
        course,
        score: 1,
        matchedFields: [],
        matchedLessons: undefined
      }));
    }
    return fuzzySearchCourses(courses, searchTerm, 0.2);
  }, [courses, searchTerm]);

  // Recherche dans les leçons individuelles
  const lessonResults = useMemo(() => {
    if (!searchTerm.trim()) {
      return [];
    }
    return fuzzySearchLessons(courses, searchTerm, 0.3);
  }, [courses, searchTerm]);

  // Groupes par niveau
  const coursesByLevel = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    searchResults.forEach(result => {
      const level = result.course.level || 'Autre';
      if (!groups[level]) groups[level] = [];
      groups[level].push(result);
    });
    return groups;
  }, [searchResults]);

  // Ordered levels to display
  const displayLevels = ['A1', 'A2', 'B1', 'B2', 'Autre'].filter(level => coursesByLevel[level] && coursesByLevel[level].length > 0);

  const scrollToLevel = (level: string) => {
    const element = document.getElementById(`level-${level}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#dd8b8b] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
      <div className="text-center mb-24">
        <div className="inline-flex items-center gap-2 px-5 py-2 bg-[#E8C586]/10 text-[#E8C586] text-xs font-black rounded-full mb-8 uppercase tracking-[0.3em] sans-geometric border border-[#E8C586]/20">
          <span className="w-2 h-2 rounded-full bg-[#E8C586] animate-pulse" /> ExpatsatHome.be
        </div>
        <h1 className="text-7xl md:text-8xl font-black text-[#5A6B70] serif-display leading-tight italic tracking-tighter mb-8">
          Votre <span className="text-[#dd8b8b] not-italic">Voyage.</span>
        </h1>
        <p className="text-[#5A6B70]/70 text-2xl sans-handwritten italic leading-relaxed max-w-3xl mx-auto mb-10">
          One path, total mastery. Access everything from A1 to B2 in one comprehensive Belgian expat package.
        </p>

        {/* Navigation Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          {displayLevels.map(level => {
            const config = LEVEL_CONFIG[level] || { title: level, color: '#5A6B70' };
            return (
              <button
                key={level}
                onClick={() => scrollToLevel(level)}
                className="group flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border-2 border-transparent shadow-sm hover:shadow-md transition-all duration-300"
                style={{ borderColor: `${config.color}20` }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                <span className="font-bold text-[#5A6B70] group-hover:text-[#dd8b8b] transition-colors">
                  {config.title}
                </span>
                <ArrowDown className="w-4 h-4 text-[#5A6B70]/40 group-hover:text-[#dd8b8b] transition-colors" />
              </button>
            );
          })}
        </div>
      </div>

      {searchTerm && searchResults.length > 0 && (
        <div className="mb-8 p-4 bg-[#E8C586]/10 rounded-2xl border border-[#E8C586]/20">
          <div className="flex items-center gap-2 text-sm font-bold text-[#5A6B70]">
            <Sparkles className="w-4 h-4 text-[#E8C586]" />
            {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''} trouvé{searchResults.length > 1 ? 's' : ''} pour "{searchTerm}"
          </div>
        </div>
      )}

      {searchTerm && searchResults.length === 0 && lessonResults.length === 0 && (
        <div className="mb-8 p-8 bg-white rounded-2xl border border-[#dd8b8b]/10 text-center">
          <p className="text-[#5A6B70]/60 font-medium">Aucun résultat trouvé pour "{searchTerm}"</p>
          <p className="text-sm text-[#5A6B70]/40 mt-2">Essayez avec d'autres mots-clés</p>
        </div>
      )}

      {/* Affichage des leçons individuelles trouvées */}
      {searchTerm && lessonResults.length > 0 && (
        <div className="mb-12">
          <div className="mb-6 p-4 bg-[#E8C586]/10 rounded-2xl border border-[#E8C586]/20">
            <div className="flex items-center gap-2 text-sm font-bold text-[#5A6B70]">
              <BookOpen className="w-4 h-4 text-[#E8C586]" />
              {lessonResults.length} leçon{lessonResults.length > 1 ? 's' : ''} trouvée{lessonResults.length > 1 ? 's' : ''} pour "{searchTerm}"
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessonResults.map((result) => (
              <div
                key={`${result.course.id}-${result.lesson.id}`}
                onClick={() => onSelectCourse(result.course, result.lesson.id)}
                className="bg-white rounded-[32px] p-6 border border-[#dd8b8b]/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#F9F7F2] flex items-center justify-center text-lg font-black text-[#dd8b8b] group-hover:bg-[#dd8b8b] group-hover:text-white transition-all">
                    {result.course.level}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40 mb-1">
                      {result.course.title}
                    </div>
                    <h4 className="font-bold text-[#5A6B70] group-hover:text-[#dd8b8b] transition-colors line-clamp-2">
                      {result.lesson.title}
                    </h4>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-[9px] font-black uppercase tracking-widest text-[#5A6B70]/40">
                    {result.lesson.duration} • {result.lesson.type}
                  </div>
                  {result.score < 1 && (
                    <div className="px-2 py-1 bg-[#dd8b8b]/10 text-[#dd8b8b] text-[8px] font-black rounded-full uppercase tracking-widest border border-[#dd8b8b]/20">
                      {Math.round(result.score * 100)}%
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTIONS PAR NIVEAU */}
      {displayLevels.map((level) => {
        const levelCourses = coursesByLevel[level];
        const config = LEVEL_CONFIG[level] || { title: `Niveau ${level}`, subtitle: 'Module', color: '#5A6B70' };

        return (
          <div key={level} id={`level-${level}`} className="mb-24 scroll-mt-32">
            <div className="flex items-center gap-6 mb-12">
              <div
                className="hidden md:block h-px w-24"
                style={{ backgroundColor: `${config.color}40` }}
              ></div>
              <h2 className="text-4xl md:text-5xl font-black text-[#5A6B70] serif-display italic">
                {config.title} <span className="text-xl md:text-2xl not-italic ml-2 font-bold sans-geometric tracking-[0.2em] opacity-60 relative -top-1 uppercase" style={{ color: config.color }}>{config.subtitle}</span>
              </h2>
              <div
                className="h-px flex-1"
                style={{ backgroundColor: `${config.color}40` }}
              ></div>
            </div>

            <div
              className="grid grid-cols-1 gap-12 p-8 md:p-16 rounded-[60px] border-4 bg-[#F9F7F2] relative"
              style={{
                borderColor: `${config.color}40`,
                backgroundColor: `${config.color}08`
              }}
            >
              <div
                className="absolute top-0 right-12 -mt-6 text-white px-6 py-2 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-lg"
                style={{ backgroundColor: config.color }}
              >
                {levelCourses.length} Modules
              </div>
              {levelCourses.map((result, idx) => (
                <CourseCard
                  key={result.course.id}
                  result={result}
                  idx={idx}
                  onSelectCourse={onSelectCourse}
                  searchTerm={searchTerm}
                />
              ))}
            </div>
          </div>
        );
      })}

      <div className="mt-32 p-16 bg-[#5A6B70] rounded-[60px] text-center text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-full bg-[#dd8b8b]/10 animate-pulse pointer-events-none" />
        <ShieldCheck className="w-16 h-16 mx-auto mb-8 text-[#E8C586]" />
        <h2 className="text-5xl font-bold serif-display italic mb-6">Prêt à commencer ?</h2>
        <p className="text-xl sans-handwritten italic opacity-80 mb-12 max-w-xl mx-auto">
          One simple membership. Unlimited access to the entire Mastery Path. Your home for French in Belgium.
        </p>
        <button
          onClick={() => onSelectCourse(courses[0])}
          className="px-12 py-5 bg-[#dd8b8b] text-white rounded-[24px] font-black sans-geometric uppercase tracking-[0.3em] hover:scale-105 transition-all shadow-xl shadow-black/20"
        >
          Entrer dans la classe
        </button>
      </div>
    </div>
  );
};


export default CourseLibrary;
