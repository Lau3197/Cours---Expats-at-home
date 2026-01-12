import React, { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend
} from 'recharts'; // Reusing recharts which is already installed
import { Loader2, TrendingUp, BookOpen, Clock, Activity } from 'lucide-react';
import { CoursePackage } from '../types';
import { getAnalyticsData, AnalyticsData } from '../services/admin';

interface AnalyticsDashboardProps {
    courses: CoursePackage[];
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ courses }) => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
    const [retentionChartData, setRetentionChartData] = useState<any[]>([]);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const result = await getAnalyticsData();
                setData(result);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        if (data && selectedCourseId && courses.length > 0) {
            // Build Retention Data for Selected Course
            const course = courses.find(c => c.id === selectedCourseId);
            if (course) {
                const chartData = [];
                let lessonCounter = 0;

                // Flatten sections to get linear lesson sequence
                for (const section of course.sections) {
                    for (const lesson of section.lessons) {
                        lessonCounter++;
                        const lessonKey = `${course.id}_${lesson.id}`;
                        const count = data.lessonCompletions[lessonKey] || 0;

                        chartData.push({
                            name: `L${lessonCounter}`, // L1, L2...
                            lessonTitle: lesson.title,
                            users: count
                        });
                    }
                }
                setRetentionChartData(chartData);
            }
        }
    }, [data, selectedCourseId, courses]);

    // Helper to resolve lesson name for Popular list
    const getLessonName = (lessonKey: string) => {
        for (const pkg of courses) {
            if (lessonKey.startsWith(pkg.id)) {
                for (const section of pkg.sections) {
                    const l = section.lessons.find(l => `${pkg.id}_${l.id}` === lessonKey);
                    if (l) return `${l.title} (${pkg.title})`;
                }
            }
        }
        return lessonKey;
    };

    if (loading) {
        return (
            <div className="flex justify-center p-20">
                <Loader2 className="w-10 h-10 text-[#dd8b8b] animate-spin" />
            </div>
        );
    }

    if (!data) return <div>No data available</div>;

    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-[#5A6B70] serif-display italic">Statistiques Globales</h2>
                <p className="text-[#5A6B70]/60 sans-handwritten text-lg">Analysez l'engagement de votre plateforme</p>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[32px] border border-[#dd8b8b]/10 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-[#5A6B70]">{Math.round(data.globalWeeklyActivity.reduce((acc, curr) => acc + curr.hours, 0))}h</div>
                        <div className="text-xs font-bold text-[#5A6B70]/40 uppercase tracking-widest">Temps d'étude (Total)</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-[#dd8b8b]/10 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-50 text-green-500 flex items-center justify-center">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-[#5A6B70]">{Object.values(data.lessonCompletions).reduce((a, b) => a + b, 0)}</div>
                        <div className="text-xs font-bold text-[#5A6B70]/40 uppercase tracking-widest">Leçons Terminées</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-[#dd8b8b]/10 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-black text-[#5A6B70]">
                            {data.globalWeeklyActivity.sort((a, b) => b.hours - a.hours)[0]?.name || 'N/A'}
                        </div>
                        <div className="text-xs font-bold text-[#5A6B70]/40 uppercase tracking-widest">Jour le plus actif</div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Global Activity */}
                <div className="bg-white p-8 rounded-[40px] border border-[#dd8b8b]/10 shadow-sm">
                    <h3 className="text-xl font-bold text-[#5A6B70] mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-[#dd8b8b]" /> Activité Hebdomadaire (Heures)
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.globalWeeklyActivity}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#5A6B70', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#5A6B70', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: '#F9F7F2' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="hours" fill="#E8C586" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Most Popular Lessons */}
                <div className="bg-white p-8 rounded-[40px] border border-[#dd8b8b]/10 shadow-sm">
                    <h3 className="text-xl font-bold text-[#5A6B70] mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-500" /> Leçons les plus populaires
                    </h3>
                    <div className="space-y-4">
                        {data.popularLessons.map((item, idx) => (
                            <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-[#F9F7F2] hover:bg-[#F9F7F2]/80 transition-colors">
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-yellow-400 text-white' : 'bg-white text-[#5A6B70]'}`}>
                                        {idx + 1}
                                    </div>
                                    <div className="truncate font-medium text-[#5A6B70] text-sm">
                                        {getLessonName(item.id)}
                                    </div>
                                </div>
                                <div className="font-black text-[#dd8b8b] text-sm whitespace-nowrap">
                                    {item.count} users
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Retention Chart (Full Width) */}
            <div className="bg-white p-8 rounded-[40px] border border-[#dd8b8b]/10 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h3 className="text-xl font-bold text-[#5A6B70] flex items-center gap-2">
                        📉 Taux de Rétention (Par Cours)
                    </h3>
                    <select
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        className="bg-[#F9F7F2] border-none rounded-xl px-4 py-2 text-[#5A6B70] font-bold focus:ring-[#dd8b8b]"
                    >
                        {courses.map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                    </select>
                </div>

                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={retentionChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#5A6B70', fontSize: 10 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#5A6B70', fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                labelStyle={{ color: '#5A6B70', fontWeight: 'bold' }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="users"
                                name="Apprenants Actifs"
                                stroke="#dd8b8b"
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#dd8b8b', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <p className="text-center text-xs text-[#5A6B70]/40 mt-4 italic">
                    Visualise combien d'élèves terminent la Leçon 1, puis la 2, et ainsi de suite. Une chute brutale indique un décrochage.
                </p>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
