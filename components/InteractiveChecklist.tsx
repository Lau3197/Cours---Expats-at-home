import React, { useState } from 'react';
import { Check, Circle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChecklistItem {
    id: string;
    label: string;
    description?: string;
}

interface InteractiveChecklistProps {
    title: string;
    items: ChecklistItem[];
    color?: string;
}

const InteractiveChecklist: React.FC<InteractiveChecklistProps> = ({
    title,
    items,
    color = "#dd8b8b"
}) => {
    const [checkedState, setCheckedState] = useState<{ [key: string]: boolean }>({});

    const toggleItem = (id: string) => {
        setCheckedState(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const progress = Math.round(
        (Object.values(checkedState).filter(Boolean).length / items.length) * 100
    );

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 my-8">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                <div className="text-sm font-bold" style={{ color }}>
                    {progress}% Complete
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-gray-100 rounded-full mb-6 overflow-hidden">
                <div
                    className="h-full transition-all duration-500 ease-out rounded-full"
                    style={{
                        width: `${progress}%`,
                        backgroundColor: color
                    }}
                />
            </div>

            <div className="space-y-3">
                {items.map((item) => {
                    const isChecked = checkedState[item.id];
                    return (
                        <motion.div
                            key={item.id}
                            initial={false}
                            animate={{ backgroundColor: isChecked ? `${color}10` : '#ffffff' }}
                            className="group relative flex items-start gap-4 p-4 rounded-xl border border-gray-100 cursor-pointer hover:border-gray-200 transition-colors"
                            onClick={() => toggleItem(item.id)}
                        >
                            <div
                                className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isChecked
                                        ? 'border-transparent text-white'
                                        : 'border-gray-300 group-hover:border-gray-400'
                                    }`}
                                style={{ backgroundColor: isChecked ? color : 'transparent' }}
                            >
                                {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>

                            <div className="flex-1">
                                <span className={`font-medium transition-all ${isChecked ? 'text-gray-500 line-through' : 'text-gray-800'
                                    }`}>
                                    {item.label}
                                </span>
                                {item.description && (
                                    <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default InteractiveChecklist;
