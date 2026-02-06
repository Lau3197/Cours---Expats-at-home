import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Target, Sparkles, Edit2, Check } from 'lucide-react';

const VisionBoard = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [visionText, setVisionText] = useState({
        dream: "Me sentir chez moi en Belgique et oser parler aux locaux.",
        goal: "Comprendre les blagues de mes collègues à la machine à café.",
        kiff: "Commander mes frites sans stresser !"
    });

    const handleSave = () => {
        setIsEditing(false);
        // TODO: Persist to localStorage or DB
    };

    return (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#E8C586]/30 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#fff5eb] rounded-bl-full -z-0 opacity-50" />

            <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-serif text-[#5A6B70] flex items-center gap-2">
                        <Sparkles className="text-[#E8C586]" />
                        Mon Pourquoi
                    </h2>
                    <button
                        onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                        className="p-2 text-[#dd8b8b] hover:bg-[#fff5eb] rounded-full transition-colors"
                    >
                        {isEditing ? <Check size={20} /> : <Edit2 size={20} />}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Card 1: The Dream */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-[#F9F7F2] p-6 rounded-2xl border-2 border-transparent hover:border-[#E8C586]/30 transition-all"
                    >
                        <div className="flex items-center gap-3 mb-3 text-[#dd8b8b] font-bold">
                            <Heart size={20} />
                            <h3>Mon Rêve</h3>
                        </div>
                        {isEditing ? (
                            <textarea
                                value={visionText.dream}
                                onChange={(e) => setVisionText({ ...visionText, dream: e.target.value })}
                                className="w-full bg-white p-2 rounded-lg text-sm text-[#5A6B70] focus:ring-2 focus:ring-[#E8C586] outline-none"
                                rows={3}
                            />
                        ) : (
                            <p className="text-[#5A6B70]/80 italic">"{visionText.dream}"</p>
                        )}
                    </motion.div>

                    {/* Card 2: The Concrete Goal */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-[#F9F7F2] p-6 rounded-2xl border-2 border-transparent hover:border-[#5A6B70]/10 transition-all"
                    >
                        <div className="flex items-center gap-3 mb-3 text-[#5A6B70] font-bold">
                            <Target size={20} />
                            <h3>Mon Objectif Pro</h3>
                        </div>
                        {isEditing ? (
                            <textarea
                                value={visionText.goal}
                                onChange={(e) => setVisionText({ ...visionText, goal: e.target.value })}
                                className="w-full bg-white p-2 rounded-lg text-sm text-[#5A6B70] focus:ring-2 focus:ring-[#E8C586] outline-none"
                                rows={3}
                            />
                        ) : (
                            <p className="text-[#5A6B70]/80 italic">"{visionText.goal}"</p>
                        )}
                    </motion.div>

                    {/* Card 3: The "Kiff" (Fun) */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-[#fff5eb] p-6 rounded-2xl border-2 border-transparent hover:border-[#dd8b8b]/30 transition-all"
                    >
                        <div className="flex items-center gap-3 mb-3 text-[#E8C586] font-bold">
                            <span className="text-xl">🍟</span>
                            <h3>Mon Petit Kiff</h3>
                        </div>
                        {isEditing ? (
                            <textarea
                                value={visionText.kiff}
                                onChange={(e) => setVisionText({ ...visionText, kiff: e.target.value })}
                                className="w-full bg-white p-2 rounded-lg text-sm text-[#5A6B70] focus:ring-2 focus:ring-[#E8C586] outline-none"
                                rows={3}
                            />
                        ) : (
                            <p className="text-[#5A6B70]/80 italic">"{visionText.kiff}"</p>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default VisionBoard;
