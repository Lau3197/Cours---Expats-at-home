import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  Play, 
  CheckCircle, 
  FileText, 
  Download, 
  BrainCircuit,
  Send,
  MessageCircle,
  Dumbbell,
  PanelRightClose,
  PanelRightOpen,
  Headphones,
  Bell,
  ClipboardList,
  Upload,
  Award,
  Book,
  Volume2,
  Pause,
  Maximize
} from 'lucide-react';
import StyledMarkdown from '../components/StyledMarkdown';
import { CoursePackage, Lesson } from '../types';
import { getTutorHelp } from '../services/gemini';
import { currentUser } from '../data/mockData';
import LessonComments from '../components/LessonComments';
import VocabTrainer from '../components/VocabTrainer';
import LiveTutor from '../components/LiveTutor';
import { jsPDF } from 'jspdf';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

interface CoursePlayerProps {
  course: CoursePackage;
  onBack: () => void;
  initialLessonId?: string;
}

const generatePDF = (title: string, contentText: string) => {
  const doc = new jsPDF();
  doc.setFontSize(22);
  doc.setTextColor(90, 107, 112);
  doc.text("ExpatsAtHome.be", 20, 20);
  doc.setFontSize(16);
  doc.text("French Mastery Resource", 20, 30);
  doc.setDrawColor(200, 122, 122);
  doc.line(20, 35, 190, 35);
  doc.setFontSize(18);
  doc.text(title, 20, 50);
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  const splitText = doc.splitTextToSize(contentText || "No content available.", 170);
  doc.text(splitText, 20, 65);
  doc.setFontSize(10);
  doc.text("Bonne chance dans votre apprentissage!", 20, 280);
  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
};

const generateCertificate = (userName: string, courseTitle: string) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setDrawColor(232, 197, 134);
  doc.setLineWidth(5);
  doc.rect(10, 10, 277, 190);
  doc.setFontSize(40);
  doc.setTextColor(90, 107, 112);
  doc.text("CERTIFICATE OF MASTERY", 148.5, 60, { align: 'center' });
  doc.setFontSize(20);
  doc.text("This is to certify that", 148.5, 80, { align: 'center' });
  doc.setFontSize(32);
  doc.setTextColor(200, 122, 122);
  doc.text(userName, 148.5, 105, { align: 'center' });
  doc.setFontSize(20);
  doc.setTextColor(90, 107, 112);
  doc.text("has successfully completed the course", 148.5, 125, { align: 'center' });
  doc.setFontSize(24);
  doc.text(courseTitle, 148.5, 145, { align: 'center' });
  doc.setFontSize(14);
  doc.text(`Completed on ${new Date().toLocaleDateString()}`, 148.5, 170, { align: 'center' });
  doc.save(`Certificate_${courseTitle.replace(/\s+/g, '_')}.pdf`);
};

// Content remains the same, but we use ReactMarkdown instead of custom renderer

const CoursePlayer: React.FC<CoursePlayerProps> = ({ course, onBack, initialLessonId }) => {
  const { user } = useAuth();
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'vocab' | 'assignments' | 'resources' | 'announcements' | 'tutor' | 'live' | 'discussions'>('content');
  const [userQuery, setUserQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const loadProgress = async () => {
      // Charger depuis localStorage pour compatibilité
      const saved = localStorage.getItem(`progress_${course.id}`);
      if (saved) {
        setCompletedLessons(new Set(JSON.parse(saved)));
      }

      // Charger depuis Firestore si utilisateur connecté
      if (user) {
        try {
          const progressRef = doc(db, 'userProgress', user.uid);
          const progressSnap = await getDoc(progressRef);
          
          if (progressSnap.exists()) {
            const userProgress = progressSnap.data();
            const courseCompleted = course.sections.flatMap(s => 
              s.lessons.map(l => {
                const lessonKey = `${course.id}_${l.id}`;
                return userProgress.completedLessons?.includes(lessonKey) ? l.id : null;
              }).filter(Boolean)
            );
            if (courseCompleted.length > 0) {
              setCompletedLessons(new Set(courseCompleted));
            }
          }
        } catch (error) {
          console.error("Error loading progress:", error);
        }
      }
      
      // Si un lessonId initial est fourni, trouver et ouvrir cette leçon
      if (initialLessonId) {
        for (const section of course.sections) {
          const lesson = section.lessons.find(l => l.id === initialLessonId);
          if (lesson) {
            setActiveLesson(lesson);
            return;
          }
        }
      }
      
      setActiveLesson(course.sections[0]?.lessons[0] || null);
    };

    loadProgress();
  }, [course, user]);

  const toggleLessonComplete = async (lessonId: string) => {
    const next = new Set(completedLessons);
    const isCompleting = !next.has(lessonId);
    
    if (isCompleting) {
      next.add(lessonId);
    } else {
      next.delete(lessonId);
    }
    
    setCompletedLessons(next);
    
    // Sauvegarder dans localStorage pour compatibilité
    localStorage.setItem(`progress_${course.id}`, JSON.stringify(Array.from(next)));
    
    // Sauvegarder dans Firestore si utilisateur connecté
    if (user) {
      try {
        const progressRef = doc(db, 'userProgress', user.uid);
        const progressSnap = await getDoc(progressRef);
        
        const lessonKey = `${course.id}_${lessonId}`;
        const totalLessons = course.sections.reduce((acc, s) => acc + s.lessons.length, 0);
        const completedCount = next.size;
        
        // Calculer les heures d'apprentissage
        const lesson = course.sections.flatMap(s => s.lessons).find(l => l.id === lessonId);
        const parseDuration = (duration: string): number => {
          const parts = duration.split(':');
          if (parts.length === 2) {
            const hours = parseInt(parts[0]) || 0;
            const minutes = parseInt(parts[1]) || 0;
            return hours + minutes / 60;
          }
          return 0;
        };
        
        if (progressSnap.exists()) {
          const currentProgress = progressSnap.data();
          const completedLessons = currentProgress.completedLessons || [];
          const courseProgress = currentProgress.courseProgress || {};
          const learningHours = currentProgress.learningHours || 0;
          
          let updatedCompleted = [...completedLessons];
          if (isCompleting) {
            if (!updatedCompleted.includes(lessonKey)) {
              updatedCompleted.push(lessonKey);
            }
          } else {
            updatedCompleted = updatedCompleted.filter(id => id !== lessonKey);
          }
          
          const hoursToAdd = lesson ? parseDuration(lesson.duration) : 0;
          const newLearningHours = isCompleting 
            ? learningHours + hoursToAdd 
            : Math.max(0, learningHours - hoursToAdd);
          
          // Mettre à jour l'activité hebdomadaire
          const today = new Date();
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const dayName = dayNames[today.getDay()];
          const weeklyActivity = currentProgress.weeklyActivity || {};
          weeklyActivity[dayName] = (weeklyActivity[dayName] || 0) + (isCompleting ? hoursToAdd : -hoursToAdd);
          
          await updateDoc(progressRef, {
            completedLessons: updatedCompleted,
            courseProgress: {
              ...courseProgress,
              [course.id]: {
                completed: completedCount,
                total: totalLessons
              }
            },
            learningHours: newLearningHours,
            lastActivity: new Date(),
            weeklyActivity
          });
        } else {
          // Créer la progression initiale
          await setDoc(progressRef, {
            completedLessons: isCompleting ? [lessonKey] : [],
            courseProgress: {
              [course.id]: {
                completed: completedCount,
                total: totalLessons
              }
            },
            learningHours: isCompleting && lesson ? parseDuration(lesson.duration) : 0,
            lastActivity: new Date(),
            weeklyActivity: {}
          });
        }
      } catch (error) {
        console.error("Error saving progress:", error);
      }
    }
  };

  const handleAiAsk = async () => {
    if (!userQuery.trim() || !activeLesson) return;
    const query = userQuery;
    setUserQuery('');
    setChatHistory(prev => [...prev, { role: 'user', text: query }]);
    setIsAiLoading(true);
    try {
      const response = await getTutorHelp(activeLesson.content, query);
      setChatHistory(prev => [...prev, { role: 'ai', text: response }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'ai', text: "Désolé, I'm having trouble connecting to Sophie." }]);
    } finally { setIsAiLoading(false); }
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isAudioPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsAudioPlaying(!isAudioPlaying);
    }
  };

  const totalLessonsCount = course.sections.reduce((acc, s) => acc + s.lessons.length, 0);
  const currentProgress = (completedLessons.size / totalLessonsCount) * 100;
  const isCourseComplete = completedLessons.size === totalLessonsCount;

  return (
    <div className="flex h-[calc(100vh-96px)] overflow-hidden bg-[#F9F7F2]">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        
        {/* Video Player Section */}
        {activeLesson?.videoUrl ? (
          <div className="bg-black aspect-video w-full relative group">
            {activeLesson.videoUrl.includes('youtube.com') || activeLesson.videoUrl.includes('youtu.be') ? (
              <iframe 
                key={activeLesson.id}
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${activeLesson.videoUrl.includes('v=') ? activeLesson.videoUrl.split('v=')[1].split('&')[0] : activeLesson.videoUrl.split('/').pop()}`}
                title={activeLesson.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <video 
                key={activeLesson.id}
                className="w-full h-full"
                controls
                poster="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=1200"
              >
                <source src={activeLesson.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="absolute right-6 top-6 z-20 p-4 bg-white/10 backdrop-blur-md text-white rounded-2xl hover:bg-white/20 border border-white/10 shadow-xl transition-all">
                <PanelRightOpen className="w-6 h-6" />
              </button>
            )}
          </div>
        ) : (
          <div className="bg-[#5A6B70] aspect-[21/9] w-full flex items-center justify-center relative shadow-inner overflow-hidden max-h-[350px]">
            <div className="absolute inset-0 bg-gradient-to-br from-[#C87A7A]/20 to-[#5A6B70]/90" />
            <div className="text-white flex flex-col items-center gap-4 relative z-10 text-center px-4">
               <div className="bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/20 text-xs font-black uppercase tracking-[0.3em]">
                 {course.title}
               </div>
               <h1 className="text-4xl md:text-5xl font-bold serif-display italic">{activeLesson?.title}</h1>
            </div>
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="absolute right-6 top-6 z-20 p-4 bg-white/10 backdrop-blur-md text-white rounded-2xl hover:bg-white/20 border border-white/10 shadow-xl transition-all">
                <PanelRightOpen className="w-6 h-6" />
              </button>
            )}
          </div>
        )}

        <div className="max-w-5xl mx-auto px-6 py-12 pb-32">
          {/* Lesson Actions & Audio Player */}
          <div className="mb-10 flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[40px] border border-[#C87A7A]/10 shadow-sm">
             <div className="flex flex-col gap-1">
               <h2 className="text-3xl font-bold text-[#5A6B70] serif-display italic">{activeLesson?.title}</h2>
               <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-[#5A6B70]/40">
                 <span className="flex items-center gap-1.5"><Play className="w-3.5 h-3.5" /> {activeLesson?.duration}</span>
                 <span className="w-1 h-1 rounded-full bg-[#5A6B70]/20" />
                 <span>Level: {course.level}</span>
               </div>
             </div>
             
             <div className="flex items-center gap-4">
               {activeLesson?.audioUrl && (
                 <div className="flex items-center gap-3 bg-[#F9F7F2] p-2 pr-4 rounded-2xl border border-[#C87A7A]/5">
                   <button 
                    onClick={toggleAudio}
                    className="w-10 h-10 bg-[#C87A7A] text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                   >
                     {isAudioPlaying ? <Pause className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                   </button>
                   <div className="flex flex-col">
                     <span className="text-[9px] font-black uppercase tracking-widest text-[#C87A7A]">Audio Version</span>
                     <span className="text-[10px] font-bold text-[#5A6B70]">Listen to Lesson</span>
                   </div>
                   <audio ref={audioRef} src={activeLesson.audioUrl} onEnded={() => setIsAudioPlaying(false)} className="hidden" />
                 </div>
               )}
               <button 
                onClick={() => activeLesson && toggleLessonComplete(activeLesson.id)}
                className={`px-8 py-3 rounded-2xl font-bold transition-all shadow-lg flex items-center gap-2 ${completedLessons.has(activeLesson?.id || '') ? 'bg-green-500 text-white' : 'bg-[#C87A7A] text-white hover:scale-105'}`}
               >
                  {completedLessons.has(activeLesson?.id || '') ? 'Completed' : 'Mark Complete'} <CheckCircle className="w-5 h-5" />
               </button>
             </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-6 border-b border-[#C87A7A]/10 mb-10 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'content', label: 'Description', icon: FileText },
              { id: 'vocab', label: 'Vocabulary', icon: Dumbbell },
              { id: 'resources', label: 'Resources', icon: Book },
              { id: 'assignments', label: 'Assignment', icon: ClipboardList },
              { id: 'tutor', label: 'Tutor Chat', icon: BrainCircuit },
              { id: 'live', label: 'Live Tutor', icon: Headphones },
              { id: 'discussions', label: 'Forum', icon: MessageCircle },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] sans-geometric transition-all relative flex-shrink-0 flex items-center gap-2 ${activeTab === tab.id ? 'text-[#C87A7A]' : 'text-[#5A6B70]/40 hover:text-[#5A6B70]'}`}>
                <tab.icon className="w-4 h-4" /> {tab.label}
                {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#C87A7A] rounded-full" />}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === 'content' && (
              <div className="space-y-12">
                <div className="bg-white p-10 rounded-[40px] border border-[#dd8b8b]/10 shadow-sm">
                  <StyledMarkdown content={activeLesson?.content || ""} />
                </div>
                
                {activeLesson?.transcript && (
                  <div className="bg-[#E8C586]/5 p-10 rounded-[40px] border border-[#E8C586]/20">
                    <h3 className="text-2xl font-bold text-[#5A6B70] serif-display italic mb-6">Video Transcript</h3>
                    <p className="text-[#5A6B70]/80 leading-relaxed font-medium">{activeLesson.transcript}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'resources' && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-[#5A6B70] serif-display italic mb-6">Course Material</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {course.resources.map(res => (
                    <div key={res.id} className="bg-white p-6 rounded-[24px] border border-[#C87A7A]/10 flex items-center justify-between group hover:border-[#E8C586] transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#F9F7F2] rounded-2xl flex items-center justify-center text-[#C87A7A]">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold text-[#5A6B70]">{res.name}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40">{res.type}</p>
                        </div>
                      </div>
                      <a 
                        href={res.url && res.url !== '#' ? res.url : '#'}
                        onClick={(e) => {
                          if (!res.url || res.url === '#') {
                            e.preventDefault();
                            generatePDF(res.name, `Resource download for: ${res.name}\n\nLevel: ${course.level}\nTopic: ${course.title}`);
                          } else {
                            // Forcer le téléchargement pour les PDFs
                            if (res.type === 'pdf' && res.url) {
                              e.preventDefault();
                              const link = document.createElement('a');
                              link.href = res.url;
                              link.download = res.name.endsWith('.pdf') ? res.name : `${res.name}.pdf`;
                              link.target = '_blank';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }
                          }
                        }}
                        target={res.url && res.url !== '#' ? '_blank' : undefined}
                        rel={res.url && res.url !== '#' ? 'noopener noreferrer' : undefined}
                        className="p-3 bg-[#C87A7A] text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 inline-block"
                        title={res.url && res.url !== '#' ? 'Télécharger le fichier' : 'Générer un PDF'}
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'vocab' && (
              <div className="space-y-8">
                <div className="bg-white p-10 rounded-[40px] border border-[#C87A7A]/10 shadow-sm">
                  <h3 className="text-2xl font-bold text-[#5A6B70] serif-display italic mb-8">Vocabulary List</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {activeLesson?.vocabulary.map(item => (
                      <div key={item.id} className="flex flex-col gap-1 p-4 bg-[#F9F7F2] rounded-2xl border border-[#C87A7A]/5">
                        <div className="flex justify-between items-start">
                          <span className="text-lg font-bold text-[#C87A7A]">{item.french}</span>
                          <span className="text-[10px] font-mono text-[#5A6B70]/50">{item.pronunciation}</span>
                        </div>
                        <span className="text-sm font-medium text-[#5A6B70]/70 italic">{item.translation}</span>
                        {item.example && <p className="text-[10px] text-[#5A6B70]/40 mt-1">"{item.example}"</p>}
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-[#C87A7A]/10 pt-12">
                    <VocabTrainer vocab={activeLesson?.vocabulary || []} />
                  </div>
                </div>
              </div>
            )}

            {/* Other tabs remain similar but styled with new palette */}
            {activeTab === 'assignments' && (
              <div className="bg-white p-10 rounded-[40px] border border-[#C87A7A]/10 shadow-sm text-center">
                <ClipboardList className="w-12 h-12 mx-auto text-[#E8C586] mb-4" />
                <h3 className="text-2xl font-bold serif-display italic text-[#5A6B70] mb-2">Lesson Assignment</h3>
                <p className="text-[#5A6B70]/60 mb-8 max-w-lg mx-auto">Upload a 1-minute audio recording or a short paragraph applying what you learned today.</p>
                <label className="border-2 border-dashed border-[#C87A7A]/20 rounded-3xl p-12 bg-[#F9F7F2]/50 hover:bg-[#F9F7F2] transition-all cursor-pointer group block">
                  <input type="file" className="hidden" onChange={() => alert("File uploaded successfully for review!")} />
                  <Upload className="w-10 h-10 mx-auto text-[#C87A7A] mb-4 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-black uppercase tracking-widest text-[#5A6B70]/40">Click to upload your work</p>
                </label>
              </div>
            )}

            {activeTab === 'tutor' && (
              <div className="bg-white rounded-[40px] border border-[#C87A7A]/10 shadow-xl p-10">
                <div className="space-y-6 mb-10 max-h-[450px] overflow-y-auto px-4 custom-scrollbar">
                  {chatHistory.map((chat, idx) => (
                    <div key={idx} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-[24px] px-6 py-4 ${chat.role === 'user' ? 'bg-[#C87A7A] text-white rounded-tr-none' : 'bg-[#F9F7F2] text-[#5A6B70] rounded-tl-none'}`}>
                        <p className="text-sm font-bold">{chat.text}</p>
                      </div>
                    </div>
                  ))}
                  {isAiLoading && <div className="animate-pulse flex gap-2"><div className="w-2 h-2 bg-[#C87A7A] rounded-full"></div><div className="w-2 h-2 bg-[#C87A7A] rounded-full"></div></div>}
                </div>
                <div className="relative">
                  <input type="text" value={userQuery} onChange={(e) => setUserQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAiAsk()} placeholder="Ask Sophie for help..." className="w-full bg-[#F9F7F2] rounded-[24px] py-4 pl-6 pr-16 focus:outline-none font-bold text-[#5A6B70]" />
                  <button onClick={handleAiAsk} className="absolute right-2 top-2 p-2.5 bg-[#C87A7A] text-white rounded-[18px] hover:scale-105 transition-all shadow-lg"><Send className="w-5 h-5" /></button>
                </div>
              </div>
            )}

            {activeTab === 'live' && (
              <LiveTutor level={course.level} topic={activeLesson?.title || ""} context={activeLesson?.content || ""} />
            )}

            {activeTab === 'discussions' && (
              <LessonComments comments={activeLesson?.comments || []} onAddComment={() => {}} />
            )}
          </div>
        </div>
      </div>

      {/* Curriculum Sidebar */}
      <div className={`bg-white border-l border-[#C87A7A]/10 transition-all duration-500 flex flex-col ${isSidebarOpen ? 'w-[400px]' : 'w-0 overflow-hidden'}`}>
        <div className="p-8 border-b border-[#C87A7A]/10 flex justify-between items-center bg-[#F9F7F2]/30">
          <h2 className="text-2xl font-bold text-[#5A6B70] serif-display italic">Course Content</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="text-[#5A6B70]/40 hover:text-[#C87A7A] transition-all"><PanelRightClose className="w-6 h-6" /></button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {course.sections.map((section) => (
            <div key={section.id} className="mb-4">
              <div className="bg-[#F9F7F2]/80 px-8 py-4 border-y border-[#C87A7A]/5">
                <h3 className="font-black text-[9px] uppercase tracking-widest text-[#5A6B70]/60">{section.title}</h3>
              </div>
              <div className="px-4 py-3 space-y-2">
                {section.lessons.map((lesson) => (
                  <button key={lesson.id} onClick={() => { setActiveLesson(lesson); setActiveTab('content'); }} className={`w-full text-left p-4 rounded-2xl flex items-center gap-4 transition-all ${activeLesson?.id === lesson.id ? 'bg-[#F9F7F2] border-[#C87A7A]/20 shadow-md border' : 'hover:bg-[#F9F7F2]/50'}`}>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 ${completedLessons.has(lesson.id) ? 'bg-green-500 border-green-500' : 'border-[#C87A7A]/20'}`}>
                      {completedLessons.has(lesson.id) ? <CheckCircle className="w-4 h-4 text-white" /> : <div className="w-1.5 h-1.5 bg-[#C87A7A]/20 rounded-full" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-bold truncate ${activeLesson?.id === lesson.id ? 'text-[#C87A7A]' : 'text-[#5A6B70]'}`}>{lesson.title}</div>
                      <div className="text-[8px] text-[#5A6B70]/40 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
                        {lesson.type === 'video' ? <Play className="w-2.5 h-2.5" /> : <FileText className="w-2.5 h-2.5" />}
                        {lesson.duration}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Certificate Sidebar Panel */}
        <div className="p-6 bg-[#F9F7F2]/50 border-t border-[#C87A7A]/10">
           <div className={`p-6 rounded-[24px] border flex flex-col gap-4 transition-all ${isCourseComplete ? 'bg-[#E8C586] border-[#E8C586] text-[#5A6B70]' : 'bg-white border-[#C87A7A]/10 text-[#5A6B70]/40'}`}>
               <div>
                 <p className="text-[9px] font-black uppercase tracking-widest leading-none mb-1">Milestone Progress</p>
                 <div className="h-1.5 bg-[#5A6B70]/10 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-[#C87A7A] transition-all" style={{ width: `${currentProgress}%` }} />
                 </div>
                 <h4 className="text-md font-bold serif-display italic">{isCourseComplete ? 'Claim Certificate!' : `Complete ${totalLessonsCount - completedLessons.size} more`}</h4>
               </div>
               <button 
                onClick={() => isCourseComplete && generateCertificate(currentUser.name, course.title)}
                disabled={!isCourseComplete}
                className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest ${isCourseComplete ? 'bg-white text-[#C87A7A] shadow-md hover:scale-105' : 'bg-transparent border border-current opacity-30 cursor-not-allowed'}`}
               >
                 <Award className="w-4 h-4" /> Download Award
               </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;