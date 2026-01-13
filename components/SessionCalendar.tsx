
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Video, Calendar as CalendarIcon, Plus, BookOpen, Trash2, CheckCircle } from 'lucide-react';
import { Session, PlannedLesson, CoursePackage } from '../types';
import { addPlannedLesson, removePlannedLesson, togglePlannedLessonStatus, updatePlannedLessonDate } from '../services/planner';

interface SessionCalendarProps {
    sessions: Session[];
    plannedLessons?: PlannedLesson[];
    courses?: CoursePackage[];
    userId?: string;
    onPlanUpdate?: () => void;
    type: 'exchange' | 'culture' | 'mixed';
    color: string;
}

const SessionCalendar: React.FC<SessionCalendarProps> = ({ sessions, plannedLessons = [], courses = [], userId, onPlanUpdate, type, color }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [selectedLessonId, setSelectedLessonId] = useState<string>('');
    const [editingPlan, setEditingPlan] = useState<PlannedLesson | null>(null);
    const [newDate, setNewDate] = useState('');

    const handleReschedule = async () => {
        if (!editingPlan || !newDate || !onPlanUpdate) return;
        await updatePlannedLessonDate(editingPlan.id, newDate);
        setEditingPlan(null);
        setNewDate('');
        onPlanUpdate();
    };


    const handleAddLesson = async () => {
        if (!userId || !selectedDate || !selectedCourseId || !selectedLessonId) return;

        const course = courses.find(c => c.id === selectedCourseId);
        const section = course?.sections.find(s => s.lessons.some(l => l.id === selectedLessonId));
        const lesson = section?.lessons.find(l => l.id === selectedLessonId);

        if (lesson && course && onPlanUpdate) {
            const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
            await addPlannedLesson(userId, dateStr, course.id, lesson.id, lesson.title);
            setShowPlanModal(false);
            setSelectedCourseId('');
            setSelectedLessonId('');
            onPlanUpdate();
        }
    };

    const handleDeletePlan = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (onPlanUpdate) {
            await removePlannedLesson(id);
            onPlanUpdate();
        }
    };

    const handleTogglePlan = async (id: string, status: 'planned' | 'completed', e: React.MouseEvent) => {
        e.stopPropagation();
        if (onPlanUpdate) {
            await togglePlannedLessonStatus(id, status);
            onPlanUpdate();
        }
    };

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay(); // 0 = Sunday
    };

    const changeMonth = (offset: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
        setSelectedDate(null);
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-11
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month); // 0 (Sun) - 6 (Sat)
    // Adjust so Monday is 0, Sunday is 6
    const startDay = firstDay === 0 ? 6 : firstDay - 1;

    const upcomingSessions = sessions.filter(s => s.status === 'upcoming');

    const renderCalendarGrid = () => {
        const days = [];
        // Empty cells for previous month
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-24 md:h-32 bg-gray-50/30 border border-transparent"></div>);
        }

        // Days of current month
        for (let d = 1; d <= daysInMonth; d++) {
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const daySessions = upcomingSessions.filter(s => s.date.startsWith(dateString));
            const dayPlans = plannedLessons.filter(p => p.date === dateString);
            const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();
            const isSelected = selectedDate?.getDate() === d && selectedDate?.getMonth() === month && selectedDate?.getFullYear() === year;

            days.push(
                <div
                    key={d}
                    onClick={() => setSelectedDate(new Date(year, month, d))}
                    className={`h-24 md:h-32 border border-[#dd8b8b]/10 p-2 relative cursor-pointer transition-all group ${isSelected ? `bg-[${color}]/10 ring-2 ring-[${color}]` : 'bg-white hover:bg-[#F9F7F2]'
                        } ${isToday ? 'bg-[#F9F7F2]' : ''} rounded-xl`}
                >
                    <div className={`text-sm font-bold mb-1 ${isToday ? `text-[${color}]` : 'text-[#5A6B70]/60'}`}>
                        {d}
                    </div>

                    <div className="flex flex-col gap-1 overflow-hidden">
                        {daySessions.map(session => {
                            const sessionColor = session.type === 'exchange' ? '#dd8b8b' : '#E8C586';
                            return (
                                <div key={session.id} className={`text-[9px] px-2 py-1 rounded-md text-white font-bold truncate shadow-sm`} style={{ backgroundColor: sessionColor }}>
                                    {new Date(session.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            );
                        })}
                        {dayPlans.map(plan => (
                            <div
                                key={plan.id}
                                onClick={(e) => { e.stopPropagation(); setEditingPlan(plan); setNewDate(plan.date); }}
                                className={`text-[9px] px-2 py-1 rounded-md font-bold truncate shadow-sm cursor-pointer hover:ring-2 hover:ring-blue-300 relative group/plan ${plan.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}
                            >
                                📚 {plan.lessonTitle.substring(0, 12)}
                                <button
                                    onClick={(e) => handleDeletePlan(plan.id, e)}
                                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 text-white rounded-full text-[8px] opacity-0 group-hover/plan:opacity-100 transition-opacity flex items-center justify-center"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Dot indicators for mobile */}
                    {(daySessions.length > 0 || dayPlans.length > 0) && !isSelected && (
                        <div className="md:hidden flex gap-1 absolute bottom-2 right-2">
                            {daySessions.map(s => (
                                <div key={s.id} className="w-2 h-2 rounded-full" style={{ backgroundColor: s.type === 'exchange' ? '#dd8b8b' : '#E8C586' }} />
                            ))}
                            {dayPlans.map(p => (
                                <div key={p.id} className={`w-2 h-2 rounded-full ${p.status === 'completed' ? 'bg-green-400' : 'bg-blue-400'}`} />
                            ))}
                        </div>
                    )}
                </div>
            );
        }
        return days;
    };

    const selectedDaySessions = selectedDate
        ? upcomingSessions.filter(s => {
            const d = new Date(s.date);
            return d.getDate() === selectedDate.getDate() &&
                d.getMonth() === selectedDate.getMonth() &&
                d.getFullYear() === selectedDate.getFullYear();
        })
        : [];

    const selectedDayPlanned = selectedDate
        ? plannedLessons.filter(p => {
            const d = new Date(p.date); // p.date is YYYY-MM-DD
            return p.date === `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
        })
        : [];

    return (
        <div className="bg-white rounded-[40px] p-8 shadow-xl border border-[#dd8b8b]/10">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-[#5A6B70] serif-display italic capitalize">
                    {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex gap-2">
                    <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-[#F9F7F2] text-[#5A6B70]">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-[#F9F7F2] text-[#5A6B70]">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 mb-4">
                {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map(day => (
                    <div key={day} className="text-center text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40">
                        <span className="hidden md:inline">{day}</span>
                        <span className="md:hidden">{day.substring(0, 3)}</span>
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 mb-8">
                {renderCalendarGrid()}
            </div>

            {/* Selected Date Details */}
            {selectedDate && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300 bg-[#F9F7F2] rounded-2xl p-6 border border-[#dd8b8b]/10 mt-6">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="font-bold text-[#5A6B70] flex items-center gap-2">
                            <CalendarIcon className={`w-4 h-4 text-[${color}]`} />
                            {selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                        </h4>
                        <button
                            onClick={() => setShowPlanModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-[#dd8b8b]/10 text-xs font-bold uppercase tracking-widest text-[#5A6B70] hover:text-[#dd8b8b] transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Ajouter
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Live Sessions */}
                        {selectedDaySessions.length > 0 && (
                            <div className="space-y-2">
                                <h5 className="text-[10px] font-black uppercase text-[#5A6B70]/40 tracking-widest mb-2">Sessions Live</h5>
                                {selectedDaySessions.map(session => (
                                    <div key={session.id} className="bg-white p-4 rounded-xl border border-[#dd8b8b]/10 shadow-sm flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                                        <div>
                                            <div className={`text-lg font-bold text-[#5A6B70] group-hover:text-[${color}]`}>{session.title}</div>
                                            <div className="text-sm text-[#5A6B70]/60 flex items-center gap-2 mt-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(session.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        <a
                                            href={session.teamsLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`flex items-center gap-2 bg-[${color}] text-white px-5 py-2 rounded-lg font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity shadow-lg shadow-[${color}]/20`}
                                        >
                                            <Video className="w-4 h-4" /> Rejoindre
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Planned Lessons */}
                        {selectedDayPlanned.length > 0 && (
                            <div className="space-y-2">
                                <h5 className="text-[10px] font-black uppercase text-[#5A6B70]/40 tracking-widest mb-2">Mon Travail Personnel</h5>
                                {selectedDayPlanned.map(plan => (
                                    <div key={plan.id} className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex justify-between items-center group">
                                        <div className="flex items-center gap-4">
                                            <div
                                                onClick={(e) => handleTogglePlan(plan.id, plan.status, e)}
                                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${plan.status === 'completed' ? 'bg-green-100 border-green-500 text-green-600' : 'border-gray-200 text-transparent hover:border-blue-400'}`}
                                            >
                                                <CheckCircle className="w-4 h-4 fill-current" />
                                            </div>
                                            <div>
                                                <div className={`font-bold transition-all ${plan.status === 'completed' ? 'text-gray-400 line-through' : 'text-[#5A6B70]'}`}>
                                                    {plan.lessonTitle}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => handleDeletePlan(plan.id, e)}
                                            className="p-2 text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {selectedDaySessions.length === 0 && selectedDayPlanned.length === 0 && (
                            <p className="text-[#5A6B70]/40 italic text-sm text-center py-6">Rien de prévu pour ce jour. Reposez-vous ou ajoutez une leçon !</p>
                        )}
                    </div>
                </div>
            )}

            {/* Plan Lesson Modal */}
            {showPlanModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-2xl font-bold text-[#5A6B70] mb-6">Planifier une leçon</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-[#5A6B70]/60 mb-2">Choisir un cours</label>
                                <select
                                    className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 font-medium text-[#5A6B70]"
                                    value={selectedCourseId}
                                    onChange={(e) => {
                                        setSelectedCourseId(e.target.value);
                                        setSelectedLessonId('');
                                    }}
                                >
                                    <option value="">Sélectionner...</option>
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>{c.title}</option>
                                    ))}
                                </select>
                            </div>

                            {selectedCourseId && (
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-[#5A6B70]/60 mb-2">Choisir une leçon</label>
                                    <select
                                        className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 font-medium text-[#5A6B70]"
                                        value={selectedLessonId}
                                        onChange={(e) => setSelectedLessonId(e.target.value)}
                                    >
                                        <option value="">Sélectionner...</option>
                                        {courses.find(c => c.id === selectedCourseId)?.sections.map((section, idx) => (
                                            <optgroup key={idx} label={section.title}>
                                                {section.lessons.map(lesson => (
                                                    <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={() => setShowPlanModal(false)}
                                className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-[#5A6B70] hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleAddLesson}
                                disabled={!selectedCourseId || !selectedLessonId}
                                className="flex-1 py-3 rounded-xl bg-[#5A6B70] text-white font-bold hover:opacity-90 disabled:opacity-50"
                            >
                                Valider
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reschedule Modal */}
            {editingPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-xl font-bold text-[#5A6B70] mb-2">Reprogrammer</h3>
                        <p className="text-sm text-[#5A6B70]/60 mb-4">{editingPlan.lessonTitle}</p>

                        <label className="block text-xs font-bold text-[#5A6B70]/60 uppercase tracking-widest mb-2">Nouvelle date</label>
                        <input
                            type="date"
                            className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 mb-6 font-bold text-[#5A6B70]"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setEditingPlan(null); setNewDate(''); }}
                                className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-[#5A6B70]"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => handleDeletePlan(editingPlan.id, { stopPropagation: () => { } } as React.MouseEvent)}
                                className="py-3 px-4 rounded-xl bg-red-100 text-red-600 font-bold"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleReschedule}
                                disabled={!newDate || newDate === editingPlan.date}
                                className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-bold disabled:opacity-50"
                            >
                                Déplacer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SessionCalendar;
