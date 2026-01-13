import React, { useState, useEffect } from 'react';
import { Send, Clock, CheckCircle, FileText, Upload, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { submitWork, getStudentSubmissions } from '../services/corrections';
import { Submission } from '../types';

const CoachingSpace: React.FC = () => {
    const { user } = useAuth();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [type, setType] = useState<Submission['type']>('exchange');
    const [content, setContent] = useState('');
    const [link, setLink] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            fetchSubmissions();
        }
    }, [user]);

    const fetchSubmissions = async () => {
        if (!user) return;
        setLoading(true);
        const data = await getStudentSubmissions(user.uid);
        setSubmissions(data);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSubmitting(true);
        try {
            await submitWork({
                studentId: user.uid,
                studentName: user.name,
                studentAvatar: user.avatar,
                title,
                type,
                content,
                fileUrl: link, // Using link as fileUrl for now (Google Drive etc)
                status: 'pending',
                createdAt: new Date().toISOString()
            } as any); // Type assertion for Omit
            setShowForm(false);
            setTitle('');
            setContent('');
            setLink('');
            fetchSubmissions();
        } catch (error) {
            alert("Erreur lors de l'envoi");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-bold text-[#5A6B70] serif-display italic mb-2">Mon Espace Coaching</h1>
                    <p className="text-[#5A6B70]/60 sans-handwritten text-lg">Envoyez vos travaux et recevez vos corrections personnalisées.</p>
                </div>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-[#dd8b8b] text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-[#c97b7b] transition-all flex items-center gap-2"
                    >
                        <Send className="w-4 h-4" /> Envoyer un travail
                    </button>
                )}
            </div>

            {/* Submission Form */}
            {showForm && (
                <div className="bg-white rounded-[40px] p-8 border border-[#dd8b8b]/10 shadow-lg animate-in fade-in slide-in-from-bottom-4">
                    <h3 className="text-2xl font-bold text-[#5A6B70] mb-6 serif-display italic">Nouvelle Soumission</h3>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-[#5A6B70] uppercase mb-2">Titre</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="Ex: Session Échange #4"
                                    className="w-full bg-[#F9F7F2] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#dd8b8b] text-[#5A6B70] font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#5A6B70] uppercase mb-2">Type</label>
                                <select
                                    value={type}
                                    onChange={e => setType(e.target.value as any)}
                                    className="w-full bg-[#F9F7F2] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#dd8b8b] text-[#5A6B70] font-medium"
                                >
                                    <option value="exchange">Clés de l'Échange</option>
                                    <option value="culture">Clés de la Culture</option>
                                    <option value="lesson">Exercice de Leçon</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#5A6B70] uppercase mb-2">Votre texte / Message</label>
                            <textarea
                                required
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                rows={6}
                                placeholder="Écrivez votre texte ici..."
                                className="w-full bg-[#F9F7F2] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#dd8b8b] text-[#5A6B70] font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#5A6B70] uppercase mb-2">Lien vers un fichier (Google Drive, Dropbox...)</label>
                            <div className="relative">
                                <Upload className="absolute left-4 top-1/2 -translate-y-1/2 text-[#dd8b8b] w-4 h-4" />
                                <input
                                    type="url"
                                    value={link}
                                    onChange={e => setLink(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full bg-[#F9F7F2] border-none rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-[#dd8b8b] text-[#5A6B70] font-medium"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-6 py-2 rounded-full font-bold text-[#5A6B70]/60 hover:bg-[#F9F7F2]"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="bg-[#dd8b8b] text-white px-8 py-2 rounded-full font-bold shadow-lg hover:bg-[#c97b7b] transition-all disabled:opacity-50"
                            >
                                {submitting ? 'Envoi...' : 'Envoyer'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Submissions List */}
            <div className="space-y-6">
                {submissions.length === 0 && !loading && (
                    <div className="text-center py-20 bg-white rounded-[40px] border border-[#dd8b8b]/10">
                        <FileText className="w-12 h-12 text-[#dd8b8b]/20 mx-auto mb-4" />
                        <p className="text-[#5A6B70]/40 font-bold">Aucune soumission pour le moment.</p>
                    </div>
                )}

                {submissions.map((sub) => (
                    <div key={sub.id} className="bg-white rounded-[30px] overflow-hidden border border-[#dd8b8b]/10 shadow-sm hover:shadow-md transition-all">
                        {/* Header */}
                        <div className="p-6 flex justify-between items-start bg-[#F9F7F2]/30 border-b border-[#dd8b8b]/10">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${sub.type === 'exchange' ? 'bg-blue-100 text-blue-500' :
                                        sub.type === 'culture' ? 'bg-purple-100 text-purple-500' :
                                            'bg-orange-100 text-orange-500'
                                    }`}>
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#5A6B70] text-lg">{sub.title}</h3>
                                    <div className="flex items-center gap-3 text-xs font-bold text-[#5A6B70]/60 uppercase tracking-wider mt-1">
                                        <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span>{sub.type}</span>
                                    </div>
                                </div>
                            </div>
                            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 ${sub.status === 'corrected'
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-yellow-100 text-yellow-600'
                                }`}>
                                {sub.status === 'corrected' ? (
                                    <><CheckCircle className="w-3 h-3" /> Corrigé</>
                                ) : (
                                    <><Clock className="w-3 h-3" /> En attente</>
                                )}
                            </span>
                        </div>

                        {/* Content */}
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-[#5A6B70]/40 uppercase tracking-widest flex items-center gap-2">
                                    <User className="w-3 h-3" /> Votre travail
                                </h4>
                                <div className="bg-[#F9F7F2] p-6 rounded-2xl text-[#5A6B70] text-sm leading-relaxed whitespace-pre-wrap">
                                    {sub.content}
                                </div>
                                {sub.fileUrl && (
                                    <a
                                        href={sub.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-[#dd8b8b] font-bold text-sm hover:underline"
                                    >
                                        <Upload className="w-4 h-4" /> Voir le fichier joint
                                    </a>
                                )}
                            </div>

                            {/* Feedback Section */}
                            {sub.status === 'corrected' && sub.feedback ? (
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-green-600/60 uppercase tracking-widest flex items-center gap-2">
                                        <CheckCircle className="w-3 h-3" /> Correction
                                    </h4>
                                    <div className="bg-green-50 p-6 rounded-2xl border border-green-100 text-[#5A6B70] text-sm leading-relaxed whitespace-pre-wrap">
                                        {sub.feedback}
                                    </div>
                                    <div className="text-right text-[10px] text-[#5A6B70]/40 font-bold uppercase">
                                        Corrigé le {sub.correctedAt ? new Date(sub.correctedAt).toLocaleDateString() : ''}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-8 text-center h-full bg-[#F9F7F2]/50 rounded-2xl border border-dashed border-[#dd8b8b]/20">
                                    <Clock className="w-8 h-8 text-[#dd8b8b]/20 mb-2" />
                                    <p className="text-[#5A6B70]/40 text-sm font-medium">Votre professeur corrige votre travail...</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CoachingSpace;
