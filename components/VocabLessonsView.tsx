import React, { useState, useMemo } from 'react';
import { ChevronRight, Volume2 } from 'lucide-react';
import { vocabularyItems } from '../data/vocabularyThemes';

interface LessonInfo {
    id: string;
    title: string;
    level: string;
}

// Sample lesson data - ideally this would come from your course data
const LESSON_DATA: LessonInfo[] = [
    { id: 'a1-1-lecon-01', title: 'Leçon 1 : Se présenter', level: 'A1.1' },
];

const VocabLessonsView: React.FC = () => {
    const [selectedLesson, setSelectedLesson] = useState<string | null>(null);

    // Get vocabulary for selected lesson
    const lessonVocab = useMemo(() => {
        if (!selectedLesson) return [];
        return vocabularyItems.filter((item) => item.lessonIds?.includes(selectedLesson));
    }, [selectedLesson]);

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
                    {LESSON_DATA.map((lesson) => (
                        <button
                            key={lesson.id}
                            onClick={() => setSelectedLesson(lesson.id)}
                            className="bg-[#F9F7F2] hover:bg-white border border-[#dd8b8b]/20 hover:border-[#dd8b8b] rounded-2xl p-6 text-left transition-all group"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-[#dd8b8b] uppercase">{lesson.level}</span>
                                <ChevronRight className="w-5 h-5 text-[#dd8b8b]/40 group-hover:text-[#dd8b8b] transition-colors" />
                            </div>
                            <h3 className="text-lg font-bold text-[#5A6B70] group-hover:text-[#dd8b8b] transition-colors">
                                {lesson.title}
                            </h3>
                        </button>
                    ))}
                </div>
                <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-2xl">
                    <p className="text-sm text-blue-800">
                        <strong>Note :</strong> Pour l'instant, seule la Leçon 1 contient du vocabulaire mappé. Les autres leçons seront ajoutées progressivement.
                    </p>
                </div>
            </div>
        );
    }

    const currentLesson = LESSON_DATA.find((l) => l.id === selectedLesson);

    return (
        <div>
            <button
                onClick={() => setSelectedLesson(null)}
                className="mb-6 text-[#dd8b8b] hover:text-[#5A6B70] font-bold flex items-center gap-2 transition-colors"
            >
                ← Retour aux leçons
            </button>

            <h2 className="text-2xl font-bold text-[#5A6B70] mb-2">{currentLesson?.title}</h2>
            <p className="text-[#A0AEC0] mb-6">
                {lessonVocab.length} mot{lessonVocab.length > 1 ? 's' : ''} de vocabulaire
            </p>

            {lessonVocab.length === 0 ? (
                <div className="text-center py-12 bg-[#F9F7F2] rounded-2xl">
                    <p className="text-[#5A6B70]/60 italic">Aucun vocabulaire pour cette leçon</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lessonVocab.map((word) => (
                        <div
                            key={word.id}
                            className="bg-white border border-[#dd8b8b]/10 rounded-2xl p-5 hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-bold text-[#5A6B70]">{word.french}</h3>
                                <button
                                    onClick={() => speak(word.french)}
                                    className="p-2 rounded-full hover:bg-[#F9F7F2] text-[#dd8b8b] transition-colors"
                                    title="Écouter"
                                >
                                    <Volume2 className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-[#5A6B70]/70 text-sm mb-1">{word.english}</p>
                            {word.example && (
                                <p className="text-xs text-[#5A6B70]/50 italic mt-3 border-t border-[#dd8b8b]/10 pt-3">
                                    "{word.example}"
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default VocabLessonsView;
