import React, { useEffect } from 'react';
import { Play } from 'lucide-react';
import { useVideoPlayer } from '../context/VideoContext';

interface BubbleVideoPlayerProps {
    sectionTitle: string;
    lessonId?: string;
}

const BubbleVideoPlayer: React.FC<BubbleVideoPlayerProps> = ({ sectionTitle, lessonId }) => {
    const { registerSection, playSection, hasRecording, getNextSection, isAdmin, saveYouTubeUrl } = useVideoPlayer(); // Ensure hasRecording is available
    const [isRecorded, setIsRecorded] = React.useState(false);

    // Register this section on mount so the playlist knows about it
    useEffect(() => {
        registerSection(sectionTitle);
    }, [sectionTitle, registerSection]);

    // Check recording status
    useEffect(() => {
        setIsRecorded(hasRecording(sectionTitle));
    }, [hasRecording, sectionTitle, getNextSection]); // Re-check when playlist updates or section changes

    if (!isRecorded && !isAdmin) return null; // Hide for students if no video exists

    const handlePlay = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Calculate center of the button for initial position
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2; // Corrected to get center
        const centerY = rect.top + rect.height / 2; // Corrected to get center

        playSection(sectionTitle, { x: centerX, y: centerY });
    };

    return (
        <div className="flex flex-col items-center">
            <div className="relative group ml-4 flex-shrink-0">
                <button
                    onClick={handlePlay}
                    className={`w-20 h-20 rounded-full overflow-hidden border-2 shadow-lg hover:scale-105 transition-transform relative group/btn ${isRecorded ? 'border-[#dd8b8b] bg-black/5' : 'border-[#dd8b8b] border-dashed bg-[#dd8b8b]/10'}`}
                    title={isRecorded ? `Play video for: ${sectionTitle}` : `Record video for: ${sectionTitle}`}
                >
                    {/* Thumbnail or Placeholder */}
                    <div className="absolute inset-0 bg-black flex items-center justify-center">
                        {isRecorded ? (
                            <video
                                src="https://www.w3schools.com/html/mov_bbb.mp4" // Ideally this would be the actual blob thumbnail, but for now placeholder is fine or generic
                                className="w-full h-full object-cover opacity-60"
                                muted
                                loop
                                onMouseOver={(e) => e.currentTarget.play()}
                                onMouseOut={(e) => e.currentTarget.pause()}
                            />
                        ) : (
                            <div className="w-full h-full bg-[#F9F7F2] flex items-center justify-center opacity-80">
                                {/* Empty state background */}
                            </div>
                        )}
                    </div>

                    {/* Overlay Icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-md group-hover/btn:scale-110 transition-transform ${isRecorded ? 'bg-[#dd8b8b]' : 'bg-[#5A6B70]'}`}>
                            {isRecorded ? (
                                <Play size={16} fill="currentColor" className="ml-0.5" />
                            ) : (
                                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse ring-2 ring-white/50" />
                                /* Using a red dot or camera icon to indicate "Record" */
                            )}
                        </div>
                    </div>
                </button>
            </div>
            {isAdmin && !isRecorded && (
                <div className="mt-3 flex items-center gap-2 transition-opacity animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Paste YouTube Link..."
                            className="text-sm w-56 border-2 border-[#dd8b8b]/30 rounded-full px-4 py-2 bg-white/95 text-[#5A6B70] font-medium placeholder:text-[#dd8b8b]/60 focus:outline-none focus:border-[#dd8b8b] focus:ring-2 focus:ring-[#dd8b8b]/20 shadow-lg transition-all text-center"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const val = (e.target as HTMLInputElement).value;
                                    if (val) saveYouTubeUrl(sectionTitle, val);
                                }
                            }}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default BubbleVideoPlayer;
