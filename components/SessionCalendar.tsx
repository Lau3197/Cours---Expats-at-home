
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Video, Calendar as CalendarIcon } from 'lucide-react';
import { Session } from '../types';

interface SessionCalendarProps {
    sessions: Session[];
    type: 'exchange' | 'culture';
    color: string;
}

const SessionCalendar: React.FC<SessionCalendarProps> = ({ sessions, type, color }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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
                        {daySessions.map(session => (
                            <div key={session.id} className={`text-[9px] px-2 py-1 rounded-md bg-[${color}] text-white font-bold truncate shadow-sm`}>
                                {new Date(session.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        ))}
                    </div>

                    {daySessions.length > 0 && !isSelected && (
                        <div className={`absolute bottom-2 right-2 w-2 h-2 rounded-full bg-[${color}] md:hidden`} />
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
                <div className="animate-in fade-in slide-in-from-top-4 duration-300 bg-[#F9F7F2] rounded-2xl p-6 border border-[#dd8b8b]/10">
                    <h4 className="font-bold text-[#5A6B70] mb-4 flex items-center gap-2">
                        <CalendarIcon className={`w-4 h-4 text-[${color}]`} />
                        Sessions du {selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                    </h4>

                    {selectedDaySessions.length > 0 ? (
                        <div className="space-y-3">
                            {selectedDaySessions.map(session => (
                                <div key={session.id} className="bg-white p-4 rounded-xl border border-[#dd8b8b]/5 shadow-sm flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                                    <div>
                                        <div className={`text-lg font-bold text-[#5A6B70] group-hover:text-[${color}]`}>{session.title}</div>
                                        <div className="text-sm text-[#5A6B70]/60 flex items-center gap-2 mt-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(session.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            {session.description && (
                                                <span className="ml-2 pl-2 border-l border-gray-300 italic">{session.description}</span>
                                            )}
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
                    ) : (
                        <p className="text-[#5A6B70]/40 italic text-sm">Aucune session prévue pour ce jour.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default SessionCalendar;
