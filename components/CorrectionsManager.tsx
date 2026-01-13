import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, FileText, Upload, User, Send, X } from 'lucide-react';
import { getAllPendingSubmissions, provideFeedback } from '../services/corrections';
import { Submission } from '../types';

const CorrectionsManager: React.FC = () => {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
    const [feedback, setFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchPending();
    }, []);

    const fetchPending = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getAllPendingSubmissions();
            setSubmissions(data);
            if (data.length === 0) console.log("No pending submissions found.");
        } catch (err: any) {
            console.error("Fetch error:", err);
            setError(err.message || "Erreur de chargement");
        } finally {
            setLoading(false);
        }
    };

    // Temporary Debug Function
    const debugFetchAll = async () => {
        setLoading(true);
        setError(null);
        try {
            // Import dynamically or assume simple fetch
            const { collection, getDocs, limit, query: qQuery } = await import('firebase/firestore');
            const { db } = await import('../services/firebase');

            // Try fetching ANY submission without filters
            const snap = await getDocs(qQuery(collection(db, 'submissions'), limit(5)));
            const all: any[] = [];
            snap.forEach(d => all.push({ id: d.id, ...d.data() }));

            alert(`DEBUG: Found ${all.length} raw documents.\n${all.map(d => `${d.title} (${d.status})`).join('\n')}`);
            if (all.length > 0) setSubmissions(all);
        } catch (e: any) {
            alert(`DEBUG ERROR: ${e.message}`);
        }
        setLoading(false);
    };

    const handleSendFeedback = async () => {
        if (!selectedSubmission) return;
        setSubmitting(true);
        try {
            await provideFeedback(selectedSubmission.id, feedback);
            setSelectedSubmission(null);
            setFeedback('');
            fetchPending(); // Refresh list
        } catch (error) {
            alert("Erreur lors de l'envoi de la correction");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[600px]">
            {/* List Column */}
            <div className="lg:col-span-1 space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-[#5A6B70] serif-display italic">À Corriger</h2>
                    <p className="text-[#5A6B70]/60 sans-handwritten">
                        {submissions.length} travaux en attente
                    </p>
                </div>

                <div className="space-y-4">
                    <button onClick={debugFetchAll} className="w-full bg-gray-200 text-xs py-2 rounded mb-4">
                        🔍 Debug: Afficher TOUT (sans filtre)
                    </button>
                    {error && (
                        <div className="p-4 bg-red-100 text-red-600 rounded-xl text-sm font-bold border border-red-200">
                            Erreur: {error}
                        </div>
                    )}

                    {submissions.length === 0 && !loading && !error && (
                        <div className="p-8 text-center bg-white rounded-2xl border border-[#dd8b8b]/10 text-[#5A6B70]/40 italic">
                            Tout est à jour ! 🎉
                        </div>
                    )}

                    {submissions.map(sub => (
                        <div
                            key={sub.id}
                            onClick={() => setSelectedSubmission(sub)}
                            className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${selectedSubmission?.id === sub.id
                                ? 'border-[#dd8b8b] ring-2 ring-[#dd8b8b]/10'
                                : 'border-[#dd8b8b]/10 hover:border-[#dd8b8b]/50'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${sub.type === 'exchange' ? 'bg-blue-50 text-blue-500' :
                                    sub.type === 'culture' ? 'bg-purple-50 text-purple-500' :
                                        'bg-orange-50 text-orange-500'
                                    }`}>
                                    {sub.type}
                                </span>
                                <span className="text-[10px] font-bold text-[#5A6B70]/40">
                                    {new Date(sub.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <h3 className="font-bold text-[#5A6B70] mb-1">{sub.title}</h3>
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-[#dd8b8b]/10 overflow-hidden">
                                    {sub.studentAvatar ? <img src={sub.studentAvatar} className="w-full h-full object-cover" /> : <User className="w-3 h-3 text-[#dd8b8b] m-1" />}
                                </div>
                                <span className="text-xs text-[#5A6B70]/80">{sub.studentName}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Detail Column */}
            <div className="lg:col-span-2">
                {selectedSubmission ? (
                    <div className="bg-white rounded-[40px] border border-[#dd8b8b]/10 shadow-lg overflow-hidden flex flex-col h-full">
                        <div className="p-8 border-b border-[#dd8b8b]/10 bg-[#F9F7F2]/30 flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold text-[#5A6B70] serif-display italic mb-2">{selectedSubmission.title}</h1>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-[#dd8b8b]/10">
                                        <User className="w-4 h-4 text-[#dd8b8b]" />
                                        <span className="text-sm font-bold text-[#5A6B70]">{selectedSubmission.studentName}</span>
                                    </div>
                                    {selectedSubmission.fileUrl && (
                                        <a href={selectedSubmission.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-[#dd8b8b]/10 text-[#dd8b8b] hover:bg-[#dd8b8b]/5">
                                            <Upload className="w-4 h-4" /> Fichier joint
                                        </a>
                                    )}
                                </div>
                            </div>
                            <button onClick={() => setSelectedSubmission(null)} className="p-2 hover:bg-[#F9F7F2] rounded-full text-[#5A6B70]/40">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8 flex-1 overflow-y-auto">
                            <div className="mb-8">
                                <h4 className="text-xs font-black text-[#5A6B70]/40 uppercase tracking-widest mb-4">Contenu de l'élève</h4>
                                <div className="bg-[#F9F7F2] p-6 rounded-2xl text-[#5A6B70] whitespace-pre-wrap leading-relaxed">
                                    {selectedSubmission.content}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-black text-[#dd8b8b] uppercase tracking-widest mb-4">Votre Correction</h4>
                                <textarea
                                    className="w-full h-64 bg-white border-2 border-[#dd8b8b]/20 rounded-2xl p-6 focus:ring-4 focus:ring-[#dd8b8b]/10 focus:border-[#dd8b8b] transition-all text-[#5A6B70] font-medium resize-none"
                                    placeholder="Écrivez votre feedback ici..."
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                />
                                <div className="flex justify-end mt-4">
                                    <button
                                        onClick={handleSendFeedback}
                                        disabled={!feedback || submitting}
                                        className="bg-[#dd8b8b] text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-[#c97b7b] transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <Send className="w-4 h-4" /> Envoyer la correction
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center bg-[#F9F7F2]/50 rounded-[40px] border border-dashed border-[#dd8b8b]/20 text-center p-8">
                        <FileText className="w-16 h-16 text-[#dd8b8b]/20 mb-4" />
                        <h3 className="text-xl font-bold text-[#5A6B70]/60">Aucune sélection</h3>
                        <p className="text-[#5A6B70]/40">Sélectionnez un travail à gauche pour le corriger.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CorrectionsManager;
