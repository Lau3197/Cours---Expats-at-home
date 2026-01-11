import React, { useState, useEffect } from 'react';
import { Calendar, Play, Pause, FileText, Download, ChevronRight, ChevronDown, Home, Heart, Users, Briefcase, Star } from 'lucide-react';
import StyledMarkdown from '../components/StyledMarkdown';

interface Phrase {
    id: number;
    french: string;
    english: string;
    context: string;
}

interface DayContent {
    dayNumber: number;
    title: string;
    phase: string;
    research: string;
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
    const [selectedDay, setSelectedDay] = useState<number>(1);
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
            // Load research.md
            let research = '';
            try {
                const researchRes = await fetch(`${basePath}/research.md`);
                if (researchRes.ok) {
                    research = await researchRes.text();
                }
            } catch (e) {
                console.log('No research.md found');
            }

            // Load phrases.json
            let phrases: Phrase[] = [];
            try {
                const phrasesRes = await fetch(`${basePath}/phrases.json`);
                if (phrasesRes.ok) {
                    phrases = await phrasesRes.json();
                }
            } catch (e) {
                console.log('No phrases.json found');
            }

            // Attempt to list files (we'll use known patterns)
            const images: string[] = [];
            const audios: string[] = [];
            const pdfs: string[] = [];

            // Common image patterns
            for (let i = 1; i <= 10; i++) {
                images.push(`${basePath}/images/graphic_${String(i).padStart(2, '0')}.prompt.png`);
            }
            images.push(`${basePath}/images/${dayFolder}_thumbnail.prompt.png`);

            // Audio files based on phrases
            phrases.forEach((phrase, idx) => {
                const audioFile = `${basePath}/audio/${String(idx + 1).padStart(2, '0')}_${phrase.french.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, '_').substring(0, 30)}.mp3`;
                audios.push(audioFile);
            });

            // Common PDF patterns
            pdfs.push(`${basePath}/pdfs/${dayFolder}_guide.pdf`);
            pdfs.push(`${basePath}/pdfs/commune_checklist.pdf`);

            setDayContent({
                dayNumber: dayNum,
                title: DAY_TITLES[dayNum] || `Day ${dayNum}`,
                phase: getPhaseForDay(dayNum),
                research,
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
        // Stop current audio if playing
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
                                                        onClick={() => setSelectedDay(day)}
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
                        <div className="max-w-4xl mx-auto">
                            {/* Header */}
                            <div className="mb-8">
                                <div
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-4"
                                    style={{
                                        backgroundColor: `${currentPhase?.color}20`,
                                        color: currentPhase?.color,
                                    }}
                                >
                                    {currentPhase && <currentPhase.icon className="w-4 h-4" />}
                                    {dayContent.phase} Phase
                                </div>
                                <h1 className="text-4xl font-black text-[#5A6B70] mb-2">
                                    Day {dayContent.dayNumber}: {dayContent.title}
                                </h1>
                            </div>

                            {/* Thumbnail */}
                            <div className="mb-8 rounded-2xl overflow-hidden shadow-lg">
                                <img
                                    src={`/30jours/day${String(selectedDay).padStart(2, '0')}/images/day${String(selectedDay).padStart(2, '0')}_thumbnail.prompt.png`}
                                    alt={dayContent.title}
                                    className="w-full h-64 object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            </div>

                            {/* French Phrases */}
                            {dayContent.phrases.length > 0 && (
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#dd8b8b]/10 mb-8">
                                    <h2 className="text-xl font-black text-[#5A6B70] uppercase tracking-wider mb-4 flex items-center gap-3">
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
                                                    className="flex items-center gap-4 p-4 bg-[#F9F7F2] rounded-xl"
                                                >
                                                    <button
                                                        onClick={() => playAudio(audioPath)}
                                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isPlaying
                                                                ? 'bg-[#dd8b8b] text-white'
                                                                : 'bg-white text-[#dd8b8b] hover:bg-[#dd8b8b] hover:text-white'
                                                            }`}
                                                    >
                                                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                                                    </button>
                                                    <div>
                                                        <p className="font-bold text-[#5A6B70]">{phrase.french}</p>
                                                        {phrase.english && (
                                                            <p className="text-sm text-[#5A6B70]/60">{phrase.english}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* PDFs */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#dd8b8b]/10 mb-8">
                                <h2 className="text-xl font-black text-[#5A6B70] uppercase tracking-wider mb-4 flex items-center gap-3">
                                    <FileText className="w-5 h-5 text-[#dd8b8b]" />
                                    Resources
                                </h2>
                                <div className="flex flex-wrap gap-3">
                                    <a
                                        href={`/30jours/day${String(selectedDay).padStart(2, '0')}/pdfs/day${String(selectedDay).padStart(2, '0')}_guide.pdf`}
                                        download
                                        className="inline-flex items-center gap-2 px-4 py-3 bg-[#F9F7F2] hover:bg-[#dd8b8b] hover:text-white rounded-xl transition-all font-bold text-[#5A6B70]"
                                    >
                                        <Download className="w-4 h-4" />
                                        Day {selectedDay} Guide (PDF)
                                    </a>
                                </div>
                            </div>

                            {/* Research Content */}
                            {dayContent.research && (
                                <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#dd8b8b]/10">
                                    <h2 className="text-xl font-black text-[#5A6B70] uppercase tracking-wider mb-6">
                                        Research & Details
                                    </h2>
                                    <div className="prose prose-lg max-w-none">
                                        <StyledMarkdown content={dayContent.research} />
                                    </div>
                                </div>
                            )}
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
