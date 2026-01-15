import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Volume2, ArrowLeft, Layers, Grid, Sparkles, Search, BookOpen, GraduationCap } from 'lucide-react';
import { Theme, VocabularyItem, FrenchLevel } from '../types';
import { themes, vocabularyItems } from '../data/vocabularyThemes';

type ViewMode = 'list' | 'trainer';

const LEVEL_OPTIONS: FrenchLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

const VocabularyTrainer: React.FC = () => {
    // URL Params for Deep Linking
    const { themeId } = useParams<{ themeId?: string }>();
    const navigate = useNavigate();

    // Derived State from URL
    const selectedTheme = useMemo(() =>
        themes.find(t => t.id === themeId) || null,
        [themeId]);

    // Local State
    const [viewMode, setViewMode] = useState<ViewMode>('list');

    // Filter State
    const [selectedSubTheme, setSelectedSubTheme] = useState<string>('all');
    const [selectedLevel, setSelectedLevel] = useState<FrenchLevel | 'all'>('all');

    // Trainer State
    const [trainerQueue, setTrainerQueue] = useState<VocabularyItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [sessionStats, setSessionStats] = useState({ known: 0, review: 0 });
    const [isFinished, setIsFinished] = useState(false);

    // --- Derived Data ---

    // Filter words based on current selection
    const filteredWords = useMemo(() => {
        if (!selectedTheme) return [];
        return vocabularyItems.filter(word => {
            // 1. Must match theme
            if (word.themeId !== selectedTheme.id) return false;
            // 2. Filter by Subtheme
            if (selectedSubTheme !== 'all' && word.subTheme !== selectedSubTheme) return false;
            // 3. Filter by Level
            if (selectedLevel !== 'all' && word.level !== selectedLevel) return false;
            return true;
        });
    }, [selectedTheme, selectedSubTheme, selectedLevel]);

    // Reset filters when entering a theme or switching themes
    useEffect(() => {
        setSelectedSubTheme('all');
        setSelectedLevel('all');
        setViewMode('list');
        // Reset trainer state
        setTrainerQueue([]);
        setCurrentIndex(0);
        setIsFlipped(false);
        setIsFinished(false);
    }, [selectedTheme?.id]); // Only trigger when ID changes

    // Initialize Trainer when switching to trainer mode
    useEffect(() => {
        if (viewMode === 'trainer') {
            startTrainerSession();
        }
    }, [viewMode, filteredWords]);

    const startTrainerSession = () => {
        const shuffled = [...filteredWords].sort(() => Math.random() - 0.5);
        setTrainerQueue(shuffled);
        setCurrentIndex(0);
        setIsFlipped(false);
        setSessionStats({ known: 0, review: 0 });
        setIsFinished(false);
    };

    // --- Actions ---

    const handleThemeSelect = (theme: Theme) => {
        navigate(`/vocabulary/themes/${theme.id}`);
    };

    const handleBackToThemes = () => {
        navigate('/vocabulary/themes');
    };

    const speak = useCallback((text: string) => {
        if (!text) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    }, []);

    const handleMastery = (isKnown: boolean) => {
        if (trainerQueue.length === 0) return;

        setIsFlipped(false);

        if (isKnown) {
            setSessionStats(prev => ({ ...prev, known: prev.known + 1 }));
            // Remove from queue
            const newQueue = [...trainerQueue];
            newQueue.splice(currentIndex, 1);

            if (newQueue.length === 0) {
                setIsFinished(true);
            } else {
                setTrainerQueue(newQueue);
                // Index stays same as array shrinks, unless we were at the end
                setCurrentIndex(prev => prev >= newQueue.length ? 0 : prev);
            }
        } else {
            setSessionStats(prev => ({ ...prev, review: prev.review + 1 }));
            // Move to back of queue
            const newQueue = [...trainerQueue];
            const item = newQueue.splice(currentIndex, 1)[0];
            newQueue.push(item);
            setTrainerQueue(newQueue);
        }
    };

    // --- Components ---

    const ThemeCard = ({ theme }: { theme: Theme }) => (
        <div
            onClick={() => handleThemeSelect(theme)}
            className="group bg-white rounded-[20px] p-6 cursor-pointer border border-gray-100 hover:border-[#dd8b8b]/30 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col items-start text-left relative overflow-hidden"
        >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 transform origin-left">
                {theme.icon}
            </div>

            <h3 className="text-xl font-bold text-[#4A5568] mb-2 group-hover:text-[#dd8b8b] transition-colors font-sans">
                {theme.title}
            </h3>

            <p className="text-[#A0AEC0] text-sm leading-relaxed font-medium">
                {theme.description}
            </p>
        </div>
    );

    const WordCard = ({ word }: { word: VocabularyItem }) => {
        const [isFlipped, setIsFlipped] = useState(false);

        // Visual indicator color for level
        const levelColors: Record<string, string> = {
            'A1': 'bg-emerald-100 text-emerald-600',
            'A2': 'bg-blue-100 text-blue-600',
            'B1': 'bg-yellow-100 text-yellow-600',
            'B2': 'bg-orange-100 text-orange-600',
            'C1': 'bg-red-100 text-red-600',
        };

        return (
            <div
                className="group relative h-[400px] w-full cursor-pointer perspective-1000"
                onClick={() => setIsFlipped(!isFlipped)}
            >
                <div className={`relative h-full w-full transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
                    style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>

                    {/* FRONT */}
                    <div className="absolute inset-0 h-full w-full bg-white rounded-[24px] border border-orange-200 shadow-sm p-6 flex flex-col items-center justify-between backface-hidden">
                        <div className="w-full flex justify-between items-start">
                            <span className="text-[10px] uppercase font-bold text-[#C87A7A] tracking-widest">{word.subTheme}</span>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${levelColors[word.level] || 'bg-gray-100'}`}>
                                {word.level}
                            </span>
                        </div>

                        <div className="text-center mt-4">
                            <h4 className="text-3xl font-bold text-[#5A6B70] mb-2 font-sans">{word.french}</h4>
                            <p className="text-[#5A6B70]/40 text-xs italic">
                                Pl: {word.plural || 'n/a'}
                            </p>
                            <button
                                onClick={(e) => { e.stopPropagation(); speak(word.french); }}
                                className="mt-4 p-2 rounded-full bg-[#F9F7F2] text-[#C87A7A] hover:bg-[#C87A7A] hover:text-white transition-colors"
                            >
                                <Volume2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="w-full mt-6">
                            <div className="bg-[#FFF8F0] rounded-xl p-4 text-center border border-orange-100">
                                <span className="block text-[9px] uppercase font-bold text-[#C87A7A]/60 mb-1 tracking-widest">Exemple</span>
                                <p className="text-[#5A6B70] text-sm italic">"{word.example}"</p>
                            </div>
                        </div>

                        <div className="mt-4 text-[9px] font-bold text-[#5A6B70]/20 uppercase tracking-widest">
                            Cliquez pour voir la traduction
                        </div>
                    </div>

                    {/* BACK */}
                    <div className="absolute inset-0 h-full w-full bg-white rounded-[24px] border border-orange-200 shadow-xl p-6 flex flex-col items-center justify-center backface-hidden rotate-y-180"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                        <div className="text-center">
                            <span className="text-[10px] uppercase font-bold text-[#C87A7A] tracking-widest mb-2 block">Traduction</span>
                            <h4 className="text-3xl font-bold text-[#5A6B70] mb-4 font-sans">{word.english}</h4>
                            <div className="w-12 h-1 bg-[#C87A7A]/20 rounded-full mx-auto"></div>
                        </div>
                        <div className="absolute bottom-6 text-[9px] font-bold text-[#5A6B70]/20 uppercase tracking-widest">
                            Cliquez pour retourner
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // --- Views ---

    if (!selectedTheme) {
        // 1. HOME SCREEN: THEME SELECTOR
        return (
            <div className="min-h-screen bg-[#F9F7F2] p-8 md:p-12">
                <div className="max-w-7xl mx-auto">
                    <header className="mb-12">
                        <h1 className="text-4xl font-extrabold text-[#4A5568] mb-3 tracking-tight">Entraîneur de Vocabulaire</h1>
                        <p className="text-[#A0AEC0] text-lg font-medium">Choisissez un thème pour commencer votre apprentissage immédiat.</p>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {themes.map(theme => (
                            <ThemeCard key={theme.id} theme={theme} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // 2. THEME SCREEN

    const totalThemeWords = vocabularyItems.filter(w => w.themeId === selectedTheme.id).length;
    const getSubThemeCount = (sub: string) => vocabularyItems.filter(w => w.themeId === selectedTheme.id && w.subTheme === sub).length;

    return (
        <div className="min-h-screen bg-[#F9F7F2]">
            {/* Sticky Header */}
            <div className="bg-[#F9F7F2] sticky top-0 z-30 pt-8 pb-6 border-b border-[#dd8b8b]/10 bg-opacity-95 backdrop-blur-sm shadow-sm transition-all">
                <div className="max-w-7xl mx-auto px-6">
                    {/* Top Row: Back, Title, Level Selector */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleBackToThemes}
                                className="p-2 -ml-2 hover:bg-[#dd8b8b]/10 rounded-full transition-colors text-[#5A6B70]"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <div className="flex items-center gap-3">
                                <span className="text-4xl">{selectedTheme.icon}</span>
                                <h2 className="text-4xl font-extrabold text-[#4A5568] tracking-tight">{selectedTheme.title}</h2>
                            </div>
                        </div>

                        {/* Level Pills */}
                        <div className="bg-white rounded-full p-1.5 flex shadow-sm border border-gray-100">
                            <button
                                onClick={() => setSelectedLevel('all')}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${selectedLevel === 'all' ? 'bg-[#E53E3E] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                All
                            </button>
                            {LEVEL_OPTIONS.map(lvl => (
                                <button
                                    key={lvl}
                                    onClick={() => setSelectedLevel(lvl)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${selectedLevel === lvl ? 'bg-[#E53E3E] text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    {lvl}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => setSelectedSubTheme('all')}
                            className={`px-5 py-2 rounded-full text-sm font-bold border transition-all ${selectedSubTheme === 'all'
                                ? 'bg-[#2D3748] text-white border-[#2D3748]'
                                : 'bg-white text-[#4A5568] border-orange-200 hover:border-orange-300'
                                }`}
                        >
                            Tout ({totalThemeWords})
                        </button>
                        {selectedTheme.subThemes.map(sub => (
                            <button
                                key={sub}
                                onClick={() => setSelectedSubTheme(sub)}
                                className={`px-5 py-2 rounded-full text-sm font-bold border transition-all ${selectedSubTheme === sub
                                    ? 'bg-[#2D3748] text-white border-[#2D3748]'
                                    : 'bg-white text-[#4A5568] border-orange-200 hover:border-orange-300'
                                    }`}
                            >
                                {sub} <span className="opacity-60 ml-1">({getSubThemeCount(sub)})</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* View Toggle (Floating or integrated) */}
                <div className="absolute right-6 bottom-6 hidden md:flex bg-white rounded-xl p-1 shadow-sm border border-gray-100">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-gray-100 text-[#2D3748]' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Grid className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('trainer')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'trainer' ? 'bg-gray-100 text-[#2D3748]' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Layers className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-7xl mx-auto p-6 md:p-8 mt-8">
                {viewMode === 'list' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {filteredWords.length > 0 ? (
                            filteredWords.map(word => <WordCard key={word.id} word={word} />)
                        ) : (
                            <div className="col-span-full py-20 text-center">
                                <Search className="w-12 h-12 text-[#5A6B70]/20 mx-auto mb-4" />
                                <p className="text-[#5A6B70]/40 font-serif italic text-lg">Aucun mot ne correspond à vos filtres.</p>
                            </div>
                        )}
                    </div>
                )}

                {viewMode === 'trainer' && (
                    <div className="max-w-2xl mx-auto animate-in zoom-in-95 duration-500">
                        {isFinished ? (
                            <div className="bg-white rounded-[40px] p-12 text-center shadow-xl border border-[#dd8b8b]/10">
                                <Sparkles className="w-16 h-16 text-[#E8C586] mx-auto mb-6 animate-pulse" />
                                <h3 className="text-3xl font-bold text-[#5A6B70] font-sans italic mb-2">Session Terminée !</h3>
                                <p className="text-[#5A6B70]/60 mb-8">Vous avez revu tous les mots de cette liste.</p>

                                <div className="flex justify-center gap-12 mb-10">
                                    <div>
                                        <div className="text-4xl font-bold text-green-500 mb-1">{sessionStats.known}</div>
                                        <div className="text-[10px] uppercase tracking-widest text-[#5A6B70]/40 font-bold">Connus</div>
                                    </div>
                                    <div>
                                        <div className="text-4xl font-bold text-orange-400 mb-1">{sessionStats.review}</div>
                                        <div className="text-[10px] uppercase tracking-widest text-[#5A6B70]/40 font-bold">À revoir</div>
                                    </div>
                                </div>

                                <button
                                    onClick={startTrainerSession}
                                    className="bg-[#dd8b8b] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-lg shadow-[#dd8b8b]/20"
                                >
                                    Recommencer
                                </button>
                            </div>
                        ) : trainerQueue.length > 0 ? (
                            <div className="relative perspective-1000">
                                <div className="mb-6 flex justify-between items-center text-xs font-bold text-[#5A6B70]/40 uppercase tracking-widest">
                                    <span>{currentIndex + 1} / {filteredWords.length}</span>
                                    <span>{trainerQueue.length} restants</span>
                                </div>

                                {/* Flashcard */}
                                <div
                                    onClick={() => setIsFlipped(!isFlipped)}
                                    className={`relative w-full aspect-[4/3] cursor-pointer transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
                                    style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                                >
                                    {/* Front */}
                                    <div className="absolute inset-0 bg-white rounded-[40px] shadow-2xl border border-[#dd8b8b]/10 p-8 flex flex-col items-center justify-center backface-hidden">
                                        <span className="absolute top-8 right-8 text-[10px] font-black bg-[#F9F7F2] px-3 py-1 rounded-full text-[#5A6B70]/40">
                                            FRANÇAIS
                                        </span>
                                        <div className="text-center">
                                            <h3 className="text-5xl font-bold text-[#5A6B70] mb-4 font-sans italic">{trainerQueue[currentIndex].french}</h3>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); speak(trainerQueue[currentIndex].french); }}
                                                className="inline-flex p-3 rounded-full bg-[#F9F7F2] text-[#dd8b8b] hover:bg-[#dd8b8b] hover:text-white transition-colors"
                                            >
                                                <Volume2 className="w-6 h-6" />
                                            </button>
                                        </div>
                                        <div className="absolute bottom-8 text-[10px] font-bold text-[#5A6B70]/20 uppercase tracking-widest">
                                            Cliquer pour retourner
                                        </div>
                                    </div>

                                    {/* Back */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#dd8b8b] to-[#c07272] rounded-[40px] shadow-2xl p-8 flex flex-col items-center justify-center backface-hidden rotate-y-180"
                                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                                        <span className="absolute top-8 right-8 text-[10px] font-black bg-white/20 px-3 py-1 rounded-full text-white">
                                            ENGLISH
                                        </span>
                                        <div className="text-center text-white">
                                            <h3 className="text-4xl font-bold mb-4 font-sans italic">{trainerQueue[currentIndex].english}</h3>
                                            <p className="text-white/80 italic text-lg opacity-90">"{trainerQueue[currentIndex].example}"</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="grid grid-cols-2 gap-4 mt-8">
                                    <button
                                        onClick={() => handleMastery(false)}
                                        className="bg-white p-4 rounded-2xl text-orange-400 font-bold uppercase text-xs tracking-widest border border-orange-100 hover:bg-orange-50 transition-colors shadow-sm"
                                    >
                                        À Revoir
                                    </button>
                                    <button
                                        onClick={() => handleMastery(true)}
                                        className="bg-white p-4 rounded-2xl text-green-500 font-bold uppercase text-xs tracking-widest border border-green-100 hover:bg-green-50 transition-colors shadow-sm"
                                    >
                                        Je Sais
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center p-12">
                                <p className="text-[#5A6B70]/40 italic">Aucun mot à réviser.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VocabularyTrainer;
