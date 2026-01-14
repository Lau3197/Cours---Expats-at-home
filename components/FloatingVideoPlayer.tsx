import YouTube from 'react-youtube';
import React, { useRef, useState, useEffect } from 'react';
import { X, Play, Pause, SkipForward } from 'lucide-react';
import { useVideoPlayer } from '../context/VideoContext';
import ReactDOM from 'react-dom';

const FloatingVideoPlayer: React.FC = () => {
    const { activeSection, closeVideo, onVideoEnded, getNextSection, initialPos, getVideoUrl, saveRecording, hasRecording, isAdmin, isUploading } = useVideoPlayer();
    const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
    const isDragging = useRef(false);
    const dialogRef = useRef<HTMLDivElement>(null);
    const dragOffset = useRef({ x: 0, y: 0 });
    const videoRef = useRef<HTMLVideoElement>(null);

    // Recording State
    const [isRecordingMode, setIsRecordingMode] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const webCamRef = useRef<HTMLVideoElement>(null);

    // Initial Setup
    useEffect(() => {
        if (activeSection) {
            const hasVideo = hasRecording(activeSection);
            // Only enter recording mode if no video AND user is admin
            if (!hasVideo && isAdmin) {
                setIsRecordingMode(true);
            } else {
                setIsRecordingMode(false);
            }

            // Positioning Logic
            if (initialPos) {
                const playerSize = 288;
                setPosition({
                    x: initialPos.x - playerSize / 2,
                    y: initialPos.y - playerSize / 2
                });
            } else if (!position) {
                const winW = window.innerWidth;
                const winH = window.innerHeight;
                setPosition({ x: winW - 400 - 24, y: winH - 250 - 24 });
            }
        }
    }, [activeSection, initialPos, hasRecording, isAdmin]);

    // Webcam Access
    useEffect(() => {
        if (isRecordingMode && activeSection) {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                .then(stream => {
                    if (webCamRef.current) {
                        webCamRef.current.srcObject = stream;
                    }
                })
                .catch(err => console.error("Webcam access error:", err));

            return () => {
                // Stop webcam stream on cleanup
                if (webCamRef.current && webCamRef.current.srcObject) {
                    const tracks = (webCamRef.current.srcObject as MediaStream).getTracks();
                    tracks.forEach(track => track.stop());
                }
            };
        }
    }, [isRecordingMode, activeSection]);

    // Start Recording
    const startRecording = () => {
        if (!webCamRef.current || !webCamRef.current.srcObject) return;

        const stream = webCamRef.current.srcObject as MediaStream;
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            setVideoBlob(blob);
        };

        mediaRecorder.start();
        setIsRecording(true);
    };

    // Stop Recording
    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    // Save Recording
    const handleSave = () => {
        if (videoBlob && activeSection) {
            saveRecording(activeSection, videoBlob);
            setIsRecordingMode(false); // Switch to Play Mode
            setVideoBlob(null); // Clear preview blob
        }
    };

    const videoUrl = activeSection ? (getVideoUrl(activeSection) || "https://www.w3schools.com/html/mov_bbb.mp4") : "";

    const [isPlaying, setIsPlaying] = useState(true); // Auto-play is on by default

    // Reset position when player first opens or section changes
    useEffect(() => {
        if (activeSection) {
            // Priority 1: Use specific click position (centered)
            if (initialPos) {
                // Width/Height are hardcoded to w-72 h-72 (18rem = 288px)
                const playerSize = 288;

                setPosition({
                    x: initialPos.x - playerSize / 2,
                    y: initialPos.y - playerSize / 2
                });
            }
            // Priority 2: Keep existing position if already open (handled by state persistence)
            else if (!position) {
                // Priority 3: Default bottom right if fresh open without specific pos
                const winW = window.innerWidth;
                const winH = window.innerHeight;
                setPosition({ x: winW - 400 - 24, y: winH - 250 - 24 });
            }
        }
    }, [activeSection, initialPos]); // Dependencies updated to react to initialPos change



    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging.current || !dialogRef.current) return;

            // Direct DOM update for performance (avoids re-renders)
            const newX = e.clientX - dragOffset.current.x;
            const newY = e.clientY - dragOffset.current.y;

            dialogRef.current.style.left = `${newX} px`;
            dialogRef.current.style.top = `${newY} px`;
        };

        const handleMouseUp = () => {
            if (isDragging.current && dialogRef.current) {
                isDragging.current = false;

                // Sync final position to state to persist across re-renders
                const rect = dialogRef.current.getBoundingClientRect();
                setPosition({ x: rect.left, y: rect.top });

                // Remove inline styles since state will take over on re-render
                // (though removing might cause a flash, better to keep them synced or let setPosition handle it)
                // Actually, letting React take over via style prop in render is fine.
            }
        };

        if (activeSection) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [activeSection]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        const dialog = dialogRef.current; // Use the ref directly
        if (!dialog) return;

        isDragging.current = true;
        const rect = dialog.getBoundingClientRect();
        dragOffset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        // If not positioned yet (default bottom right), set initial absolute position
        // so we don't jump when switching from CSS class positioning to absolute
        if (!position) {
            const initialX = rect.left;
            const initialY = rect.top;
            setPosition({ x: initialX, y: initialY });
            // Also force style immediately to prevent jump
            dialog.style.left = `${initialX} px`;
            dialog.style.top = `${initialY} px`;
            dialog.style.bottom = 'auto';
            dialog.style.right = 'auto';
        }
        e.preventDefault();
    };

    // Check type
    const isYouTube = videoUrl?.startsWith('yt:');
    const youtubeId = isYouTube ? videoUrl.split(':')[1] : null;
    const youtubePlayerRef = useRef<any>(null); // Type 'any' for YT player instance

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isYouTube && youtubePlayerRef.current) {
            const state = youtubePlayerRef.current.getPlayerState();
            if (state === 1) { // Playing
                youtubePlayerRef.current.pauseVideo();
                setIsPlaying(false);
            } else {
                youtubePlayerRef.current.playVideo();
                setIsPlaying(true);
            }
        } else if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const renderContent = () => {
        // ... Recording Mode Logic ...
        if (isRecordingMode) {
            // ... existing recording UI ...
            // (Copy existing logic here or ensure replace handles it)
            // I will provide full body of renderContent to be safe
            return (
                <div className="relative w-full h-full bg-black flex flex-col items-center justify-center text-white">
                    <h3 className="absolute top-4 left-4 text-xs font-bold uppercase tracking-widest bg-red-600 px-2 py-1 rounded">
                        Recording Station
                    </h3>

                    {!videoBlob ? (
                        <video ref={webCamRef} autoPlay muted className="w-full h-full object-cover opacity-80" />
                    ) : (
                        <video src={URL.createObjectURL(videoBlob)} controls className="w-full h-full object-cover" />
                    )}

                    <div className="absolute bottom-6 flex gap-4">
                        {!videoBlob ? (
                            !isRecording ? (
                                <button onClick={startRecording} className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center border-4 border-white shadow-xl transition-transform hover:scale-110">
                                    <div className="w-6 h-6 rounded-full bg-white" />
                                </button>
                            ) : (
                                <button onClick={stopRecording} className="w-16 h-16 rounded-full bg-white hover:bg-gray-200 flex items-center justify-center border-4 border-red-600 shadow-xl transition-transform hover:scale-110">
                                    <div className="w-6 h-6 bg-red-600 rounded-sm" />
                                </button>
                            )
                        ) : (
                            <>
                                <button
                                    onClick={handleSave}
                                    disabled={isUploading}
                                    className={`px-6 py-2 ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#dd8b8b] hover:bg-white hover:text-[#dd8b8b]'} text-white font-bold rounded-full shadow-lg transition-colors border-2 border-[#dd8b8b]`}
                                >
                                    {isUploading ? 'Saving...' : 'Save & Play'}
                                </button>
                                <button onClick={() => setVideoBlob(null)} className="px-6 py-2 bg-gray-500/50 hover:bg-gray-500/80 text-white font-bold rounded-full shadow-lg backdrop-blur-sm">
                                    Retake
                                </button>
                            </>
                        )}
                    </div>
                </div>
            );
        }

        // Playback Mode
        return (
            <>
                {isYouTube ? (
                    <div className="w-full h-full relative pointer-events-none">
                        {/* pointer-events-none on wrapper to allow clicks to pass to parent for drag? 
                          No, we need dragging on the border/parent. 
                          The iframe intercepts clicks. 
                          We said custom controls. If I put a transparent overlay, I can capture clicks.
                      */}
                        <YouTube
                            videoId={youtubeId!}
                            opts={{
                                height: '100%',
                                width: '100%',
                                playerVars: {
                                    autoplay: 1,
                                    controls: 0,
                                    modestbranding: 1,
                                    rel: 0,
                                },
                            }}
                            className="w-full h-full"
                            onReady={(e) => {
                                youtubePlayerRef.current = e.target;
                                setIsPlaying(true);
                            }}
                            onEnd={onVideoEnded}
                            onStateChange={(e) => {
                                // Sync state
                                setIsPlaying(e.data === 1);
                            }}
                        />
                        {/* Click catcher for togglePlay */}
                        <div className="absolute inset-0 z-10" onClick={togglePlay} />
                    </div>
                ) : (
                    <video
                        ref={videoRef}
                        src={videoUrl}
                        autoPlay
                        className="w-full h-full object-cover"
                        onEnded={onVideoEnded}
                        onClick={togglePlay}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                    />
                )}

                {/* Custom Play/Pause Overlay */}
                {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 w-full h-full z-20 pointer-events-none">
                        <button
                            onClick={togglePlay}
                            className="w-20 h-20 bg-[#dd8b8b] rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 transition-transform pointer-events-auto cursor-pointer"
                        >
                            <Play size={40} fill="currentColor" className="ml-2" />
                        </button>
                    </div>
                )}

                {/* Hover Pause Button */}
                {isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                        <button
                            onClick={togglePlay}
                            className="w-16 h-16 bg-black/50 hover:bg-[#dd8b8b] rounded-full flex items-center justify-center text-white backdrop-blur-sm pointer-events-auto cursor-pointer transition-colors"
                        >
                            <Pause size={32} fill="currentColor" />
                        </button>
                    </div>
                )}
            </>
        );
    };

    if (!activeSection) return null;

    return ReactDOM.createPortal(
        <div
            ref={dialogRef}
            className={`fixed z-[100] animate-in zoom-in-50 duration-300 video-dialog ${isRecordingMode ? 'w-[800px] h-[600px]' : 'w-72 h-72'}`}
            style={
                position
                    ? { left: position.x, top: position.y }
                    : isRecordingMode
                        ? { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' } // Center for recording
                        : { bottom: '2rem', right: '2rem' }
            }
        >
            <div
                className={`relative w-full h-full bg-black overflow-hidden shadow-2xl group cursor-move ${isRecordingMode ? 'rounded-xl border-4 border-white' : 'rounded-full border-4 border-[#dd8b8b]'}`}
                onMouseDown={handleMouseDown}
            >
                {/* Header/Close Button */}
                <div className={`absolute z-50 transition-opacity duration-200 ${isRecordingMode ? 'top-4 right-4 opacity-100' : 'top-8 right-16 opacity-0 group-hover:opacity-100'}`}>
                    <button
                        onClick={(e) => { e.stopPropagation(); closeVideo(); }}
                        className={`p-2 rounded-full text-white transition-colors flex items-center justify-center transform hover:scale-110 ${isRecordingMode ? 'bg-black/20 hover:bg-black/40' : 'bg-black/60 hover:bg-[#dd8b8b]'}`}
                        title="Close Video"
                    >
                        <X size={20} />
                    </button>
                </div>

                {renderContent()}

                {/* Title Toast (Bottom) - Only show in Play Mode */}
                {!isRecordingMode && (
                    <div className="absolute bottom-6 left-0 right-0 text-center px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        <span className="inline-block bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-full truncate max-w-full backdrop-blur-md">
                            Now Playing: {activeSection}
                        </span>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default FloatingVideoPlayer;
