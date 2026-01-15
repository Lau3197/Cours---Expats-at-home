
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight, CheckCircle, ShieldCheck, ArrowLeft, FolderOpen } from 'lucide-react';
import StyledMarkdown from '../components/StyledMarkdown';

// Helper to format filenames into readable titles
const formatTitle = (filename: string) => {
    // Remove numbers at start (01_, 006_, etc) and extension
    const cleanName = filename.replace(/^\d+[_]*/, '').replace(/\.md$/, '');
    // Replace underscores with spaces
    return cleanName.replace(/_/g, ' ');
};

interface Lesson {
    id: string;
    cleanId: string;
    title: string;
    path: string;
    level: string;
    subLevel: string;
    loadContent: () => Promise<string>;
    content?: string;
}

const GrammairePage: React.FC = () => {
    // URL Params for Deep Linking
    const { level, subLevel, lessonId } = useParams<{ level?: string; subLevel?: string; lessonId?: string }>();
    const navigate = useNavigate();

    // Global loader for all grammar markdown files
    const allModules = import.meta.glob('../Grammaire/*/*/*.md', { query: '?raw', import: 'default' });

    // Parse all available lessons once
    const allLessons = useMemo(() => {
        const lessons: Lesson[] = [];
        for (const path in allModules) {
            // Path format: ../Grammaire/Level/SubLevel/filename.md
            const parts = path.split('/');
            // Expected length check or robust indexing
            if (parts.length >= 5) {
                const lvl = parts[parts.length - 3];
                const sub = parts[parts.length - 2];
                const fileName = parts[parts.length - 1];

                lessons.push({
                    id: fileName, // Original filename as ID (e.g. 01_Le_present.md)
                    cleanId: formatTitle(fileName).replace(/\s+/g, '-').toLowerCase(), // Readable slug
                    title: formatTitle(fileName),
                    path: path,
                    level: lvl,
                    subLevel: sub,
                    loadContent: allModules[path] as () => Promise<string>
                });
            }
        }
        // Sort by level, then sublevel, then filename
        return lessons.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
    }, []);

    // Derived Selection State based on URL
    const selectedLevel = level || null;
    const selectedSubLevel = subLevel || null;

    // Find selected lesson if ID is present
    const [lessonContent, setLessonContent] = useState<string | null>(null);
    const [loadingContent, setLoadingContent] = useState(false);

    const activeLesson = useMemo(() => {
        if (!lessonId || !selectedSubLevel) return null;
        // Try to find by ID or cleanId (slug)
        return allLessons.find(l =>
            l.level === selectedLevel &&
            l.subLevel === selectedSubLevel &&
            (l.id === lessonId || l.cleanId === lessonId || l.id.includes(lessonId))
        ) || null;
    }, [lessonId, selectedLevel, selectedSubLevel, allLessons]);

    // Restore derived lists for UI
    const availableSubLevels = useMemo(() => {
        if (!selectedLevel) return [];
        const levels = new Set<string>();
        allLessons.filter(l => l.level === selectedLevel).forEach(l => levels.add(l.subLevel));
        return Array.from(levels).sort();
    }, [selectedLevel, allLessons]);

    const currentLessons = useMemo(() => {
        if (!selectedLevel || !selectedSubLevel) return [];
        return allLessons.filter(l => l.level === selectedLevel && l.subLevel === selectedSubLevel);
    }, [selectedLevel, selectedSubLevel, allLessons]);

    // Effect to load content when active lesson changes
    useEffect(() => {
        const load = async () => {
            if (activeLesson) {
                setLoadingContent(true);
                try {
                    const content = await activeLesson.loadContent();
                    setLessonContent(content);
                } catch (e) {
                    console.error("Failed to load lesson", e);
                } finally {
                    setLoadingContent(false);
                }
            } else {
                setLessonContent(null);
            }
        };
        load();
    }, [activeLesson]);

    const handleLevelSelect = (lvl: string) => {
        navigate(`/grammaire/${lvl}`);
    };

    const handleSubLevelSelect = (sub: string) => {
        navigate(`/grammaire/${selectedLevel}/${sub}`);
    };

    const handleLessonSelect = (lesson: Lesson) => {
        const slug = lesson.cleanId || lesson.id;
        navigate(`/grammaire/${selectedLevel}/${selectedSubLevel}/${slug}`);
    };

    const handleBackToLevels = () => navigate('/grammaire');
    const handleBackToSubLevels = () => navigate(`/grammaire/${selectedLevel}`);
    const handleBackToLessons = () => navigate(`/grammaire/${selectedLevel}/${selectedSubLevel}`);

    const levels = [
        { id: 'A1', title: 'Niveau A1', description: 'Débutant, Les bases essentielles. Maîtrisez les structures fondamentales pour vos premières conversations.' },
        { id: 'A2', title: 'Niveau A2', description: 'Élémentaire, Consolidation. Renforcez vos acquis et commencez à construire des phrases plus complexes.' },
        { id: 'B1', title: 'Niveau B1', description: 'Intermédiaire, Enrichissement. Exprimez vos opinions et nuances avec des structures avancées.' },
        { id: 'B2', title: 'Niveau B2', description: 'Avancé, Maîtrise et nuances. Atteignez une aisance naturelle et comprenez les subtilités de la langue.' },
    ];

    // ----- VIEW 4: LESSON CONTENT -----
    if (activeLesson && lessonContent) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <button
                    onClick={handleBackToLessons}
                    className="flex items-center text-[#dd8b8b] font-bold mb-8 hover:opacity-80 transition-opacity"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" /> Retour aux leçons
                </button>

                <div className="bg-white rounded-[40px] p-12 border border-[#dd8b8b]/10 shadow-lg">
                    <div className="text-center mb-12">
                        <div className="inline-block px-4 py-1 bg-[#F9F7F2] rounded-full text-[#dd8b8b] text-xs font-black uppercase tracking-widest mb-4">
                            {selectedSubLevel}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-[#5A6B70] serif-display italic mb-6">
                            {activeLesson.title}
                        </h1>
                    </div>

                    <div className="prose prose-lg max-w-none prose-headings:text-[#5A6B70] prose-p:text-[#5A6B70]/80 prose-li:text-[#5A6B70]/80 prose-strong:text-[#5A6B70]">
                        <StyledMarkdown content={lessonContent} />
                    </div>
                </div>
            </div>
        );
    }

    // ----- VIEW 3: LESSON LIST (Inside Sublevel) -----
    if (selectedLevel && selectedSubLevel) {
        return (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="mb-12">
                    <button
                        onClick={handleBackToSubLevels}
                        className="flex items-center text-[#dd8b8b] font-bold mb-4 hover:opacity-80 transition-opacity"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" /> Retour aux modules
                    </button>
                    <h1 className="text-5xl font-black text-[#5A6B70] serif-display italic mb-4">
                        Module <span className="text-[#dd8b8b]">{selectedSubLevel}</span>
                    </h1>
                    <p className="text-[#5A6B70]/60 text-lg">
                        Sélectionnez une leçon de ce module.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentLessons.length > 0 ? currentLessons.map((lesson, idx) => (
                        <div
                            key={lesson.id}
                            onClick={() => handleLessonSelect(lesson)}
                            className="bg-white rounded-[32px] p-8 border border-[#dd8b8b]/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-10 h-10 rounded-xl bg-[#F9F7F2] flex items-center justify-center text-sm font-black text-[#dd8b8b] group-hover:bg-[#dd8b8b] group-hover:text-white transition-all">
                                    {idx + 1}
                                </div>
                                <BookOpen className="w-5 h-5 text-[#dd8b8b]/40 group-hover:text-[#dd8b8b] transition-colors" />
                            </div>

                            <h3 className="text-xl font-bold text-[#5A6B70] group-hover:text-[#dd8b8b] transition-colors mb-2 line-clamp-2">
                                {lesson.title}
                            </h3>

                            <div className="mt-4 pt-4 border-t border-[#dd8b8b]/10 flex items-center justify-between text-xs font-bold text-[#5A6B70]/40 uppercase tracking-wider">
                                <span>Leçon</span>
                                <ChevronRight className="w-4 h-4" />
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-3 text-center py-12 bg-white rounded-[32px] border border-[#dd8b8b]/10">
                            <p className="text-[#5A6B70]/40 font-bold">Aucune leçon disponible pour ce module.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ----- VIEW 2: SUBLEVEL LIST (Inside Level) -----
    if (selectedLevel) {
        return (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="mb-12">
                    <button
                        onClick={handleBackToLevels}
                        className="flex items-center text-[#dd8b8b] font-bold mb-4 hover:opacity-80 transition-opacity"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" /> Retour aux niveaux
                    </button>
                    <h1 className="text-5xl font-black text-[#5A6B70] serif-display italic mb-4">
                        Niveau <span className="text-[#dd8b8b]">{selectedLevel}</span>
                    </h1>
                    <p className="text-[#5A6B70]/60 text-lg">
                        Choisissez un module pour continuer votre apprentissage.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {availableSubLevels.length > 0 ? availableSubLevels.map((subLevel) => (
                        <div
                            key={subLevel}
                            onClick={() => handleSubLevelSelect(subLevel)}
                            className="bg-white rounded-[40px] p-10 border border-[#dd8b8b]/10 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-40 h-40 bg-[#F9F7F2] rounded-full -mr-16 -mt-16 group-hover:bg-[#dd8b8b]/5 transition-all duration-500" />

                            <div className="relative z-10 flex items-center gap-8">
                                <div className="w-24 h-24 rounded-[30px] bg-[#F9F7F2] flex items-center justify-center text-3xl font-black text-[#dd8b8b] group-hover:bg-[#dd8b8b] group-hover:text-white transition-all serif-display italic border border-[#dd8b8b]/5">
                                    {subLevel.replace(selectedLevel + '.', '')}
                                </div>

                                <div>
                                    <div className="inline-block px-3 py-1 bg-[#E8C586]/20 text-[#E8C586] text-[10px] font-black rounded-full uppercase tracking-widest mb-3">
                                        Module
                                    </div>
                                    <h3 className="text-3xl font-bold text-[#5A6B70] serif-display italic group-hover:text-[#dd8b8b] transition-colors">
                                        {subLevel}
                                    </h3>
                                    <div className="mt-2 flex items-center text-[#5A6B70]/40 text-sm font-bold uppercase tracking-wider group-hover:text-[#dd8b8b]/60 transition-colors">
                                        <FolderOpen className="w-4 h-4 mr-2" />
                                        {allLessons.filter(l => l.subLevel === subLevel).length} Leçons
                                    </div>
                                </div>

                                <div className="ml-auto">
                                    <div className="w-12 h-12 rounded-full border-2 border-[#dd8b8b]/10 flex items-center justify-center text-[#dd8b8b] group-hover:border-[#dd8b8b] group-hover:bg-[#dd8b8b] group-hover:text-white transition-all">
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-2 text-center py-20 bg-white rounded-[40px] border border-[#dd8b8b]/10">
                            <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-[#F9F7F2] mb-4">
                                <FolderOpen className="w-8 h-8 text-[#dd8b8b]/40" />
                            </div>
                            <h3 className="text-xl font-bold text-[#5A6B70] mb-2">Bientôt disponible</h3>
                            <p className="text-[#5A6B70]/40">Le contenu pour ce niveau est en cours de création.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ----- VIEW 1: LEVEL LIST -----
    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center mb-24">
                <div className="inline-flex items-center gap-2 px-5 py-2 bg-[#E8C586]/10 text-[#E8C586] text-xs font-black rounded-full mb-8 uppercase tracking-[0.3em] sans-geometric border border-[#E8C586]/20">
                    <span className="w-2 h-2 rounded-full bg-[#E8C586] animate-pulse" /> ExpatsatHome.be
                </div>
                <h1 className="text-7xl md:text-8xl font-black text-[#5A6B70] serif-display leading-tight italic tracking-tighter mb-8">
                    Votre <span className="text-[#dd8b8b] not-italic">Grammaire.</span>
                </h1>
                <p className="text-[#5A6B70]/70 text-2xl sans-handwritten italic leading-relaxed max-w-3xl mx-auto">
                    Explorez nos leçons de grammaire classées par niveau pour renforcer vos compétences linguistiques.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-12">
                {levels.map((level, idx) => (
                    <div
                        key={level.id}
                        onClick={() => handleLevelSelect(level.id)}
                        className="group relative bg-white rounded-[56px] p-10 border border-[#dd8b8b]/10 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-700 cursor-pointer overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F9F7F2] rounded-full -mr-20 -mt-20 group-hover:bg-[#dd8b8b]/5 transition-all duration-700" />

                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                            <div className="w-32 h-32 rounded-[40px] bg-[#F9F7F2] flex items-center justify-center text-5xl font-black text-[#dd8b8b] serif-display italic shadow-inner border border-[#dd8b8b]/5">
                                {level.id}
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-3 mb-2 flex-wrap">
                                    <div className="px-3 py-1 bg-[#E8C586] text-white text-[9px] font-black rounded-full uppercase tracking-widest">
                                        Étape {idx + 1}
                                    </div>
                                </div>
                                <h3 className="text-4xl font-bold text-[#5A6B70] serif-display italic mb-4">{level.title}</h3>

                                <div className="text-[#5A6B70]/70 text-lg leading-relaxed mb-6 max-w-xl">
                                    <p className="sans-handwritten italic text-[#5A6B70]/70 mb-3">{level.description}</p>
                                </div>

                                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                    <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40">
                                        <CheckCircle className="w-3 h-3 text-green-400" /> Leçons interactives
                                    </span>
                                    <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40">
                                        <CheckCircle className="w-3 h-3 text-green-400" /> Exercices pratiques
                                    </span>
                                </div>
                            </div>

                            <div className="w-20 h-20 rounded-[30px] bg-[#F9F7F2] flex items-center justify-center text-[#dd8b8b] group-hover:bg-[#dd8b8b] group-hover:text-white transition-all transform group-hover:rotate-12 shadow-sm">
                                <ChevronRight className="w-10 h-10" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-32 p-16 bg-[#5A6B70] rounded-[60px] text-center text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-full bg-[#dd8b8b]/10 animate-pulse pointer-events-none" />
                <ShieldCheck className="w-16 h-16 mx-auto mb-8 text-[#E8C586]" />
                <h2 className="text-5xl font-bold serif-display italic mb-6">Prêt à maîtriser la grammaire ?</h2>
                <p className="text-xl sans-handwritten italic opacity-80 mb-12 max-w-xl mx-auto">
                    Chaque leçon est conçue pour renforcer votre confiance et votre précision.
                </p>
                <button
                    className="px-12 py-5 bg-[#dd8b8b] text-white rounded-[24px] font-black sans-geometric uppercase tracking-[0.3em] hover:scale-105 transition-all shadow-xl shadow-black/20"
                >
                    Commencer l'apprentissage
                </button>
            </div>
        </div>
    );
};

export default GrammairePage;
