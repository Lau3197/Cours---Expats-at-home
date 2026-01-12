import React, { useState, useEffect, useRef } from 'react';
import { X, GripVertical, Save, Trash2, ChevronLeft, BookOpen, Search } from 'lucide-react';

interface Note {
    courseId: string;
    lessonId: string;
    courseTitle: string;
    lessonTitle: string;
    content: string;
    updatedAt: string;
}

const CarnetPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingNote, setEditingNote] = useState<Note | null>(null);

    useEffect(() => {
        // Load all notes from localStorage
        const allNotes: Note[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('notes_')) {
                try {
                    const noteData = JSON.parse(localStorage.getItem(key) || '{}');
                    if (noteData.content) {
                        allNotes.push(noteData);
                    }
                } catch (e) {
                    // Skip malformed entries
                }
            }
        }
        // Sort by updatedAt descending
        allNotes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setNotes(allNotes);
    }, []);

    const deleteNote = (courseId: string, lessonId: string) => {
        localStorage.removeItem(`notes_${courseId}_${lessonId}`);
        setNotes(notes.filter(n => !(n.courseId === courseId && n.lessonId === lessonId)));
    };

    const saveEditedNote = () => {
        if (!editingNote) return;
        const key = `notes_${editingNote.courseId}_${editingNote.lessonId}`;
        const updatedNote = { ...editingNote, updatedAt: new Date().toISOString() };
        localStorage.setItem(key, JSON.stringify(updatedNote));
        setNotes(notes.map(n =>
            (n.courseId === editingNote.courseId && n.lessonId === editingNote.lessonId) ? updatedNote : n
        ));
        setEditingNote(null);
    };

    const filteredNotes = notes.filter(n =>
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.lessonTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.courseTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group notes by course
    const groupedNotes: Record<string, Note[]> = {};
    filteredNotes.forEach(note => {
        if (!groupedNotes[note.courseTitle]) {
            groupedNotes[note.courseTitle] = [];
        }
        groupedNotes[note.courseTitle].push(note);
    });

    return (
        <div className="min-h-screen bg-[#F9F7F2]">
            <div className="max-w-4xl mx-auto px-6 py-12">
                {/* Header */}
                <button onClick={onBack} className="flex items-center text-[#dd8b8b] font-bold mb-8 hover:opacity-80 transition-opacity">
                    <ChevronLeft className="w-5 h-5 mr-2" /> Retour
                </button>

                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <BookOpen className="w-10 h-10 text-[#dd8b8b]" />
                        <h1 className="text-4xl font-black text-[#5A6B70] serif-display italic">Mon Carnet</h1>
                    </div>
                    <p className="text-[#5A6B70]/60">Toutes vos notes de cours au même endroit</p>
                </div>

                {/* Search */}
                <div className="relative mb-8">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5A6B70]/40" />
                    <input
                        type="text"
                        placeholder="Rechercher dans vos notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#dd8b8b]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#dd8b8b]/30"
                    />
                </div>

                {/* Notes List */}
                {Object.keys(groupedNotes).length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-[#dd8b8b]/10">
                        <p className="text-[#5A6B70]/40 text-lg">Aucune note pour l'instant.</p>
                        <p className="text-[#5A6B70]/30 text-sm mt-2">Prenez des notes pendant vos leçons avec le bouton 📝</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {Object.entries(groupedNotes).map(([courseTitle, courseNotes]) => (
                            <div key={courseTitle} className="bg-white rounded-2xl border border-[#dd8b8b]/10 overflow-hidden">
                                <div className="bg-[#5A6B70] text-white px-6 py-3 font-bold">{courseTitle}</div>
                                <div className="divide-y divide-[#dd8b8b]/10">
                                    {courseNotes.map((note) => (
                                        <div key={`${note.courseId}_${note.lessonId}`} className="p-6">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h3 className="font-bold text-[#5A6B70]">{note.lessonTitle}</h3>
                                                    <p className="text-xs text-[#5A6B70]/40">
                                                        Modifié le {new Date(note.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setEditingNote(note)}
                                                        className="p-2 text-[#5A6B70]/40 hover:text-[#dd8b8b] transition-colors"
                                                    >
                                                        <Save className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteNote(note.courseId, note.lessonId)}
                                                        className="p-2 text-[#5A6B70]/40 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-[#5A6B70]/70 whitespace-pre-wrap text-sm leading-relaxed line-clamp-4">{note.content}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Edit Modal */}
                {editingNote && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-[#dd8b8b]/10">
                                <h3 className="font-bold text-[#5A6B70]">{editingNote.lessonTitle}</h3>
                                <button onClick={() => setEditingNote(null)} className="p-1 text-[#5A6B70]/40 hover:text-[#5A6B70]">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <textarea
                                value={editingNote.content}
                                onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                                className="flex-1 p-6 resize-none focus:outline-none text-[#5A6B70]"
                                placeholder="Vos notes..."
                            />
                            <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#dd8b8b]/10">
                                <button onClick={() => setEditingNote(null)} className="px-4 py-2 text-[#5A6B70]/60 hover:text-[#5A6B70]">
                                    Annuler
                                </button>
                                <button onClick={saveEditedNote} className="px-4 py-2 bg-[#dd8b8b] text-white rounded-lg font-bold hover:bg-[#dd8b8b]/90">
                                    Sauvegarder
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CarnetPage;
