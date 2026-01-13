import { db } from './firebase';
import { collection, addDoc, getDocs, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { Submission } from '../types';

const COLLECTION_NAME = 'submissions';

export const submitWork = async (data: Omit<Submission, 'id' | 'status' | 'createdAt'>): Promise<string> => {
    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...data,
            status: 'pending',
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error submitting work:", error);
        throw error;
    }
};

export const getStudentSubmissions = async (studentId: string): Promise<Submission[]> => {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('studentId', '==', studentId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));
    } catch (error) {
        console.error("Error fetching student submissions:", error);
        return [];
    }
};

export const getAllPendingSubmissions = async (): Promise<Submission[]> => {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'asc') // Oldest first
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));
    } catch (error) {
        console.error("Error fetching pending submissions:", error);
        return [];
    }
};

export const provideFeedback = async (submissionId: string, feedback: string): Promise<void> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, submissionId);
        await updateDoc(docRef, {
            feedback,
            status: 'corrected',
            correctedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error providing feedback:", error);
        throw error;
    }
};
