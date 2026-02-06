import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, CheckCircle2, Circle } from 'lucide-react';

const ConfianceMeter = () => {
    const [challenges, setChallenges] = useState([
        { id: 1, text: "Dire bonjour au chauffeur de bus", completed: true, points: 5 },
        { id: 2, text: "Commander un café en français", completed: false, points: 10 },
        { id: 3, text: "Répondre au téléphone sans paniquer", completed: false, points: 20 },
        { id: 4, text: "Demander mon chemin dans la rue", completed: false, points: 15 },
        { id: 5, text: "Faire une blague (même nulle) !", completed: false, points: 25 },
    ]);

    const toggleChallenge = (id: number) => {
        setChallenges(challenges.map(c =>
            c.id === id ? { ...c, completed: !c.completed } : c
        ));
    };

    const totalPoints = challenges.reduce((acc, curr) => acc + curr.points, 0);
    const currentPoints = challenges.filter(c => c.completed).reduce((acc, curr) => acc + curr.points, 0);
    const progress = (currentPoints / totalPoints) * 100;

    return (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#dd8b8b]/20">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-serif text-[#5A6B70] flex items-center gap-2">
                    <Trophy className="text-[#dd8b8b]" />
                    Confiance Meter
                </h2>
                <div className="text-right">
                    <span className="text-3xl font-handwritten font-bold text-[#dd8b8b]">{currentPoints}</span>
                    <span className="text-sm text-[#5A6B70]/60 uppercase font-bold tracking-wider"> / {totalPoints} pts d'audace</span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-4 bg-[#F9F7F2] rounded-full overflow-hidden mb-8 shadow-inner">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-[#dd8b8b] to-[#E8C586] rounded-full"
                />
            </div>

            <div className="space-y-3">
                {challenges.map((challenge) => (
                    <motion.div
                        key={challenge.id}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => toggleChallenge(challenge.id)}
                        className={`cursor-pointer p-4 rounded-xl border flex items-center justify-between transition-all ${challenge.completed
                                ? 'bg-[#f0fdf4] border-green-200 text-[#5A6B70]'
                                : 'bg-white border-gray-100 text-[#5A6B70]/60 hover:border-[#dd8b8b]/30'
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            {challenge.completed
                                ? <CheckCircle2 className="text-green-500 shrink-0" />
                                : <Circle className="text-[#dd8b8b]/30 shrink-0" />
                            }
                            <span className={challenge.completed ? 'font-medium' : ''}>{challenge.text}</span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${challenge.completed ? 'bg-green-100 text-green-700' : 'bg-[#F9F7F2] text-[#5A6B70]/40'
                            }`}>
                            +{challenge.points} pts
                        </span>
                    </motion.div>
                ))}
            </div>

            <div className="mt-6 text-center">
                <p className="text-sm text-[#5A6B70]/60 italic font-handwritten">
                    "Le courage n'est pas l'absence de peur, mais la capacité de la vaincre."
                </p>
            </div>
        </div>
    );
};

export default ConfianceMeter;
