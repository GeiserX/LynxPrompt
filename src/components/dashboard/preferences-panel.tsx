"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Settings,
  FileCode,
  Scale,
  Shield,
  BookOpen,
  AlertTriangle,
  Package,
  Pencil,
  ChevronDown,
  ChevronRight,
  FolderCog,
  Save,
  Trash2,
  Loader2,
} from "lucide-react";

// Category display config
const PREFERENCE_CATEGORIES: Record<string, { label: string; icon: React.ElementType; description: string }> = {
  static: { label: "Static Files", icon: FileCode, description: "FUNDING.yml, .editorconfig, etc." },
  license: { label: "License", icon: Scale, description: "Default license preference" },
  testing: { label: "Testing", icon: Shield, description: "Testing strategy preferences" },
  codeStyle: { label: "Code Style", icon: BookOpen, description: "Naming conventions, formatting" },
  boundaries: { label: "AI Boundaries", icon: AlertTriangle, description: "AI behavior rules" },
  commands: { label: "Commands", icon: Package, description: "Build, test, lint commands" },
  general: { label: "General", icon: Settings, description: "Other preferences" },
};

// Static file display names
const STATIC_FILE_NAMES: Record<string, string> = {
  funding: "FUNDING.yml",
  editorconfig: ".editorconfig",
  contributing: "CONTRIBUTING.md",
  codeOfConduct: "CODE_OF_CONDUCT.md",
  security: "SECURITY.md",
  gitignore: ".gitignore",
  dockerignore: ".dockerignore",
};

interface PreferencesPanelProps {
  preferences: Record<string, Record<string, { value: string; isDefault: boolean }>>;
  onUpdate: (category: string, key: string, value: string) => Promise<void>;
  onDelete: (category: string, key: string) => Promise<void>;
}

export function PreferencesPanel({ 
  preferences, 
  onUpdate,
  onDelete,
}: PreferencesPanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["static"]);
  const [editingItem, setEditingItem] = useState<{ category: string; key: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const startEditing = (category: string, key: string, currentValue: string) => {
    setEditingItem({ category, key });
    setEditValue(currentValue);
  };

  const handleSave = async () => {
    if (!editingItem) return;
    setSaving(true);
    try {
      await onUpdate(editingItem.category, editingItem.key, editValue);
      setEditingItem(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: string, key: string) => {
    if (!confirm("Are you sure you want to delete this saved preference?")) return;
    await onDelete(category, key);
  };

  const getDisplayName = (category: string, key: string): string => {
    if (category === "static") {
      return STATIC_FILE_NAMES[key] || key;
    }
    // Convert camelCase to Title Case
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  const categories = Object.keys(preferences);
  
  if (categories.length === 0) {
    return (
      <div className="p-6 text-center">
        <FolderCog className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <h3 className="font-medium">No saved preferences yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Use the wizard to save your preferences and static files for quick reuse
        </p>
        <Button asChild className="mt-4" size="sm" variant="outline">
          <Link href="/wizard">Go to Wizard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {categories.map(category => {
        const categoryConfig = PREFERENCE_CATEGORIES[category] || PREFERENCE_CATEGORIES.general;
        const CategoryIcon = categoryConfig.icon;
        const items = Object.entries(preferences[category]);
        const isExpanded = expandedCategories.includes(category);

        return (
          <div key={category}>
            <button
              onClick={() => toggleCategory(category)}
              className="flex w-full items-center justify-between p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="rounded bg-muted p-1.5">
                  <CategoryIcon className="h-3.5 w-3.5" />
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-sm">{categoryConfig.label}</h4>
                  <p className="text-xs text-muted-foreground">{items.length} saved item{items.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            
            {isExpanded && (
              <div className="border-t bg-muted/30 divide-y">
                {items.map(([key, { value, isDefault }]) => {
                  const isEditing = editingItem?.category === category && editingItem?.key === key;
                  const displayName = getDisplayName(category, key);
                  const isLongContent = value.length > 100 || value.includes('\n');

                  return (
                    <div key={key} className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{displayName}</span>
                            {isDefault && (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                                Default
                              </span>
                            )}
                          </div>
                          
                          {isEditing ? (
                            <div className="mt-2">
                              {isLongContent ? (
                                <textarea
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="w-full h-40 rounded-lg border bg-background px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                  autoFocus
                                />
                              ) : (
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                  autoFocus
                                />
                              )}
                              <div className="mt-2 flex gap-2">
                                <Button size="sm" onClick={handleSave} disabled={saving}>
                                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                                  Save
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-1">
                              {isLongContent ? (
                                <pre className="text-xs text-muted-foreground bg-muted/50 rounded p-2 overflow-x-auto max-h-24 overflow-y-auto font-mono">
                                  {value.length > 300 ? value.slice(0, 300) + '...' : value}
                                </pre>
                              ) : (
                                <p className="text-sm text-muted-foreground truncate">{value}</p>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {!isEditing && (
                          <div className="flex gap-1 shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => startEditing(category, key, value)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                              onClick={() => handleDelete(category, key)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

