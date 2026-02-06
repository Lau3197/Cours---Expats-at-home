import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, MessageCircle, Briefcase, ChevronDown, ChevronUp, MapPin } from 'lucide-react';

type Category = 'admin' | 'social' | 'pro' | 'places';

const BelgianToolkit = () => {
    const [activeCategory, setActiveCategory] = useState<Category | null>('social');

    const categories = [
        {
            id: 'social',
            title: 'Vie Sociale & Apéro',
            icon: <MessageCircle size={20} />,
            color: 'bg-[#dd8b8b]',
            content: (
                <ul className="space-y-3">
                    <li className="flex gap-3 items-start">
                        <span className="bg-[#dd8b8b]/10 text-[#dd8b8b] font-bold px-2 rounded text-sm">BE</span>
                        <div>
                            <span className="font-bold text-[#5A6B70]">Ça me goûte !</span>
                            <p className="text-sm text-[#5A6B70]/70">C'est délicieux / J'aime bien ça.</p>
                        </div>
                    </li>
                    <li className="flex gap-3 items-start">
                        <span className="bg-[#dd8b8b]/10 text-[#dd8b8b] font-bold px-2 rounded text-sm">BE</span>
                        <div>
                            <span className="font-bold text-[#5A6B70]">À tantôt</span>
                            <p className="text-sm text-[#5A6B70]/70">À tout à l'heure (et pas "à cet après-midi").</p>
                        </div>
                    </li>
                    <li className="flex gap-3 items-start">
                        <span className="bg-[#dd8b8b]/10 text-[#dd8b8b] font-bold px-2 rounded text-sm">BE</span>
                        <div>
                            <span className="font-bold text-[#5A6B70]">Dire "S'il vous plaît"</span>
                            <p className="text-sm text-[#5A6B70]/70">Quand on tend un objet à quelqu'un (équivalent de "voici").</p>
                        </div>
                    </li>
                </ul>
            )
        },
        {
            id: 'admin',
            title: 'Administration & Commune',
            icon: <Book size={20} />,
            color: 'bg-[#5A6B70]',
            content: (
                <div className="space-y-4">
                    <div className="bg-[#F9F7F2] p-4 rounded-lg">
                        <h4 className="font-bold text-[#5A6B70] mb-2 underline">Mots-clés indispensables</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <span className="font-medium">Maison communale</span>
                            <span className="text-[#5A6B70]/60">Mairie / Hôtel de ville</span>
                            <span className="font-medium">Composition de ménage</span>
                            <span className="text-[#5A6B70]/60">Preuve de qui vit chez toi</span>
                            <span className="font-medium">Domiciliation</span>
                            <span className="text-[#5A6B70]/60">S'inscrire à l'adresse</span>
                        </div>
                    </div>
                    <div className="bg-[#F9F7F2] p-4 rounded-lg">
                        <h4 className="font-bold text-[#5A6B70] mb-2">Script : Demander un document</h4>
                        <p className="text-sm italic text-[#5A6B70]/80">"Bonjour, je voudrais obtenir une composition de ménage pour mon dossier de mutuelle. Est-ce que je peux l'avoir immédiatement ?"</p>
                    </div>
                </div>
            )
        },
        {
            id: 'places',
            title: 'Mes Safe Places',
            icon: <MapPin size={20} />,
            color: 'bg-[#E8C586]',
            content: (
                <div className="text-center py-6">
                    <p className="text-[#5A6B70]/70 mb-4">Note ici tes endroits préférés où tu te sens bien pour parler français.</p>
                    <div className="space-y-2">
                        <input type="text" placeholder="Ex: Café de la Presse (Avenue Louise)" className="w-full bg-[#F9F7F2] border-none rounded-lg p-2 text-sm" />
                        <input type="text" placeholder="Ex: Bibliothèque Woluwe" className="w-full bg-[#F9F7F2] border-none rounded-lg p-2 text-sm" />
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="bg-white rounded-3xl p-8 shadow-sm">
            <h2 className="text-2xl font-serif text-[#5A6B70] mb-6 flex items-center gap-2">
                <span className="text-2xl">🇧🇪</span>
                Boîte à Outils Belge
            </h2>

            <div className="space-y-3">
                {categories.map((cat) => (
                    <div key={cat.id} className="border border-gray-100 rounded-2xl overflow-hidden">
                        <button
                            onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id as Category)}
                            className={`w-full p-4 flex items-center justify-between transition-colors ${activeCategory === cat.id ? 'bg-[#F9F7F2]' : 'hover:bg-gray-50'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-full text-white ${cat.color} opacity-80`}>
                                    {cat.icon}
                                </div>
                                <span className="font-bold text-[#5A6B70]">{cat.title}</span>
                            </div>
                            {activeCategory === cat.id ? <ChevronUp size={20} className="text-[#5A6B70]/40" /> : <ChevronDown size={20} className="text-[#5A6B70]/40" />}
                        </button>

                        <AnimatePresence>
                            {activeCategory === cat.id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-4 pt-0">
                                        <div className="h-px w-full bg-gray-100 mb-4" />
                                        {cat.content}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BelgianToolkit;
