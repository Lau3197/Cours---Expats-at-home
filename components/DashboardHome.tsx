import React, { useState, useEffect } from 'react';
import {
    Users,
    MessageCircle,
    Calendar,
    TrendingUp,
    FileText,
    Database,
    ArrowRight,
    Search,
    Clock,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import { getAllPendingSubmissions } from '../services/corrections';
import { getSessions } from '../services/sessions';
import { getAnalyticsData } from '../services/admin';
import { collection, getDocs, query, where } from 'firebase/firestore'; // Direct usage for simple count
import { db } from '../services/firebase';

interface DashboardHomeProps {
    onNavigate: (tab: any) => void;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ onNavigate }) => {
    const [stats, setStats] = useState({
        pendingCorrections: 0,
        nextSession: null as any,
        totalStudents: 0,
        activeStudents: 0, // Mock or simple calc
        weeklyHours: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            // Parallelize fetching for speed
            const [pending, sessions, analytics, studentsSnap] = await Promise.all([
                getAllPendingSubmissions(),
                getSessions(),
                getAnalyticsData(),
                getDocs(collection(db, 'users'))
            ]);

            // 1. Pending Corrections
            const pendingCount = pending.length;

            // 2. Next Session
            const now = new Date();
            const upcomingSessions = sessions
                .filter(s => new Date(s.date) > now && s.status !== 'archived')
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            const next = upcomingSessions.length > 0 ? upcomingSessions[0] : null;

            // 3. Students
            // Simple filter for students (assuming role check or just count for now to be fast)
            // Ideally we filter by role but doing it client side for now as per `getAllStudents` pattern
            let studentCount = 0;
            studentsSnap.forEach(doc => {
                const data = doc.data();
                if (data.role !== 'admin' && data.role !== 'instructor') {
                    studentCount++;
                }
            });

            // 4. Weekly Activity
            const hours = analytics.globalWeeklyActivity.reduce((acc, curr) => acc + curr.hours, 0);

            setStats({
                pendingCorrections: pendingCount,
                nextSession: next,
                totalStudents: studentCount,
                activeStudents: Math.round(studentCount * 0.8), // Placeholder logic or derived from analytics
                weeklyHours: Math.round(hours)
            });

        } catch (error) {
            console.error("Error loading dashboard stats:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-48 bg-gray-200 rounded-[32px]"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-12">
                <h2 className="text-3xl font-bold text-[#5A6B70] serif-display italic">Vue d'ensemble</h2>
                <p className="text-[#5A6B70]/60 sans-handwritten text-xl">Voici ce qui se passe sur la plateforme aujourd'hui.</p>
            </div>

            {/* BENTO GRID */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]">

                {/* 1. COACHING (Large Card) */}
                <div
                    onClick={() => onNavigate('coaching')}
                    className="md:col-span-2 row-span-2 bg-[#dd8b8b] text-white p-8 rounded-[40px] shadow-xl shadow-[#dd8b8b]/20 cursor-pointer hover:scale-[1.02] transition-all relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <MessageCircle className="w-48 h-48 transform translate-x-12 -translate-y-12" />
                    </div>

                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="flex justify-between items-start">
                            <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl inline-flex">
                                <MessageCircle className="w-8 h-8 text-white" />
                            </div>
                            {stats.pendingCorrections > 0 && (
                                <span className="bg-white text-[#dd8b8b] font-black px-4 py-2 rounded-full text-sm animate-pulse">
                                    {stats.pendingCorrections} À TRAITER
                                </span>
                            )}
                        </div>

                        <div>
                            <h3 className="text-4xl font-black mb-2">{stats.pendingCorrections} Corrections</h3>
                            <p className="text-white/80 font-medium text-lg max-w-sm">
                                {stats.pendingCorrections > 0
                                    ? "Des élèves attendent votre retour ! Cliquez pour corriger leurs travaux."
                                    : "Tout est à jour. Aucune correction en attente pour le moment."}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 font-black uppercase tracking-widest text-sm text-white/60 group-hover:text-white transition-colors">
                            Accéder au Coaching <ArrowRight className="w-4 h-4" />
                        </div>
                    </div>
                </div>

                {/* 2. SESSIONS (Medium Tall Card) */}
                <div
                    onClick={() => onNavigate('sessions')}
                    className="md:col-span-1 row-span-2 bg-white p-6 rounded-[40px] border border-[#dd8b8b]/10 shadow-sm cursor-pointer hover:border-[#dd8b8b] transition-all group relative overflow-hidden"
                >
                    <div className="absolute -bottom-10 -right-10 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                        <Calendar className="w-64 h-64 text-[#5A6B70]" />
                    </div>

                    <div className="flex flex-col h-full">
                        <div className="bg-[#E8C586]/20 p-3 rounded-2xl w-fit mb-6 text-[#E8C586]">
                            <Calendar className="w-6 h-6" />
                        </div>

                        <h3 className="text-xl font-bold text-[#5A6B70] mb-2">Prochaine Session</h3>

                        {stats.nextSession ? (
                            <div className="mt-auto">
                                <div className="text-sm font-black text-[#dd8b8b] uppercase tracking-widest mb-2">
                                    {new Date(stats.nextSession.date).toLocaleDateString('fr-FR', { weekday: 'long' })}
                                </div>
                                <div className="text-4xl font-black text-[#5A6B70] mb-1">
                                    {new Date(stats.nextSession.date).getDate()}
                                </div>
                                <div className="text-xl font-medium text-[#5A6B70]/60 mb-6">
                                    {new Date(stats.nextSession.date).toLocaleDateString('fr-FR', { month: 'long' })} • {new Date(stats.nextSession.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="p-4 bg-[#F9F7F2] rounded-2xl">
                                    <p className="font-bold text-[#5A6B70] line-clamp-2 text-sm">{stats.nextSession.title}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-auto text-[#5A6B70]/40 italic">
                                Aucune session prévue.
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. STUDENTS (Small Card) */}
                <div
                    onClick={() => onNavigate('students')}
                    className="bg-white p-6 rounded-[32px] border border-[#dd8b8b]/10 shadow-sm cursor-pointer hover:border-[#dd8b8b] transition-all group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-blue-50 p-2.5 rounded-xl text-blue-500">
                            <Users className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-black text-[#5A6B70]/20 group-hover:text-[#5A6B70]/60 transition-colors uppercase tracking-widest">
                            Effectif
                        </span>
                    </div>
                    <div className="text-3xl font-black text-[#5A6B70] mb-1">{stats.totalStudents}</div>
                    <div className="text-sm font-medium text-[#5A6B70]/40">Étudiants inscrits</div>
                </div>

                {/* 4. STATS (Small Card) */}
                <div
                    onClick={() => onNavigate('analytics')}
                    className="bg-white p-6 rounded-[32px] border border-[#dd8b8b]/10 shadow-sm cursor-pointer hover:border-[#dd8b8b] transition-all group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-green-50 p-2.5 rounded-xl text-green-500">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-black text-[#5A6B70]/20 group-hover:text-[#5A6B70]/60 transition-colors uppercase tracking-widest">
                            Activité
                        </span>
                    </div>
                    <div className="text-3xl font-black text-[#5A6B70] mb-1">{stats.weeklyHours}h</div>
                    <div className="text-sm font-medium text-[#5A6B70]/40">Cette semaine</div>
                </div>

                {/* 5. LISTENING KEYS (Small Card) */}
                <div
                    onClick={() => onNavigate('listening')}
                    className="bg-[#F9F7F2] p-6 rounded-[32px] border border-transparent hover:border-[#dd8b8b]/20 transition-all cursor-pointer flex flex-col justify-center items-center text-center group"
                >
                    <div className="w-12 h-12 rounded-full bg-white mb-3 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <span className="text-2xl">🎧</span>
                    </div>
                    <div className="font-bold text-[#5A6B70]">Listening Keys</div>
                </div>

                {/* 6. RESOURCES (Small Card) */}
                <div
                    onClick={() => onNavigate('resources')}
                    className="bg-[#F9F7F2] p-6 rounded-[32px] border border-transparent hover:border-[#dd8b8b]/20 transition-all cursor-pointer flex flex-col justify-center items-center text-center group"
                >
                    <div className="w-12 h-12 rounded-full bg-white mb-3 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6 text-[#5A6B70]" />
                    </div>
                    <div className="font-bold text-[#5A6B70]">Ressources</div>
                </div>

                {/* 7. DATA (Small Card) */}
                <div
                    onClick={() => onNavigate('data')}
                    className="md:col-span-2 bg-gradient-to-r from-[#5A6B70] to-[#4A5B60] p-6 rounded-[32px] shadow-lg cursor-pointer hover:scale-[1.02] transition-all flex items-center justify-between group"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-white/10 p-3 rounded-xl text-white">
                            <Database className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="font-bold text-white text-lg">Données & Cours</div>
                            <div className="text-white/60 text-sm">Gérer le contenu brut</div>
                        </div>
                    </div>
                    <div className="bg-white/10 p-2 rounded-full group-hover:bg-white/20 transition-colors">
                        <ArrowRight className="w-5 h-5 text-white" />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default DashboardHome;
