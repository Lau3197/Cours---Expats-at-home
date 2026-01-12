import React, { useState, useEffect } from 'react';
import { MessageCircle, Headphones, Globe, ArrowLeft, Star, ChevronRight, Loader2 } from 'lucide-react';
import { Session } from '../types';
import { getSessions } from '../services/sessions';
import SessionCalendar from '../components/SessionCalendar';

type ViewState = 'menu' | 'exchange' | 'listening' | 'culture';

const ProgrammePage: React.FC = () => {
    const [view, setView] = useState<ViewState>('menu');
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const fetchedSessions = await getSessions();
                setSessions(fetchedSessions);
            } catch (error) {
                console.error("Error fetching sessions:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSessions();
    }, []);

    const renderCard = (
        title: string,
        subtitle: string,
        description: string,
        icon: React.ReactNode,
        targetView: ViewState,
        color: string
    ) => (
        <div
            onClick={() => setView(targetView)}
            className="group relative bg-white rounded-[40px] p-8 border border-[#dd8b8b]/10 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col h-full"
        >
            <div className={`absolute top-0 right-0 w-48 h-48 bg-[#F9F7F2] rounded-full -mr-16 -mt-16 group-hover:bg-[${color}]/5 transition-all duration-500`} />

            <div className="relative z-10 flex flex-col h-full">
                <div className={`w-20 h-20 rounded-3xl bg-[${color}]/10 flex items-center justify-center mb-8 text-[${color}] group-hover:scale-110 transition-transform duration-500`}>
                    {icon}
                </div>

                <div className="mb-4">
                    <div className={`text-[10px] font-black uppercase tracking-widest text-[${color}] mb-2`}>
                        {subtitle}
                    </div>
                    <h3 className="text-3xl font-black text-[#5A6B70] serif-display italic leading-tight">
                        {title}
                    </h3>
                </div>

                <p className="text-[#5A6B70]/70 sans-handwritten text-lg leading-relaxed italic mb-8 flex-grow">
                    {description}
                </p>

                <div className="flex justify-end mt-auto">
                    <div className={`w-12 h-12 rounded-full bg-[#F9F7F2] flex items-center justify-center text-[${color}] group-hover:bg-[${color}] group-hover:text-white transition-all`}>
                        <ChevronRight className="w-6 h-6" />
                    </div>
                </div>
            </div>
        </div>
    );

    const renderDetailView = (
        title: string,
        subtitle: string,
        color: string,
        content: React.ReactNode,
        sessionsType?: 'exchange' | 'culture'
    ) => {
        const relevantSessions = sessions.filter(s => s.type === sessionsType);
        const pastSessions = relevantSessions.filter(s => s.status === 'past');

        return (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <button
                    onClick={() => setView('menu')}
                    className="group flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-[#dd8b8b]/10 shadow-sm hover:shadow-md transition-all mb-12 text-[#5A6B70]/60 hover:text-[#dd8b8b]"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold uppercase text-xs tracking-widest">Retour au programme</span>
                </button>

                <div className="bg-white rounded-[60px] p-12 md:p-20 shadow-xl border border-[#dd8b8b]/10 relative overflow-hidden mb-16">
                    <div className={`absolute top-0 right-0 w-96 h-96 bg-[${color}]/5 rounded-full -mr-20 -mt-20 blur-3xl`} />

                    <div className="relative z-10">
                        <div className={`inline-block px-4 py-2 bg-[${color}]/10 text-[${color}] text-[10px] font-black rounded-full uppercase tracking-widest mb-6`}>
                            {subtitle}
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-[#5A6B70] serif-display italic mb-12">
                            {title}
                        </h1>

                        <div className="prose prose-lg max-w-none text-[#5A6B70]/80">
                            {content}
                        </div>
                    </div>
                </div>

                {sessionsType && (
                    <div className="space-y-16">
                        {/* Prochaines Sessions - Calendrier */}
                        <div>
                            <h2 className="text-3xl font-black text-[#5A6B70] serif-display italic mb-8 flex items-center gap-4">
                                Prochaines Sessions
                                <div className={`h-px flex-1 bg-[${color}]/20`} />
                            </h2>
                            {loading ? (
                                <div className="flex justify-center p-12">
                                    <Loader2 className={`w-8 h-8 text-[${color}] animate-spin`} />
                                </div>
                            ) : (
                                <SessionCalendar
                                    sessions={relevantSessions}
                                    type={sessionsType}
                                    color={color}
                                />
                            )}
                        </div>

                        {/* Archives */}
                        <div>
                            <h2 className="text-3xl font-black text-[#5A6B70] serif-display italic mb-8 flex items-center gap-4">
                                Replays & Archives
                                <div className={`h-px flex-1 bg-[${color}]/20`} />
                            </h2>
                            <div className="bg-white rounded-[40px] p-8 border border-[#dd8b8b]/10 shadow-sm">
                                {pastSessions.length > 0 ? (
                                    pastSessions.map((session, idx, arr) => (
                                        <div key={session.id} className={`flex flex-col md:flex-row items-start md:items-center gap-6 p-6 hover:bg-[#F9F7F2] rounded-2xl transition-colors cursor-pointer group ${idx !== arr.length - 1 ? 'border-b border-[#dd8b8b]/10' : ''}`}>
                                            <div className={`w-16 h-16 rounded-2xl bg-[${color}]/10 flex flex-col items-center justify-center text-[${color}] shrink-0`}>
                                                <span className="text-xl font-black">{new Date(session.date).getDate()}</span>
                                                <span className="text-[10px] font-black uppercase">
                                                    {new Date(session.date).toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-lg font-bold text-[#5A6B70] group-hover:text-[${color}] transition-colors mb-1">
                                                    {session.title}
                                                </h4>
                                                <p className="text-sm text-[#5A6B70]/60 line-clamp-1">
                                                    {session.description}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#dd8b8b]/10 text-[#5A6B70]/40 text-xs font-bold uppercase tracking-widest group-hover:bg-white group-hover:text-[${color}] group-hover:border-[${color}]/20 transition-all">
                                                Revoir <ChevronRight className="w-3 h-3" />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-[#5A6B70]/40 italic">
                                        Aucune archive disponible pour le moment.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    if (view === 'exchange') {
        const content = (
            <div className="space-y-8">
                <p className="text-xl leading-relaxed">
                    Forget school. This is your safe place. We discuss specific topics, laugh, and practice. Your only job is to speak—I take all the notes for you. You receive a PDF recap after every class.
                </p>
                <div className="p-8 bg-[#F9F7F2] rounded-3xl border border-[#dd8b8b]/20 my-8">
                    <h3 className="font-bold text-[#dd8b8b] text-lg mb-4 flex items-center gap-2">
                        <Star className="w-5 h-5" /> Result
                    </h3>
                    <p className="italic text-[#5A6B70] text-lg">
                        You gain confidence and the tools to progress.
                    </p>
                </div>
            </div>
        );
        return renderDetailView("The Exchange Keys", "Your Mistakes, Your Victories", "#dd8b8b", content, 'exchange');
    }

    if (view === 'listening') {
        const content = (
            <div className="space-y-8">
                <p className="text-xl leading-relaxed">
                    Understood "Bonjour" then lost? We train with real content: YouTuber videos. It's the French you actually hear on the street. Watch, listen, and decode everyday French through targeted exercises!
                </p>
                <div className="p-8 bg-[#F9F7F2] rounded-3xl border border-[#6A994E]/20 my-8">
                    <h3 className="font-bold text-[#6A994E] text-lg mb-4 flex items-center gap-2">
                        <Star className="w-5 h-5" /> Result
                    </h3>
                    <p className="italic text-[#5A6B70] text-lg">
                        You stop translating and start understanding. You finally feel part of the conversation.
                    </p>
                </div>
                <div className="flex items-center justify-center p-12 border-2 border-dashed border-[#6A994E]/20 rounded-3xl text-[#5A6B70]/40 font-bold uppercase tracking-widest">
                    Contenu des clés de l'écoute à venir
                </div>
            </div>
        );
        return renderDetailView("The Listening Keys", "Stop Smiling Without Knowing Why", "#6A994E", content);
    }

    if (view === 'culture') {
        const content = (
            <div className="space-y-8">
                <p className="text-xl leading-relaxed">
                    Speaking is good; understanding is better. Tired of missing cultural references? Together, we explore real Belgian life: music, holidays, politeness... I explain everything books don't tell you.
                </p>
                <div className="p-8 bg-[#F9F7F2] rounded-3xl border border-[#E8C586]/20 my-8">
                    <h3 className="font-bold text-[#E8C586] text-lg mb-4 flex items-center gap-2">
                        <Star className="w-5 h-5" /> Result
                    </h3>
                    <p className="italic text-[#5A6B70] text-lg">
                        You understand your new country and find your place.
                    </p>
                </div>
            </div>
        );
        return renderDetailView("The Culture Keys", "Understanding More Than Just Words", "#E8C586", content, 'culture');
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center mb-24">
                <div className="inline-flex items-center gap-2 px-5 py-2 bg-[#dd8b8b]/10 text-[#dd8b8b] text-xs font-black rounded-full mb-8 uppercase tracking-[0.3em] sans-geometric border border-[#dd8b8b]/20">
                    <span className="w-2 h-2 rounded-full bg-[#dd8b8b] animate-pulse" /> The Method
                </div>
                <h1 className="text-7xl md:text-8xl font-black text-[#5A6B70] serif-display leading-tight italic tracking-tighter mb-8">
                    Le <span className="text-[#dd8b8b] not-italic">Programme</span>
                </h1>
                <p className="text-[#5A6B70]/70 text-2xl sans-handwritten italic leading-relaxed max-w-3xl mx-auto">
                    Three essential keys to unlock your full potential in French.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {renderCard(
                    "The Exchange Keys",
                    "Your Mistakes, Your Victories",
                    "Does speaking French scare you? Not here! We discuss, we laugh, and we practice. You make mistakes? Great! That's how we learn.",
                    <MessageCircle className="w-10 h-10" />,
                    'exchange',
                    '#dd8b8b'
                )}
                {renderCard(
                    "The Listening Keys",
                    "Stop Smiling Without Knowing Why",
                    "You understood \"Bonjour\" and then... total darkness? We train with real content to decode everyday French.",
                    <Headphones className="w-10 h-10" />,
                    'listening',
                    '#6A994E'
                )}
                {renderCard(
                    "The Culture Keys",
                    "Understanding More Than Just Words",
                    "Speaking is good. Understanding the culture is better! Explore the \"real\" life in Belgium: music, holidays, politeness...",
                    <Globe className="w-10 h-10" />,
                    'culture',
                    '#E8C586'
                )}
            </div>
        </div>
    );
};

export default ProgrammePage;

