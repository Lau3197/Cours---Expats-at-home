import React, { useState, useEffect, useMemo } from 'react';
import { Play } from 'lucide-react';
import { themes, vocabularyItems } from '../data/vocabularyThemes';
import VocabTrainer from './VocabTrainer';
import { VocabularyItem, Lesson, VocabItem } from '../types';
import { loadCourses } from '../utils/courseLoader';

type Source = 'themes' | 'lessons' | 'user';

interface EnrichedLesson extends Lesson {
    courseTitle: string;
    level: string;
}

const VocabPracticeView: React.FC = () => {
    const [source, setSource] = useState<Source | null>(null);
    const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
    const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
    const [includeUserVocab, setIncludeUserVocab] = useState(false);
    const [practiceVocab, setPracticeVocab] = useState<VocabItem[]>([]);
    const [isStarted, setIsStarted] = useState(false);

    const [userVocab, setUserVocab] = useState<VocabItem[]>([]);

    // Load real courses and flatten lessons for selection
    const { allLessons, lessonMap } = useMemo(() => {
        const courses = loadCourses();
        const lessons: EnrichedLesson[] = [];
        const map = new Map<string, EnrichedLesson>();

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

    // Load user vocabulary
    useEffect(() => {
        const saved = localStorage.getItem('userVocabulary');
        if (saved) {
            try {
                // User vocab might be saved in different formats, adapt if needed
                const parsed = JSON.parse(saved);
                const adapted = parsed.map((p: any) => ({
                    id: p.id,
                    french: p.french,
                    translation: p.translation || p.english,
                    example: p.example
                }));
                setUserVocab(adapted);
            } catch (e) {
                console.error('Failed to load user vocabulary', e);
            }
        }
    }, []);

    const handleStart = () => {
        let vocab: VocabItem[] = [];

        if (source === 'themes' && selectedThemes.length > 0) {
            const selectedItems = vocabularyItems.filter((item) => selectedThemes.includes(item.themeId));
            vocab = selectedItems.map(item => ({
                id: item.id,
                french: item.french,
                translation: item.english, // Map english to translation
                example: item.example
            }));
        } else if (source === 'lessons' && selectedLessons.length > 0) {
            // Aggregate vocabulary from selected lessons
            selectedLessons.forEach(lessonId => {
                const lesson = lessonMap.get(lessonId);
                if (lesson && lesson.vocabulary) {
                    const lessonVocab = lesson.vocabulary.map((item: any, idx: number) => ({
                        id: `${lesson.id}-${idx}`,
                        french: item.fr || item.french,
                        translation: item.en || item.translation || item.english,
                        example: item.example,
                        pronunciation: item.pronunciation
                    }));
                    vocab = [...vocab, ...lessonVocab];
                }
            });
        } else if (source === 'user') {
            vocab = userVocab;
        }

        // Add user vocab if checkbox is checked
        if (includeUserVocab && source !== 'user') {
            vocab = [...vocab, ...userVocab];
        }

        setPracticeVocab(vocab);
        setIsStarted(true);
    };

    const handleReset = () => {
        setIsStarted(false);
        setSource(null);
        setSelectedThemes([]);
        setSelectedLessons([]);
        setIncludeUserVocab(false);
        setPracticeVocab([]);
    };

    if (isStarted && practiceVocab.length > 0) {
        return (
            <div>
                <button
                    onClick={handleReset}
                    className="mb-6 text-[#dd8b8b] hover:text-[#5A6B70] font-bold transition-colors"
                >
                    ← Nouvelle session
                </button>
                <VocabTrainer vocab={practiceVocab} />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-[#5A6B70] mb-2">Entraînement au Vocabulaire</h2>
            <p className="text-[#A0AEC0] mb-8">
                Choisissez le vocabulaire à pratiquer
            </p>

            {/* Step 1: Choose Source */}
            {!source && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => setSource('themes')}
                        className="bg-white hover:bg-[#F9F7F2] border-2 border-[#dd8b8b]/20 hover:border-[#dd8b8b] rounded-2xl p-8 text-center transition-all group"
                    >
                        <div className="text-4xl mb-3">📚</div>
                        <h3 className="text-lg font-bold text-[#5A6B70] group-hover:text-[#dd8b8b]">
                            Par Thèmes
                        </h3>
                        <p className="text-sm text-[#5A6B70]/60 mt-2">
                            {themes.length} thèmes disponibles
                        </p>
                    </button>

                    <button
                        onClick={() => setSource('lessons')}
                        className="bg-white hover:bg-[#F9F7F2] border-2 border-[#dd8b8b]/20 hover:border-[#dd8b8b] rounded-2xl p-8 text-center transition-all group"
                    >
                        <div className="text-4xl mb-3">📖</div>
                        <h3 className="text-lg font-bold text-[#5A6B70] group-hover:text-[#dd8b8b]">
                            Par Leçons
                        </h3>
                        <p className="text-sm text-[#5A6B70]/60 mt-2">
                            {allLessons.filter(l => l.vocabulary?.length > 0).length} leçons disponibles
                        </p>
                    </button>

                    <button
                        onClick={() => setSource('user')}
                        className="bg-white hover:bg-[#F9F7F2] border-2 border-[#dd8b8b]/20 hover:border-[#dd8b8b] rounded-2xl p-8 text-center transition-all group"
                    >
                        <div className="text-4xl mb-3">✏️</div>
                        <h3 className="text-lg font-bold text-[#5A6B70] group-hover:text-[#dd8b8b]">
                            Mon Vocabulaire
                        </h3>
                        <p className="text-sm text-[#5A6B70]/60 mt-2">
                            {userVocab.length} mot{userVocab.length > 1 ? 's' : ''} personnalisé{userVocab.length > 1 ? 's' : ''}
                        </p>
                    </button>
                </div>
            )}

            {/* Step 2: Select Items */}
            {source === 'themes' && (
                <div>
                    <button
                        onClick={() => setSource(null)}
                        className="mb-4 text-[#dd8b8b] hover:text-[#5A6B70] font-bold transition-colors"
                    >
                        ← Retour
                    </button>
                    <h3 className="text-xl font-bold text-[#5A6B70] mb-4">Sélectionnez les thèmes</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                        {themes.map((theme) => {
                            const isSelected = selectedThemes.includes(theme.id);
                            return (
                                <button
                                    key={theme.id}
                                    onClick={() => {
                                        if (isSelected) {
                                            setSelectedThemes(selectedThemes.filter((id) => id !== theme.id));
                                        } else {
                                            setSelectedThemes([...selectedThemes, theme.id]);
                                        }
                                    }}
                                    className={`p-4 rounded-xl border-2 transition-all text-left ${isSelected
                                        ? 'bg-[#dd8b8b] text-white border-[#dd8b8b]'
                                        : 'bg-white text-[#5A6B70] border-[#dd8b8b]/20 hover:border-[#dd8b8b]'
                                        }`}
                                >
                                    <div className="text-2xl mb-1">{theme.icon}</div>
                                    <div className="text-sm font-bold">{theme.title}</div>
                                </button>
                            );
                        })}
                    </div>

                    <label className="flex items-center gap-2 mb-6">
                        <input
                            type="checkbox"
                            checked={includeUserVocab}
                            onChange={(e) => setIncludeUserVocab(e.target.checked)}
                            className="w-4 h-4"
                        />
                        <span className="text-sm text-[#5A6B70]">
                            Inclure mon vocabulaire personnalisé ({userVocab.length} mots)
                        </span>
                    </label>

                    <button
                        onClick={handleStart}
                        disabled={selectedThemes.length === 0}
                        className="flex items-center gap-2 px-8 py-4 bg-[#dd8b8b] text-white rounded-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform shadow-lg"
                    >
                        <Play className="w-5 h-5" />
                        Commencer ({vocabularyItems.filter((item) => selectedThemes.includes(item.themeId)).length + (includeUserVocab ? userVocab.length : 0)} mots)
                    </button>
                </div>
            )}

            {source === 'lessons' && (
                <div>
                    <button
                        onClick={() => setSource(null)}
                        className="mb-4 text-[#dd8b8b] hover:text-[#5A6B70] font-bold transition-colors"
                    >
                        ← Retour
                    </button>
                    <h3 className="text-xl font-bold text-[#5A6B70] mb-4">Sélectionnez les leçons</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 max-h-[60vh] overflow-y-auto pr-2">
                        {allLessons
                            .filter(l => l.vocabulary && l.vocabulary.length > 0)
                            .map((lesson) => {
                                const isSelected = selectedLessons.includes(lesson.id);
                                return (
                                    <button
                                        key={lesson.id}
                                        onClick={() => {
                                            if (isSelected) {
                                                setSelectedLessons(selectedLessons.filter((id) => id !== lesson.id));
                                            } else {
                                                setSelectedLessons([...selectedLessons, lesson.id]);
                                            }
                                        }}
                                        className={`p-4 rounded-xl border-2 transition-all text-left ${isSelected
                                            ? 'bg-[#dd8b8b] text-white border-[#dd8b8b]'
                                            : 'bg-white text-[#5A6B70] border-[#dd8b8b]/20 hover:border-[#dd8b8b]'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className={`text-xs font-bold uppercase ${isSelected ? 'text-white/80' : 'text-[#dd8b8b]'}`}>
                                                    {lesson.level}
                                                </span>
                                                <div className="font-bold line-clamp-2">{lesson.title}</div>
                                            </div>
                                            <span className={`text-xs ml-2 px-2 py-1 rounded-full ${isSelected ? 'bg-white/20' : 'bg-[#F9F7F2] text-[#5A6B70]/60'}`}>
                                                {lesson.vocabulary.length} mots
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                    </div>

                    <button
                        onClick={handleStart}
                        disabled={selectedLessons.length === 0}
                        className="flex items-center gap-2 px-8 py-4 bg-[#dd8b8b] text-white rounded-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform shadow-lg"
                    >
                        <Play className="w-5 h-5" />
                        Commencer ({
                            allLessons
                                .filter(l => selectedLessons.includes(l.id))
                                .reduce((acc, curr) => acc + (curr.vocabulary?.length || 0), 0)
                        } mots)
                    </button>
                </div>
            )}

            {source === 'user' && (
                <div>
                    <button
                        onClick={() => setSource(null)}
                        className="mb-4 text-[#dd8b8b] hover:text-[#5A6B70] font-bold transition-colors"
                    >
                        ← Retour
                    </button>
                    {userVocab.length === 0 ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
                            <p className="text-sm text-yellow-800">
                                Vous n'avez pas encore ajouté de vocabulaire personnalisé. Allez dans l'onglet "Mon Vocabulaire" pour ajouter vos propres mots.
                            </p>
                        </div>
                    ) : (
                        <button
                            onClick={handleStart}
                            className="flex items-center gap-2 px-8 py-4 bg-[#dd8b8b] text-white rounded-2xl font-bold hover:scale-105 transition-transform shadow-lg"
                        >
                            <Play className="w-5 h-5" />
                            Commencer ({userVocab.length} mots)
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default VocabPracticeView;
