
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
  Loader2,
  Calendar as CalendarIcon
} from 'lucide-react';

import VisionBoard from '../components/WelcomeDashboard/VisionBoard';
import ConfianceMeter from '../components/WelcomeDashboard/ConfianceMeter';
import BelgianToolkit from '../components/WelcomeDashboard/BelgianToolkit';
import FocusTimer from '../components/WelcomeDashboard/FocusTimer';
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
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { CoursePackage, Session, PlannedLesson } from '../types';
import SessionCalendar from '../components/SessionCalendar';
import { getPlannedLessons } from '../services/planner';
import { loadCourses } from '../utils/courseLoader';

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
  const [sessions, setSessions] = useState<Session[]>([]);
  const [plannedLessons, setPlannedLessons] = useState<PlannedLesson[]>([]);
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
        // Load courses from file system
        const fetchedCourses = loadCourses();
        setCourses(fetchedCourses);
        setEnrolledCount(fetchedCourses.length);

        // Fetch Sessions
        const sessionsQuery = query(collection(db, 'sessions'), orderBy('date', 'asc'));
        const sessionsSnapshot = await getDocs(sessionsQuery);
        const fetchedSessions = sessionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session));
        setSessions(fetchedSessions);

        // Fetch Planned Lessons
        const plans = await getPlannedLessons(user.uid);
        setPlannedLessons(plans);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-12">
        <h1 className="text-6xl font-black text-[#5A6B70] serif-display italic leading-tight">Votre <span className="text-[#dd8b8b] not-italic">Progression.</span></h1>
        <p className="text-[#5A6B70]/60 mt-4 text-xl sans-handwritten italic">Keep going! You're building your future in Belgium.</p>
      </header>

      {/* 1. VISION & MOTIVATION (Top Priority) */}
      <div className="mb-12">
        <VisionBoard />
      </div>

      {/* 2. STATS (Quick Status Check) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { icon: GraduationCap, label: 'Cours Inscrits', value: enrolledCount, color: 'bg-blue-50 text-blue-500' },
          { icon: Trophy, label: 'Leçons Complétées', value: completedCount, color: 'bg-green-50 text-green-500' },
          { icon: Clock, label: 'Heures d\'Apprentissage', value: `${learningHours}h`, color: 'bg-purple-50 text-purple-500' },
          { icon: TrendingUp, label: 'Score de Maîtrise', value: `${totalProgress}%`, color: 'bg-[#E8C586]/10 text-[#E8C586]' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border border-[#dd8b8b]/10 shadow-sm flex flex-col gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-3xl font-black text-[#5A6B70] serif-display italic">{stat.value}</div>
              <div className="text-[9px] font-black sans-geometric uppercase tracking-[0.2em] text-[#5A6B70]/40">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. MAIN ACTION AREA: CALENDAR & GROWTH TOOLS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        {/* Left Column: Calendar (The Path) */}
        <div className="lg:col-span-8">
          <div className="bg-white p-8 rounded-[40px] border border-[#dd8b8b]/10 shadow-sm h-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-[#5A6B70] serif-display italic">Mon Agenda</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#5A6B70]/60 uppercase tracking-widest">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#dd8b8b]"></span> Exchange
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#5A6B70]/60 uppercase tracking-widest">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E8C586]"></span> Culture
                </div>
              </div>
            </div>
            {loading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 text-[#dd8b8b] animate-spin" />
              </div>
            ) : (
              <SessionCalendar
                sessions={sessions}
                plannedLessons={plannedLessons}
                courses={courses}
                userId={user?.uid}
                onPlanUpdate={async () => {
                  if (user) {
                    const plans = await getPlannedLessons(user.uid);
                    setPlannedLessons(plans);
                  }
                }}
                type="mixed"
                color="#5A6B70"
              />
            )}
          </div>
        </div>

        {/* Right Column: Growth & Daily Motivation */}
        <div className="lg:col-span-4 space-y-6">
          {/* Focus Timer (Top Action) */}
          <FocusTimer />

          {/* Confiance Meter */}
          <ConfianceMeter />

          {/* Daily Quote Card */}
          <div className="bg-[#5A6B70] rounded-3xl p-8 text-[#F9F7F2] text-center shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#ffffff] opacity-10 rounded-bl-full" />
            <h3 className="font-serif text-xl mb-4">Le mot du jour</h3>
            <p className="italic text-lg mb-4">"L'art de la frite, c'est comme la vie : il faut savoir être croustillant à l'extérieur et tendre à l'intérieur."</p>
            <span className="text-sm opacity-60 uppercase tracking-widest font-bold">― Sagesse Bruxelloise</span>
          </div>

          {/* Notebook Link (Compact) */}
          <div
            onClick={() => onNavigate && onNavigate('carnet')}
            className="bg-amber-50 p-6 rounded-3xl border border-amber-100 shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white text-amber-500 shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-black text-[#5A6B70] serif-display italic">Mon Carnet</div>
              <div className="text-[9px] font-black sans-geometric uppercase tracking-[0.2em] text-[#5A6B70]/40">Voir mes notes</div>
            </div>
            <div className="ml-auto">
              <ChevronRight className="w-5 h-5 text-[#dd8b8b]/40 group-hover:text-[#dd8b8b] transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. RESOURCES (Bottom Shelf) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12">
          <BelgianToolkit />
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
