"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  X,
  Share2,
  Eye,
  AlertTriangle,
  Check,
  Shield,
  Globe,
} from "lucide-react";

interface TemplateSharePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (sanitizedTemplate: SanitizedTemplate) => void;
  template: {
    name: string;
    description?: string;
    content: string;
    variables?: Record<string, string>;
    sensitiveFields?: Record<string, { label: string; required: boolean }>;
    tags?: string[];
    category?: string;
  };
}

interface SanitizedTemplate {
  name: string;
  description: string;
  content: string;
  variables: Record<string, string>;
  tags: string[];
  category: string;
}

// Patterns to detect and sanitize
const sensitivePatterns = [
  // URLs with specific domains
  { pattern: /https?:\/\/[^\s"']+\.(local|internal|corp)\b[^\s"']*/gi, replacement: "{{INTERNAL_URL}}" },
  // IP addresses
  { pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, replacement: "{{IP_ADDRESS}}" },
  // Ports with specific numbers
  { pattern: /:(\d{4,5})\b/g, replacement: ":{{PORT}}" },
  // API keys patterns
  { pattern: /['"](sk|pk|api|key|token|secret|password)[-_]?[a-zA-Z0-9]{20,}['"]/gi, replacement: '"{{API_KEY}}"' },
  // Environment variables with values
  { pattern: /(\w+_SECRET|_KEY|_TOKEN|_PASSWORD)\s*[=:]\s*["']?[^"'\n]+["']?/gi, replacement: "$1={{SECRET}}" },
  // Email addresses
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: "{{EMAIL}}" },
  // Usernames in URLs
  { pattern: /github\.com\/[a-zA-Z0-9-]+/g, replacement: "github.com/{{USERNAME}}" },
  // Docker registry URLs with user
  { pattern: /[a-zA-Z0-9.-]+\.(ts\.net|local):?\d*\/[a-zA-Z0-9-]+/g, replacement: "{{REGISTRY}}/{{IMAGE}}" },
];

// Words that might indicate project-specific content
const specificityIndicators = [
  "my-", "our-", "-prod", "-staging", "-dev",
  "internal", "private", "corp", "company",
];

export function TemplateSharePreview({
  isOpen,
  onClose,
  onConfirm,
  template,
}: TemplateSharePreviewProps) {
  const [editedName, setEditedName] = useState(template.name);
  const [editedDescription, setEditedDescription] = useState(
    template.description || ""
  );
  const [editedContent, setEditedContent] = useState("");
  const [detectedIssues, setDetectedIssues] = useState<string[]>([]);
  const [acknowledged, setAcknowledged] = useState(false);

  // Sanitize content automatically
  const sanitizedContent = useMemo(() => {
    let content = template.content;
    const issues: string[] = [];

    // Replace sensitive patterns
    sensitivePatterns.forEach(({ pattern, replacement }) => {
      const matches = content.match(pattern);
      if (matches) {
        issues.push(`Found ${matches.length} instance(s) of potentially sensitive data`);
        content = content.replace(pattern, replacement);
      }
    });

    // Replace known variable values with placeholders
    if (template.variables) {
      Object.entries(template.variables).forEach(([key, value]) => {
        if (value && value.length > 2) {
          const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const valueRegex = new RegExp(escapedValue, "g");
          if (content.match(valueRegex)) {
            content = content.replace(valueRegex, `{{${key}}}`);
          }
        }
      });
    }

    // Check for specificity indicators
    specificityIndicators.forEach((indicator) => {
      if (content.toLowerCase().includes(indicator)) {
        issues.push(`Content may contain project-specific term: "${indicator}"`);
      }
    });

    setDetectedIssues(issues);
    return content;
  }, [template.content, template.variables]);

  // Initialize edited content with sanitized version
  useState(() => {
    setEditedContent(sanitizedContent);
  });

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm({
      name: editedName,
      description: editedDescription,
      content: editedContent || sanitizedContent,
      variables: template.variables || {},
      tags: template.tags || [],
      category: template.category || "general",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-primary/5 px-6 py-4">
          <div className="flex items-center gap-3">
            <Share2 className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">Share Template</h2>
              <p className="text-sm text-muted-foreground">
                Review what will be shared with the community
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {/* Security Notice */}
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
            <div>
              <h3 className="font-medium text-yellow-600">
                Automatic Sanitization Applied
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                We automatically detect and replace sensitive data like API keys,
                internal URLs, IP addresses, and project-specific names with
                placeholders. Please review the content below.
              </p>
            </div>
          </div>

          {/* Detected Issues */}
          {detectedIssues.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-yellow-600">
                <AlertTriangle className="h-4 w-4" />
                Items Modified ({detectedIssues.length})
              </h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {detectedIssues.map((issue, i) => (
                  <li key={i}>• {issue}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Editable Fields */}
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Template Name (public)
              </label>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Description (public)
              </label>
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                rows={2}
                className="w-full rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium">
                  Template Content (public)
                </label>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Eye className="h-3 w-3" />
                  Everyone will see this
                </span>
              </div>
              <textarea
                value={editedContent || sanitizedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={12}
                className="w-full rounded-lg border bg-muted/50 px-4 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* What's Shared */}
          <div className="mt-6 rounded-lg border bg-muted/30 p-4">
            <h3 className="mb-3 flex items-center gap-2 font-medium">
              <Globe className="h-4 w-4 text-primary" />
              What will be shared publicly
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Template name and description
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Template content (with placeholders)
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Tags and category
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Your username (as author)
              </li>
            </ul>
          </div>

          {/* Acknowledgment */}
          <label className="mt-6 flex items-start gap-3">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-1 rounded"
            />
            <span className="text-sm text-muted-foreground">
              I confirm that this template does not contain any sensitive
              information, proprietary code, or content that I don&apos;t have
              permission to share publicly.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!acknowledged}>
            <Share2 className="mr-2 h-4 w-4" />
            Share with Community
          </Button>
        </div>
      </div>
    </div>
  );
}
