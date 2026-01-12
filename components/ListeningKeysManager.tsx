import React, { useState, useEffect } from 'react';
import {
    Plus,
    X,
    Loader2,
    CheckCircle,
    Edit,
    Trash2,
    Video,
    FileText,
    Youtube,
    Hash,
    Target,
    User
} from 'lucide-react';
import { ListeningLesson } from '../types';
import { getListeningLessons, addListeningLesson, updateListeningLesson, deleteListeningLesson } from '../services/listening';

interface ListeningKeysManagerProps {
    onRefetch?: () => void;
}

const ListeningKeysManager: React.FC<ListeningKeysManagerProps> = ({ onRefetch }) => {
    const [lessons, setLessons] = useState<ListeningLesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [currentLesson, setCurrentLesson] = useState<Partial<ListeningLesson>>({
        number: 1,
        title: '',
        focus: '',
        youtuber: '',
        videoLink: '',
        docLink: ''
    });

    useEffect(() => {
        fetchLessons();
    }, []);

    const fetchLessons = async () => {
        setLoading(true);
        try {
            const fetchedLessons = await getListeningLessons();
            setLessons(fetchedLessons);
        } catch (error) {
            console.error("Error fetching listening lessons:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (lesson?: ListeningLesson) => {
        if (lesson) {
            setIsEditing(true);
            setCurrentLesson({ ...lesson });
        } else {
            setIsEditing(false);
            // Auto-increment number based on last lesson
            const nextNumber = lessons.length > 0 ? (Math.max(...lessons.map(l => l.number)) + 1) : 1;
            setCurrentLesson({
                number: nextNumber,
                title: '',
                focus: '',
                youtuber: '',
                videoLink: '',
                docLink: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!currentLesson.title || !currentLesson.focus || !currentLesson.youtuber || !currentLesson.videoLink || !currentLesson.docLink) {
            alert("Veuillez remplir tous les champs.");
            return;
        }

        setLoading(true);
        try {
            const lessonData = { ...currentLesson } as any;

            if (isEditing && currentLesson.id) {
                await updateListeningLesson(currentLesson.id, {
                    number: lessonData.number,
                    title: lessonData.title,
                    focus: lessonData.focus,
                    youtuber: lessonData.youtuber,
                    videoLink: lessonData.videoLink,
                    docLink: lessonData.docLink
                });
            } else {
                const { id, ...newLessonData } = lessonData;
                await addListeningLesson(newLessonData);
            }

            setIsModalOpen(false);
            fetchLessons();
            if (onRefetch) onRefetch();
        } catch (error) {
            console.error("Error saving lesson:", error);
            alert("Une erreur est survenue lors de la sauvegarde.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette leçon ?")) return;
        setLoading(true);
        try {
            await deleteListeningLesson(id);
            fetchLessons();
            if (onRefetch) onRefetch();
        } catch (error) {
            console.error("Error deleting lesson:", error);
            alert("Erreur lors de la suppression.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-[#5A6B70] serif-display italic">The Listening Keys</h2>
                    <p className="text-[#5A6B70]/60 sans-handwritten text-lg">Gérez les leçons vidéos</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-[#6A994E] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#5a8242] transition-all shadow-lg"
                >
                    <Plus className="w-5 h-5" /> Nouvelle Leçon
                </button>
            </div>

            {loading && !isModalOpen ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-[#6A994E] animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {lessons.length === 0 ? (
                        <p className="text-[#5A6B70]/40 italic text-center py-8">Aucune leçon pour le moment.</p>
                    ) : (
                        lessons.map((lesson) => (
                            <div key={lesson.id} className="bg-white p-6 rounded-2xl border border-[#6A994E]/20 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-md transition-all group">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-[#6A994E]/10 flex items-center justify-center text-[#6A994E] font-black text-xl shrink-0">
                                        #{lesson.number}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-[#5A6B70] mb-1">{lesson.title}</h3>
                                        <div className="flex flex-wrap gap-3 text-sm text-[#5A6B70]/70">
                                            <div className="flex items-center gap-1 bg-[#F9F7F2] px-2 py-1 rounded-md">
                                                <Target className="w-3 h-3 text-[#6A994E]" />
                                                <span className="font-bold">Focus:</span> {lesson.focus}
                                            </div>
                                            <div className="flex items-center gap-1 bg-[#F9F7F2] px-2 py-1 rounded-md">
                                                <User className="w-3 h-3 text-[#6A994E]" />
                                                <span className="font-bold">YouTuber:</span> {lesson.youtuber}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleOpenModal(lesson)}
                                        className="p-3 bg-[#F9F7F2] text-[#5A6B70] hover:text-[#6A994E] hover:bg-[#6A994E]/10 rounded-xl transition-all"
                                        title="Modifier"
                                    >
                                        <Edit className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(lesson.id)}
                                        className="p-3 bg-[#F9F7F2] text-[#5A6B70] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        title="Supprimer"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-[#5A6B70]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-[#dd8b8b]/10 flex justify-between items-center bg-[#F9F7F2]/50">
                            <h2 className="text-2xl font-bold text-[#5A6B70] serif-display italic">
                                {isEditing ? 'Modifier la leçon' : 'Nouvelle Leçon'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-[#dd8b8b]/10 rounded-full transition-colors text-[#5A6B70]/40"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto space-y-6">
                            <div className="grid grid-cols-4 gap-4">
                                <div className="col-span-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40 mb-2 block">N°</label>
                                    <div className="relative">
                                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6A994E]" />
                                        <input
                                            type="number"
                                            value={currentLesson.number}
                                            onChange={(e) => setCurrentLesson({ ...currentLesson, number: parseInt(e.target.value) })}
                                            className="w-full bg-[#F9F7F2] border-none rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-[#6A994E] font-bold text-[#5A6B70]"
                                        />
                                    </div>
                                </div>
                                <div className="col-span-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40 mb-2 block">Titre de la leçon *</label>
                                    <input
                                        type="text"
                                        value={currentLesson.title}
                                        onChange={(e) => setCurrentLesson({ ...currentLesson, title: e.target.value })}
                                        placeholder="Ex: Les courses au supermarché"
                                        className="w-full bg-[#F9F7F2] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#6A994E] font-bold text-[#5A6B70]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40 mb-2 block">Focus *</label>
                                    <div className="relative">
                                        <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6A994E]" />
                                        <input
                                            type="text"
                                            value={currentLesson.focus}
                                            onChange={(e) => setCurrentLesson({ ...currentLesson, focus: e.target.value })}
                                            placeholder="Ex: Vocabulaire alimentaire"
                                            className="w-full bg-[#F9F7F2] border-none rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-[#6A994E] font-medium text-[#5A6B70]"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40 mb-2 block">YouTuber *</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6A994E]" />
                                        <input
                                            type="text"
                                            value={currentLesson.youtuber}
                                            onChange={(e) => setCurrentLesson({ ...currentLesson, youtuber: e.target.value })}
                                            placeholder="Ex: Cyprien"
                                            className="w-full bg-[#F9F7F2] border-none rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-[#6A994E] font-medium text-[#5A6B70]"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40 mb-2 block">Lien Vidéo (YouTube) *</label>
                                <div className="relative">
                                    <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6A994E]" />
                                    <input
                                        type="text"
                                        value={currentLesson.videoLink}
                                        onChange={(e) => setCurrentLesson({ ...currentLesson, videoLink: e.target.value })}
                                        placeholder="https://youtube.com/watch?v=..."
                                        className="w-full bg-[#F9F7F2] border-none rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-[#6A994E] font-medium text-[#5A6B70]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40 mb-2 block">Lien Document (PDF/Drive) *</label>
                                <div className="relative">
                                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6A994E]" />
                                    <input
                                        type="text"
                                        value={currentLesson.docLink}
                                        onChange={(e) => setCurrentLesson({ ...currentLesson, docLink: e.target.value })}
                                        placeholder="https://drive.google.com/..."
                                        className="w-full bg-[#F9F7F2] border-none rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-[#6A994E] font-medium text-[#5A6B70]"
                                    />
                                </div>
                            </div>

                        </div>

                        <div className="p-8 border-t border-[#dd8b8b]/10 bg-[#F9F7F2]/30 flex justify-end gap-4">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40 hover:text-[#5A6B70]"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="flex items-center gap-2 bg-[#6A994E] text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                Sauvegarder
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListeningKeysManager;
