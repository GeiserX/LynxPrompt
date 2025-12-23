"use client";

import { useRef, useEffect, useState, useCallback } from "react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function CodeEditor({
  value,
  onChange,
  placeholder = "",
  className = "",
  minHeight = "300px",
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [lineCount, setLineCount] = useState(1);

  // Update line count when content changes
  useEffect(() => {
    const lines = value.split("\n").length;
    setLineCount(Math.max(lines, 1));
  }, [value]);

  // Sync scroll between textarea and line numbers
  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current && highlightRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  // Generate highlighted content with variables marked
  const getHighlightedContent = () => {
    if (!value) return "";
    
    // Escape HTML and highlight variables
    const escaped = value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(
        /\[\[([A-Z_][A-Z0-9_]*)\]\]/g,
        '<span class="bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 rounded px-0.5 font-semibold">[[$1]]</span>'
      );
    
    return escaped;
  };

  return (
    <div
      className={`relative rounded-lg border bg-muted/30 overflow-hidden ${className}`}
      style={{ minHeight }}
    >
      {/* Line Numbers */}
      <div
        ref={lineNumbersRef}
        className="absolute left-0 top-0 bottom-0 w-12 bg-muted/50 border-r overflow-hidden select-none"
        style={{ minHeight }}
      >
        <div className="p-4 pr-2 font-mono text-sm text-right text-muted-foreground leading-6">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i + 1} className="h-6">
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Highlighted Background Layer (for variable highlighting) */}
      <div
        ref={highlightRef}
        className="absolute left-12 top-0 right-0 bottom-0 overflow-hidden pointer-events-none"
        style={{ minHeight }}
      >
        <pre
          className="p-4 font-mono text-sm whitespace-pre-wrap break-words leading-6 text-transparent"
          style={{ wordBreak: "break-word" }}
          dangerouslySetInnerHTML={{ __html: getHighlightedContent() + "\n" }}
        />
      </div>

      {/* Actual Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        placeholder={placeholder}
        className="absolute left-12 top-0 right-0 bottom-0 w-[calc(100%-3rem)] resize-none bg-transparent p-4 font-mono text-sm leading-6 focus:outline-none focus:ring-0 caret-foreground"
        style={{ 
          minHeight,
          color: "inherit",
        }}
        spellCheck={false}
      />
    </div>
  );
}
