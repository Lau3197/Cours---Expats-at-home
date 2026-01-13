import { db } from './firebase';
import { collection, getDocs, getDoc, doc, query, where, orderBy, updateDoc } from 'firebase/firestore';
import { UserProfile, UserProgress, Plan } from '../types';

export interface StudentData extends UserProfile {
    progress?: UserProgress;
    lastLogin?: string;
    stats?: {
        completedLessonsCount: number;
        averageQuizScore: number;
    };
}

export const getAllStudents = async (): Promise<StudentData[]> => {
    try {
        const usersRef = collection(db, 'users');
        const usersSnap = await getDocs(usersRef);

        const students: StudentData[] = [];

        const promises = usersSnap.docs.map(async (userDoc) => {
            const userData = userDoc.data() as UserProfile;

            // Filter only students
            if (userData.role === 'admin' || userData.role === 'superadmin' || userData.role === 'instructor') {
                return null;
            }

            let progress: UserProgress | undefined;
            let lastLogin = 'Jamais';
            let completedCount = 0;

            try {
                const progressRef = doc(db, 'userProgress', userDoc.id);
                const progressSnap = await getDoc(progressRef);
                if (progressSnap.exists()) {
                    progress = progressSnap.data() as UserProgress;
                    lastLogin = progress.lastActivity || 'Inconnue';
                    completedCount = progress.completedLessons?.length || 0;
                }
            } catch (e) {
                console.warn(`Could not fetch progress for user ${userDoc.id}`, e);
            }

            return {
                ...userData,
                uid: userDoc.id,
                progress,
                lastLogin,
                stats: {
                    completedLessonsCount: completedCount,
                    averageQuizScore: 0
                }
            } as StudentData;
        });

        const results = await Promise.all(promises);
        return results.filter((s): s is StudentData => s !== null);

    } catch (error) {
        console.error("Error fetching students:", error);
        throw error;
    }
};

export interface AnalyticsData {
    globalWeeklyActivity: { name: string; hours: number }[];
    popularLessons: { id: string; count: number }[];
    lessonCompletions: { [lessonKey: string]: number };
}

export const getAnalyticsData = async (): Promise<AnalyticsData> => {
    try {
        const progressRef = collection(db, 'userProgress');
        const snap = await getDocs(progressRef);

        const activityMap: { [day: string]: number } = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
        const lessonCounts: { [lessonId: string]: number } = {};

        snap.forEach(doc => {
            const data = doc.data() as UserProgress;

            // 1. Global Activity
            if (data.weeklyActivity) {
                Object.entries(data.weeklyActivity).forEach(([day, hours]) => {
                    const shortDay = day.substring(0, 3);
                    if (activityMap[shortDay] !== undefined) {
                        activityMap[shortDay] += hours;
                    } else if (activityMap[day] !== undefined) {
                        activityMap[day] += hours;
                    }
                });
            }

            // 2. Lesson Counts
            if (data.completedLessons) {
                data.completedLessons.forEach(lessonKey => {
                    lessonCounts[lessonKey] = (lessonCounts[lessonKey] || 0) + 1;
                });
            }
        });

        const sortOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const globalWeeklyActivity = Object.entries(activityMap)
            .map(([name, hours]) => ({ name, hours: Math.round(hours * 10) / 10 }))
            .sort((a, b) => sortOrder.indexOf(a.name) - sortOrder.indexOf(b.name));

        const popularLessons = Object.entries(lessonCounts)
            .map(([id, count]) => ({ id, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return {
            globalWeeklyActivity,
            popularLessons,
            lessonCompletions: lessonCounts
        };
    } catch (error) {
        console.error("Error fetching analytics:", error);
        return { globalWeeklyActivity: [], popularLessons: [], lessonCompletions: {} };
    }
};

export const updateStudentPlan = async (uid: string, plan: Plan): Promise<void> => {
    try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, { plan });
    } catch (error) {
        console.error("Error updating student plan:", error);
        throw error;
    }
};
