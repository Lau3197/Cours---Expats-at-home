import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { PlannedLesson } from '../types';

export const addPlannedLesson = async (
    userId: string,
    date: string,
    courseId: string,
    lessonId: string,
    lessonTitle: string
) => {
    const docRef = await addDoc(collection(db, 'planned_lessons'), {
        userId,
        date,
        courseId,
        lessonId,
        lessonTitle,
        status: 'planned'
    });
    return docRef.id;
};

export const getPlannedLessons = async (userId: string): Promise<PlannedLesson[]> => {
    const q = query(collection(db, 'planned_lessons'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PlannedLesson));
};

export const removePlannedLesson = async (id: string) => {
    await deleteDoc(doc(db, 'planned_lessons', id));
};

export const togglePlannedLessonStatus = async (id: string, currentStatus: 'planned' | 'completed') => {
    const newStatus = currentStatus === 'planned' ? 'completed' : 'planned';
    await updateDoc(doc(db, 'planned_lessons', id), { status: newStatus });
};

export const updatePlannedLessonDate = async (id: string, newDate: string) => {
    await updateDoc(doc(db, 'planned_lessons', id), { date: newDate });
};
