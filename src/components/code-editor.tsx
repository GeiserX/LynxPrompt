"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { GripHorizontal } from "lucide-react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number | string;
  maxHeight?: number;
}

// Shared text styling to ensure pixel-perfect alignment between layers
// Using pre (no wrap) to ensure line numbers align correctly
const TEXT_STYLES: React.CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  fontSize: "14px",
  lineHeight: "24px",
  padding: "16px",
  margin: 0,
  border: "none",
  boxSizing: "border-box",
  whiteSpace: "pre", // No wrap - use horizontal scroll like real code editors
  overflowX: "auto",
  letterSpacing: "normal",
  tabSize: 2,
};

export function CodeEditor({
  value,
  onChange,
  placeholder = "",
  className = "",
  minHeight: minHeightProp = 300,
  maxHeight = 800,
}: CodeEditorProps) {
  // Parse minHeight - accept both numbers and strings like "300px"
  const minHeight = typeof minHeightProp === 'string' 
    ? parseInt(minHeightProp.replace('px', ''), 10) || 300 
    : minHeightProp;

  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [lineCount, setLineCount] = useState(1);
  const [height, setHeight] = useState(minHeight);
  const [isResizing, setIsResizing] = useState(false);

  // Update line count when content changes
  useEffect(() => {
    const lines = value.split("\n").length;
    setLineCount(Math.max(lines, 1));
  }, [value]);

  // Sync scroll between textarea, line numbers, and highlight layer
  const handleScroll = useCallback(() => {
    if (textareaRef.current) {
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
      }
      if (highlightRef.current) {
        highlightRef.current.scrollTop = textareaRef.current.scrollTop;
        highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
      }
    }
  }, []);

  // Handle resize
  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsResizing(true);
    
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const startHeight = height;

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentY = 'touches' in moveEvent 
        ? (moveEvent as TouchEvent).touches[0].clientY 
        : (moveEvent as MouseEvent).clientY;
      const delta = currentY - startY;
      const newHeight = Math.min(maxHeight, Math.max(minHeight, startHeight + delta));
      setHeight(newHeight);
    };

    const handleEnd = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);
  }, [height, minHeight, maxHeight]);

  // Generate highlighted HTML - variables get amber background
  const getHighlightedHtml = () => {
    if (!value) return "\n"; // Need at least a newline for proper height
    
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(
        /\[\[([A-Za-z_][A-Za-z0-9_]*)\]\]/g,
        '<mark class="bg-amber-300 dark:bg-amber-700 text-amber-900 dark:text-amber-100 rounded px-0.5">[[$1]]</mark>'
      ) + "\n";
  };

  return (
    <div
      ref={containerRef}
      className={`relative rounded-lg border bg-muted/30 overflow-hidden ${className}`}
      style={{ height: `${height}px` }}
    >
      {/* Line Numbers */}
      <div
        ref={lineNumbersRef}
        className="absolute left-0 top-0 w-12 bg-muted/50 border-r overflow-hidden select-none z-10"
        style={{ height: `${height - 24}px` }} // Account for resize handle
      >
        <div 
          className="text-right text-muted-foreground"
          style={{
            ...TEXT_STYLES,
            paddingRight: "8px",
          }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i + 1} style={{ height: "24px" }}>
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Syntax Highlight Layer - shows behind textarea */}
      <div
        ref={highlightRef}
        aria-hidden="true"
        className="absolute left-12 top-0 right-0 overflow-auto pointer-events-none text-foreground"
        style={{
          ...TEXT_STYLES,
          height: `${height - 24}px`, // Account for resize handle
        }}
        dangerouslySetInnerHTML={{ __html: getHighlightedHtml() }}
      />

      {/* Actual Textarea - transparent text, caret visible */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        placeholder={placeholder}
        className="absolute left-12 top-0 right-0 resize-none bg-transparent focus:outline-none focus:ring-0 text-transparent caret-foreground selection:bg-primary/30 z-20"
        style={{
          ...TEXT_STYLES,
          height: `${height - 24}px`, // Account for resize handle
          width: "calc(100% - 3rem)",
          overflowX: "auto",
          overflowY: "auto",
        }}
        spellCheck={false}
      />

      {/* Resize Handle */}
      <div
        onMouseDown={handleResizeStart}
        onTouchStart={handleResizeStart}
        className={`absolute bottom-0 left-0 right-0 h-6 flex items-center justify-center cursor-ns-resize bg-muted/50 border-t hover:bg-muted transition-colors ${isResizing ? 'bg-muted' : ''}`}
        title="Drag to resize"
      >
        <GripHorizontal className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}
