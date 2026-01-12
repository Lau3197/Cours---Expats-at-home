
import React, { useEffect, useState } from 'react';
import {
  Trophy,
  GraduationCap,
  Clock,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Star,
  Loader2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { CoursePackage } from '../types';

interface UserProgress {
  completedLessons: string[];
  courseProgress: { [courseId: string]: { completed: number; total: number } };
  learningHours: number;
  lastActivity: any;
  weeklyActivity: { [day: string]: number };
}

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [totalProgress, setTotalProgress] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [learningHours, setLearningHours] = useState(0);
  const [courses, setCourses] = useState<CoursePackage[]>([]);
  const [chartData, setChartData] = useState([
    { name: 'Mon', hours: 0 },
    { name: 'Tue', hours: 0 },
    { name: 'Wed', hours: 0 },
    { name: 'Thu', hours: 0 },
    { name: 'Fri', hours: 0 },
    { name: 'Sat', hours: 0 },
    { name: 'Sun', hours: 0 },
  ]);
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);

  // Fonction pour convertir durée "15:00" en heures décimales
  const parseDuration = (duration: string): number => {
    const parts = duration.split(':');
    if (parts.length === 2) {
      const hours = parseInt(parts[0]) || 0;
      const minutes = parseInt(parts[1]) || 0;
      return hours + minutes / 60;
    }
    return 0;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // Récupérer les cours depuis Firebase
        const coursesSnapshot = await getDocs(collection(db, 'courses'));
        const fetchedCourses: CoursePackage[] = [];
        coursesSnapshot.forEach((doc) => {
          fetchedCourses.push({ id: doc.id, ...doc.data() } as CoursePackage);
        });
        setCourses(fetchedCourses);
        setEnrolledCount(fetchedCourses.length);

        // Récupérer ou créer la progression de l'utilisateur
        const progressRef = doc(db, 'userProgress', user.uid);
        const progressSnap = await getDoc(progressRef);

        let userProgress: UserProgress;
        if (progressSnap.exists()) {
          userProgress = progressSnap.data() as UserProgress;

          // Migrer depuis localStorage si nécessaire (pour compatibilité)
          let needsUpdate = false;
          fetchedCourses.forEach(pkg => {
            const saved = localStorage.getItem(`progress_${pkg.id}`);
            if (saved) {
              const localCompleted = JSON.parse(saved);
              localCompleted.forEach((lessonId: string) => {
                const lessonKey = `${pkg.id}_${lessonId}`;
                if (!userProgress.completedLessons.includes(lessonKey)) {
                  userProgress.completedLessons.push(lessonKey);
                  needsUpdate = true;
                }
              });
            }
          });

          if (needsUpdate) {
            await updateDoc(progressRef, {
              completedLessons: userProgress.completedLessons
            });
          }
        } else {
          // Migrer depuis localStorage si disponible
          const completedLessons: string[] = [];
          const courseProgress: { [courseId: string]: { completed: number; total: number } } = {};

          fetchedCourses.forEach(pkg => {
            const saved = localStorage.getItem(`progress_${pkg.id}`);
            const completed = saved ? JSON.parse(saved) : [];
            const total = pkg.sections.reduce((acc, s) => acc + s.lessons.length, 0);

            completed.forEach((lessonId: string) => {
              completedLessons.push(`${pkg.id}_${lessonId}`);
            });

            courseProgress[pkg.id] = {
              completed: completed.length,
              total
            };
          });

          userProgress = {
            completedLessons,
            courseProgress,
            learningHours: 0,
            lastActivity: null,
            weeklyActivity: {}
          };

          await setDoc(progressRef, userProgress);
        }

        setUserProgress(userProgress);

        // Calculer les statistiques
        let totalLessons = 0;
        let totalCompleted = 0;
        let totalHours = 0;

        fetchedCourses.forEach(pkg => {
          const total = pkg.sections.reduce((acc, s) => acc + s.lessons.length, 0);
          totalLessons += total;

          // Compter les leçons complétées depuis userProgress
          let courseCompleted = 0;
          pkg.sections.forEach(section => {
            section.lessons.forEach(lesson => {
              const lessonKey = `${pkg.id}_${lesson.id}`;
              if (userProgress.completedLessons.includes(lessonKey)) {
                courseCompleted++;
                totalHours += parseDuration(lesson.duration);
              }
            });
          });

          totalCompleted += courseCompleted;
        });

        setCompletedCount(totalCompleted);
        setTotalProgress(totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0);
        setLearningHours(Math.round(totalHours * 10) / 10);

        // Calculer l'activité hebdomadaire
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const weeklyData = days.map(day => ({
          name: day,
          hours: userProgress.weeklyActivity[day] || 0
        }));
        setChartData(weeklyData);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#dd8b8b] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <header className="mb-16">
        <h1 className="text-6xl font-black text-[#5A6B70] serif-display italic leading-tight">Votre <span className="text-[#dd8b8b] not-italic">Progression.</span></h1>
        <p className="text-[#5A6B70]/60 mt-4 text-xl sans-handwritten italic">Keep going! You're building your future in Belgium.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        {[
          { icon: GraduationCap, label: 'Cours Inscrits', value: enrolledCount, color: 'bg-blue-50 text-blue-500' },
          { icon: Trophy, label: 'Leçons Complétées', value: completedCount, color: 'bg-green-50 text-green-500' },
          { icon: Clock, label: 'Heures d\'Apprentissage', value: `${learningHours}h`, color: 'bg-purple-50 text-purple-500' },
          { icon: TrendingUp, label: 'Score de Maîtrise', value: `${totalProgress}%`, color: 'bg-[#E8C586]/10 text-[#E8C586]' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[40px] border border-[#dd8b8b]/10 shadow-sm flex flex-col gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-4xl font-black text-[#5A6B70] serif-display italic">{stat.value}</div>
              <div className="text-[10px] font-black sans-geometric uppercase tracking-[0.2em] text-[#5A6B70]/40">{stat.label}</div>
            </div>
          </div>
        ))}

        {/* My Notes Link */}
        <div
          onClick={() => onNavigate && onNavigate('carnet')}
          className="bg-white p-8 rounded-[40px] border border-[#dd8b8b]/10 shadow-sm flex flex-col gap-4 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all group md:col-span-2 lg:col-span-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-50 text-amber-500 group-hover:bg-amber-100 transition-colors">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xl font-black text-[#5A6B70] serif-display italic">Mon Carnet de Notes</div>
              <div className="text-[10px] font-black sans-geometric uppercase tracking-[0.2em] text-[#5A6B70]/40">Accéder à toutes vos notes</div>
            </div>
            <div className="ml-auto">
              <ChevronRight className="w-6 h-6 text-[#dd8b8b]/40 group-hover:text-[#dd8b8b] transition-colors" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Activity Chart */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[48px] border border-[#dd8b8b]/10 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-2xl font-bold text-[#5A6B70] serif-display italic">Engagement Activity</h3>
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-[#E8C586]" />
              <span className="text-[10px] font-black uppercase text-[#5A6B70]/40 tracking-widest">Weekly Goal: 15h</span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F9F7F2" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#5A6B70', fontSize: 10, fontWeight: 800 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#5A6B70', fontSize: 10, fontWeight: 800 }} />
                <Tooltip cursor={{ fill: '#F9F7F2' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="hours" radius={[12, 12, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 3 ? '#dd8b8b' : '#E8C586'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Continue Learning */}
        <div className="bg-[#5A6B70] p-10 rounded-[48px] text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
          <h3 className="text-2xl font-bold serif-display italic mb-8">Prêt à Continuer ?</h3>
          <div className="space-y-6">
            {courses.slice(0, 3).map((pkg) => {
              const totalLessons = pkg.sections.reduce((acc, s) => acc + s.lessons.length, 0);
              // Calculer depuis userProgress si disponible
              let completedLessons = 0;
              if (userProgress) {
                completedLessons = pkg.sections.reduce((acc, section) => {
                  return acc + section.lessons.filter(lesson => {
                    const lessonKey = `${pkg.id}_${lesson.id}`;
                    return userProgress.completedLessons.includes(lessonKey);
                  }).length;
                }, 0);
              } else {
                // Fallback sur localStorage
                const localProgress = localStorage.getItem(`progress_${pkg.id}`);
                const localCompleted = localProgress ? JSON.parse(localProgress) : [];
                completedLessons = localCompleted.length;
              }
              const prog = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
              return (
                <div
                  key={pkg.id}
                  className="group cursor-pointer"
                  onClick={() => {
                    // Naviguer vers le cours
                    window.dispatchEvent(new CustomEvent('navigate', { detail: { page: 'library', course: pkg } }));
                  }}
                >
                  <div className="flex justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80 truncate flex-1 mr-2">{pkg.title}</span>
                    <span className="text-[10px] font-black whitespace-nowrap">{prog}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#E8C586] group-hover:bg-[#dd8b8b] transition-all" style={{ width: `${prog}%` }} />
                  </div>
                </div>
              );
            })}
            {courses.length === 0 && (
              <p className="text-sm opacity-60 italic">Aucun cours disponible. Chargez les cours depuis l'admin.</p>
            )}
          </div>
          <button
            onClick={() => window.location.hash = 'library'}
            className="mt-12 w-full py-4 bg-white text-[#5A6B70] font-black sans-geometric uppercase tracking-widest text-xs rounded-2xl hover:scale-[1.02] transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-3"
          >
            Aller à la Bibliothèque <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
