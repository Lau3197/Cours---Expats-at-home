import React, { useState } from 'react';
import { Book, Library, UserPlus, Dumbbell } from 'lucide-react';
import VocabularyTrainer from './VocabularyTrainer';
import VocabLessonsView from './VocabLessonsView';
import VocabUserView from './VocabUserView';
import VocabPracticeView from './VocabPracticeView';

type VocabularyTab = 'themes' | 'lessons' | 'my-vocab' | 'practice';

const VocabularyLayout: React.FC = () => {
    const [activeTab, setActiveTab] = useState<VocabularyTab>('themes');

    const tabs = [
        { id: 'themes' as VocabularyTab, label: 'Thèmes', icon: Library },
        { id: 'lessons' as VocabularyTab, label: 'Leçons', icon: Book },
        { id: 'my-vocab' as VocabularyTab, label: 'Mon Vocabulaire', icon: UserPlus },
        { id: 'practice' as VocabularyTab, label: 'Entraînement', icon: Dumbbell },
    ];

    return (
        <div className="min-h-screen bg-[#F9F7F2] p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-8">
                    <h1 className="text-4xl font-extrabold text-[#4A5568] mb-3 tracking-tight">
                        Vocabulaire
                    </h1>
                    <p className="text-[#A0AEC0] text-lg font-medium">
                        Gérez et entraînez votre vocabulaire français
                    </p>
                </header>

                {/* Tabs */}
                <div className="flex gap-4 mb-8 border-b border-[#dd8b8b]/20 pb-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold transition-all ${activeTab === tab.id
                                    ? 'bg-white text-[#dd8b8b] border-b-4 border-[#dd8b8b] translate-y-[2px]'
                                    : 'text-[#5A6B70]/60 hover:text-[#dd8b8b] hover:bg-white/50'
                                }`}
                        >
                            <tab.icon className="w-5 h-5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#dd8b8b]/10">
                    {activeTab === 'themes' && <VocabularyTrainer />}
                    {activeTab === 'lessons' && <VocabLessonsView />}
                    {activeTab === 'my-vocab' && <VocabUserView />}
                    {activeTab === 'practice' && <VocabPracticeView />}
                </div>
            </div>
        </div>
    );
};

export default VocabularyLayout;
