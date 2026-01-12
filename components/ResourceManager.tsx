import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Link as LinkIcon, FileText, Video, Mic, Package, ExternalLink, Loader2, Search } from 'lucide-react';
import { getAllResources, addResource, deleteResource, AdminResource } from '../services/resources';

const ResourceManager: React.FC = () => {
    const [resources, setResources] = useState<AdminResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // Form State
    const [newTitle, setNewTitle] = useState('');
    const [newType, setNewType] = useState<AdminResource['type']>('link');
    const [newUrl, setNewUrl] = useState('');
    const [newSection, setNewSection] = useState('');
    const [filter, setFilter] = useState('');

    useEffect(() => {
        loadResources();
    }, []);

    const loadResources = async () => {
        setLoading(true);
        try {
            const data = await getAllResources();
            setResources(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const added = await addResource({
                title: newTitle,
                type: newType,
                url: newUrl,
                section: newSection || 'Général'
            });
            setResources([added, ...resources]);
            setIsAdding(false);
            setNewTitle('');
            setNewUrl('');
            setNewSection('');
        } catch (error) {
            alert("Erreur lors de l'ajout");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Supprimer cette ressource ?")) return;
        try {
            await deleteResource(id);
            setResources(resources.filter(r => r.id !== id));
        } catch (error) {
            alert("Erreur lors de la suppression");
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'pdf': return <FileText className="w-5 h-5 text-red-500" />;
            case 'video': return <Video className="w-5 h-5 text-purple-500" />;
            case 'audio': return <Mic className="w-5 h-5 text-pink-500" />;
            case 'zip': return <Package className="w-5 h-5 text-amber-500" />;
            default: return <LinkIcon className="w-5 h-5 text-blue-500" />;
        }
    };

    const filteredResources = resources.filter(r =>
        r.title.toLowerCase().includes(filter.toLowerCase()) ||
        r.section?.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-[#5A6B70] serif-display italic">Bibliothèque de Ressources</h2>
                    <p className="text-[#5A6B70]/60 sans-handwritten text-lg">Centralisez vos PDFs, Liens et Documents</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 bg-[#dd8b8b] text-white px-6 py-3 rounded-full font-bold shadow-sm hover:shadow-md transition-all hover:scale-105"
                >
                    <Plus className="w-5 h-5" />
                    {isAdding ? 'Fermer' : 'Nouvelle Ressource'}
                </button>
            </div>

            {/* Add Form */}
            {isAdding && (
                <form onSubmit={handleAdd} className="bg-white p-6 rounded-[32px] border border-[#dd8b8b]/10 shadow-sm space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-[#5A6B70] uppercase mb-1">Titre</label>
                            <input
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                className="w-full bg-[#F9F7F2] border-none rounded-xl px-4 py-3 text-[#5A6B70] focus:ring-2 focus:ring-[#dd8b8b]"
                                placeholder="ex: Fiche Grammaire - Le Subjonctif"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#5A6B70] uppercase mb-1">URL / Lien</label>
                            <input
                                value={newUrl}
                                onChange={e => setNewUrl(e.target.value)}
                                className="w-full bg-[#F9F7F2] border-none rounded-xl px-4 py-3 text-[#5A6B70] focus:ring-2 focus:ring-[#dd8b8b]"
                                placeholder="https://..."
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#5A6B70] uppercase mb-1">Type</label>
                            <select
                                value={newType}
                                onChange={e => setNewType(e.target.value as AdminResource['type'])}
                                className="w-full bg-[#F9F7F2] border-none rounded-xl px-4 py-3 text-[#5A6B70] focus:ring-2 focus:ring-[#dd8b8b]"
                            >
                                <option value="link">Lien / Site Web</option>
                                <option value="pdf">Document PDF</option>
                                <option value="video">Vidéo</option>
                                <option value="audio">Audio</option>
                                <option value="zip">Archive ZIP</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#5A6B70] uppercase mb-1">Section (Optionnel)</label>
                            <input
                                value={newSection}
                                onChange={e => setNewSection(e.target.value)}
                                className="w-full bg-[#F9F7F2] border-none rounded-xl px-4 py-3 text-[#5A6B70] focus:ring-2 focus:ring-[#dd8b8b]"
                                placeholder="ex: Grammaire, Vocabulaire, Culture..."
                            />
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-[#5A6B70] text-white px-8 py-3 rounded-full font-bold hover:bg-[#5A6B70]/90 transition-colors">
                            Ajouter la ressource
                        </button>
                    </div>
                </form>
            )}

            {/* List */}
            <div className="bg-white p-8 rounded-[40px] border border-[#dd8b8b]/10 shadow-sm min-h-[400px]">
                <div className="flex items-center gap-4 mb-6 bg-[#F9F7F2] p-2 rounded-xl">
                    <Search className="w-5 h-5 text-[#5A6B70]/40 ml-2" />
                    <input
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        placeholder="Rechercher une ressource..."
                        className="bg-transparent border-none w-full text-[#5A6B70] focus:ring-0 placeholder-[#5A6B70]/30"
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="w-8 h-8 text-[#dd8b8b] animate-spin" />
                    </div>
                ) : resources.length === 0 ? (
                    <div className="text-center py-12 text-[#5A6B70]/40 italic">
                        Aucune ressource pour le moment.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {filteredResources.map(resource => (
                            <div key={resource.id} className="group flex items-center justify-between p-4 rounded-2xl hover:bg-[#F9F7F2] transition-colors border border-transparent hover:border-[#dd8b8b]/10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                                        {getIcon(resource.type)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[#5A6B70]">{resource.title}</h3>
                                        <div className="flex items-center gap-2 text-xs text-[#5A6B70]/60">
                                            <span className="bg-[#5A6B70]/5 px-2 py-0.5 rounded-md uppercase tracking-wider text-[10px] font-bold">{resource.section}</span>
                                            {resource.type.toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a
                                        href={resource.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 rounded-full hover:bg-white text-[#5A6B70] hover:text-[#dd8b8b] transition-colors"
                                        title="Ouvrir le lien"
                                    >
                                        <ExternalLink className="w-5 h-5" />
                                    </a>
                                    <button
                                        onClick={() => handleDelete(resource.id)}
                                        className="p-2 rounded-full hover:bg-white text-[#5A6B70]/40 hover:text-red-500 transition-colors"
                                        title="Supprimer"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResourceManager;
