import React, { useState, useEffect } from 'react';
import SessionManager from '../components/SessionManager';
import ListeningKeysManager from '../components/ListeningKeysManager';
import StudentManager from '../components/StudentManager';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import ResourceManager from '../components/ResourceManager';
import CorrectionsManager from '../components/CorrectionsManager';

import DashboardHome from '../components/DashboardHome';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import { CoursePackage } from '../types';
import { loadCourses } from '../utils/courseLoader';

const InstructorDashboard: React.FC = () => {
  const [dashboardTab, setDashboardTab] = useState<'home' | 'sessions' | 'listening' | 'students' | 'analytics' | 'resources' | 'coaching'>('home');
  const [courses, setCourses] = useState<CoursePackage[]>([]);

  useEffect(() => {
    setCourses(loadCourses());
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h1 className="text-5xl font-black text-[#5A6B70] serif-display italic leading-tight">
            Tableau de bord <span className="text-[#dd8b8b] not-italic">Administrateur.</span>
          </h1>
          <div className="flex items-center gap-2 mt-4 text-[#5A6B70]/60 sans-handwritten text-xl italic">
            {dashboardTab !== 'home' && (
              <button
                onClick={() => setDashboardTab('home')}
                className="flex items-center gap-2 hover:text-[#dd8b8b] transition-colors underline decoration-dotted"
              >
                <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
              </button>
            )}
            {dashboardTab === 'home' && (
              <span>Gérez les sessions, leçons et étudiants.</span>
            )}
          </div>
        </div>

        {/* Mini Navigation for Inner Pages (Optional, keep it clean for now or show 'Back to Dashboard' prominent button) */}
        {dashboardTab !== 'home' && (
          <button
            onClick={() => setDashboardTab('home')}
            className="bg-[#F9F7F2] hover:bg-[#dd8b8b] hover:text-white transition-all text-[#5A6B70] px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 shadow-sm"
          >
            <LayoutDashboard className="w-4 h-4" /> Vue d'ensemble
          </button>
        )}
      </div>

      {dashboardTab === 'home' && <DashboardHome onNavigate={(tab) => setDashboardTab(tab)} />}

      {dashboardTab === 'coaching' && <CorrectionsManager />}
      {dashboardTab === 'sessions' && <SessionManager />}
      {dashboardTab === 'listening' && <ListeningKeysManager />}
      {dashboardTab === 'students' && <StudentManager courses={courses} />}
      {dashboardTab === 'analytics' && <AnalyticsDashboard courses={courses} />}
      {dashboardTab === 'resources' && <ResourceManager />}


    </div>
  );
};

export default InstructorDashboard;


