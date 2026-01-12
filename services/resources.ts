import { db } from './firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp, orderBy, query } from 'firebase/firestore';
import { Resource } from '../types';

export interface AdminResource {
    id: string;
    title: string;
    type: 'pdf' | 'link' | 'video' | 'audio' | 'zip';
    url: string;
    description?: string;
    createdAt?: any;
    section?: string; // Optional: to categorize resources (e.g., 'Grammaire', 'Vocabulaire')
}

const RESOURCES_COLLECTION = 'resources';

export const getAllResources = async (): Promise<AdminResource[]> => {
    try {
        const q = query(collection(db, RESOURCES_COLLECTION), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as AdminResource));
    } catch (error) {
        console.error("Error fetching resources:", error);
        throw error;
    }
};

export const addResource = async (resource: Omit<AdminResource, 'id' | 'createdAt'>): Promise<AdminResource> => {
    try {
        const docRef = await addDoc(collection(db, RESOURCES_COLLECTION), {
            ...resource,
            createdAt: serverTimestamp()
        });
        return {
            id: docRef.id,
            ...resource,
            createdAt: new Date()
        };
    } catch (error) {
        console.error("Error adding resource:", error);
        throw error;
    }
};

export const deleteResource = async (resourceId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, RESOURCES_COLLECTION, resourceId));
    } catch (error) {
        console.error("Error deleting resource:", error);
        throw error;
    }
};
