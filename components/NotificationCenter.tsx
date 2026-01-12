
import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Info, AlertCircle, FileText, CheckCircle, X } from 'lucide-react';
import { UserProfile, AppNotification, CoursePackage } from '../types';
import { fetchNotifications, markNotificationAsRead } from '../services/notifications';

interface NotificationCenterProps {
    user: UserProfile;
    courses: CoursePackage[];
    onNavigate: (page: string) => void;
    onSelectCourse?: (course: CoursePackage, lessonId?: string) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ user, courses, onNavigate, onSelectCourse }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user && courses.length >= 0) {
            loadNotifications();
        }
    }, [user, courses]);

    // Periodic refresh (every 5 minutes)
    useEffect(() => {
        const interval = setInterval(() => {
            if (user) loadNotifications();
        }, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [user]);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const data = await fetchNotifications(user, courses);
            setNotifications(data);
        } catch (e) {
            console.error("Failed to load notifications", e);
        } finally {
            setLoading(false);
        }
    };

    const handleClickNotification = async (notification: AppNotification) => {
        if (!notification.read) {
            await handleMarkAsRead(notification, { stopPropagation: () => { } } as React.MouseEvent);
        }

        if (notification.type === 'course_update' && notification.courseId && onSelectCourse) {
            const course = courses.find(c => c.id === notification.courseId);
            if (course) {
                onSelectCourse(course);
                setIsOpen(false);
                return;
            }
        }

        if (notification.link) {
            // Simple navigation if link is internal (naive check)
            // If it starts with / or http, handle accordingly.
            // For now, assuming basic page navigation strings if matching
            // internal pages, or external links
            // But since we use onNavigate(page), we expect page keys ('library', 'profile')
            // We'll leave this simple for now. 
            // If it's a URL:
            if (notification.link.startsWith('http')) {
                window.open(notification.link, '_blank');
            }
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleToggle = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            // Refresh when opening
            loadNotifications();
        }
    };

    const handleMarkAsRead = async (notification: AppNotification, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await markNotificationAsRead(user, notification);
            // Optimistic update
            setNotifications(prev => prev.map(n =>
                n.id === notification.id ? { ...n, read: true } : n
            ));
        } catch (error) {
            console.error("Error marking as read", error);
        }
    };

    const handleMarkAllAsRead = async () => {
        const unread = notifications.filter(n => !n.read);
        // Process in parallel
        await Promise.all(unread.map(n => markNotificationAsRead(user, n)));
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    // Click outside listener
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const getIcon = (type: AppNotification['type']) => {
        switch (type) {
            case 'course_update': return <FileText className="w-4 h-4 text-blue-500" />;
            case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'warning': return <AlertCircle className="w-4 h-4 text-amber-500" />;
            case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
            default: return <Info className="w-4 h-4 text-[#dd8b8b]" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleToggle}
                className={`relative p-3 transition-all rounded-2xl group ${isOpen ? 'bg-[#dd8b8b] text-white shadow-lg shadow-[#dd8b8b]/30' : 'text-[#5A6B70]/40 hover:text-[#dd8b8b] bg-[#F9F7F2]'}`}
                title="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#E8C586] rounded-full border border-white animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-4 w-80 sm:w-96 bg-white rounded-[24px] shadow-xl border border-[#dd8b8b]/10 backdrop-blur-xl z-50 overflow-hidden animation-fade-in-up origin-top-right">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#F9F7F2]/50">
                        <h3 className="font-bold text-[#5A6B70] serif-display italic text-lg">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-[10px] font-black uppercase tracking-widest text-[#dd8b8b] hover:underline"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-[#5A6B70]/40 text-sm">
                                Loading...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="bg-[#F9F7F2] w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Bell className="w-5 h-5 text-[#5A6B70]/20" />
                                </div>
                                <p className="text-[#5A6B70]/40 text-sm font-bold">No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map(notif => (
                                    <div
                                        key={notif.id}
                                        onClick={() => handleClickNotification(notif)}
                                        className={`p-4 hover:bg-[#F9F7F2] transition-colors relative group cursor-pointer ${!notif.read ? 'bg-blue-50/30' : ''}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`mt-1 flex-shrink-0 ${!notif.read ? 'opacity-100' : 'opacity-50'}`}>
                                                {getIcon(notif.type)}
                                            </div>
                                            <div className="flex-1">
                                                <p className={`text-sm text-[#5A6B70] mb-1 ${!notif.read ? 'font-bold' : 'font-medium'}`}>{notif.title}</p>
                                                <p className="text-xs text-[#5A6B70]/60 leading-relaxed mb-2">{notif.message}</p>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] text-[#5A6B70]/30 font-bold uppercase tracking-wide">
                                                        {new Date(notif.date).toLocaleDateString()}
                                                    </span>
                                                    {!notif.read && (
                                                        <button
                                                            onClick={(e) => handleMarkAsRead(notif, e)}
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#dd8b8b]/10 rounded-full text-[#dd8b8b]"
                                                            title="Mark as read"
                                                        >
                                                            <Check className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {!notif.read && (
                                            <div className="absolute top-4 right-4 w-2 h-2 bg-[#dd8b8b] rounded-full"></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
