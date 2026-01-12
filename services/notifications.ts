import { db } from './firebase';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, setDoc, limit } from 'firebase/firestore';
import { AppNotification, CoursePackage, UserProfile } from '../types';

const STORAGE_KEY_READ_ANNOUNCEMENTS = 'read_announcements_ids';

export const getReadAnnouncementIds = (): string[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_READ_ANNOUNCEMENTS);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

export const markAnnouncementAsRead = (id: string) => {
    const current = getReadAnnouncementIds();
    if (!current.includes(id)) {
        localStorage.setItem(STORAGE_KEY_READ_ANNOUNCEMENTS, JSON.stringify([...current, id]));
    }
};

// --- NEW function to send notifications ---
export const sendNotification = async (userId: string, notification: Omit<AppNotification, 'id' | 'read' | 'date'>) => {
    try {
        const newNotifRef = doc(collection(db, 'users', userId, 'notifications'));
        await setDoc(newNotifRef, {
            ...notification,
            date: new Date().toISOString(),
            read: false
        });
        return newNotifRef.id;
    } catch (error) {
        console.error("Error sending notification:", error);
        throw error;
    }
};
// ------------------------------------------

export const fetchNotifications = async (user: UserProfile, courses: CoursePackage[]): Promise<AppNotification[]> => {
    const notifications: AppNotification[] = [];

    // 1. Fetch Personal Notifications from Firestore
    try {
        const userNotifsRef = collection(db, 'users', user.uid, 'notifications');
        const q = query(userNotifsRef, orderBy('date', 'desc'), limit(20));
        const snapshot = await getDocs(q);

        snapshot.forEach(doc => {
            const data = doc.data();
            notifications.push({
                id: doc.id,
                userId: user.uid,
                title: data.title,
                message: data.message,
                date: data.date,
                read: data.read || false,
                type: data.type || 'info',
                link: data.link,
                courseId: data.courseId
            });
        });
    } catch (error) {
        console.warn("Could not fetch personal notifications", error);
    }

    // 2. Fetch Course Announcements if enabled
    if (user.notifications?.courseUpdates !== false && courses.length > 0) {
        try {
            const readIds = getReadAnnouncementIds();

            courses.forEach(course => {
                if (course.announcements && Array.isArray(course.announcements)) {
                    course.announcements.forEach(announcement => {
                        const notifId = `announcement_${course.id}_${announcement.id}`;

                        notifications.push({
                            id: notifId,
                            title: `New in ${course.title}: ${announcement.title}`,
                            message: announcement.content,
                            date: announcement.date,
                            read: readIds.includes(notifId),
                            type: 'course_update',
                            courseId: course.id
                        });
                    });
                }
            });
        } catch (error) {
            console.error("Error processing course announcements", error);
        }
    }

    return notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const markNotificationAsRead = async (user: UserProfile, notification: AppNotification) => {
    if (notification.userId === user.uid) {
        try {
            const notifRef = doc(db, 'users', user.uid, 'notifications', notification.id);
            await updateDoc(notifRef, { read: true });
        } catch (e) {
            console.error("Error marking personal notification as read", e);
        }
    } else {
        markAnnouncementAsRead(notification.id);
    }
};
