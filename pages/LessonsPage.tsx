
import React, { useState, useMemo } from 'react';
import { BookOpen, ChevronRight, ArrowLeft, FolderOpen, GraduationCap } from 'lucide-react';
import StyledMarkdown from '../components/StyledMarkdown';

// Helper to format filenames into readable titles
const formatTitle = (filename: string) => {
    // Remove "Lecon_XX_" prefix and extension
    const cleanName = filename
        .replace(/^Lecon_\d+_/, '')
        .replace(/_NEW_STRUCTURE|_OLD/g, '')
        .replace(/\.md$/, '');
    // Replace underscores with spaces
    return cleanName.replace(/_/g, ' ');
};

interface Lesson {
    id: string;
    title: string;
    path: string;
    subLevel: string;
    loadContent: () => Promise<string>;
    content?: string;
}

const LessonsPage: React.FC = () => {
    const [selectedSubLevel, setSelectedSubLevel] = useState<string | null>(null);
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(false);

    // Global loader for all lesson files across all levels (A1, A2, B1)
    // We look for the main lesson file in each Lecon_XX folder
    const a1Modules = import.meta.glob('../Niveau_A1/**/Lecon_*/*.md', { query: '?raw', import: 'default' });
    const a2Modules = import.meta.glob('../Niveau_A2/**/Lecon_*/*.md', { query: '?raw', import: 'default' });
    const b1Modules = import.meta.glob('../Niveau_B1/**/Lecon_*/*.md', { query: '?raw', import: 'default' });

    // Combine all modules
    const allModules = { ...a1Modules, ...a2Modules, ...b1Modules };

    // Parse all available lessons
    const allLessons = useMemo(() => {
        const lessons: Lesson[] = [];
        for (const path in allModules) {
            // Skip OLD versions
            if (path.includes('_OLD')) continue;
            // Prefer NEW_STRUCTURE if available, otherwise take the main file
            if (path.includes('_NEW_STRUCTURE') || !path.includes('_NEW_STRUCTURE')) {
                // Path format: ../Niveau_XX/XX.X/Lecon_XX/filename.md
                const parts = path.split('/');
                // Find sub-level (A1.1, A1.2, A2.1, A2.2, B1.1, B1.2)
                const subLevel = parts.find(p => /^[AB]\d\.\d$/.test(p)) || '';
                const fileName = parts[parts.length - 1];

                // Skip if we already have a NEW_STRUCTURE version
                const existingIdx = lessons.findIndex(l =>
                    l.subLevel === subLevel &&
                    l.id.replace('_NEW_STRUCTURE', '') === fileName.replace('_NEW_STRUCTURE', '')
                );

                if (path.includes('_NEW_STRUCTURE')) {
                    // Replace with NEW_STRUCTURE version
                    if (existingIdx >= 0) {
                        lessons[existingIdx] = {
                            id: fileName,
                            title: formatTitle(fileName),
                            path: path,
                            subLevel: subLevel,
                            loadContent: allModules[path] as () => Promise<string>
                        };
                    } else {
                        lessons.push({
                            id: fileName,
                            title: formatTitle(fileName),
                            path: path,
                            subLevel: subLevel,
                            loadContent: allModules[path] as () => Promise<string>
                        });
                    }
                } else if (existingIdx < 0) {
                    // Only add if no NEW_STRUCTURE version exists
                    lessons.push({
                        id: fileName,
                        title: formatTitle(fileName),
                        path: path,
                        subLevel: subLevel,
                        loadContent: allModules[path] as () => Promise<string>
                    });
                }
            }
        }
        return lessons.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
    }, []);

    // Get available sub-levels
    const availableSubLevels = useMemo(() => {
        const levels = new Set<string>();
        allLessons.forEach(l => levels.add(l.subLevel));
        return Array.from(levels).sort();
    }, [allLessons]);

    // Get lessons for the selected sub-level
    const currentLessons = useMemo(() => {
        if (!selectedSubLevel) return [];
        return allLessons.filter(l => l.subLevel === selectedSubLevel);
    }, [selectedSubLevel, allLessons]);

    const handleLessonSelect = async (lesson: Lesson) => {
        setLoading(true);
        try {
            if (!lesson.content) {
                const content = await lesson.loadContent();
                setSelectedLesson({ ...lesson, content });
            } else {
                setSelectedLesson(lesson);
            }
        } catch (error) {
            console.error("Error loading lesson content", error);
        } finally {
            setLoading(false);
        }
    };

    // ----- VIEW 3: LESSON CONTENT -----
    if (selectedLesson && selectedLesson.content) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <button
                    onClick={() => setSelectedLesson(null)}
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
                            {selectedLesson.title}
                        </h1>
                    </div>

                    <div className="prose prose-lg max-w-none prose-headings:text-[#5A6B70] prose-p:text-[#5A6B70]/80 prose-li:text-[#5A6B70]/80 prose-strong:text-[#5A6B70]">
                        <StyledMarkdown content={selectedLesson.content} />
                    </div>
                </div>
            </div>
        );
    }

    // ----- VIEW 2: LESSON LIST -----
    if (selectedSubLevel) {
        return (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="mb-12">
                    <button
                        onClick={() => setSelectedSubLevel(null)}
                        className="flex items-center text-[#dd8b8b] font-bold mb-4 hover:opacity-80 transition-opacity"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" /> Retour aux modules
                    </button>
                    <h1 className="text-5xl font-black text-[#5A6B70] serif-display italic mb-4">
                        Module <span className="text-[#dd8b8b]">{selectedSubLevel}</span>
                    </h1>
                    <p className="text-[#5A6B70]/60 text-lg">
                        {currentLessons.length} leçons disponibles
                    </p>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-[#5A6B70]/40 font-bold animate-pulse">Chargement...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {currentLessons.map((lesson, idx) => (
                            <div
                                key={lesson.id}
                                onClick={() => handleLessonSelect(lesson)}
                                className="bg-white rounded-[32px] p-8 border border-[#dd8b8b]/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-[#F9F7F2] flex items-center justify-center text-lg font-black text-[#dd8b8b] group-hover:bg-[#dd8b8b] group-hover:text-white transition-all">
                                        {idx + 1}
                                    </div>
                                    <BookOpen className="w-5 h-5 text-[#dd8b8b]/40 group-hover:text-[#dd8b8b] transition-colors" />
                                </div>

                                <h3 className="text-xl font-bold text-[#5A6B70] group-hover:text-[#dd8b8b] transition-colors mb-2">
                                    {lesson.title}
                                </h3>

                                <div className="mt-4 pt-4 border-t border-[#dd8b8b]/10 flex items-center justify-between text-xs font-bold text-[#5A6B70]/40 uppercase tracking-wider">
                                    <span>Leçon complète</span>
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // ----- VIEW 1: SUBLEVEL LIST -----
    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center mb-24">
                <div className="inline-flex items-center gap-2 px-5 py-2 bg-[#E8C586]/10 text-[#E8C586] text-xs font-black rounded-full mb-8 uppercase tracking-[0.3em] sans-geometric border border-[#E8C586]/20">
                    <span className="w-2 h-2 rounded-full bg-[#E8C586] animate-pulse" /> ExpatsatHome.be
                </div>
                <h1 className="text-7xl md:text-8xl font-black text-[#5A6B70] serif-display leading-tight italic tracking-tighter mb-8">
                    Vos <span className="text-[#dd8b8b] not-italic">Leçons.</span>
                </h1>
                <p className="text-[#5A6B70]/70 text-2xl sans-handwritten italic leading-relaxed max-w-3xl mx-auto">
                    Des cours complets pour maîtriser le français, adaptés aux expatriés en Belgique.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {availableSubLevels.map((subLevel) => (
                    <div
                        key={subLevel}
                        onClick={() => setSelectedSubLevel(subLevel)}
                        className="bg-white rounded-[40px] p-10 border border-[#dd8b8b]/10 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-40 h-40 bg-[#F9F7F2] rounded-full -mr-16 -mt-16 group-hover:bg-[#dd8b8b]/5 transition-all duration-500" />

                        <div className="relative z-10 flex items-center gap-8">
                            <div className="w-24 h-24 rounded-[30px] bg-[#F9F7F2] flex items-center justify-center text-3xl font-black text-[#dd8b8b] group-hover:bg-[#dd8b8b] group-hover:text-white transition-all serif-display italic border border-[#dd8b8b]/5">
                                <GraduationCap className="w-10 h-10" />
                            </div>

                            <div>
                                <div className="inline-block px-3 py-1 bg-[#E8C586]/20 text-[#E8C586] text-[10px] font-black rounded-full uppercase tracking-widest mb-3">
                                    Niveau {subLevel.substring(0, 2)}
                                </div>
                                <h3 className="text-3xl font-bold text-[#5A6B70] serif-display italic group-hover:text-[#dd8b8b] transition-colors">
                                    Module {subLevel}
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
                ))}
            </div>

            {availableSubLevels.length === 0 && (
                <div className="text-center py-20 bg-white rounded-[40px] border border-[#dd8b8b]/10">
                    <div className="inline-flex justify-center items-center w-16 h-16 rounded-full bg-[#F9F7F2] mb-4">
                        <FolderOpen className="w-8 h-8 text-[#dd8b8b]/40" />
                    </div>
                    <h3 className="text-xl font-bold text-[#5A6B70] mb-2">Bientôt disponible</h3>
                    <p className="text-[#5A6B70]/40">Les leçons sont en cours de création.</p>
                </div>
            )}
        </div>
    );
};

export default LessonsPage;
