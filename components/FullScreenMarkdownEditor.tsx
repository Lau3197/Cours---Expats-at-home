import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import StyledMarkdown from './StyledMarkdown';

interface FullScreenMarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  onClose: () => void;
  title?: string;
}

const FullScreenMarkdownEditor: React.FC<FullScreenMarkdownEditorProps> = ({
  content,
  onChange,
  onClose,
  title = 'Édition Markdown'
}) => {
  const [splitPosition, setSplitPosition] = useState(50); // Percentage
  const [isDragging, setIsDragging] = useState(false);
  const markdownRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  // Handle split pane dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const container = document.getElementById('fullscreen-editor-container');
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const newPosition = ((e.clientX - rect.left) / rect.width) * 100;
    const clampedPosition = Math.max(10, Math.min(90, newPosition));
    setSplitPosition(clampedPosition);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Synchronized scrolling
  const handleMarkdownScroll = useCallback(() => {
    if (isScrollingRef.current) return;
    
    const markdown = markdownRef.current;
    const preview = previewRef.current;
    
    if (!markdown || !preview) return;
    
    isScrollingRef.current = true;
    
    const markdownScrollRatio = markdown.scrollTop / (markdown.scrollHeight - markdown.clientHeight);
    const previewMaxScroll = preview.scrollHeight - preview.clientHeight;
    
    if (previewMaxScroll > 0) {
      preview.scrollTop = markdownScrollRatio * previewMaxScroll;
    }
    
    requestAnimationFrame(() => {
      isScrollingRef.current = false;
    });
  }, []);

  const handlePreviewScroll = useCallback(() => {
    if (isScrollingRef.current) return;
    
    const markdown = markdownRef.current;
    const preview = previewRef.current;
    
    if (!markdown || !preview) return;
    
    isScrollingRef.current = true;
    
    const previewScrollRatio = preview.scrollTop / (preview.scrollHeight - preview.clientHeight);
    const markdownMaxScroll = markdown.scrollHeight - markdown.clientHeight;
    
    if (markdownMaxScroll > 0) {
      markdown.scrollTop = previewScrollRatio * markdownMaxScroll;
    }
    
    requestAnimationFrame(() => {
      isScrollingRef.current = false;
    });
  }, []);

  useEffect(() => {
    const markdown = markdownRef.current;
    const preview = previewRef.current;
    
    if (markdown) {
      markdown.addEventListener('scroll', handleMarkdownScroll);
    }
    
    if (preview) {
      preview.addEventListener('scroll', handlePreviewScroll);
    }
    
    return () => {
      if (markdown) {
        markdown.removeEventListener('scroll', handleMarkdownScroll);
      }
      if (preview) {
        preview.removeEventListener('scroll', handlePreviewScroll);
      }
    };
  }, [handleMarkdownScroll, handlePreviewScroll, content]);

  return (
    <div 
      id="fullscreen-editor-container"
      className="fixed inset-0 z-[200] bg-white flex flex-col"
    >
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-[#dd8b8b]/10 bg-[#F9F7F2]/50 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#5A6B70] serif-display italic">
          {title}
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-[#dd8b8b]/10 rounded-lg transition-colors text-[#5A6B70]/60 hover:text-[#5A6B70]"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Split Pane Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Markdown Editor - Left */}
        <div 
          className="flex flex-col border-r border-[#dd8b8b]/20"
          style={{ width: `${splitPosition}%` }}
        >
          <div className="flex-shrink-0 px-4 py-2 bg-[#F9F7F2] border-b border-[#dd8b8b]/10">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40">
              Markdown
            </label>
          </div>
          <textarea
            ref={markdownRef}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder="# Titre\n\nBienvenue dans cette leçon..."
            className="flex-1 w-full bg-[#F9F7F2] border-none py-6 px-8 focus:ring-0 focus:outline-none font-mono text-sm text-[#5A6B70] leading-relaxed resize-none overflow-y-auto"
            style={{ tabSize: 2 }}
          />
        </div>

        {/* Resize Handle */}
        <div
          onMouseDown={handleMouseDown}
          className={`flex-shrink-0 w-2 bg-[#dd8b8b]/20 hover:bg-[#dd8b8b]/40 cursor-col-resize transition-colors flex items-center justify-center relative group ${
            isDragging ? 'bg-[#dd8b8b]/60' : ''
          }`}
        >
          <div className="flex flex-col gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
            <div className="w-1 h-1 rounded-full bg-[#dd8b8b]"></div>
            <div className="w-1 h-1 rounded-full bg-[#dd8b8b]"></div>
            <div className="w-1 h-1 rounded-full bg-[#dd8b8b]"></div>
          </div>
        </div>

        {/* Preview - Right */}
        <div 
          className="flex flex-col"
          style={{ width: `${100 - splitPosition}%` }}
        >
          <div className="flex-shrink-0 px-4 py-2 bg-[#F9F7F2] border-b border-[#dd8b8b]/10">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#5A6B70]/40">
              Prévisualisation
            </label>
          </div>
          <div
            ref={previewRef}
            className="flex-1 overflow-y-auto bg-white p-8"
          >
            <StyledMarkdown content={content || ''} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullScreenMarkdownEditor;

