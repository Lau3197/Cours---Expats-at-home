import React, { useState, useMemo } from 'react';
import { ChevronRight, Volume2 } from 'lucide-react';
import { loadCourses } from '../utils/courseLoader';
import { CoursePackage, Lesson } from '../types';

const VocabLessonsView: React.FC = () => {
    const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

    // Load real courses and flatten lessons
    const { allLessons, lessonMap } = useMemo(() => {
        const courses = loadCourses();
        const lessons: (Lesson & { courseTitle: string; level: string })[] = [];
        const map = new Map<string, Lesson>();

        courses.forEach(course => {
            course.sections.forEach(section => {
                section.lessons.forEach(lesson => {
                    const enrichedLesson = {
                        ...lesson,
                        courseTitle: course.title,
                        level: course.level
                    };
                    lessons.push(enrichedLesson);
                    map.set(lesson.id, enrichedLesson);
                });
            });
        });

        return { allLessons: lessons, lessonMap: map };
    }, []);

    const selectedLesson = selectedLessonId ? lessonMap.get(selectedLessonId) : null;

    const speak = (text: string) => {
        if (!text) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    };

    if (!selectedLesson) {
        return (
            <div>
                <h2 className="text-2xl font-bold text-[#5A6B70] mb-6">Sélectionnez une leçon</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allLessons
                        // Filter lessons that actually have vocabulary
                        .filter(l => l.vocabulary && l.vocabulary.length > 0)
                        .map((lesson) => (
                            <button
                                key={lesson.id}
                                onClick={() => setSelectedLessonId(lesson.id)}
                                className="bg-[#F9F7F2] hover:bg-white border border-[#dd8b8b]/20 hover:border-[#dd8b8b] rounded-2xl p-6 text-left transition-all group"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-[#dd8b8b] uppercase">{lesson.level}</span>
                                    <ChevronRight className="w-5 h-5 text-[#dd8b8b]/40 group-hover:text-[#dd8b8b] transition-colors" />
                                </div>
                                <h3 className="text-lg font-bold text-[#5A6B70] group-hover:text-[#dd8b8b] transition-colors line-clamp-2">
                                    {lesson.title}
                                </h3>
                                <span className="text-xs text-[#5A6B70]/50 mt-2 block">
                                    {lesson.vocabulary.length} mots
                                </span>
                            </button>
                        ))}
                </div>
                {allLessons.filter(l => l.vocabulary && l.vocabulary.length > 0).length === 0 && (
                    <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-2xl text-center">
                        <p className="text-sm text-blue-800">
                            Aucune leçon avec du vocabulaire n'est disponible pour le moment.
                        </p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div>
            <button
                onClick={() => setSelectedLessonId(null)}
                className="mb-6 text-[#dd8b8b] hover:text-[#5A6B70] font-bold flex items-center gap-2 transition-colors"
            >
                ← Retour aux leçons
            </button>

            <h2 className="text-2xl font-bold text-[#5A6B70] mb-2">{selectedLesson.title}</h2>
            <p className="text-[#A0AEC0] mb-6">
                {selectedLesson.vocabulary.length} mot{selectedLesson.vocabulary.length > 1 ? 's' : ''} de vocabulaire
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedLesson.vocabulary.map((word: any, idx) => (
                    <div
                        key={idx}
                        className="bg-white border border-[#dd8b8b]/10 rounded-2xl p-5 hover:shadow-md transition-shadow"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-xl font-bold text-[#5A6B70]">{word.fr || word.french}</h3>
                            <button
                                onClick={() => speak(word.fr || word.french)}
                                className="p-2 rounded-full hover:bg-[#F9F7F2] text-[#dd8b8b] transition-colors"
                                title="Écouter"
                            >
                                <Volume2 className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-[#5A6B70]/70 text-sm mb-1">{word.en || word.english}</p>
                        {word.example && (
                            <p className="text-xs text-[#5A6B70]/50 italic mt-3 border-t border-[#dd8b8b]/10 pt-3">
                                "{word.example}"
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VocabLessonsView;
