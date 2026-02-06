import React, { useState } from 'react';
import { db } from '../services/firebase';
import { doc, setDoc, writeBatch, collection, getDocs, getDoc, updateDoc } from 'firebase/firestore';
import { Loader2, Upload, CheckCircle, AlertTriangle, RefreshCw, BookOpen } from 'lucide-react';
import { loadCourses } from '../utils/courseLoader';

const CourseDataManager: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

    // Granular Update State
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [selectedLessonId, setSelectedLessonId] = useState<string>('');

    const coursesData = loadCourses();

    const handleUpdateLesson = async () => {
        if (!selectedCourseId || !selectedLessonId) return;

        setLoading(true);
        setStatus({ type: 'info', message: `Mise à jour de la leçon ${selectedLessonId}...` });

        try {
            const courseData = coursesData.find((c: any) => c.id === selectedCourseId);
            if (!courseData) throw new Error("Cours non trouvé dans le JSON local");

            let newLessonData: any = null;
            let sectionIndex = -1;

            for (let sIdx = 0; sIdx < courseData.sections.length; sIdx++) {
                const s = courseData.sections[sIdx];
                const lIdx = s.lessons.findIndex((l: any) => l.id === selectedLessonId);
                if (lIdx !== -1) {
                    newLessonData = s.lessons[lIdx];
                    sectionIndex = sIdx;
                    break;
                }
            }

            if (!newLessonData) throw new Error("Leçon non trouvée dans le JSON local");

            const courseRef = doc(db, 'courses', selectedCourseId);
            const courseSnap = await getDoc(courseRef);

            if (!courseSnap.exists()) {
                throw new Error("Le cours n'existe pas encore dans Firestore. Faites une synchro complète d'abord.");
            }

            const firestoreData = courseSnap.data();
            const sections = [...firestoreData.sections];

            let fsSectionIndex = -1;
            let fsLessonIndex = -1;

            for (let i = 0; i < sections.length; i++) {
                const lIdx = sections[i].lessons.findIndex((l: any) => l.id === selectedLessonId);
                if (lIdx !== -1) {
                    fsSectionIndex = i;
                    fsLessonIndex = lIdx;
                    break;
                }
            }

            if (fsSectionIndex !== -1) {
                sections[fsSectionIndex].lessons[fsLessonIndex] = newLessonData;
            } else {
                if (sections[sectionIndex]) {
                    sections[sectionIndex].lessons.push(newLessonData);
                } else {
                    throw new Error("Structure incohérente entre JSON et Firestore.");
                }
            }

            await updateDoc(courseRef, { sections });
            setStatus({ type: 'success', message: `Leçon ${newLessonData.title} mise à jour avec succès !` });

        } catch (error: any) {
            console.error("Error updating lesson:", error);
            setStatus({ type: 'error', message: `Erreur : ${error.message}` });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateCourse = async () => {
        if (!selectedCourseId) return;

        if (!confirm(`Confirmer la mise à jour complète du cours ${selectedCourseId} ? Cela écrasera toutes les données de ce cours sur Firebase.`)) {
            return;
        }

        setLoading(true);
        setStatus({ type: 'info', message: `Mise à jour complète du cours ${selectedCourseId}...` });

        try {
            const courseData = coursesData.find((c: any) => c.id === selectedCourseId);
            if (!courseData) throw new Error("Cours non trouvé dans le JSON local");

            const courseRef = doc(db, 'courses', selectedCourseId);
            const cleanCourse = JSON.parse(JSON.stringify(courseData));
            await setDoc(courseRef, cleanCourse);

            setStatus({ type: 'success', message: `Cours ${courseData.title} entièrement mis à jour !` });

        } catch (error: any) {
            console.error("Error updating course:", error);
            setStatus({ type: 'error', message: `Erreur : ${error.message}` });
        } finally {
            setLoading(false);
        }
    };

    const handleLoadCourses = async () => {
        if (!confirm("Attention : Cela va écraser TOUS les cours existants dans Firebase. Continuer ?")) {
            return;
        }

        setLoading(true);
        setStatus({ type: 'info', message: 'Démarrage de la synchronisation...' });

        try {
            const batch = writeBatch(db);
            let count = 0;

            const courses = coursesData;

            if (!Array.isArray(courses)) {
                throw new Error("Format JSON invalide : 'courses' n'est pas un tableau");
            }

            for (const course of courses) {
                const docRef = doc(db, 'courses', course.id);
                const cleanCourse = JSON.parse(JSON.stringify(course));
                batch.set(docRef, cleanCourse);
                count++;
            }

            await batch.commit();
            setStatus({ type: 'success', message: `Succès ! ${count} cours ont été mis à jour.` });

        } catch (error: any) {
            console.error("Error uploading courses:", error);
            setStatus({ type: 'error', message: `Erreur : ${error.message}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-[40px] border border-[#dd8b8b]/10 shadow-sm p-8 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-[#5A6B70] serif-display italic mb-6">Gestion des Données</h2>

            <div className="bg-[#F9F7F2] p-6 rounded-2xl border border-[#dd8b8b]/10 mb-8">
                <h3 className="font-bold text-[#5A6B70] flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-orange-400" />
                    Zone Dangereuse
                </h3>
                <p className="text-sm text-[#5A6B70]/60 mb-6">
                    Ces actions modifient directement la base de données en direct.
                    Assurez-vous que le fichier <code>data/allCourses.json</code> est à jour.
                </p>

                {/* Granular Update Section */}
                <div className="mb-8 p-4 bg-white rounded-xl border border-blue-100 shadow-sm">
                    <h4 className="font-bold text-[#5A6B70] mb-4 flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-blue-500" />
                        Mise à jour Chirurgicale
                    </h4>
                    <p className="text-xs text-[#5A6B70]/70 mb-4">
                        1. Lancez d'abord <code>node scripts/update_json.mjs [CourseID] [LessonNum]</code><br />
                        2. Sélectionnez la leçon ci-dessous pour l'envoyer sur Firestore.
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <select
                            className="p-3 rounded-lg border border-gray-200"
                            value={selectedCourseId}
                            onChange={(e) => { setSelectedCourseId(e.target.value); setSelectedLessonId(''); }}
                        >
                            <option value="">Choisir un cours...</option>
                            {coursesData.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                        </select>

                        <select
                            className="p-3 rounded-lg border border-gray-200"
                            value={selectedLessonId}
                            onChange={(e) => setSelectedLessonId(e.target.value)}
                            disabled={!selectedCourseId}
                        >
                            <option value="">Choisir une leçon...</option>
                            {selectedCourseId && coursesData.find((c: any) => c.id === selectedCourseId)?.sections.flatMap((s: any) => s.lessons).map((l: any) => (
                                <option key={l.id} value={l.id}>{l.title} ({l.id})</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={handleUpdateLesson}
                            disabled={loading || !selectedLessonId}
                            className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all"
                        >
                            {loading && selectedLessonId ? <Loader2 className="animate-spin w-4 h-4" /> : <Upload className="w-4 h-4" />}
                            MAJ Leçon
                        </button>

                        <button
                            onClick={handleUpdateCourse}
                            disabled={loading || !selectedCourseId}
                            className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all"
                        >
                            {loading && selectedCourseId && !selectedLessonId ? <Loader2 className="animate-spin w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                            MAJ Cours Complet
                        </button>
                    </div>
                </div>

                <div className="h-px bg-gray-200 my-6"></div>

                <h4 className="font-bold text-[#5A6B70] mb-2 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    Zone Destructive (Tout écraser)
                </h4>

                <button
                    onClick={handleLoadCourses}
                    disabled={loading}
                    className="w-full py-4 bg-[#dd8b8b] hover:bg-[#c36f6f] text-white rounded-xl font-bold shadow-lg shadow-[#dd8b8b]/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Upload className="w-5 h-5" />
                    )}
                    Charger les cours depuis le JSON local
                </button>
            </div>

            {status && (
                <div className={`p-4 rounded-xl flex items-start gap-3 ${status.type === 'success' ? 'bg-green-50 text-green-700' :
                    status.type === 'error' ? 'bg-red-50 text-red-700' :
                        'bg-blue-50 text-blue-700'
                    }`}>
                    {status.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> :
                        status.type === 'error' ? <AlertTriangle className="w-5 h-5 shrink-0" /> :
                            <Loader2 className="w-5 h-5 shrink-0 animate-spin" />}
                    <div>
                        <p className="font-bold">{status.type === 'success' ? 'Succès' : status.type === 'error' ? 'Erreur' : 'En cours'}</p>
                        <p className="text-sm opacity-90">{status.message}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseDataManager;
