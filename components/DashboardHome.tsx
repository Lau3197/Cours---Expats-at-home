import React, { useState, useEffect } from 'react';
import {
    Users,
    MessageCircle,
    Calendar,
    TrendingUp,
    FileText,

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
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DashboardHomeProps {
    onNavigate: (tab: any) => void;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ onNavigate }) => {
    const [stats, setStats] = useState({
        pendingCorrections: 0,
        nextSession: null as any,
        totalStudents: 0,
        activeStudents: 0,
        weeklyHours: 0,
        recentStudents: [] as any[],
        inactiveCount: 0,
        planDistribution: [] as any[]
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

            // 5. Advanced Metrics
            const recentStudents: any[] = [];
            let inactiveCount = 0;
            const plans: Record<string, number> = { booster: 0, integration: 0, autonomy: 0 };

            const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;

            studentsSnap.forEach(doc => {
                const data = doc.data();
                if (data.role !== 'admin' && data.role !== 'instructor') {
                    // Recent Activity
                    if (data.lastLogin && data.lastLogin !== 'Jamais') {
                        recentStudents.push({
                            name: data.name,
                            avatar: data.avatar,
                            lastLogin: data.lastLogin,
                            plan: data.plan || 'autonomy'
                        });

                        // Inactive check
                        const lastLoginDate = new Date(data.lastLogin);
                        if (now.getTime() - lastLoginDate.getTime() > FIFTEEN_DAYS_MS) {
                            inactiveCount++;
                        }
                    } else {
                        inactiveCount++; // Never logged in is also inactive
                    }

                    // Plan Distribution
                    const plan = data.plan || 'autonomy';
                    if (plans[plan] !== undefined) plans[plan]++;
                    else plans['autonomy']++; // Fallback
                }
            });

            // Sort recent
            recentStudents.sort((a, b) => new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime());

            // Format Plan Data for Chart
            const planData = [
                { name: 'Booster', value: plans.booster, color: '#dd8b8b' },
                { name: 'Intégration', value: plans.integration, color: '#60A5FA' },
                { name: 'Autonomie', value: plans.autonomy, color: '#9CA3AF' },
            ].filter(p => p.value > 0);


            setStats({
                pendingCorrections: pendingCount,
                nextSession: next,
                totalStudents: studentCount,
                activeStudents: Math.round(studentCount * 0.8),
                weeklyHours: Math.round(hours),
                recentStudents: recentStudents.slice(0, 3),
                inactiveCount,
                planDistribution: planData
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
                    className="md:col-span-2 row-span-2 bg-gradient-to-br from-[#dd8b8b] via-[#dd8b8b] to-[#e2a0a0] text-white p-8 rounded-[40px] shadow-xl shadow-[#dd8b8b]/20 cursor-pointer hover:scale-[1.01] hover:shadow-2xl hover:shadow-[#dd8b8b]/30 transition-all relative overflow-hidden group border border-[#dd8b8b]/20"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity mix-blend-overlay">
                        <MessageCircle className="w-48 h-48 transform translate-x-12 -translate-y-12" />
                    </div>

                    {/* Decorative noise/texture overlay */}
                    <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div className="flex justify-between items-start">
                            <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl inline-flex shadow-inner border border-white/10">
                                <MessageCircle className="w-8 h-8 text-white" />
                            </div>
                            {stats.pendingCorrections > 0 && (
                                <span className="bg-white text-[#dd8b8b] font-black px-4 py-2 rounded-full text-xs uppercase tracking-widest shadow-lg animate-pulse">
                                    {stats.pendingCorrections} À Corrigés
                                </span>
                            )}
                        </div>

                        <div>
                            <h3 className="text-5xl font-black mb-3 tracking-tight">{stats.pendingCorrections} <span className="text-white/80 font-thin serif-display italic">Corrections</span></h3>
                            <p className="text-white/90 font-medium text-lg max-w-sm leading-relaxed">
                                {stats.pendingCorrections > 0
                                    ? "Vos élèves progressent ! Prenez un moment pour valider leurs succès."
                                    : "Tout est calme. Profitez-en pour préparer les prochaines leçons."}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 group/btn w-fit">
                            <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full font-bold text-sm uppercase tracking-widest text-white group-hover/btn:bg-white group-hover/btn:text-[#dd8b8b] transition-all flex items-center gap-2">
                                Accéder au Coaching <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. SESSIONS (Medium Tall Card -> Now Expanded to 2 Columns) */}
                <div
                    onClick={() => onNavigate('sessions')}
                    className="md:col-span-2 row-span-2 bg-white p-8 rounded-[40px] border border-[#dd8b8b]/10 shadow-sm cursor-pointer hover:border-[#dd8b8b] transition-all group relative overflow-hidden flex flex-col md:flex-row gap-6"
                >
                    <div className="absolute -bottom-10 -right-10 opacity-[0.03] group-hover:opacity-10 transition-opacity pointer-events-none">
                        <Calendar className="w-64 h-64 text-[#5A6B70]" />
                    </div>

                    {/* Left Side: Header & Icon */}
                    <div className="flex flex-col justify-between items-start md:w-1/3">
                        <div className="bg-[#E8C586]/20 p-4 rounded-2xl text-[#E8C586] mb-4">
                            <Calendar className="w-8 h-8" />
                        </div>
                        <h3 className="text-3xl font-bold text-[#5A6B70] leading-tight">Prochaine<br />Session</h3>
                        <div className="mt-auto pt-4 flex items-center gap-2 text-[#5A6B70]/60 text-sm font-bold uppercase tracking-widest group-hover:text-[#5A6B70] transition-colors">
                            Voir le calendrier <ArrowRight className="w-4 h-4" />
                        </div>
                    </div>

                    {/* Right Side: Session Details */}
                    <div className="md:w-2/3 flex flex-col justify-center relative z-10">
                        {stats.nextSession ? (
                            <div className="bg-[#F9F7F2] p-8 rounded-[32px] h-full flex flex-col justify-center border border-transparent group-hover:border-[#dd8b8b]/10 transition-colors">
                                <div className="flex items-center gap-6 mb-4">
                                    <div className="text-7xl font-thin serif-display italic text-[#5A6B70] leading-none">
                                        {new Date(stats.nextSession.date).getDate()}
                                    </div>
                                    <div className="flex flex-col border-l-2 border-[#dd8b8b]/20 pl-6 py-1">
                                        <div className="text-sm font-black text-[#dd8b8b] uppercase tracking-widest mb-1">
                                            {new Date(stats.nextSession.date).toLocaleDateString('fr-FR', { weekday: 'long' })}
                                        </div>
                                        <div className="text-xl font-medium text-[#5A6B70]/60">
                                            {new Date(stats.nextSession.date).toLocaleDateString('fr-FR', { month: 'long' })}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-[#5A6B70] font-bold bg-white/50 w-fit px-4 py-2 rounded-full mb-6">
                                    <Clock className="w-4 h-4 text-[#dd8b8b]" />
                                    {new Date(stats.nextSession.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </div>

                                <div className="p-5 bg-white rounded-2xl shadow-sm border border-[#5A6B70]/5">
                                    <p className="font-bold text-[#5A6B70] text-lg line-clamp-2 leading-relaxed">{stats.nextSession.title}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-[#F9F7F2] p-6 rounded-[32px] h-full flex flex-col justify-center items-center text-center text-[#5A6B70]/40 italic border-2 border-dashed border-[#5A6B70]/10">
                                <Calendar className="w-12 h-12 mb-4 opacity-10" />
                                <p>Aucune session prévue<br />dans l'immédiat.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. STUDENTS (Small Card) */}
                <div
                    onClick={() => onNavigate('students')}
                    className="bg-[#F0F7FF]/50 p-6 rounded-[32px] border border-transparent hover:border-blue-200 hover:bg-[#F0F7FF] transition-all cursor-pointer group hover:shadow-lg hover:shadow-blue-100/50"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-white p-3 rounded-2xl text-blue-500 shadow-sm group-hover:scale-110 transition-transform">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-4xl font-black text-[#5A6B70] mb-1">{stats.totalStudents}</div>
                    <div className="text-sm font-bold text-[#5A6B70]/40 uppercase tracking-widest">Étudiants</div>
                </div>

                {/* 4. STATS (Small Card) */}
                <div
                    onClick={() => onNavigate('analytics')}
                    className="bg-[#F0FFF4]/50 p-6 rounded-[32px] border border-transparent hover:border-emerald-200 hover:bg-[#F0FFF4] transition-all cursor-pointer group hover:shadow-lg hover:shadow-emerald-100/50"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-white p-3 rounded-2xl text-emerald-500 shadow-sm group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-4xl font-black text-[#5A6B70] mb-1">{stats.weeklyHours}h</div>
                    <div className="text-sm font-bold text-[#5A6B70]/40 uppercase tracking-widest">Activités</div>
                </div>

                {/* 5. LISTENING KEYS (Small Card) */}
                <div
                    onClick={() => onNavigate('listening')}
                    className="bg-[#FFF9F0]/50 p-6 rounded-[32px] border border-transparent hover:border-amber-200 hover:bg-[#FFF9F0] transition-all cursor-pointer flex flex-col justify-center items-center text-center group hover:shadow-lg hover:shadow-amber-100/50"
                >
                    <div className="w-14 h-14 rounded-2xl bg-white mb-4 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform text-2xl">
                        🎧
                    </div>
                    <div className="font-bold text-[#5A6B70] text-lg">Listening Keys</div>
                    <div className="text-xs font-medium text-[#5A6B70]/40 mt-1">Gérer les audios</div>
                </div>

                {/* 6. RESOURCES (Small Card) */}
                <div
                    onClick={() => onNavigate('resources')}
                    className="bg-[#FAF5FF]/50 p-6 rounded-[32px] border border-transparent hover:border-purple-200 hover:bg-[#FAF5FF] transition-all cursor-pointer flex flex-col justify-center items-center text-center group hover:shadow-lg hover:shadow-purple-100/50"
                >
                    <div className="w-14 h-14 rounded-2xl bg-white mb-4 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="font-bold text-[#5A6B70] text-lg">Ressources</div>
                    <div className="text-xs font-medium text-[#5A6B70]/40 mt-1">Bibliothèque</div>
                </div>

                {/* --- NEW ROW: DATA INSIGHTS --- */}

                {/* 7. LIVE ACTIVITY (List) */}
                <div className="md:col-span-2 bg-white p-8 rounded-[40px] border border-[#dd8b8b]/10 shadow-sm flex flex-col">
                    <h3 className="text-xl font-bold text-[#5A6B70] mb-6 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-[#dd8b8b]" /> Activité Récente
                    </h3>
                    <div className="space-y-4">
                        {stats.recentStudents.length > 0 ? (
                            stats.recentStudents.map((student, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-[#F9F7F2] hover:bg-[#F9F7F2]/80 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border border-[#dd8b8b]/10">
                                            {student.avatar ? <img src={student.avatar} className="w-full h-full object-cover" /> : <Users className="w-4 h-4 text-[#dd8b8b]" />}
                                        </div>
                                        <div>
                                            <div className="font-bold text-[#5A6B70] text-sm">{student.name}</div>
                                            <div className="text-xs text-[#5A6B70]/60">
                                                {new Date(student.lastLogin).toLocaleDateString()} à {new Date(student.lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${student.plan === 'booster' ? 'bg-purple-100 text-purple-600' :
                                            student.plan === 'integration' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        {student.plan}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-[#5A6B70]/40 italic py-4">Aucune activité récente.</div>
                        )}
                    </div>
                </div>

                {/* 8. BUSINESS & RETENTION (Metric + Chart) */}
                <div className="md:col-span-2 grid grid-cols-2 gap-6">
                    {/* RISK CARD */}
                    <div className="bg-[#FFF5F5] p-6 rounded-[32px] border border-red-100 flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute -right-6 -top-6 text-red-500/5 rotate-12 group-hover:rotate-0 transition-transform">
                            <AlertCircle className="w-32 h-32" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 text-red-500 font-bold mb-2">
                                <AlertCircle className="w-5 h-5" /> Attention Requise
                            </div>
                            <div className="text-4xl font-black text-[#5A6B70] mb-1">{stats.inactiveCount}</div>
                            <div className="text-xs font-bold text-[#5A6B70]/40 uppercase tracking-widest leading-relaxed">
                                Élèves inactifs<br />(+15 jours)
                            </div>
                        </div>
                        <button onClick={() => onNavigate('students')} className="mt-4 w-full py-2 bg-white rounded-xl text-red-400 font-bold text-sm hover:bg-red-50 transition-colors shadow-sm">
                            Voir la liste
                        </button>
                    </div>

                    {/* PLANS CHART */}
                    <div className="bg-white p-6 rounded-[32px] border border-[#dd8b8b]/10 shadow-sm flex flex-col items-center justify-center relative">
                        <div className="absolute top-6 left-6 text-xs font-bold text-[#5A6B70]/40 uppercase tracking-widest">Répartition</div>
                        <div className="w-full h-32 mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.planDistribution}
                                        innerRadius={25}
                                        outerRadius={40}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {stats.planDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                                        itemStyle={{ color: '#5A6B70', fontWeight: 'bold' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex gap-2 justify-center w-full mt-2">
                            {stats.planDistribution.map((p, i) => (
                                <div key={i} className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></div>
                                    <span className="text-[10px] text-[#5A6B70]/60 font-bold">{Math.round((p.value / stats.totalStudents) * 100)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>



            </div>
        </div>
    );
};

export default DashboardHome;
