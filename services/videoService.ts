
import { doc, setDoc, getDoc, collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

export interface VideoMapping {
    lessonId: string;
    sectionTitle: string;
    youtubeId: string;
    updatedAt: number;
}

const COLLECTION_NAME = 'lesson_videos';

const getDocId = (lessonId: string, sectionTitle: string) => {
    // Create a safe ID string
    const safeTitle = sectionTitle.replace(/[^a-zA-Z0-9]/g, '_');
    return `${lessonId}_${safeTitle}`;
};

export const saveVideoMapping = async (lessonId: string, sectionTitle: string, youtubeId: string) => {
    const docId = getDocId(lessonId, sectionTitle);
    const videoRef = doc(db, COLLECTION_NAME, docId);

    await setDoc(videoRef, {
        lessonId,
        sectionTitle,
        youtubeId,
        updatedAt: Date.now()
    });
};

export const getVideoMappingsForLesson = async (lessonId: string): Promise<Record<string, string>> => {
    const videosRef = collection(db, COLLECTION_NAME);
    const q = query(videosRef, where("lessonId", "==", lessonId));

    const querySnapshot = await getDocs(q);
    const mappings: Record<string, string> = {};

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.sectionTitle && data.youtubeId) {
            mappings[data.sectionTitle] = data.youtubeId;
        }
    });

    return mappings;
};

export const subscribeToLessonVideos = (lessonId: string, onUpdate: (mappings: Record<string, string>) => void) => {
    const videosRef = collection(db, COLLECTION_NAME);
    const q = query(videosRef, where("lessonId", "==", lessonId));

    return onSnapshot(q, (querySnapshot) => {
        const mappings: Record<string, string> = {};
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.sectionTitle && data.youtubeId) {
                mappings[data.sectionTitle] = data.youtubeId;
            }
        });
        onUpdate(mappings);
    });
};
