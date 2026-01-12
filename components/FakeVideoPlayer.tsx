import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Settings } from 'lucide-react';

interface FakeVideoPlayerProps {
    script: string;
    title?: string;
    duration?: number; // Estimated duration in seconds
    poster?: string;
}

const FakeVideoPlayer: React.FC<FakeVideoPlayerProps> = ({
    script,
    title = "Video Lesson",
    duration = 120,
    poster
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0); // 0 to 100
    const [currentTime, setCurrentTime] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Calculate words per minute to estimate auto-scroll speed
    // Average reading speed ~200-250 wpm. 
    // Let's say we want to scroll through the whole text in `duration` seconds.

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying) {
            interval = setInterval(() => {
                setCurrentTime(prev => {
                    const newTime = prev + 0.1;
                    if (newTime >= duration) {
                        setIsPlaying(false);
                        return duration;
                    }
                    return newTime;
                });
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isPlaying, duration]);

    useEffect(() => {
        setProgress((currentTime / duration) * 100);

        // Auto-scroll logic
        if (scrollContainerRef.current) {
            const scrollHeight = scrollContainerRef.current.scrollHeight - scrollContainerRef.current.clientHeight;
            const scrollPos = (currentTime / duration) * scrollHeight;
            scrollContainerRef.current.scrollTop = scrollPos;
        }
    }, [currentTime, duration]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newProgress = parseFloat(e.target.value);
        const newTime = (newProgress / 100) * duration;
        setCurrentTime(newTime);
        setProgress(newProgress);

        if (scrollContainerRef.current) {
            const scrollHeight = scrollContainerRef.current.scrollHeight - scrollContainerRef.current.clientHeight;
            const scrollPos = (newProgress / 100) * scrollHeight;
            scrollContainerRef.current.scrollTop = scrollPos;
        }
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, 2000);
    };

    return (
        <div
            className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl group"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
        >
            {/* Screen Content */}
            <div className="absolute inset-0 flex items-center justify-center p-8 bg-gradient-to-br from-gray-900 to-black">
                <div
                    ref={scrollContainerRef}
                    className="w-full h-full overflow-hidden text-center flex flex-col items-center"
                    style={{ scrollBehavior: 'smooth' }}
                >
                    {/* Padding top to start with blank or title */}
                    <div className="min-h-[40%] flex items-end justify-center pb-8">
                        <h2 className="text-3xl font-bold text-white/90">{title}</h2>
                    </div>

                    {/* Size of text optimized for readability */}
                    <div className="max-w-2xl px-4 pb-[50%]">
                        <p className="text-2xl leading-relaxed font-medium text-white/90 transition-all">
                            {script.split('\n').map((line, i) => (
                                <span key={i} className="block mb-6">
                                    {line}
                                </span>
                            ))}
                        </p>
                    </div>
                </div>

                {/* Vignette effect */}
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]"></div>
            </div>

            {/* Play Overlay (Initial) */}
            {!isPlaying && currentTime === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all z-10">
                    <button
                        onClick={() => setIsPlaying(true)}
                        className="w-20 h-20 bg-[#dd8b8b] rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform"
                    >
                        <Play className="w-8 h-8 ml-1" fill="currentColor" />
                    </button>
                </div>
            )}

            {/* Controls Bar */}
            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity duration-300 z-20 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                {/* Progress Bar */}
                <div className="w-full h-1 bg-white/20 rounded-full mb-4 cursor-pointer relative group/progress">
                    <div
                        className="absolute h-full bg-[#dd8b8b] rounded-full"
                        style={{ width: `${progress}%` }}
                    ></div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={handleSeek}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                    />
                </div>

                <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsPlaying(!isPlaying)} className="hover:text-[#dd8b8b] transition-colors">
                            {isPlaying ? <Pause className="w-6 h-6" fill="currentColor" /> : <Play className="w-6 h-6" fill="currentColor" />}
                        </button>

                        <div className="flex items-center gap-2 text-sm font-medium">
                            <span>{formatTime(currentTime)}</span>
                            <span className="text-white/50">/</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsMuted(!isMuted)} className="hover:text-[#dd8b8b] transition-colors">
                            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                        <button className="hover:text-[#dd8b8b] transition-colors">
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FakeVideoPlayer;
