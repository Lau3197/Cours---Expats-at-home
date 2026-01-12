import React, { useState, useEffect, useRef } from 'react';
import { X, GripVertical, Minimize2, Maximize2 } from 'lucide-react';

interface FloatingNotesProps {
    courseId: string;
    lessonId: string;
    courseTitle: string;
    lessonTitle: string;
    isOpen: boolean;
    onClose: () => void;
}

const FloatingNotes: React.FC<FloatingNotesProps> = ({
    courseId,
    lessonId,
    courseTitle,
    lessonTitle,
    isOpen,
    onClose,
}) => {
    const [content, setContent] = useState('');
    const [position, setPosition] = useState({ x: 20, y: 100 });
    const [isMinimized, setIsMinimized] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const noteRef = useRef<HTMLDivElement>(null);

    const storageKey = `notes_${courseId}_${lessonId}`;

    // Load note on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                setContent(parsed.content || '');
            } else {
                setContent('');
            }
        } catch (e) {
            setContent('');
        }
    }, [storageKey]);

    // Auto-save on content change
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (content.trim()) {
                const noteData = {
                    courseId,
                    lessonId,
                    courseTitle,
                    lessonTitle,
                    content,
                    updatedAt: new Date().toISOString(),
                };
                localStorage.setItem(storageKey, JSON.stringify(noteData));
            } else {
                // Remove note if empty
                localStorage.removeItem(storageKey);
            }
        }, 500);
        return () => clearTimeout(timeout);
    }, [content, storageKey, courseId, lessonId, courseTitle, lessonTitle]);

    // Drag handling
    const handleMouseDown = (e: React.MouseEvent) => {
        if (noteRef.current) {
            setIsDragging(true);
            setDragOffset({
                x: e.clientX - position.x,
                y: e.clientY - position.y,
            });
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setPosition({
                    x: e.clientX - dragOffset.x,
                    y: e.clientY - dragOffset.y,
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset]);

    if (!isOpen) return null;

    return (
        <div
            ref={noteRef}
            className="fixed z-50 bg-white rounded-xl shadow-2xl border border-amber-200 overflow-hidden"
            style={{
                left: position.x,
                top: position.y,
                width: isMinimized ? 200 : 320,
                transition: isDragging ? 'none' : 'width 0.2s',
            }}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-amber-100 to-yellow-100 cursor-move select-none"
                onMouseDown={handleMouseDown}
            >
                <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-amber-600/50" />
                    <span className="text-sm font-bold text-amber-800 truncate">📝 Mes Notes</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="p-1 text-amber-600/50 hover:text-amber-700 transition-colors"
                    >
                        {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1 text-amber-600/50 hover:text-red-500 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content */}
            {!isMinimized && (
                <div className="p-3">
                    <p className="text-[10px] text-amber-600/60 uppercase tracking-wide mb-2 truncate">{lessonTitle}</p>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Prenez vos notes ici... (sauvegarde automatique)"
                        className="w-full h-48 p-2 text-sm text-[#5A6B70] bg-amber-50/50 rounded-lg border border-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-200 resize-none"
                    />
                    <p className="text-[10px] text-amber-600/40 mt-2 text-right">
                        {content.length > 0 ? '✓ Sauvegardé' : 'Tapez pour commencer'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default FloatingNotes;
