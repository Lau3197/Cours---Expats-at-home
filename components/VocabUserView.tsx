import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Volume2, Save, X } from 'lucide-react';
import { VocabularyItem } from '../types';

const VocabUserView: React.FC = () => {
    const [userVocab, setUserVocab] = useState<VocabularyItem[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        french: '',
        english: '',
        example: '',
        level: 'A1' as const,
    });

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('userVocabulary');
        if (saved) {
            try {
                setUserVocab(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load user vocabulary', e);
            }
        }
    }, []);

    // Save to localStorage whenever userVocab changes
    useEffect(() => {
        localStorage.setItem('userVocabulary', JSON.stringify(userVocab));
    }, [userVocab]);

    const speak = (text: string) => {
        if (!text) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.french || !formData.english) return;

        if (editingId) {
            // Update existing
            setUserVocab((prev) =>
                prev.map((item) =>
                    item.id === editingId
                        ? { ...item, ...formData }
                        : item
                )
            );
            setEditingId(null);
        } else {
            // Add new
            const newWord: VocabularyItem = {
                id: `user-${Date.now()}`,
                french: formData.french,
                english: formData.english,
                example: formData.example,
                level: formData.level,
                gender: 'm', // Default
                subTheme: 'Personnalisé',
                themeId: 'user-custom',
                userCreated: true,
            };
            setUserVocab((prev) => [...prev, newWord]);
        }

        // Reset form
        setFormData({ french: '', english: '', example: '', level: 'A1' });
        setIsAdding(false);
    };

    const handleEdit = (word: VocabularyItem) => {
        setFormData({
            french: word.french,
            english: word.english,
            example: word.example,
            level: word.level,
        });
        setEditingId(word.id);
        setIsAdding(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('Supprimer ce mot ?')) {
            setUserVocab((prev) => prev.filter((item) => item.id !== id));
        }
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({ french: '', english: '', example: '', level: 'A1' });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-[#5A6B70]">Mon Vocabulaire</h2>
                    <p className="text-[#A0AEC0] text-sm">
                        {userVocab.length} mot{userVocab.length > 1 ? 's' : ''} personnalisé{userVocab.length > 1 ? 's' : ''}
                    </p>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-[#dd8b8b] text-white rounded-2xl font-bold hover:scale-105 transition-transform shadow-lg"
                    >
                        <Plus className="w-5 h-5" />
                        Ajouter un mot
                    </button>
                )}
            </div>

            {/* Add/Edit Form */}
            {isAdding && (
                <form onSubmit={handleSubmit} className="bg-white border-2 border-[#dd8b8b] rounded-2xl p-6 mb-6">
                    <h3 className="text-lg font-bold text-[#5A6B70] mb-4">
                        {editingId ? 'Modifier le mot' : 'Nouveau mot'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-bold text-[#5A6B70] mb-2">
                                Mot en français *
                            </label>
                            <input
                                type="text"
                                value={formData.french}
                                onChange={(e) => setFormData({ ...formData, french: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-[#dd8b8b]/20 focus:border-[#dd8b8b] focus:outline-none"
                                placeholder="le chat"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-[#5A6B70] mb-2">
                                Traduction en anglais *
                            </label>
                            <input
                                type="text"
                                value={formData.english}
                                onChange={(e) => setFormData({ ...formData, english: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-[#dd8b8b]/20 focus:border-[#dd8b8b] focus:outline-none"
                                placeholder="the cat"
                                required
                            />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-bold text-[#5A6B70] mb-2">
                            Exemple (optionnel)
                        </label>
                        <input
                            type="text"
                            value={formData.example}
                            onChange={(e) => setFormData({ ...formData, example: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-[#dd8b8b]/20 focus:border-[#dd8b8b] focus:outline-none"
                            placeholder="Le chat mange une souris."
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-6 py-3 bg-[#dd8b8b] text-white rounded-xl font-bold hover:scale-105 transition-transform"
                        >
                            <Save className="w-4 h-4" />
                            {editingId ? 'Mettre à jour' : 'Ajouter'}
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-[#5A6B70] rounded-xl font-bold hover:bg-gray-300 transition-colors"
                        >
                            <X className="w-4 h-4" />
                            Annuler
                        </button>
                    </div>
                </form>
            )}

            {/* Vocabulary List */}
            {userVocab.length === 0 ? (
                <div className="text-center py-20 bg-[#F9F7F2] rounded-2xl">
                    <p className="text-[#5A6B70]/60 italic mb-4">Aucun mot personnalisé pour l'instant</p>
                    <p className="text-sm text-[#5A6B70]/40">
                        Cliquez sur "Ajouter un mot" pour commencer
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userVocab.map((word) => (
                        <div
                            key={word.id}
                            className="bg-white border border-[#dd8b8b]/10 rounded-2xl p-5 hover:shadow-lg transition-shadow group"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="text-xl font-bold text-[#5A6B70]">{word.french}</h3>
                                <button
                                    onClick={() => speak(word.french)}
                                    className="p-2 rounded-full hover:bg-[#F9F7F2] text-[#dd8b8b] transition-colors"
                                >
                                    <Volume2 className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-[#5A6B70]/70 mb-3">{word.english}</p>
                            {word.example && (
                                <p className="text-xs text-[#5A6B70]/50 italic mb-4 border-t border-[#dd8b8b]/10 pt-3">
                                    "{word.example}"
                                </p>
                            )}
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEdit(word)}
                                    className="flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                                >
                                    <Edit2 className="w-3 h-3" />
                                    Modifier
                                </button>
                                <button
                                    onClick={() => handleDelete(word.id)}
                                    className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                                >
                                    <Trash2 className="w-3 h-3" />
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default VocabUserView;
