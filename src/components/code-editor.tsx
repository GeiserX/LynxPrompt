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
  const highlightRef = useRef<HTMLPreElement>(null);
  const [lineCount, setLineCount] = useState(1);

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
      className={`relative rounded-lg border bg-muted/30 overflow-hidden ${className}`}
      style={{ minHeight }}
    >
      {/* Line Numbers */}
      <div
        ref={lineNumbersRef}
        className="absolute left-0 top-0 bottom-0 w-12 bg-muted/50 border-r overflow-hidden select-none z-10"
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

      {/* Syntax Highlight Layer - shows behind textarea */}
      <pre
        ref={highlightRef}
        aria-hidden="true"
        className="absolute left-12 top-0 right-0 bottom-0 m-0 p-4 font-mono text-sm leading-6 whitespace-pre-wrap break-words overflow-hidden pointer-events-none text-foreground"
        style={{ minHeight, wordBreak: "break-word" }}
        dangerouslySetInnerHTML={{ __html: getHighlightedHtml() }}
      />

      {/* Actual Textarea - transparent text, caret visible */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        placeholder={placeholder}
        className="absolute left-12 top-0 right-0 bottom-0 w-[calc(100%-3rem)] resize-none bg-transparent p-4 font-mono text-sm leading-6 focus:outline-none focus:ring-0 text-transparent caret-foreground selection:bg-primary/30 z-20"
        style={{ minHeight }}
        spellCheck={false}
      />
    </div>
  );
}
