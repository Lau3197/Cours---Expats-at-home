import React, { useState, useEffect } from 'react';
import SessionManager from '../components/SessionManager';
import ListeningKeysManager from '../components/ListeningKeysManager';
import StudentManager from '../components/StudentManager';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import ResourceManager from '../components/ResourceManager';
import { CoursePackage } from '../types';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

const InstructorDashboard: React.FC = () => {
  const [dashboardTab, setDashboardTab] = useState<'sessions' | 'listening' | 'students' | 'analytics' | 'resources'>('sessions');
  const [courses, setCourses] = useState<CoursePackage[]>([]);

  useEffect(() => {
    // Fetch courses for StudentManager (to resolve lesson names)
    const fetchCourses = async () => {
      try {
        const snap = await getDocs(collection(db, 'courses'));
        const list: CoursePackage[] = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() } as CoursePackage));
        setCourses(list);
      } catch (e) {
        console.error("Error fetching courses for admin:", e);
      }
    };
    fetchCourses();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
        <div>
          <h1 className="text-5xl font-black text-[#5A6B70] serif-display italic leading-tight">
            Tableau de bord <span className="text-[#dd8b8b] not-italic">Administrateur.</span>
          </h1>
          <p className="text-[#5A6B70]/60 mt-4 sans-handwritten text-xl italic">Gérez les sessions, leçons et étudiants.</p>
        </div>

        {/* Main Dashboard Tabs */}
        <div className="flex bg-[#F9F7F2] p-2 rounded-full border border-[#dd8b8b]/10 overflow-x-auto max-w-full">
          <button
            onClick={() => setDashboardTab('sessions')}
            className={`px-6 py-3 rounded-full font-bold text-sm transition-all whitespace-nowrap ${dashboardTab === 'sessions'
              ? 'bg-white text-[#dd8b8b] shadow-sm'
              : 'text-[#5A6B70]/60 hover:text-[#5A6B70]'
              }`}
          >
            Sessions (Live)
          </button>
          <button
            onClick={() => setDashboardTab('listening')}
            className={`px-6 py-3 rounded-full font-bold text-sm transition-all whitespace-nowrap ${dashboardTab === 'listening'
              ? 'bg-white text-[#dd8b8b] shadow-sm'
              : 'text-[#5A6B70]/60 hover:text-[#5A6B70]'
              }`}
          >
            The Listening Keys
          </button>
          <button
            onClick={() => setDashboardTab('students')}
            className={`px-6 py-3 rounded-full font-bold text-sm transition-all whitespace-nowrap ${dashboardTab === 'students'
              ? 'bg-white text-[#dd8b8b] shadow-sm'
              : 'text-[#5A6B70]/60 hover:text-[#5A6B70]'
              }`}
          >
            Étudiants
          </button>
          <button
            onClick={() => setDashboardTab('analytics')}
            className={`px-6 py-3 rounded-full font-bold text-sm transition-all whitespace-nowrap ${dashboardTab === 'analytics'
              ? 'bg-white text-[#dd8b8b] shadow-sm'
              : 'text-[#5A6B70]/60 hover:text-[#5A6B70]'
              }`}
          >
            Statistiques
          </button>
          <button
            onClick={() => setDashboardTab('resources')}
            className={`px-6 py-3 rounded-full font-bold text-sm transition-all whitespace-nowrap ${dashboardTab === 'resources'
              ? 'bg-white text-[#dd8b8b] shadow-sm'
              : 'text-[#5A6B70]/60 hover:text-[#5A6B70]'
              }`}
          >
            Ressources
          </button>
        </div>
      </div>

      {dashboardTab === 'sessions' && <SessionManager />}
      {dashboardTab === 'listening' && <ListeningKeysManager />}
      {dashboardTab === 'students' && <StudentManager courses={courses} />}
      {dashboardTab === 'analytics' && <AnalyticsDashboard courses={courses} />}
      {dashboardTab === 'resources' && <ResourceManager />}
    </div>
  );
};

export default InstructorDashboard;


