import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Session } from '../types';

const COLLECTION_NAME = 'sessions';

export const getSessions = async (type?: 'exchange' | 'culture') => {
    try {
        let q;
        if (type) {
            q = query(
                collection(db, COLLECTION_NAME),
                where('type', '==', type),
                orderBy('date', 'desc')
            );
        } else {
            q = query(
                collection(db, COLLECTION_NAME),
                orderBy('date', 'desc')
            );
        }

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Session));
    } catch (error) {
        console.error("Error fetching sessions:", error);
        throw error;
    }
};

export const addSession = async (session: Omit<Session, 'id'>) => {
    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...session,
            createdAt: new Date().toISOString()
        });
        return { id: docRef.id, ...session };
    } catch (error) {
        console.error("Error adding session:", error);
        throw error;
    }
};

export const updateSession = async (id: string, updates: Partial<Session>) => {
    try {
        const sessionRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(sessionRef, updates);
    } catch (error) {
        console.error("Error updating session:", error);
        throw error;
    }
};

export const deleteSession = async (id: string) => {
    try {
        const sessionRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(sessionRef);
    } catch (error) {
        console.error("Error deleting session:", error);
        throw error;
    }
};

export const archiveSession = async (id: string) => {
    try {
        const sessionRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(sessionRef, { status: 'archived' });
    } catch (error) {
        console.error("Error archiving session:", error);
        throw error;
    }
};
