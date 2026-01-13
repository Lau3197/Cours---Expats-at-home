
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Volume2, Trophy, PartyPopper, Check, X, RotateCcw, BarChart2 } from 'lucide-react';
import { VocabItem } from '../types';

interface VocabTrainerProps {
  vocab: VocabItem[];
}

const VocabTrainer: React.FC<VocabTrainerProps> = ({ vocab }) => {
  const [mode, setMode] = useState<'cards' | 'game'>('cards');
  const [isFlipped, setIsFlipped] = useState(false);
  const [score, setScore] = useState(0);

  // Learning states
  const [learningQueue, setLearningQueue] = useState<number[]>([]);
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardTransition, setCardTransition] = useState<'left' | 'right' | null>(null);

  // Quiz states
  const [quizQueue, setQuizQueue] = useState<number[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  // Initialize
  useEffect(() => {
    if (vocab && vocab.length > 0) {
      const ids = vocab.map((_, i) => i);
      setLearningQueue([...ids]);
      setQuizQueue([...ids].sort(() => Math.random() - 0.5));
      setCurrentIndex(0);
      setQuizIndex(0);
      setMasteredIds(new Set());
      setIsFinished(false);
      setScore(0);
      setIsFlipped(false);
    }
  }, [vocab, mode]);

  const speak = useCallback((text: string) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, []);

  const handleMastery = (isKnown: boolean) => {
    if (!learningQueue.length || cardTransition) return;

    const currentVocabIndex = learningQueue[currentIndex];
    const item = vocab[currentVocabIndex];
    if (!item) return;

    setCardTransition(isKnown ? 'right' : 'left');

    setTimeout(() => {
      setCardTransition(null);
      setIsFlipped(false);

      if (isKnown) {
        const newMastered = new Set(masteredIds);
        newMastered.add(item.id);
        setMasteredIds(newMastered);

        const newQueue = [...learningQueue];
        newQueue.splice(currentIndex, 1);

        if (newQueue.length === 0) {
          setIsFinished(true);
        } else {
          setLearningQueue(newQueue);
          setCurrentIndex(prev => prev >= newQueue.length ? 0 : prev);
        }
      } else {
        const newQueue = [...learningQueue];
        const failingItem = newQueue.splice(currentIndex, 1)[0];
        newQueue.push(failingItem);
        setLearningQueue(newQueue);
      }
    }, 400);
  };

  const handleQuizChoice = (selectedId: string) => {
    if (feedback || !quizQueue.length) return;
    const item = vocab[quizQueue[quizIndex]];
    if (!item) return;

    if (selectedId === item.id) {
      setFeedback('correct');
      setScore(s => s + 10);
      setTimeout(() => {
        setFeedback(null);
        if (quizIndex + 1 >= quizQueue.length) {
          setIsFinished(true);
        } else {
          setQuizIndex(prev => prev + 1);
        }
      }, 700);
    } else {
      setFeedback('wrong');
      setScore(s => Math.max(0, s - 5));
      speak(item.french);
      setTimeout(() => {
        setFeedback(null);
        const newQueue = [...quizQueue];
        const fail = newQueue.splice(quizIndex, 1)[0];
        newQueue.push(fail);
        setQuizQueue(newQueue);
      }, 1200);
    }
  };

  const activeItemIndex = mode === 'cards' ? learningQueue[currentIndex] : quizQueue[quizIndex];
  const activeItem = (activeItemIndex !== undefined && activeItemIndex !== null && vocab && vocab[activeItemIndex]) ? vocab[activeItemIndex] : null;

  const currentOptions = useMemo(() => {
    if (mode !== 'game' || !activeItem || !vocab) return [];

    // Get all other items as potential distractors
    const others = vocab.filter(v => v.id !== activeItem.id);
    // Shuffle distractors and take 3
    const distractors = others.sort(() => Math.random() - 0.5).slice(0, 3);
    // Combine with correct answer and shuffle again
    return [activeItem, ...distractors].sort(() => Math.random() - 0.5);
  }, [activeItem, mode, vocab]);

  const progressPercentage = (masteredIds.size / (vocab?.length || 1)) * 100;

  if (!vocab || vocab.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-[#C87A7A]/20">
        <p className="text-[#5A6B70]/40 sans-handwritten italic text-xl">
          "Pas encore de vocabulaire !"
        </p>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="bg-white rounded-[40px] p-16 border border-[#C87A7A]/10 shadow-2xl text-center max-w-2xl mx-auto animate-in zoom-in duration-700 ease-out">
        <div className="w-24 h-24 bg-[#E8C586]/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
          <PartyPopper className="w-12 h-12 text-[#E8C586]" />
        </div>
        <h3 className="text-4xl font-bold text-[#5A6B70] serif-display italic mb-4">Lesson Complete!</h3>
        <p className="text-[#5A6B70]/60 sans-handwritten text-xl mb-10 italic">
          Bravo ! You've mastered all {vocab.length} words today.
        </p>
        <button
          onClick={() => { setIsFinished(false); setMasteredIds(new Set()); setCurrentIndex(0); setMode('cards'); setIsFlipped(false); }}
          className="px-12 py-5 bg-[#C87A7A] text-white rounded-2xl font-black sans-geometric uppercase tracking-widest text-xs shadow-xl hover:scale-110 active:scale-95 transition-all duration-300"
        >
          Study Again
        </button>
      </div>
    );
  }

  if (!activeItem) return null;

  /* Options memoized at top level */

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Mode Toggle */}
      <div className="flex justify-center gap-4 p-1.5 bg-[#F9F7F2] rounded-full w-fit mx-auto border border-[#C87A7A]/5">
        <button
          onClick={() => setMode('cards')}
          className={`px-10 py-3 rounded-full text-[10px] font-black sans-geometric uppercase tracking-[0.2em] transition-all duration-500 ${mode === 'cards' ? 'bg-[#C87A7A] text-white shadow-xl scale-105' : 'bg-transparent text-[#5A6B70]/60 hover:text-[#C87A7A]'
            }`}
        >
          Flashcards
        </button>
        <button
          onClick={() => setMode('game')}
          className={`px-10 py-3 rounded-full text-[10px] font-black sans-geometric uppercase tracking-[0.2em] transition-all duration-500 ${mode === 'game' ? 'bg-[#C87A7A] text-white shadow-xl scale-105' : 'bg-transparent text-[#5A6B70]/60 hover:text-[#C87A7A]'
            }`}
        >
          Quiz Game
        </button>
      </div>

      {mode === 'cards' ? (
        <div className="relative px-4 pb-2 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="mb-8 space-y-3">
            <div className="flex justify-between items-center px-1">
              <div className="text-[9px] font-black text-[#5A6B70]/60 uppercase tracking-[0.3em] sans-geometric flex items-center gap-2">
                <BarChart2 className="w-3 h-3 text-[#C87A7A]" />
                {masteredIds.size} / {vocab.length} Mastered
              </div>
              <div className="text-[9px] font-black text-[#E8C586] uppercase tracking-[0.3em]">
                {Math.round(progressPercentage)}%
              </div>
            </div>
            <div className="h-2 bg-[#5A6B70]/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#C87A7A] to-[#E8C586] transition-all duration-1000 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div
            className="relative w-full aspect-[16/9] cursor-pointer group [perspective:1200px]"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div
              className={`w-full h-full relative transition-all duration-700 [transform-style:preserve-3d] 
                ${isFlipped ? '[transform:rotateY(180deg)]' : ''}
                ${cardTransition === 'right' ? 'translate-x-[120%] rotate-12 opacity-0' : cardTransition === 'left' ? '-translate-x-[120%] -rotate-12 opacity-0' : ''}
              `}
            >
              <div className="absolute inset-0 w-full h-full bg-white rounded-[32px] border border-[#C87A7A]/10 flex flex-col items-center justify-center p-8 [backface-visibility:hidden] shadow-2xl shadow-[#5A6B70]/5 overflow-hidden">
                <div className="absolute top-6 left-0 w-full text-center">
                  <span className="text-[10px] font-black text-[#C87A7A]/60 uppercase tracking-[0.5em]">French</span>
                </div>
                <div className="space-y-4 text-center">
                  <h4 className="text-4xl md:text-5xl font-bold text-[#5A6B70] serif-display italic leading-tight group-hover:scale-105 transition-transform duration-500">
                    {activeItem.french}
                  </h4>
                  {activeItem.pronunciation && (
                    <p className="text-[#C87A7A] font-mono text-sm tracking-widest bg-[#F9F7F2] px-4 py-1.5 rounded-full inline-block border border-[#C87A7A]/10">
                      {activeItem.pronunciation}
                    </p>
                  )}
                </div>
                <div className="absolute bottom-6 left-6">
                  <button onClick={(e) => { e.stopPropagation(); speak(activeItem.french); }} className="p-4 bg-[#F9F7F2] rounded-[20px] text-[#C87A7A] hover:bg-[#C87A7A] hover:text-white transition-all shadow-sm border border-[#C87A7A]/5 hover:scale-110 active:scale-90">
                    <Volume2 className="w-6 h-6" />
                  </button>
                </div>
                <div className="absolute bottom-6 right-8 text-[9px] font-black text-[#5A6B70]/20 uppercase tracking-[0.3em] flex items-center gap-2">
                  Reveal Translation <RotateCcw className="w-3 h-3" />
                </div>
              </div>

              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#C87A7A] to-[#a65d5d] rounded-[32px] flex flex-col items-center justify-center p-8 [backface-visibility:hidden] [transform:rotateY(180deg)] shadow-2xl">
                <div className="absolute top-6 left-0 w-full text-center">
                  <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.5em]">Meaning</span>
                </div>
                <div className="space-y-4 text-center">
                  <h4 className="text-4xl md:text-5xl font-bold text-white serif-display italic leading-tight">
                    {activeItem.translation}
                  </h4>
                  {activeItem.example && (
                    <p className="text-white/70 sans-handwritten text-lg italic max-w-xs px-4">
                      "{activeItem.example}"
                    </p>
                  )}
                </div>
                <div className="absolute bottom-6 right-8 text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">
                  Click to flip back
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-10">
            <button
              onClick={() => handleMastery(false)}
              className="group flex flex-col items-center gap-3 p-6 bg-white rounded-[28px] border border-[#C87A7A]/10 text-[#5A6B70]/40 hover:bg-red-50 hover:text-red-500 transition-all shadow-sm active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-all">
                <X className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.3em]">Still Learning</span>
            </button>
            <button
              onClick={() => handleMastery(true)}
              className="group flex flex-col items-center gap-3 p-6 bg-white rounded-[28px] border border-[#C87A7A]/10 text-[#5A6B70]/40 hover:bg-green-50 hover:text-green-500 transition-all shadow-sm active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-all">
                <Check className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.3em]">Mastered</span>
            </button>
          </div>
        </div>
      ) : (
        <div className={`bg-white rounded-[48px] p-12 border border-[#C87A7A]/10 shadow-2xl text-center transition-all ${feedback === 'correct' ? 'ring-8 ring-green-100/50' : feedback === 'wrong' ? 'ring-8 ring-red-100/50' : ''}`}>
          <div className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-3 text-[#E8C586] bg-[#E8C586]/10 px-6 py-2 rounded-full border border-[#E8C586]/20">
              <Trophy className="w-4 h-4" />
              <span className="font-black text-[10px] tracking-widest">{score} POINTS</span>
            </div>
          </div>
          <div className="relative h-40 flex flex-col items-center justify-center mb-12">
            <div className={`transition-all duration-700 ${feedback ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}>
              <div className="text-[10px] font-black text-[#C87A7A] uppercase tracking-[0.4em] mb-4">Translate this:</div>
              <h4 className="text-5xl md:text-6xl font-bold text-[#5A6B70] serif-display italic leading-tight">{activeItem.french}</h4>
            </div>
            {feedback === 'correct' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center animate-in zoom-in duration-500">
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-xl mb-4"><Check className="w-12 h-12 text-white" /></div>
                <span className="text-green-600 font-black text-[10px] uppercase tracking-widest">Bravo !</span>
              </div>
            )}
            {feedback === 'wrong' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center animate-in zoom-in duration-500">
                <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center shadow-xl mb-4"><X className="w-12 h-12 text-white" /></div>
                <span className="text-red-600 font-black text-[10px] uppercase tracking-widest">Encore !</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {currentOptions.map((v, idx) => (
              <button key={v.id} onClick={() => handleQuizChoice(v.id)} disabled={!!feedback} className="p-6 bg-[#F9F7F2] rounded-[24px] text-[#5A6B70] font-bold border-2 border-transparent hover:border-[#C87A7A]/30 hover:bg-white hover:text-[#C87A7A] transition-all text-lg shadow-sm active:scale-95">
                {v.translation}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VocabTrainer;
