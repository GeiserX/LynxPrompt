"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, AlertTriangle } from "lucide-react";

interface AiEditPanelProps {
  /** Current content being edited */
  currentContent: string;
  /** Callback when AI returns modified content */
  onContentChange: (newContent: string) => void;
  /** Mode: 'blueprint' for full template editing, 'wizard' for short suggestions */
  mode?: "blueprint" | "wizard";
  /** Placeholder text for the input */
  placeholder?: string;
  /** Whether to show warning if content exists (wizard mode) */
  showReplaceWarning?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

export function AiEditPanel({
  currentContent,
  onContentChange,
  mode = "blueprint",
  placeholder = "Describe what you want to change...",
  showReplaceWarning = false,
  disabled = false,
}: AiEditPanelProps) {
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  const handleApply = async () => {
    // Check if we should show warning (wizard mode with existing content)
    if (showReplaceWarning && currentContent.trim() && !showWarning) {
      setShowWarning(true);
      return;
    }

    setShowWarning(false);
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/ai/edit-blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: mode === "blueprint" ? currentContent : undefined,
          instruction: instruction.trim(),
          mode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to apply AI changes");
      }

      onContentChange(data.content);
      setInstruction(""); // Clear input after success
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && !loading && instruction.trim()) {
        handleApply();
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Sparkles className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-500" />
          <input
            type="text"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || loading}
            maxLength={500}
            className="w-full rounded-lg border bg-background pl-10 pr-4 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50"
          />
        </div>
        <Button
          type="button"
          onClick={handleApply}
          disabled={disabled || loading || !instruction.trim()}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Applying...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Apply AI Changes
            </>
          )}
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Warning dialog for wizard mode */}
      {showWarning && (
        <div className="rounded-lg border-2 border-amber-500 bg-amber-50 p-3 dark:bg-amber-900/20">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Replace existing content?
              </p>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                This will replace your current text with AI-generated content.
              </p>
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowWarning(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleApply}
                  className="bg-amber-600 text-white hover:bg-amber-700"
                >
                  Proceed
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Helper text */}
      <p className="text-xs text-muted-foreground">
        {mode === "wizard"
          ? "Describe what you want to add and AI will format it for you."
          : "Describe changes like \"change GitHub to GitLab\" or \"add section for testing\"."}
      </p>
    </div>
  );
}


