import React from 'react';
import { Search, TrendingUp, BookOpen, FileText } from 'lucide-react';
import { CoursePackage } from '../types';
import { LessonSearchResult } from '../services/search';

interface SearchSuggestionsProps {
  suggestions: string[];
  courses: CoursePackage[];
  lessons?: LessonSearchResult[];
  searchTerm: string;
  onSelectSuggestion: (term: string) => void;
  onSelectCourse?: (course: CoursePackage) => void;
  onSelectLesson?: (course: CoursePackage, lessonId: string) => void;
  visible: boolean;
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  suggestions,
  courses,
  lessons,
  searchTerm,
  onSelectSuggestion,
  onSelectCourse,
  onSelectLesson,
  visible
}) => {
  if (!visible || (!suggestions.length && !courses.length && !lessons?.length)) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[24px] border-2 border-[#dd8b8b]/20 shadow-2xl z-50 overflow-hidden">
      {suggestions.length > 0 && (
        <div className="p-4 border-b border-[#dd8b8b]/10">
          <div className="flex items-center gap-2 mb-3 px-2">
            <TrendingUp className="w-4 h-4 text-[#E8C586]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/60">Suggestions</span>
          </div>
          <div className="space-y-1">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => onSelectSuggestion(suggestion)}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-[#F9F7F2] transition-all group flex items-center gap-3"
              >
                <Search className="w-4 h-4 text-[#5A6B70]/40 group-hover:text-[#dd8b8b] transition-colors" />
                <span className="text-sm font-bold text-[#5A6B70] group-hover:text-[#dd8b8b] transition-colors">
                  {suggestion}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {lessons && lessons.length > 0 && (
        <div className="p-4 border-b border-[#dd8b8b]/10">
          <div className="flex items-center gap-2 mb-3 px-2">
            <FileText className="w-4 h-4 text-[#E8C586]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/60">Leçons Correspondantes</span>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {lessons.slice(0, 5).map((result) => (
              <button
                key={`${result.course.id}-${result.lesson.id}`}
                onClick={() => onSelectLesson?.(result.course, result.lesson.id)}
                className="w-full text-left p-3 rounded-xl hover:bg-[#F9F7F2] transition-all group border border-transparent hover:border-[#dd8b8b]/20"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#F9F7F2] flex items-center justify-center text-sm font-black text-[#dd8b8b] group-hover:bg-[#dd8b8b] group-hover:text-white transition-all flex-shrink-0">
                    {result.course.level}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-[#5A6B70] group-hover:text-[#dd8b8b] transition-colors line-clamp-1">
                      {result.lesson.title}
                    </div>
                    <div className="text-[10px] text-[#5A6B70]/50 mt-0.5 line-clamp-1">
                      {result.course.title}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {courses.length > 0 && (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3 px-2">
            <BookOpen className="w-4 h-4 text-[#dd8b8b]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/60">Cours Correspondants</span>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {courses.slice(0, 5).map((course) => (
              <button
                key={course.id}
                onClick={() => onSelectCourse?.(course)}
                className="w-full text-left p-4 rounded-xl hover:bg-[#F9F7F2] transition-all group border border-transparent hover:border-[#dd8b8b]/20"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#F9F7F2] flex items-center justify-center text-lg font-black text-[#dd8b8b] group-hover:bg-[#dd8b8b] group-hover:text-white transition-all">
                    {course.level}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[#5A6B70] group-hover:text-[#dd8b8b] transition-colors line-clamp-1">
                      {course.title}
                    </div>
                    <div className="text-xs text-[#5A6B70]/60 mt-1 line-clamp-2">
                      {course.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchSuggestions;

