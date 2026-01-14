import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { uploadToYouTube } from '../services/youtube';
import { saveVideoMapping, subscribeToLessonVideos } from '../services/videoService';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../services/firebase';

interface VideoContextType {
    registerSection: (title: string) => void;
    playSection: (title: string, initialPos?: { x: number; y: number }) => void;
    activeSection: string | null;
    initialPos: { x: number; y: number } | null;
    closeVideo: () => void;
    onVideoEnded: () => void;
    getNextSection: () => string | null;
    getVideoUrl: (section: string) => string | null;
    saveRecording: (section: string, blob: Blob) => Promise<void>;
    hasRecording: (section: string) => boolean;
    isAdmin: boolean;
    isUploading: boolean;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export const VideoProvider: React.FC<{ children: React.ReactNode; lessonId: string }> = ({ children, lessonId }) => {
    const { user } = useAuth();
    const [sections, setSections] = useState<string[]>([]);
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [initialPos, setInitialPos] = useState<{ x: number; y: number } | null>(null);
    const [videoSources, setVideoSources] = useState<Record<string, string>>({}); // sectionTitle -> "yt:ID" or "blob:URL"
    const [isUploading, setIsUploading] = useState(false);

    const isAdmin = user?.role === 'superadmin' || ['jacqueslaurine@live.be', 'jacqueslaurine97@gmail.com'].includes(user?.email || '');

    // Use a ref for sections to access current value in callbacks without dependency loops if needed
    // but state is fine if we update correctly.

    // Subscribe to Firestore videos for this lesson
    useEffect(() => {
        if (!lessonId) return;

        const unsubscribe = subscribeToLessonVideos(lessonId, (mappings) => {
            // Convert simple ID to prefixed format for internal consistency if needed, 
            // or just store as is and let logic handle it. 
            // The service returns { title: youtubeId }.
            // We want videoSources to hold "yt:ID" to distinguish.
            const sources: Record<string, string> = {};
            Object.entries(mappings).forEach(([title, id]) => {
                sources[title] = `yt:${id}`;
            });
            setVideoSources(prev => ({ ...prev, ...sources }));
        });

        return () => unsubscribe();
    }, [lessonId]);

    const registerSection = useCallback((title: string) => {
        setSections(prev => {
            if (prev.includes(title)) return prev;
            return [...prev, title];
        });
    }, []);

    const playSection = useCallback((title: string, pos?: { x: number; y: number }) => {
        setActiveSection(title);
        if (pos) setInitialPos(pos);
    }, []);

    const closeVideo = useCallback(() => {
        setActiveSection(null);
        setInitialPos(null);
    }, []);

    const getNextSection = useCallback(() => {
        if (!activeSection) return null;
        const currentIndex = sections.indexOf(activeSection);
        if (currentIndex !== -1 && currentIndex < sections.length - 1) {
            return sections[currentIndex + 1];
        }
        return null;
    }, [activeSection, sections]);

    const onVideoEnded = useCallback(() => {
        const next = getNextSection();
        if (next) {
            setActiveSection(next);
            // Keep same position for auto-advance
        }
    }, [getNextSection]);

    const getYouTubeToken = async (): Promise<string> => {
        const provider = new GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/youtube.upload');
        // Force account selection to ensure we get the right user/refresh token flow
        provider.setCustomParameters({ prompt: 'select_account' });

        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (!credential?.accessToken) {
            throw new Error("Unable to retrieve YouTube API Access Token");
        }
        return credential.accessToken;
    };

    const saveRecording = useCallback(async (section: string, blob: Blob) => {
        if (!isAdmin) return;
        setIsUploading(true);

        try {
            // 1. Get OAuth Token
            const token = await getYouTubeToken();

            // 2. Upload to YouTube
            const title = `French Mastery - ${section} (${lessonId})`;
            const videoId = await uploadToYouTube(token, blob, title);

            // 3. Save to Firestore
            await saveVideoMapping(lessonId, section, videoId);

            // 4. Update Local State (Optimistic/Immediate)
            setVideoSources(prev => ({ ...prev, [section]: `yt:${videoId}` }));

        } catch (error) {
            console.error("Failed to save recording:", error);
            alert("Erreur lors de l'upload YouTube. Vérifiez la console.");
        } finally {
            setIsUploading(false);
        }
    }, [isAdmin, lessonId]);

    const getVideoUrl = useCallback((section: string) => {
        return videoSources[section] || null;
    }, [videoSources]);

    const hasRecording = useCallback((section: string) => {
        return !!videoSources[section];
    }, [videoSources]);

    return (
        <VideoContext.Provider value={{
            registerSection,
            playSection,
            activeSection,
            initialPos,
            closeVideo,
            onVideoEnded,
            getNextSection,
            getVideoUrl,
            saveRecording,
            hasRecording,
            isAdmin,
            isUploading
        }}>
            {children}
        </VideoContext.Provider>
    );
};

export const useVideoPlayer = () => {
    const context = useContext(VideoContext);
    if (!context) {
        throw new Error('useVideoPlayer must be used within a VideoProvider');
    }
    return context;
};
