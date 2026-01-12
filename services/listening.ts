import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { ListeningLesson } from '../types';

const COLLECTION_NAME = 'listening-lessons';

export const getListeningLessons = async () => {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            orderBy('number', 'asc') // Order by lesson number
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ListeningLesson));
    } catch (error) {
        console.error("Error fetching listening lessons:", error);
        throw error;
    }
};

export const addListeningLesson = async (lesson: Omit<ListeningLesson, 'id' | 'createdAt'>) => {
    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...lesson,
            createdAt: new Date().toISOString()
        });
        return { id: docRef.id, ...lesson };
    } catch (error) {
        console.error("Error adding listening lesson:", error);
        throw error;
    }
};

export const updateListeningLesson = async (id: string, updates: Partial<ListeningLesson>) => {
    try {
        const lessonRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(lessonRef, updates);
    } catch (error) {
        console.error("Error updating listening lesson:", error);
        throw error;
    }
};

export const deleteListeningLesson = async (id: string) => {
    try {
        const lessonRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(lessonRef);
    } catch (error) {
        console.error("Error deleting listening lesson:", error);
        throw error;
    }
};
