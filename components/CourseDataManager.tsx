import React, { useState } from 'react';
import { db } from '../services/firebase';
import { doc, setDoc, writeBatch, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { Loader2, Upload, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import allCoursesData from '../data/allCourses.json'; // Direct import

const CourseDataManager: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

    const handleLoadCourses = async () => {
        if (!confirm("Attention : Cela va écraser les cours existants dans Firebase avec les données du fichier local JSON. Continuer ?")) {
            return;
        }

        setLoading(true);
        setStatus({ type: 'info', message: 'Démarrage de la synchronisation...' });

        try {
            // 1. Get all current courses
            const coursesRef = collection(db, 'courses');
            const snapshot = await getDocs(coursesRef);

            // 2. Delete existing courses (to ensure clean slate or use setDoc with merge:false)
            // For safety, let's just overwrite known IDs from JSON, but if structure changed significantly
            // we might want to clean up. For now, let's just Upsert.

            const batch = writeBatch(db);
            let count = 0;

            const courses = (allCoursesData as any).courses || allCoursesData; // Handle potential wrapper

            if (!Array.isArray(courses)) {
                throw new Error("Format JSON invalide : 'courses' n'est pas un tableau");
            }

            for (const course of courses) {
                const docRef = doc(db, 'courses', course.id);
                // Ensure plain objects
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
