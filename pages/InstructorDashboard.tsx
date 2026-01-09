
import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  Star,
  Plus,
  Video,
  FileText,
  Save,
  X,
  Layout,
  BookOpen,
  Database,
  Loader2,
  Edit,
  Book,
  Upload,
  Trash2,
  Maximize2,
  Minimize2
} from 'lucide-react';
import StyledMarkdown from '../components/StyledMarkdown';
import FullScreenMarkdownEditor from '../components/FullScreenMarkdownEditor';
import { Course, Lesson, CoursePackage, Section, VocabItem, Resource } from '../types';
import { db } from '../services/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, query, setDoc } from 'firebase/firestore';
import { masterCurriculum } from '../data/mockData';

const InstructorDashboard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courses, setCourses] = useState<CoursePackage[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [newLesson, setNewLesson] = useState<Partial<Lesson>>({
    title: '',
    content: '',
    videoUrl: '',
    type: 'video',
    duration: '10:00',
    vocabulary: [],
    comments: [],
    completed: false
  });
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [editingLesson, setEditingLesson] = useState<{ courseId: string; sectionId: string; lessonId: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'vocabulary'>('content');
  const [vocabForm, setVocabForm] = useState({ french: '', translation: '', pronunciation: '', example: '' });
  const [bulkVocabInput, setBulkVocabInput] = useState('');
  const [isResourcesModalOpen, setIsResourcesModalOpen] = useState(false);
  const [selectedCourseForResources, setSelectedCourseForResources] = useState<string>('');
  const [resourceForm, setResourceForm] = useState({ name: '', type: 'pdf' as 'pdf' | 'link' | 'zip', url: '' });
  const [isContentFullscreen, setIsContentFullscreen] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'courses'));
      const querySnapshot = await getDocs(q);
      const fetchedCourses: CoursePackage[] = [];
      querySnapshot.forEach((doc) => {
        fetchedCourses.push({ id: doc.id, ...doc.data() } as CoursePackage);
      });
      setCourses(fetchedCourses);
      if (fetchedCourses.length > 0) {
        setSelectedCourseId(fetchedCourses[0].id);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const seedDatabase = async () => {
    if (!window.confirm("Voulez-vous initialiser la base de données avec les cours par défaut (A1.1, A1.2) ?")) return;
    
    setSeeding(true);
    try {
      for (const course of masterCurriculum) {
        // Use setDoc with the existing ID to avoid duplicates if run multiple times
        await setDoc(doc(db, 'courses', course.id), course);
      }
      alert("Base de données initialisée avec succès !");
      fetchCourses();
    } catch (error) {
      console.error("Error seeding database:", error);
      alert("Erreur lors de l'initialisation.");
    } finally {
      setSeeding(false);
    }
  };

  const loadAllCoursesFromJSON = async () => {
    if (!window.confirm("Voulez-vous charger TOUTES les leçons depuis les fichiers Markdown ? Cela va charger 54 leçons dans 8 cours (A1.1, A1.2, A2.1, A2.2, B1.1, B1.2, B2.1, B2.2).")) return;
    
    setSeeding(true);
    try {
      // Import the JSON file
      const allCoursesModule = await import('../data/allCourses.json');
      const allCourses = allCoursesModule.default || allCoursesModule;
      
      let loaded = 0;
      for (const course of allCourses) {
        await setDoc(doc(db, 'courses', course.id), course, { merge: true });
        loaded++;
        console.log(`✅ Loaded: ${course.title} (${course.sections.reduce((sum, s) => sum + s.lessons.length, 0)} lessons)`);
      }
      
      alert(`✅ ${loaded} cours chargés avec succès ! Total: ${allCourses.reduce((sum, c) => sum + c.sections.reduce((s, sec) => s + sec.lessons.length, 0), 0)} leçons.`);
      fetchCourses();
    } catch (error) {
      console.error("Error loading courses from JSON:", error);
      alert("Erreur lors du chargement. Assurez-vous que le fichier allCourses.json existe dans le dossier data/.");
    } finally {
      setSeeding(false);
    }
  };

  const handleEditLesson = (courseId: string, sectionId: string, lessonId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    
    const section = course.sections.find(s => s.id === sectionId);
    if (!section) return;
    
    const lesson = section.lessons.find(l => l.id === lessonId);
    if (!lesson) return;
    
    setSelectedCourseId(courseId);
    setEditingLesson({ courseId, sectionId, lessonId });
    setNewLesson({
      title: lesson.title,
      content: lesson.content,
      videoUrl: lesson.videoUrl || '',
      type: lesson.type,
      duration: lesson.duration,
      vocabulary: lesson.vocabulary || [],
      comments: lesson.comments || [],
      completed: lesson.completed || false
    });
    setIsModalOpen(true);
  };

  const addVocabItem = () => {
    if (!vocabForm.french || !vocabForm.translation) {
      alert('Veuillez remplir au moins le français et la traduction');
      return;
    }
    const newVocab: VocabItem = {
      id: `vocab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      french: vocabForm.french,
      translation: vocabForm.translation,
      pronunciation: vocabForm.pronunciation || undefined,
      example: vocabForm.example || undefined
    };
    setNewLesson({
      ...newLesson,
      vocabulary: [...(newLesson.vocabulary || []), newVocab]
    });
    setVocabForm({ french: '', translation: '', pronunciation: '', example: '' });
  };

  const removeVocabItem = (vocabId: string) => {
    setNewLesson({
      ...newLesson,
      vocabulary: (newLesson.vocabulary || []).filter(v => v.id !== vocabId)
    });
  };

  const handleBulkVocabImport = () => {
    try {
      // Support CSV format: french,translation,pronunciation,example
      // Or JSON format: [{"french":"...","translation":"...","pronunciation":"...","example":"..."}]
      let vocabItems: VocabItem[] = [];
      
      if (bulkVocabInput.trim().startsWith('[')) {
        // JSON format
        const parsed = JSON.parse(bulkVocabInput);
        vocabItems = parsed.map((item: any, idx: number) => ({
          id: `vocab-bulk-${Date.now()}-${idx}`,
          french: item.french || item.French || '',
          translation: item.translation || item.Translation || item.english || item.English || '',
          pronunciation: item.pronunciation || item.Pronunciation || undefined,
          example: item.example || item.Example || undefined
        }));
      } else {
        // CSV format
        const lines = bulkVocabInput.trim().split('\n');
        vocabItems = lines.map((line, idx) => {
          const parts = line.split(',').map(p => p.trim());
          return {
            id: `vocab-bulk-${Date.now()}-${idx}`,
            french: parts[0] || '',
            translation: parts[1] || '',
            pronunciation: parts[2] || undefined,
            example: parts[3] || undefined
          };
        });
      }

      // Filter out invalid items
      vocabItems = vocabItems.filter(v => v.french && v.translation);
      
      if (vocabItems.length === 0) {
        alert('Aucun vocabulaire valide trouvé. Format attendu:\nCSV: french,translation,pronunciation,example\nJSON: [{"french":"...","translation":"..."}]');
        return;
      }

      setNewLesson({
        ...newLesson,
        vocabulary: [...(newLesson.vocabulary || []), ...vocabItems]
      });
      setBulkVocabInput('');
      alert(`${vocabItems.length} vocabulaires ajoutés avec succès !`);
    } catch (error) {
      alert('Erreur lors de l\'import. Vérifiez le format (CSV ou JSON).');
      console.error(error);
    }
  };

  const handleAddResource = async () => {
    if (!selectedCourseForResources || !resourceForm.name || !resourceForm.url) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      const courseRef = doc(db, 'courses', selectedCourseForResources);
      const course = courses.find(c => c.id === selectedCourseForResources);
      
      if (course) {
        const newResource: Resource = {
          id: `resource-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: resourceForm.name,
          type: resourceForm.type,
          url: resourceForm.url
        };

        const updatedResources = [...(course.resources || []), newResource];

        await updateDoc(courseRef, {
          resources: updatedResources
        });

        alert('Ressource ajoutée avec succès !');
        setResourceForm({ name: '', type: 'pdf', url: '' });
        fetchCourses();
      }
    } catch (error) {
      console.error("Error adding resource:", error);
      alert("Erreur lors de l'ajout de la ressource.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveResource = async (resourceId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette ressource ?')) return;

    setLoading(true);
    try {
      const courseRef = doc(db, 'courses', selectedCourseForResources);
      const course = courses.find(c => c.id === selectedCourseForResources);
      
      if (course) {
        const updatedResources = (course.resources || []).filter(r => r.id !== resourceId);

        await updateDoc(courseRef, {
          resources: updatedResources
        });

        alert('Ressource supprimée avec succès !');
        fetchCourses();
      }
    } catch (error) {
      console.error("Error removing resource:", error);
      alert("Erreur lors de la suppression de la ressource.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLesson = async () => {
    if (!selectedCourseId || !newLesson.title) {
      alert("Veuillez sélectionner un cours et donner un titre à la leçon.");
      return;
    }

    setLoading(true);
    try {
      const courseRef = doc(db, 'courses', selectedCourseId);
      const course = courses.find(c => c.id === selectedCourseId);
      
      if (course) {
        const updatedSections = [...(course.sections || [])];
        
        if (editingLesson) {
          // Édition d'une leçon existante
          const sectionIndex = updatedSections.findIndex(s => s.id === editingLesson.sectionId);
          if (sectionIndex !== -1) {
            const lessonIndex = updatedSections[sectionIndex].lessons.findIndex(l => l.id === editingLesson.lessonId);
            if (lessonIndex !== -1) {
              updatedSections[sectionIndex].lessons[lessonIndex] = {
                ...updatedSections[sectionIndex].lessons[lessonIndex],
                ...newLesson,
                id: editingLesson.lessonId
              } as Lesson;
            }
          }
        } else {
          // Création d'une nouvelle leçon
          const lessonWithId = {
            ...newLesson,
            id: Date.now().toString(),
          } as Lesson;
          
          if (updatedSections.length === 0) {
            updatedSections.push({
              id: 'section-1',
              title: 'Contenu additionnel',
              lessons: [lessonWithId]
            });
          } else {
            updatedSections[updatedSections.length - 1].lessons.push(lessonWithId);
          }
        }

        await updateDoc(courseRef, {
          sections: updatedSections
        });

        alert(editingLesson ? "Leçon modifiée avec succès !" : "Leçon ajoutée avec succès !");
        setIsModalOpen(false);
        setEditingLesson(null);
        setNewLesson({
          title: '',
          content: '',
          videoUrl: '',
          type: 'video',
          duration: '10:00',
          vocabulary: [],
          comments: [],
          completed: false
        });
        fetchCourses();
      }
    } catch (error) {
      console.error("Error saving lesson:", error);
      alert("Erreur lors de la sauvegarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16">
        <div>
          <h1 className="text-5xl font-black text-[#5A6B70] serif-display italic leading-tight">
            Tableau de bord <span className="text-[#dd8b8b] not-italic">Administrateur.</span>
          </h1>
          <p className="text-[#5A6B70]/60 mt-4 sans-handwritten text-xl italic">Gérez vos cours et leçons en Markdown.</p>
        </div>
        <div className="flex gap-4 flex-wrap">
          <button 
            onClick={loadAllCoursesFromJSON}
            disabled={seeding}
            className="flex items-center gap-3 bg-[#dd8b8b] text-white px-6 py-4 rounded-[24px] font-bold shadow-xl hover:bg-[#c97a7a] transition-all sans-geometric uppercase tracking-widest text-xs"
          >
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />} Charger toutes les leçons (54)
          </button>
          <button 
            onClick={seedDatabase}
            disabled={seeding}
            className="flex items-center gap-3 bg-[#5A6B70] text-white px-6 py-4 rounded-[24px] font-bold shadow-xl hover:bg-[#4A5B60] transition-all sans-geometric uppercase tracking-widest text-xs"
          >
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />} Initialiser (A1.1, A1.2)
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-3 bg-[#E8C586] text-white px-8 py-4 rounded-[24px] font-bold shadow-xl shadow-[#E8C586]/20 hover:scale-[1.03] transition-all sans-geometric uppercase tracking-widest text-xs"
          >
            <Plus className="w-5 h-5" /> Ajouter une Leçon
          </button>
          <button 
            onClick={() => {
              if (courses.length > 0) {
                setSelectedCourseForResources(courses[0].id);
                setIsResourcesModalOpen(true);
              } else {
                alert('Aucun cours disponible. Veuillez d\'abord charger des cours.');
              }
            }}
            className="flex items-center gap-3 bg-[#5A6B70] text-white px-8 py-4 rounded-[24px] font-bold shadow-xl hover:bg-[#4A5B60] transition-all sans-geometric uppercase tracking-widest text-xs"
          >
            <FileText className="w-5 h-5" /> Gérer les Ressources
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="bg-white p-8 rounded-[32px] border border-[#dd8b8b]/10 shadow-sm flex flex-col gap-4">
          <div className="w-12 h-12 bg-[#dd8b8b]/10 rounded-2xl flex items-center justify-center text-[#dd8b8b]">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-4xl font-black text-[#5A6B70] serif-display italic">{courses.length}</div>
            <div className="text-xs font-black sans-geometric uppercase tracking-[0.2em] text-[#5A6B70]/40">Cours en ligne</div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-[#5A6B70]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className={`bg-white w-full ${isContentFullscreen ? 'max-w-full h-[95vh]' : 'max-w-5xl'} rounded-[40px] shadow-2xl overflow-hidden flex flex-col ${isContentFullscreen ? 'h-[95vh]' : 'max-h-[95vh]'}`}>
            <div className="p-8 border-b border-[#dd8b8b]/10 flex justify-between items-center bg-[#F9F7F2]/50">
              <h2 className="text-3xl font-bold text-[#5A6B70] serif-display italic">
                {editingLesson ? 'Modifier la leçon' : 'Gestion du contenu'}
              </h2>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingLesson(null);
                  setActiveTab('content');
                  setIsContentFullscreen(false);
                  setNewLesson({
                    title: '',
                    content: '',
                    videoUrl: '',
                    type: 'video',
                    duration: '10:00',
                    vocabulary: [],
                    comments: [],
                    completed: false
                  });
                  setVocabForm({ french: '', translation: '', pronunciation: '', example: '' });
                  setBulkVocabInput('');
                }} 
                className="p-2 hover:bg-[#dd8b8b]/10 rounded-full transition-colors text-[#5A6B70]/40"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-8 pt-6 border-b border-[#dd8b8b]/10 flex gap-4">
              <button
                onClick={() => setActiveTab('content')}
                className={`pb-4 px-4 font-bold text-sm transition-all relative ${
                  activeTab === 'content' 
                    ? 'text-[#dd8b8b]' 
                    : 'text-[#5A6B70]/40 hover:text-[#5A6B70]'
                }`}
              >
                Contenu
                {activeTab === 'content' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#dd8b8b] rounded-t-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('vocabulary')}
                className={`pb-4 px-4 font-bold text-sm transition-all relative flex items-center gap-2 ${
                  activeTab === 'vocabulary' 
                    ? 'text-[#dd8b8b]' 
                    : 'text-[#5A6B70]/40 hover:text-[#5A6B70]'
                }`}
              >
                <Book className="w-4 h-4" />
                Vocabulaire ({newLesson.vocabulary?.length || 0})
                {activeTab === 'vocabulary' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#dd8b8b] rounded-t-full" />
                )}
              </button>
            </div>
            
            <div className={`p-8 ${isContentFullscreen ? 'flex flex-col flex-1 min-h-0 overflow-hidden' : 'overflow-y-auto space-y-8'}`}>
              {activeTab === 'content' ? (
              <>
              {!isContentFullscreen && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40 ml-2">Sélectionner le cours</label>
                    <select 
                      value={selectedCourseId}
                      onChange={(e) => setSelectedCourseId(e.target.value)}
                      disabled={!!editingLesson}
                      className="w-full bg-[#F9F7F2] border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-[#dd8b8b] font-bold text-[#5A6B70] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.level} - {c.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40 ml-2">Titre de la leçon</label>
                    <input 
                      type="text" 
                      value={newLesson.title}
                      onChange={(e) => setNewLesson({...newLesson, title: e.target.value})}
                      placeholder="Ex: Maîtriser le passé composé"
                      className="w-full bg-[#F9F7F2] border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-[#dd8b8b] font-bold text-[#5A6B70]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40 ml-2">Lien Vidéo (YouTube ou .mp4)</label>
                    <div className="relative">
                      <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#dd8b8b]" />
                      <input 
                        type="text" 
                        value={newLesson.videoUrl}
                        onChange={(e) => setNewLesson({...newLesson, videoUrl: e.target.value})}
                        placeholder="https://..."
                        className="w-full bg-[#F9F7F2] border-none rounded-2xl py-4 pl-12 pr-6 focus:ring-2 focus:ring-[#dd8b8b] font-bold text-[#5A6B70]"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40 ml-2">Durée (ex: 12:30)</label>
                    <input 
                      type="text" 
                      value={newLesson.duration}
                      onChange={(e) => setNewLesson({...newLesson, duration: e.target.value})}
                      className="w-full bg-[#F9F7F2] border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-[#dd8b8b] font-bold text-[#5A6B70]"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40 ml-2 flex items-center gap-2 justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="w-3 h-3" /> Édition Markdown
                    </span>
                    <button
                      onClick={() => setIsContentFullscreen(true)}
                      className="p-2 hover:bg-[#dd8b8b]/10 rounded-lg transition-colors text-[#5A6B70]/60 hover:text-[#5A6B70]"
                      title="Plein écran"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </label>
                  <textarea 
                    value={newLesson.content}
                    onChange={(e) => setNewLesson({...newLesson, content: e.target.value})}
                    placeholder="# Titre\n\nBienvenue dans cette leçon..."
                    className="w-full bg-[#F9F7F2] border-none rounded-3xl py-6 px-8 focus:ring-2 focus:ring-[#dd8b8b] font-medium text-[#5A6B70] leading-relaxed min-h-[400px] resize-y"
                    style={{ resize: 'vertical' }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40 ml-2">Prévisualisation</label>
                  <div className="w-full bg-white rounded-3xl py-6 px-8 min-h-[400px] max-h-[600px] overflow-y-auto border border-[#dd8b8b]/10">
                    <StyledMarkdown content={newLesson.content || ''} />
                  </div>
                </div>
              </div>
              
              {isContentFullscreen && (
                <FullScreenMarkdownEditor
                  content={newLesson.content}
                  onChange={(newContent) => setNewLesson({...newLesson, content: newContent})}
                  onClose={() => setIsContentFullscreen(false)}
                  title={editingLesson ? 'Modifier la leçon' : 'Nouvelle leçon'}
                />
              )}
              </>
              ) : (
                <div className="space-y-6">
                  <div className="bg-[#F9F7F2] p-6 rounded-2xl border border-[#dd8b8b]/10">
                    <h3 className="text-lg font-bold text-[#5A6B70] mb-4 flex items-center gap-2">
                      <Book className="w-5 h-5 text-[#dd8b8b]" />
                      Ajouter un vocabulaire individuel
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40 mb-2 block">Français *</label>
                        <input
                          type="text"
                          value={vocabForm.french}
                          onChange={(e) => setVocabForm({...vocabForm, french: e.target.value})}
                          placeholder="Bonjour"
                          className="w-full bg-white border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#dd8b8b] font-bold text-[#5A6B70]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40 mb-2 block">Traduction *</label>
                        <input
                          type="text"
                          value={vocabForm.translation}
                          onChange={(e) => setVocabForm({...vocabForm, translation: e.target.value})}
                          placeholder="Hello"
                          className="w-full bg-white border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#dd8b8b] font-bold text-[#5A6B70]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40 mb-2 block">Prononciation (IPA)</label>
                        <input
                          type="text"
                          value={vocabForm.pronunciation}
                          onChange={(e) => setVocabForm({...vocabForm, pronunciation: e.target.value})}
                          placeholder="/bɔ̃.ʒuʁ/"
                          className="w-full bg-white border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#dd8b8b] font-mono text-[#5A6B70]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40 mb-2 block">Exemple d'utilisation</label>
                        <input
                          type="text"
                          value={vocabForm.example}
                          onChange={(e) => setVocabForm({...vocabForm, example: e.target.value})}
                          placeholder="Bonjour, comment allez-vous ?"
                          className="w-full bg-white border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#dd8b8b] font-medium text-[#5A6B70]"
                        />
                      </div>
                    </div>
                    <button
                      onClick={addVocabItem}
                      className="mt-4 flex items-center gap-2 bg-[#dd8b8b] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#c97a7a] transition-all text-sm"
                    >
                      <Plus className="w-4 h-4" /> Ajouter
                    </button>
                  </div>

                  <div className="bg-[#F9F7F2] p-6 rounded-2xl border border-[#dd8b8b]/10">
                    <h3 className="text-lg font-bold text-[#5A6B70] mb-4 flex items-center gap-2">
                      <Upload className="w-5 h-5 text-[#E8C586]" />
                      Ajout en masse (CSV ou JSON)
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40 mb-2 block">
                          Format CSV: french,translation,pronunciation,example (une ligne par vocabulaire)
                        </label>
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40 mb-2 block">
                          Format JSON: tableau d&apos;objets avec french, translation, pronunciation, example
                        </label>
                        <textarea
                          value={bulkVocabInput}
                          onChange={(e) => setBulkVocabInput(e.target.value)}
                          placeholder={`CSV:\nBonjour,Hello,/bɔ̃.ʒuʁ/,Bonjour, comment allez-vous ?\nMerci,Thank you,/mɛʁ.si/,Merci beaucoup\n\nOU\n\nJSON:\n[{"french":"Bonjour","translation":"Hello","pronunciation":"/bɔ̃.ʒuʁ/","example":"Bonjour, comment allez-vous ?"}]`}
                          rows={8}
                          className="w-full bg-white border-none rounded-xl py-4 px-4 focus:ring-2 focus:ring-[#dd8b8b] font-mono text-sm text-[#5A6B70]"
                        />
                      </div>
                      <button
                        onClick={handleBulkVocabImport}
                        className="flex items-center gap-2 bg-[#E8C586] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#d4b575] transition-all text-sm"
                      >
                        <Upload className="w-4 h-4" /> Importer
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-[#5A6B70] mb-4">
                      Vocabulaires de la leçon ({newLesson.vocabulary?.length || 0})
                    </h3>
                    {newLesson.vocabulary && newLesson.vocabulary.length > 0 ? (
                      <div className="space-y-3">
                        {newLesson.vocabulary.map((vocab) => (
                          <div
                            key={vocab.id}
                            className="bg-white p-4 rounded-xl border border-[#dd8b8b]/10 flex items-start justify-between gap-4"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-bold text-[#5A6B70] text-lg">{vocab.french}</span>
                                <span className="text-[#5A6B70]/60">→</span>
                                <span className="font-bold text-[#dd8b8b] text-lg">{vocab.translation}</span>
                              </div>
                              {vocab.pronunciation && (
                                <div className="text-sm font-mono text-[#5A6B70]/60 mb-1">
                                  {vocab.pronunciation}
                                </div>
                              )}
                              {vocab.example && (
                                <div className="text-sm italic text-[#5A6B70]/70">
                                  "{vocab.example}"
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => removeVocabItem(vocab.id)}
                              className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-white rounded-xl border-2 border-dashed border-[#dd8b8b]/20">
                        <Book className="w-8 h-8 text-[#5A6B70]/20 mx-auto mb-2" />
                        <p className="text-[#5A6B70]/40 font-medium">Aucun vocabulaire ajouté</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 border-t border-[#dd8b8b]/10 bg-[#F9F7F2]/30 flex justify-end gap-4">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40 hover:text-[#5A6B70]"
              >
                Annuler
              </button>
              <button 
                onClick={handleSaveLesson}
                disabled={loading}
                className="flex items-center gap-3 bg-[#dd8b8b] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-[#dd8b8b]/20 hover:scale-[1.02] transition-all disabled:opacity-50"
              >
                <Save className="w-5 h-5" /> {loading ? (editingLesson ? 'Modification...' : 'Publication...') : (editingLesson ? 'Modifier la leçon' : 'Publier la leçon')}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && !seeding ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 text-[#dd8b8b] animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-[40px] border border-[#dd8b8b]/10 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-[#dd8b8b]/10 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-[#5A6B70] serif-display italic">Contenus de la plateforme</h2>
          </div>
          
          <div className="p-8">
            {courses.length === 0 ? (
              <div className="text-center py-10">
                <Database className="w-12 h-12 text-[#5A6B70]/20 mx-auto mb-4" />
                <p className="text-[#5A6B70]/60 font-medium">Aucun cours trouvé dans la base de données.</p>
                <button onClick={seedDatabase} className="mt-4 text-[#dd8b8b] font-bold hover:underline">Initialiser avec les données par défaut</button>
              </div>
            ) : (
              courses.map(course => (
                <div key={course.id} className="mb-8 last:mb-0">
                  <h3 className="text-xl font-black text-[#5A6B70] mb-4 flex items-center gap-2 uppercase tracking-tight">
                    <span className="bg-[#dd8b8b] text-white px-2 py-0.5 rounded text-xs">{course.level}</span> {course.title}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {course.sections.map(section => (
                      section.lessons.map(lesson => (
                        <div 
                          key={lesson.id} 
                          onClick={() => handleEditLesson(course.id, section.id, lesson.id)}
                          className="bg-[#F9F7F2] p-4 rounded-2xl border border-[#dd8b8b]/5 cursor-pointer hover:border-[#dd8b8b] hover:shadow-md transition-all group relative"
                        >
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Edit className="w-4 h-4 text-[#dd8b8b]" />
                          </div>
                          <div className="font-bold text-[#5A6B70] mb-1 group-hover:text-[#dd8b8b] transition-colors pr-8">{lesson.title}</div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40">
                            {lesson.duration} • {lesson.type}
                          </div>
                          <div className="mt-2 text-[9px] text-[#5A6B70]/50 italic">
                            Cliquez pour modifier
                          </div>
                        </div>
                      ))
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal de gestion des ressources */}
      {isResourcesModalOpen && (
        <div className="fixed inset-0 bg-[#5A6B70]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="p-8 border-b border-[#dd8b8b]/10 flex justify-between items-center bg-[#F9F7F2]/50">
              <h2 className="text-3xl font-bold text-[#5A6B70] serif-display italic">
                Gérer les Ressources PDF
              </h2>
              <button 
                onClick={() => {
                  setIsResourcesModalOpen(false);
                  setResourceForm({ name: '', type: 'pdf', url: '' });
                }} 
                className="p-2 hover:bg-[#dd8b8b]/10 rounded-full transition-colors text-[#5A6B70]/40"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-8">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40 ml-2 mb-2 block">Sélectionner le cours</label>
                  <select 
                    value={selectedCourseForResources}
                    onChange={(e) => setSelectedCourseForResources(e.target.value)}
                    className="w-full bg-[#F9F7F2] border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-[#dd8b8b] font-bold text-[#5A6B70]"
                  >
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.level} - {c.title}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-[#F9F7F2] p-6 rounded-2xl border border-[#dd8b8b]/10">
                  <h3 className="text-lg font-bold text-[#5A6B70] mb-4">Ajouter une ressource</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40 mb-2 block">Nom de la ressource *</label>
                      <input
                        type="text"
                        value={resourceForm.name}
                        onChange={(e) => setResourceForm({...resourceForm, name: e.target.value})}
                        placeholder="Ex: Guide de grammaire A1"
                        className="w-full bg-white border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#dd8b8b] font-bold text-[#5A6B70]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40 mb-2 block">Type *</label>
                      <select
                        value={resourceForm.type}
                        onChange={(e) => setResourceForm({...resourceForm, type: e.target.value as 'pdf' | 'link' | 'zip'})}
                        className="w-full bg-white border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#dd8b8b] font-bold text-[#5A6B70]"
                      >
                        <option value="pdf">PDF</option>
                        <option value="link">Lien</option>
                        <option value="zip">ZIP</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40 mb-2 block">URL *</label>
                      <input
                        type="text"
                        value={resourceForm.url}
                        onChange={(e) => setResourceForm({...resourceForm, url: e.target.value})}
                        placeholder="https://example.com/file.pdf"
                        className="w-full bg-white border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#dd8b8b] font-medium text-[#5A6B70]"
                      />
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-xs text-[#5A6B70]/70">
                      <strong>💡 Astuce :</strong> Vous pouvez héberger vos PDFs sur des services gratuits comme GitHub (raw), Google Drive (lien partagé), Dropbox, ou un CDN. Collez simplement l'URL directe du fichier ici.
                    </p>
                  </div>
                  <button
                    onClick={handleAddResource}
                    disabled={loading || !resourceForm.name || !resourceForm.url}
                    className="mt-4 flex items-center gap-2 bg-[#dd8b8b] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#c97a7a] transition-all text-sm disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" /> Ajouter la ressource
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#5A6B70] mb-4">
                    Ressources du cours ({courses.find(c => c.id === selectedCourseForResources)?.resources?.length || 0})
                  </h3>
                  {courses.find(c => c.id === selectedCourseForResources)?.resources && courses.find(c => c.id === selectedCourseForResources)!.resources.length > 0 ? (
                    <div className="space-y-3">
                      {courses.find(c => c.id === selectedCourseForResources)!.resources.map((resource) => (
                        <div
                          key={resource.id}
                          className="bg-white p-4 rounded-xl border border-[#dd8b8b]/10 flex items-center justify-between group hover:border-[#dd8b8b] transition-all"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 bg-[#F9F7F2] rounded-xl flex items-center justify-center text-[#dd8b8b]">
                              <FileText className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-[#5A6B70]">{resource.name}</div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40 mt-1">
                                {resource.type} • <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-[#dd8b8b] hover:underline">{resource.url.length > 50 ? resource.url.substring(0, 50) + '...' : resource.url}</a>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveResource(resource.id)}
                            className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-white rounded-xl border-2 border-dashed border-[#dd8b8b]/20">
                      <FileText className="w-8 h-8 text-[#5A6B70]/20 mx-auto mb-2" />
                      <p className="text-[#5A6B70]/40 font-medium">Aucune ressource ajoutée</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorDashboard;
