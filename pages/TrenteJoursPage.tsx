import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Play, Pause, FileText, Download, ChevronRight, ChevronDown, Home, Heart, Users, Briefcase, Star, CheckSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import StyledMarkdown from '../components/StyledMarkdown';
import FakeVideoPlayer from '../components/FakeVideoPlayer';
import InteractiveChecklist from '../components/InteractiveChecklist';

interface Phrase {
    id: number;
    french: string;
    english: string;
    context: string;
}

interface ChecklistItem {
    id: string;
    label: string;
    description?: string;
}

interface Checklist {
    id: string;
    title: string;
    items: ChecklistItem[];
}

interface DayContent {
    dayNumber: number;
    title: string;
    phase: string;
    content: string; // Main body content
    script: string; // Video script
    checklists: Checklist[];
    phrases: Phrase[];
    images: string[];
    audios: string[];
    pdfs: string[];
}

const PHASES = [
    { id: 'survive', name: 'Survive', icon: Home, days: [1, 2, 3, 4, 5, 6, 7], color: '#dd8b8b' },
    { id: 'thrive', name: 'Thrive', icon: Heart, days: [8, 9, 10, 11, 12, 13, 14], color: '#E8C586' },
    { id: 'connect', name: 'Connect', icon: Users, days: [15, 16, 17, 18, 19, 20, 21], color: '#7BA7A7' },
    { id: 'belong', name: 'Belong', icon: Briefcase, days: [22, 23, 24, 25, 26, 27, 28], color: '#9B8AA6' },
    { id: 'home', name: 'Home', icon: Star, days: [29, 30], color: '#dd8b8b' },
];

const DAY_TITLES: { [key: number]: string } = {
    1: 'Commune Mastery',
    2: 'Banking & Finance Setup',
    3: 'Healthcare Decoded',
    4: 'Housing Secrets',
    5: 'Transport Triumph',
    6: 'Essential French Phrases',
    7: 'Week 1 Integration',
    8: 'Grocery & Food Culture',
    9: 'Making Belgian Friends',
    10: 'Join the Right Communities',
    11: 'Work Culture in Belgium',
    12: 'French for Social Situations',
    13: 'Explore Your Neighborhood',
    14: 'Week 2 Celebration',
    15: 'Belgian Culture Deep Dive',
    16: 'Navigating Belgian Bureaucracy',
    17: 'Belgian Social Calendar',
    18: 'Dating & Relationships',
    19: 'Weekend Getaways',
    20: 'French Confidence Boost',
    21: 'Week 3 Celebration',
    22: 'Creating Your Routine',
    23: 'Dealing with Homesickness',
    24: 'Building Your Inner Circle',
    25: 'Career Growth in Belgium',
    26: 'French for Professional Settings',
    27: 'Giving Back',
    28: 'Your One-Year Vision',
    29: 'Your Brussels Playbook',
    30: 'Celebration & Next Steps',
};

const TrenteJoursPage: React.FC = () => {
    const { dayId } = useParams<{ dayId?: string }>();
    const navigate = useNavigate();

    // Derive selected day from URL, default to 1
    const selectedDay = dayId ? parseInt(dayId, 10) : 1;

    // Validate day range (1-30) and redirect if invalid
    useEffect(() => {
        if (isNaN(selectedDay) || selectedDay < 1 || selectedDay > 30) {
            navigate('/30-days/1', { replace: true });
        }
    }, [selectedDay, navigate]);

    const handleDaySelect = (day: number) => {
        navigate(`/30-days/${day}`);
    };

    const [dayContent, setDayContent] = useState<DayContent | null>(null);
    const [expandedPhases, setExpandedPhases] = useState<string[]>(['survive']);
    const [playingAudio, setPlayingAudio] = useState<string | null>(null);
    const [audioElements, setAudioElements] = useState<{ [key: string]: HTMLAudioElement }>({});
    const [loading, setLoading] = useState(false);

    const getPhaseForDay = (day: number): string => {
        const phase = PHASES.find(p => p.days.includes(day));
        return phase?.name || 'Unknown';
    };

    const loadDayContent = async (dayNum: number) => {
        setLoading(true);
        const dayFolder = `day${String(dayNum).padStart(2, '0')}`;
        const basePath = `/30jours/${dayFolder}`;

        try {
            // Load content.md (Main Body)
            let content = '';
            try {
                const contentRes = await fetch(`${basePath}/content.md`);
                if (contentRes.ok) content = await contentRes.text();
                else {
                    // Fallback to research.md if content.md doesn't exist yet
                    // But maybe strip the metadata headers?
                    const researchRes = await fetch(`${basePath}/research.md`);
                    if (researchRes.ok) content = await researchRes.text();
                }
            } catch (e) {
                console.log('No content found');
            }

            // Load script.md (Video Script)
            let script = '';
            try {
                const scriptRes = await fetch(`${basePath}/script.md`);
                if (scriptRes.ok) script = await scriptRes.text();
            } catch (e) {
                console.log('No script found');
            }

            // Load phrases.json
            let phrases: Phrase[] = [];
            try {
                const phrasesRes = await fetch(`${basePath}/phrases.json`);
                if (phrasesRes.ok) phrases = await phrasesRes.json();
            } catch (e) {
                console.log('No phrases found');
            }

            // Load checklists.json
            let checklists: Checklist[] = [];
            try {
                const checklistsRes = await fetch(`${basePath}/checklists.json`);
                if (checklistsRes.ok) checklists = await checklistsRes.json();
            } catch (e) {
                console.log('No checklists found');
            }

            // Assets
            const images: string[] = [];
            const audios: string[] = [];
            const pdfs: string[] = [];

            // Images
            images.push(`${basePath}/images/${dayFolder}_thumbnail.prompt.png`);

            // Audio
            phrases.forEach((phrase, idx) => {
                const audioFile = `${basePath}/audio/${String(idx + 1).padStart(2, '0')}_${phrase.french.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z\s]/g, '').replace(/\s+/g, '_').substring(0, 30)}.mp3`;
                audios.push(audioFile);
            });

            // PDFs
            // We can try to guess or just list common ones
            pdfs.push(`${basePath}/pdfs/${dayFolder}_guide.pdf`);
            pdfs.push(`${basePath}/pdfs/commune_checklist.pdf`);

            setDayContent({
                dayNumber: dayNum,
                title: DAY_TITLES[dayNum] || `Day ${dayNum}`,
                phase: getPhaseForDay(dayNum),
                content,
                script,
                checklists,
                phrases,
                images,
                audios,
                pdfs,
            });
        } catch (error) {
            console.error('Error loading day content:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDayContent(selectedDay);
    }, [selectedDay]);

    const togglePhase = (phaseId: string) => {
        setExpandedPhases(prev =>
            prev.includes(phaseId)
                ? prev.filter(p => p !== phaseId)
                : [...prev, phaseId]
        );
    };

    const playAudio = async (audioSrc: string) => {
        if (playingAudio && audioElements[playingAudio]) {
            audioElements[playingAudio].pause();
            audioElements[playingAudio].currentTime = 0;
        }

        if (playingAudio === audioSrc) {
            setPlayingAudio(null);
            return;
        }

        let audio = audioElements[audioSrc];
        if (!audio) {
            audio = new Audio(audioSrc);
            audio.onended = () => setPlayingAudio(null);
            audio.onerror = () => {
                console.log('Audio not found:', audioSrc);
                setPlayingAudio(null);
            };
            setAudioElements(prev => ({ ...prev, [audioSrc]: audio }));
        }

        try {
            await audio.play();
            setPlayingAudio(audioSrc);
        } catch (e) {
            console.log('Error playing audio');
        }
    };

    const currentPhase = PHASES.find(p => p.days.includes(selectedDay));

    return (
        <div className="min-h-screen bg-[#F9F7F2]">
            <div className="flex">
                {/* Sidebar */}
                <aside className="w-80 bg-white border-r border-[#dd8b8b]/10 min-h-screen sticky top-24 overflow-y-auto max-h-[calc(100vh-6rem)]">
                    <div className="p-6">
                        <h2 className="text-lg font-black text-[#5A6B70] uppercase tracking-widest mb-6 flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-[#dd8b8b]" />
                            30 Jours
                        </h2>

                        <div className="space-y-2">
                            {PHASES.map(phase => {
                                const PhaseIcon = phase.icon;
                                const isExpanded = expandedPhases.includes(phase.id);

                                return (
                                    <div key={phase.id}>
                                        <button
                                            onClick={() => togglePhase(phase.id)}
                                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#F9F7F2] transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                                                    style={{ backgroundColor: `${phase.color}20` }}
                                                >
                                                    <PhaseIcon className="w-4 h-4" style={{ color: phase.color }} />
                                                </div>
                                                <span className="font-bold text-[#5A6B70] text-sm uppercase tracking-wider">
                                                    {phase.name}
                                                </span>
                                            </div>
                                            {isExpanded ? (
                                                <ChevronDown className="w-4 h-4 text-[#5A6B70]/40" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4 text-[#5A6B70]/40" />
                                            )}
                                        </button>

                                        {isExpanded && (
                                            <div className="ml-4 mt-1 space-y-1">
                                                {phase.days.map(day => (
                                                    <button
                                                        key={day}
                                                        onClick={() => handleDaySelect(day)}
                                                        className={`w-full text-left px-4 py-2.5 rounded-lg transition-all text-sm ${selectedDay === day
                                                            ? 'bg-[#dd8b8b] text-white font-bold'
                                                            : 'hover:bg-[#F9F7F2] text-[#5A6B70]'
                                                            }`}
                                                    >
                                                        <span className="font-bold">Day {day}</span>
                                                        <span className="ml-2 opacity-75">– {DAY_TITLES[day]}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-8">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#dd8b8b]"></div>
                        </div>
                    ) : dayContent ? (
                        <div className="max-w-4xl mx-auto space-y-12">
                            {/* Header */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center"
                            >
                                <div
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-6"
                                    style={{
                                        backgroundColor: `${currentPhase?.color}20`,
                                        color: currentPhase?.color,
                                    }}
                                >
                                    {currentPhase && <currentPhase.icon className="w-4 h-4" />}
                                    {dayContent.phase} Phase
                                </div>
                                <h1 className="text-5xl font-black text-[#5A6B70] mb-4">
                                    {dayContent.title}
                                </h1>
                                <p className="text-xl text-[#5A6B70]/60 font-medium">Day {dayContent.dayNumber}</p>
                            </motion.div>

                            {/* Video Player */}
                            {dayContent.script && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <FakeVideoPlayer
                                        script={dayContent.script}
                                        title={dayContent.title}
                                        poster={dayContent.images[0]}
                                    />
                                </motion.div>
                            )}

                            {/* Main Content Body */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="grid md:grid-cols-3 gap-8"
                            >
                                {/* Left Column: Content */}
                                <div className="md:col-span-2 space-y-8">
                                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#dd8b8b]/10">
                                        <div className="prose prose-lg max-w-none prose-headings:font-black prose-headings:text-[#5A6B70] prose-p:text-[#5A6B70]/80">
                                            <StyledMarkdown content={dayContent.content} />
                                        </div>
                                    </div>

                                    {/* Embedded Checklists */}
                                    {dayContent.checklists.length > 0 && (
                                        <div className="space-y-6">
                                            {dayContent.checklists.map(checklist => (
                                                <InteractiveChecklist
                                                    key={checklist.id}
                                                    title={checklist.title}
                                                    items={checklist.items}
                                                    color={currentPhase?.color}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Right Column: Phrases & Resources */}
                                <div className="space-y-6">
                                    {/* Audio/Phrases */}
                                    {dayContent.phrases.length > 0 && (
                                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#dd8b8b]/10 sticky top-32">
                                            <h2 className="text-lg font-black text-[#5A6B70] uppercase tracking-wider mb-4 flex items-center gap-2">
                                                <Play className="w-5 h-5 text-[#dd8b8b]" />
                                                Phrases du Jour
                                            </h2>
                                            <div className="space-y-3">
                                                {dayContent.phrases.map((phrase, idx) => {
                                                    const audioPath = `/30jours/day${String(selectedDay).padStart(2, '0')}/audio/${String(idx + 1).padStart(2, '0')}_${phrase.french.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z\s]/g, '').replace(/\s+/g, '_').substring(0, 30)}.mp3`;
                                                    const isPlaying = playingAudio === audioPath;

                                                    return (
                                                        <div
                                                            key={phrase.id}
                                                            className="flex items-start gap-3 p-3 bg-[#F9F7F2] rounded-xl group hover:bg-[#dd8b8b]/5 transition-colors"
                                                        >
                                                            <button
                                                                onClick={() => playAudio(audioPath)}
                                                                className={`mt-1 min-w-[2rem] w-8 h-8 rounded-full flex items-center justify-center transition-all ${isPlaying
                                                                    ? 'bg-[#dd8b8b] text-white'
                                                                    : 'bg-white text-[#dd8b8b] border border-[#dd8b8b]/20 hover:bg-[#dd8b8b] hover:text-white'
                                                                    }`}
                                                            >
                                                                {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                                                            </button>
                                                            <div>
                                                                <p className="font-bold text-[#5A6B70] text-sm leading-tight mb-1">{phrase.french}</p>
                                                                {phrase.english && (
                                                                    <p className="text-xs text-[#5A6B70]/60 italic">{phrase.english}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Resources */}
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#dd8b8b]/10">
                                        <h2 className="text-lg font-black text-[#5A6B70] uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-[#dd8b8b]" />
                                            Downloads
                                        </h2>
                                        <div className="space-y-2">
                                            <a
                                                href={`/30jours/day${String(selectedDay).padStart(2, '0')}/pdfs/day${String(selectedDay).padStart(2, '0')}_guide.pdf`}
                                                download
                                                className="flex items-center gap-3 p-3 bg-[#F9F7F2] hover:bg-[#dd8b8b] hover:text-white rounded-xl transition-all group"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-white group-hover:bg-white/20 flex items-center justify-center text-[#dd8b8b] group-hover:text-white transition-colors">
                                                    <Download className="w-4 h-4" />
                                                </div>
                                                <span className="font-bold text-sm">Day Guide (PDF)</span>
                                            </a>
                                            {selectedDay === 1 && (
                                                <a
                                                    href={`/30jours/day01/pdfs/commune_checklist.pdf`}
                                                    download
                                                    className="flex items-center gap-3 p-3 bg-[#F9F7F2] hover:bg-[#dd8b8b] hover:text-white rounded-xl transition-all group"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-white group-hover:bg-white/20 flex items-center justify-center text-[#dd8b8b] group-hover:text-white transition-colors">
                                                        <CheckSquare className="w-4 h-4" />
                                                    </div>
                                                    <span className="font-bold text-sm">Commune Checklist</span>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    ) : (
                        <div className="text-center py-16 text-[#5A6B70]/60">
                            Select a day to view content
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default TrenteJoursPage;
