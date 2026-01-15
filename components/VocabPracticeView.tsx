import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { themes, vocabularyItems } from '../data/vocabularyThemes';
import VocabTrainer from './VocabTrainer';
import { VocabularyItem } from '../types';

type Source = 'themes' | 'lessons' | 'user';

const VocabPracticeView: React.FC = () => {
    const [source, setSource] = useState<Source | null>(null);
    const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
    const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
    const [includeUserVocab, setIncludeUserVocab] = useState(false);
    const [practiceVocab, setPracticeVocab] = useState<VocabularyItem[]>([]);
    const [isStarted, setIsStarted] = useState(false);

    const [userVocab, setUserVocab] = useState<VocabularyItem[]>([]);

    // Load user vocabulary
    useEffect(() => {
        const saved = localStorage.getItem('userVocabulary');
        if (saved) {
            try {
                setUserVocab(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load user vocabulary', e);
            }
        }
    }, []);

    const handleStart = () => {
        let vocab: VocabularyItem[] = [];

        if (source === 'themes' && selectedThemes.length > 0) {
            vocab = vocabularyItems.filter((item) => selectedThemes.includes(item.themeId));
        } else if (source === 'lessons' && selectedLessons.length > 0) {
            vocab = vocabularyItems.filter((item) =>
                item.lessonIds?.some((lid) => selectedLessons.includes(lid))
            );
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
                            Vocabulaire par leçon
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
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                        <p className="text-sm text-blue-800">
                            <strong>Note :</strong> Seule la Leçon 1 est disponible pour l'instant.
                        </p>
                    </div>
                    <div className="mt-6">
                        <button
                            onClick={() => {
                                setSelectedLessons(['a1-1-lecon-01']);
                                handleStart();
                            }}
                            className="flex items-center gap-2 px-8 py-4 bg-[#dd8b8b] text-white rounded-2xl font-bold hover:scale-105 transition-transform shadow-lg"
                        >
                            <Play className="w-5 h-5" />
                            Commencer avec Leçon 1
                        </button>
                    </div>
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
