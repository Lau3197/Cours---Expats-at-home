import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer, CheckCircle2 } from 'lucide-react';

const FocusTimer = () => {
    const INITIAL_TIME = 20 * 60; // 20 minutes in seconds
    const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
    const [isActive, setIsActive] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const intervalRef = useRef<number | null>(null);

    // Format time mm:ss
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        setIsCompleted(false);
        setTimeLeft(INITIAL_TIME);
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            intervalRef.current = window.setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            setIsCompleted(true);
            if (intervalRef.current) clearInterval(intervalRef.current);
            // Optional: Add sound here
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Simple bell sound
            audio.play().catch(e => console.log("Audio play failed", e));
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive, timeLeft]);

    // Progress calculation for circle
    const progress = ((INITIAL_TIME - timeLeft) / INITIAL_TIME) * 100;
    const circumference = 2 * Math.PI * 40; // 40 is radius
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="bg-[#5A6B70] rounded-3xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-white opacity-5 rounded-br-full pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-[#dd8b8b] opacity-10 rounded-tl-full pointer-events-none" />

            <div className="relative z-10 w-full flex flex-col items-center">
                <h3 className="font-serif text-xl mb-6 flex items-center gap-2">
                    <Timer className="w-5 h-5 text-[#dd8b8b]" />
                    Mode Focus
                </h3>

                {isCompleted ? (
                    <div className="text-center animate-in zoom-in duration-500">
                        <CheckCircle2 className="w-20 h-20 text-[#dd8b8b] mx-auto mb-4" />
                        <h4 className="text-2xl font-bold mb-2">Bravo !</h4>
                        <p className="text-white/70 mb-6">20 minutes de concentration terminées.</p>
                        <button
                            onClick={resetTimer}
                            className="bg-white text-[#5A6B70] px-6 py-2 rounded-full font-bold hover:bg-[#F9F7F2] transition-colors"
                        >
                            Nouvelle Session
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Timer Visualization */}
                        <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
                            {/* SVG Ring */}
                            <svg className="transform -rotate-90 w-full h-full">
                                <circle
                                    cx="96"
                                    cy="96"
                                    r="88"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="transparent"
                                    className="text-white/10"
                                />
                                <circle
                                    cx="96"
                                    cy="96"
                                    r="88"
                                    stroke="#dd8b8b"
                                    strokeWidth="8"
                                    fill="transparent"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000 ease-linear"
                                />
                            </svg>
                            <div className="absolute text-5xl font-black font-variant-numeric tabular-nums tracking-wider text-white">
                                {formatTime(timeLeft)}
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={toggleTimer}
                                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isActive
                                    ? 'bg-white/10 hover:bg-white/20 text-white'
                                    : 'bg-[#dd8b8b] hover:bg-[#c97b7b] text-white shadow-lg hover:shadow-[#dd8b8b]/40 hover:scale-105'
                                    }`}
                            >
                                {isActive ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                            </button>

                            {(isActive || timeLeft !== INITIAL_TIME) && (
                                <button
                                    onClick={resetTimer}
                                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                                    title="Réinitialiser"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <p className="mt-6 text-sm text-white/50 font-medium tracking-widest uppercase">
                            {isActive ? "Focus en cours..." : "Prêt pour 20min ?"}
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default FocusTimer;
