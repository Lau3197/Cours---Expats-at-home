
import React, { useState, useEffect } from 'react';
import {
    Calendar,
    MapPin,
    Trash2,
    Archive,
    Edit,
    Plus,
    X,
    Loader2,
    CheckCircle,
    Clock,
    Video
} from 'lucide-react';
import { Session } from '../types';
import { getSessions, addSession, updateSession, deleteSession, archiveSession } from '../services/sessions';

interface SessionManagerProps {
    onRefetch?: () => void;
}

const SessionManager: React.FC<SessionManagerProps> = ({ onRefetch }) => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSession, setCurrentSession] = useState<Partial<Session>>({
        title: '',
        description: '',
        date: '',
        time: '', // We'll combine date + time for ISO string
        teamsLink: '',
        type: 'exchange',
        status: 'upcoming'
    });
    const [isEditing, setIsEditing] = useState(false);
    const [dateInput, setDateInput] = useState('');
    const [timeInput, setTimeInput] = useState('');

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        setLoading(true);
        try {
            // Fetch all sessions and sort them locally or via query
            // The service fetches all ordered by date desc
            const fetchedSessions = await getSessions();
            setSessions(fetchedSessions);
        } catch (error) {
            console.error("Error fetching sessions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (session?: Session) => {
        if (session) {
            setIsEditing(true);
            const dateDate = new Date(session.date);
            // Format YYYY-MM-DD for input date
            const yyyy = dateDate.getFullYear();
            const mm = String(dateDate.getMonth() + 1).padStart(2, '0');
            const dd = String(dateDate.getDate()).padStart(2, '0');

            // Format HH:MM for input time
            const hh = String(dateDate.getHours()).padStart(2, '0');
            const min = String(dateDate.getMinutes()).padStart(2, '0');

            setDateInput(`${yyyy}-${mm}-${dd}`);
            setTimeInput(`${hh}:${min}`);

            setCurrentSession({ ...session });
        } else {
            setIsEditing(false);
            setDateInput('');
            setTimeInput('');
            setCurrentSession({
                title: '',
                description: '',
                teamsLink: '',
                type: 'exchange',
                status: 'upcoming'
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!currentSession.title || !dateInput || !timeInput) {
            alert("Veuillez remplir tous les champs obligatoires (Titre, Date, Heure).");
            return;
        }

        setLoading(true);
        try {
            const dateTimeString = `${dateInput}T${timeInput}:00`; // Simple ISO format construction
            const sessionData = {
                ...currentSession,
                date: dateTimeString
            } as Session; // Cast as Session for now, createdAt handled in service for new

            if (isEditing && currentSession.id) {
                await updateSession(currentSession.id, {
                    title: sessionData.title,
                    description: sessionData.description,
                    date: sessionData.date,
                    teamsLink: sessionData.teamsLink,
                    type: sessionData.type,
                    status: sessionData.status
                });
            } else {
                // remove id if present (should not be for new)
                const { id, ...newSessionData } = sessionData;
                await addSession(newSessionData);
            }

            setIsModalOpen(false);
            fetchSessions();
            if (onRefetch) onRefetch();
        } catch (error) {
            console.error("Error saving session:", error);
            alert("Une erreur est survenue lors de la sauvegarde.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette session ? Cette action est irréversible.")) return;
        setLoading(true);
        try {
            await deleteSession(id);
            fetchSessions();
            if (onRefetch) onRefetch();
        } catch (error) {
            console.error("Error deleting session:", error);
            alert("Erreur lors de la suppression.");
        } finally {
            setLoading(false);
        }
    };

    const handleArchive = async (id: string) => {
        if (!window.confirm("Voulez-vous archiver cette session ? Elle apparaîtra dans les archives.")) return;
        setLoading(true);
        try {
            await archiveSession(id);
            fetchSessions();
            if (onRefetch) onRefetch();
        } catch (error) {
            console.error("Error archiving session:", error);
            alert("Erreur lros de l'archivage.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-[#5A6B70] serif-display italic">Gestion des Sessions</h2>
                    <p className="text-[#5A6B70]/60 sans-handwritten text-lg">Échanges & Culture</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-[#dd8b8b] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#c97a7a] transition-all shadow-lg"
                >
                    <Plus className="w-5 h-5" /> Nouvelle Session
                </button>
            </div>

            {loading && !isModalOpen ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-[#dd8b8b] animate-spin" />
                </div>
            ) : (
                <div className="space-y-8">
                    {['exchange', 'culture'].map((type) => {
                        const typeSessions = sessions.filter(s => s.type === type);
                        const color = type === 'exchange' ? '#dd8b8b' : '#E8C586';
                        const title = type === 'exchange' ? "Les Clés de l'Échange" : "Les Clés de la Culture";

                        return (
                            <div key={type} className="bg-white rounded-[32px] p-8 border border-[#dd8b8b]/10 shadow-sm">
                                <h3 className="text-2xl font-black text-[#5A6B70] mb-6 flex items-center gap-3">
                                    <span className={`w-3 h-3 rounded-full bg-[${color}]`}></span>
                                    {title}
                                </h3>

                                {typeSessions.length === 0 ? (
                                    <p className="text-[#5A6B70]/40 italic text-center py-8">Aucune session programmée.</p>
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {typeSessions.map(session => (
                                            <div key={session.id} className={`p-6 rounded-2xl border ${session.status === 'archived' ? 'bg-gray-50 border-gray-200 opacity-70' : `bg-[#F9F7F2] border-[${color}]/20`} relative group transition-all`}>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${session.status === 'archived' ? 'text-gray-400' : `text-[${color}]`}`}>
                                                            {new Date(session.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                                        </div>
                                                        <div className="text-xs font-bold text-[#5A6B70]/60 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(session.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                    <div className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${session.status === 'upcoming' ? 'bg-green-100 text-green-600' :
                                                        session.status === 'past' ? 'bg-orange-100 text-orange-600' :
                                                            'bg-gray-200 text-gray-500'
                                                        }`}>
                                                        {session.status === 'upcoming' ? 'À venir' : session.status === 'past' ? 'Passé' : 'Archivé'}
                                                    </div>
                                                </div>

                                                <h4 className="text-lg font-bold text-[#5A6B70] mb-2">{session.title}</h4>
                                                {session.description && <p className="text-sm text-[#5A6B70]/70 mb-4 line-clamp-2">{session.description}</p>}

                                                <div className="flex items-center gap-2 mb-4 text-xs font-medium text-[#5A6B70]/60 bg-white p-2 rounded-lg border border-[#dd8b8b]/5">
                                                    <Video className="w-3 h-3 text-[#dd8b8b]" />
                                                    <span className="truncate max-w-[200px]">{session.teamsLink}</span>
                                                </div>

                                                <div className="flex justify-end gap-2 pt-4 border-t border-[#dd8b8b]/10">
                                                    <button
                                                        onClick={() => handleOpenModal(session)}
                                                        className="p-2 hover:bg-[#dd8b8b]/10 text-[#5A6B70] hover:text-[#dd8b8b] rounded-lg transition-colors"
                                                        title="Modifier"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>

                                                    {session.status !== 'archived' && (
                                                        <button
                                                            onClick={() => handleArchive(session.id)}
                                                            className="p-2 hover:bg-orange-50 text-[#5A6B70] hover:text-orange-500 rounded-lg transition-colors"
                                                            title="Archiver"
                                                        >
                                                            <Archive className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => handleDelete(session.id)}
                                                        className="p-2 hover:bg-red-50 text-[#5A6B70] hover:text-red-500 rounded-lg transition-colors"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-[#5A6B70]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-[#dd8b8b]/10 flex justify-between items-center bg-[#F9F7F2]/50">
                            <h2 className="text-2xl font-bold text-[#5A6B70] serif-display italic">
                                {isEditing ? 'Modifier la session' : 'Nouvelle Session'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-[#dd8b8b]/10 rounded-full transition-colors text-[#5A6B70]/40"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40 mb-2 block">Type</label>
                                    <select
                                        value={currentSession.type}
                                        onChange={(e) => setCurrentSession({ ...currentSession, type: e.target.value as 'exchange' | 'culture' })}
                                        className="w-full bg-[#F9F7F2] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#dd8b8b] font-bold text-[#5A6B70]"
                                    >
                                        <option value="exchange">Clés de l'Échange</option>
                                        <option value="culture">Clés de la Culture</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40 mb-2 block">Statut</label>
                                    <select
                                        value={currentSession.status}
                                        onChange={(e) => setCurrentSession({ ...currentSession, status: e.target.value as any })}
                                        className="w-full bg-[#F9F7F2] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#dd8b8b] font-bold text-[#5A6B70]"
                                    >
                                        <option value="upcoming">À venir</option>
                                        <option value="past">Passé</option>
                                        <option value="archived">Archivé</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40 mb-2 block">Titre *</label>
                                <input
                                    type="text"
                                    value={currentSession.title}
                                    onChange={(e) => setCurrentSession({ ...currentSession, title: e.target.value })}
                                    placeholder="Ex: Soirée Débat - L'écologie"
                                    className="w-full bg-[#F9F7F2] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#dd8b8b] font-bold text-[#5A6B70]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40 mb-2 block">Date *</label>
                                    <input
                                        type="date"
                                        value={dateInput}
                                        onChange={(e) => setDateInput(e.target.value)}
                                        className="w-full bg-[#F9F7F2] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#dd8b8b] font-bold text-[#5A6B70]"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40 mb-2 block">Heure *</label>
                                    <input
                                        type="time"
                                        value={timeInput}
                                        onChange={(e) => setTimeInput(e.target.value)}
                                        className="w-full bg-[#F9F7F2] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#dd8b8b] font-bold text-[#5A6B70]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40 mb-2 block">Lien Teams (Optionnel)</label>
                                <div className="relative">
                                    <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#dd8b8b]" />
                                    <input
                                        type="text"
                                        value={currentSession.teamsLink}
                                        onChange={(e) => setCurrentSession({ ...currentSession, teamsLink: e.target.value })}
                                        placeholder="https://teams.microsoft.com/..."
                                        className="w-full bg-[#F9F7F2] border-none rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-[#dd8b8b] font-medium text-[#5A6B70]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40 mb-2 block">Description</label>
                                <textarea
                                    value={currentSession.description || ''}
                                    onChange={(e) => setCurrentSession({ ...currentSession, description: e.target.value })}
                                    rows={3}
                                    className="w-full bg-[#F9F7F2] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#dd8b8b] font-medium text-[#5A6B70]"
                                />
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
                                className="flex items-center gap-2 bg-[#dd8b8b] text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50"
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

export default SessionManager;
