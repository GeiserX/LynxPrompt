"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Wand2,
  FileText,
  Settings,
  ArrowRight,
  Sparkles,
  Upload,
  Download,
  Heart,
  TrendingUp,
  Clock,
  Eye,
  Github,
  Mail,
  Plus,
  BarChart3,
  Activity,
  ShoppingBag,
  User,
  X,
  Check,
  Loader2,
  Search,
  FolderCog,
  Save,
  Trash2,
  ChevronDown,
  ChevronRight,
  FileCode,
  Scale,
  Shield,
  BookOpen,
  AlertTriangle,
  Package,
  Pencil,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Footer } from "@/components/footer";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";

// Developer persona options - extensive list
const PERSONA_OPTIONS = [
  // Most common first
  { value: "frontend", label: "Frontend Developer", emoji: "🎨" },
  { value: "backend", label: "Backend Developer", emoji: "⚙️" },
  { value: "fullstack", label: "Full-Stack Developer", emoji: "🔄" },
  { value: "devops", label: "DevOps / SRE", emoji: "🚀" },
  { value: "mobile", label: "Mobile Developer", emoji: "📱" },
  { value: "data", label: "Data Engineer / Scientist", emoji: "📊" },
  { value: "ml", label: "Machine Learning Engineer", emoji: "🤖" },
  { value: "security", label: "Security Engineer", emoji: "🔐" },
  // Extended options
  { value: "ios", label: "iOS Developer", emoji: "🍎" },
  { value: "android", label: "Android Developer", emoji: "🤖" },
  { value: "game", label: "Game Developer", emoji: "🎮" },
  { value: "embedded", label: "Embedded Systems", emoji: "🔌" },
  { value: "blockchain", label: "Blockchain / Web3", emoji: "⛓️" },
  { value: "cloud", label: "Cloud Architect", emoji: "☁️" },
  { value: "qa", label: "QA / Test Engineer", emoji: "🧪" },
  { value: "platform", label: "Platform Engineer", emoji: "🏗️" },
  { value: "solutions", label: "Solutions Architect", emoji: "📐" },
  { value: "technical_lead", label: "Technical Lead", emoji: "👨‍💼" },
  { value: "system", label: "Systems Programmer", emoji: "💾" },
  { value: "database", label: "Database Administrator", emoji: "🗄️" },
  { value: "network", label: "Network Engineer", emoji: "🌐" },
  { value: "ai", label: "AI Engineer", emoji: "🧠" },
  { value: "robotics", label: "Robotics Engineer", emoji: "🦾" },
  { value: "graphics", label: "Graphics / 3D Developer", emoji: "🎬" },
  { value: "audio", label: "Audio / DSP Engineer", emoji: "🎵" },
  { value: "research", label: "Research Engineer", emoji: "🔬" },
  { value: "student", label: "Student / Learning", emoji: "📚" },
  { value: "hobbyist", label: "Hobbyist / Maker", emoji: "🛠️" },
  { value: "other", label: "Other (specify)", emoji: "✏️" },
];

// Skill level options
const SKILL_LEVELS = [
  { value: "beginner", label: "Beginner", description: "Learning the basics" },
  { value: "intermediate", label: "Intermediate", description: "Building real projects" },
  { value: "advanced", label: "Advanced", description: "Deep expertise" },
  { value: "expert", label: "Expert", description: "Industry leader" },
];

// Welcome Modal Component
function WelcomeModal({ 
  onComplete, 
  userName 
}: { 
  onComplete: () => void;
  userName?: string | null;
}) {
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState(userName || "");
  const [persona, setPersona] = useState("");
  const [customPersona, setCustomPersona] = useState("");
  const [personaSearch, setPersonaSearch] = useState("");
  const [showAllPersonas, setShowAllPersonas] = useState(false);
  const [skillLevel, setSkillLevel] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Filter personas by search
  const filteredPersonas = PERSONA_OPTIONS.filter(
    (p) => p.label.toLowerCase().includes(personaSearch.toLowerCase())
  );
  
  // Show first 8 or all if searching or expanded
  const displayedPersonas = personaSearch || showAllPersonas 
    ? filteredPersonas 
    : filteredPersonas.slice(0, 8);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      // Use custom persona if "other" selected
      const finalPersona = persona === "other" && customPersona.trim() 
        ? customPersona.trim() 
        : persona || "fullstack";
        
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim() || "Developer",
          persona: finalPersona,
          skillLevel: skillLevel || "intermediate",
          isProfilePublic: isPublic,
          showJobTitle: isPublic,
          showSkillLevel: isPublic,
        }),
      });
      
      if (res.ok) {
        onComplete();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save. Please try again.");
        setSaving(false);
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
      setError("Network error. Please try again.");
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    setSaving(true);
    try {
      await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: userName || "Developer",
          persona: "fullstack",
          skillLevel: "intermediate",
          isProfilePublic: false,
        }),
      });
      onComplete();
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-lg rounded-2xl bg-background p-8 shadow-2xl">
        {/* Skip button */}
        <button
          onClick={handleSkip}
          disabled={saving}
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Step 1: Name */}
        {step === 1 && (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Welcome to LynxPrompt! 👋</h2>
            <p className="mt-2 text-muted-foreground">
              Let&apos;s personalize your experience. What should we call you?
            </p>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name or nickname"
              className="mt-6 w-full rounded-lg border bg-background px-4 py-3 text-center text-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              autoFocus
            />
            <Button
              onClick={() => setStep(2)}
              className="mt-6 w-full"
              size="lg"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Persona */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-center">What type of developer are you?</h2>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              This info is included in your AI configuration files
            </p>
            
            {/* Search box */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={personaSearch}
                onChange={(e) => setPersonaSearch(e.target.value)}
                placeholder="Search roles..."
                className="w-full rounded-lg border bg-background pl-10 pr-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            
            {/* Options grid with fade effect */}
            <div className="relative mt-4">
              <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto pr-1">
                {displayedPersonas.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setPersona(option.value);
                      if (option.value !== "other") setCustomPersona("");
                    }}
                    className={`rounded-lg border p-3 text-left transition-all hover:border-primary ${
                      persona === option.value
                        ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                        : "border-border"
                    }`}
                  >
                    <span className="text-lg">{option.emoji}</span>
                    <span className="ml-2 text-sm font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
              
              {/* Fade overlay when collapsed */}
              {!personaSearch && filteredPersonas.length > 8 && !showAllPersonas && (
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
              )}
              
              {/* Show more button */}
              {!personaSearch && filteredPersonas.length > 8 && !showAllPersonas && (
                <button
                  onClick={() => setShowAllPersonas(true)}
                  className="relative z-10 mt-2 w-full text-center text-sm text-primary hover:underline"
                >
                  Show {filteredPersonas.length - 8} more options...
                </button>
              )}
            </div>
            
            {/* Custom input for "Other" */}
            {persona === "other" && (
              <input
                type="text"
                value={customPersona}
                onChange={(e) => setCustomPersona(e.target.value)}
                placeholder="Describe your role..."
                className="mt-3 w-full rounded-lg border bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
            )}
            
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={() => setStep(3)} 
                className="flex-1" 
                disabled={!persona || (persona === "other" && !customPersona.trim())}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Skill Level */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-center">What&apos;s your experience level?</h2>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              This helps AI assistants tailor their responses to you
            </p>
            <div className="mt-6 space-y-2">
              {SKILL_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setSkillLevel(level.value)}
                  className={`w-full rounded-lg border p-4 text-left transition-all hover:border-primary ${
                    skillLevel === level.value
                      ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                      : "border-border"
                  }`}
                >
                  <div className="font-medium">{level.label}</div>
                  <div className="text-sm text-muted-foreground">{level.description}</div>
                </button>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(4)} className="flex-1" disabled={!skillLevel}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Public Profile */}
        {step === 4 && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20">
              <User className="h-7 w-7 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">Make your profile public?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Public profiles can share blueprints and be discovered by others
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setIsPublic(false)}
                className={`flex-1 rounded-lg border p-4 transition-all ${
                  !isPublic ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "border-border"
                }`}
              >
                <div className="font-medium">Keep Private</div>
                <div className="text-xs text-muted-foreground">Just for me</div>
              </button>
              <button
                onClick={() => setIsPublic(true)}
                className={`flex-1 rounded-lg border p-4 transition-all ${
                  isPublic ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "border-border"
                }`}
              >
                <div className="font-medium">Make Public</div>
                <div className="text-xs text-muted-foreground">Share with community</div>
              </button>
            </div>
            {/* Error message */}
            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}
            
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Complete Setup
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Progress dots */}
        <div className="mt-6 flex justify-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 w-2 rounded-full transition-all ${
                s === step ? "w-6 bg-primary" : s < step ? "bg-primary/50" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface DashboardStats {
  templatesCreated: number;
  totalDownloads: number;
  totalFavorites: number;
  linkedProviders: string[];
}

interface MyTemplate {
  id: string;
  name: string;
  type: string;
  downloads: number;
  favorites: number;
  isPublic: boolean;
  createdAt: string;
}

interface RecentActivity {
  id: string;
  templateId: string;
  templateName: string;
  templateType: string;
  platform: string | null;
  createdAt: string;
  isOwnDownload: boolean;
}

interface FavoriteTemplate {
  id: string;
  name: string;
  description: string | null;
  downloads: number;
  favorites: number;
  tier: string;
  isOfficial: boolean;
  author?: string;
}

interface PurchasedBlueprint {
  id: string;
  name: string;
  description: string | null;
  downloads: number;
  favorites: number;
  tier: string;
  price: number;
  author: string;
  purchasedAt: string;
}

interface DashboardData {
  stats: DashboardStats;
  myTemplates: MyTemplate[];
  recentActivity: RecentActivity[];
  favoriteTemplates: FavoriteTemplate[];
  purchasedBlueprints: PurchasedBlueprint[];
}

// Preferences/Static Files types
interface SavedPreference {
  category: string;
  key: string;
  value: string;
  isDefault: boolean;
}

// Category display config
const PREFERENCE_CATEGORIES: Record<string, { label: string; icon: React.ElementType; description: string }> = {
  staticFiles: { label: "Static Files", icon: FileCode, description: "FUNDING.yml, .editorconfig, etc." },
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

// Preferences Panel Component
function PreferencesPanel({ 
  preferences, 
  onUpdate,
  onDelete,
}: { 
  preferences: Record<string, Record<string, { value: string; isDefault: boolean }>>;
  onUpdate: (category: string, key: string, value: string) => Promise<void>;
  onDelete: (category: string, key: string) => Promise<void>;
}) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["staticFiles"]);
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
    if (category === "staticFiles") {
      return STATIC_FILE_NAMES[key] || key;
    }
    // Convert camelCase to Title Case
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  const categories = Object.keys(preferences);
  
  if (categories.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
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
    <div className="space-y-3">
      {categories.map(category => {
        const categoryConfig = PREFERENCE_CATEGORIES[category] || PREFERENCE_CATEGORIES.general;
        const CategoryIcon = categoryConfig.icon;
        const items = Object.entries(preferences[category]);
        const isExpanded = expandedCategories.includes(category);

        return (
          <div key={category} className="rounded-lg border bg-card overflow-hidden">
            <button
              onClick={() => toggleCategory(category)}
              className="flex w-full items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-muted p-2">
                  <CategoryIcon className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <h4 className="font-medium">{categoryConfig.label}</h4>
                  <p className="text-xs text-muted-foreground">{items.length} saved item{items.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            
            {isExpanded && (
              <div className="border-t divide-y">
                {items.map(([key, { value, isDefault }]) => {
                  const isEditing = editingItem?.category === category && editingItem?.key === key;
                  const displayName = getDisplayName(category, key);
                  const isLongContent = value.length > 100 || value.includes('\n');

                  return (
                    <div key={key} className="p-4">
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

export default function DashboardPage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [preferences, setPreferences] = useState<Record<string, Record<string, { value: string; isDefault: boolean }>>>({});
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      fetchDashboardData();
      fetchPreferences();
      // Show welcome modal if profile not completed
      if (session?.user && !session.user.profileCompleted) {
        setShowWelcome(true);
      }
    }
  }, [status, session?.user?.profileCompleted]);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/user/dashboard");
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const res = await fetch("/api/user/wizard-preferences");
      if (res.ok) {
        const data = await res.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error("Failed to fetch preferences:", error);
    } finally {
      setPreferencesLoading(false);
    }
  };

  const handleUpdatePreference = async (category: string, key: string, value: string) => {
    const res = await fetch("/api/user/wizard-preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        preferences: [{ category, key, value, isDefault: preferences[category]?.[key]?.isDefault ?? false }]
      }),
    });
    if (res.ok) {
      // Update local state
      setPreferences(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [key]: { ...prev[category]?.[key], value }
        }
      }));
    }
  };

  const handleDeletePreference = async (category: string, key: string) => {
    const res = await fetch(`/api/user/wizard-preferences?category=${category}&key=${key}`, {
      method: "DELETE",
    });
    if (res.ok) {
      // Update local state
      setPreferences(prev => {
        const newPrefs = { ...prev };
        if (newPrefs[category]) {
          delete newPrefs[category][key];
          // Remove category if empty
          if (Object.keys(newPrefs[category]).length === 0) {
            delete newPrefs[category];
          }
        }
        return newPrefs;
      });
    }
  };

  const handleWelcomeComplete = async () => {
    setShowWelcome(false);
    // Refresh the session to get updated profileCompleted
    await updateSession();
    // Refresh dashboard data
    fetchDashboardData();
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Sign in required</h1>
          <p className="mt-2 text-muted-foreground">
            Please sign in to access your dashboard.
          </p>
          <Button asChild className="mt-4">
            <Link href="/auth/signin">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: "Create Configuration",
      description: "Generate AI IDE configs with our wizard",
      icon: Wand2,
      href: "/wizard",
      primary: true,
    },
    {
      title: "Share Blueprint",
      description: "Upload and monetize your prompts",
      icon: Upload,
      href: "/blueprints/create",
    },
    {
      title: "Browse Blueprints",
      description: "Explore community blueprints",
      icon: FileText,
      href: "/blueprints",
    },
    {
      title: "Settings",
      description: "Profile & linked accounts",
      icon: Settings,
      href: "/settings/profile",
    },
  ];

  const stats = dashboardData?.stats || {
    templatesCreated: 0,
    totalDownloads: 0,
    totalFavorites: 0,
    linkedProviders: [],
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "github":
        return <Github className="h-4 w-4" />;
      case "google":
        return (
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        );
      case "email":
        return <Mail className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Welcome Modal for new users */}
      {showWelcome && (
        <WelcomeModal 
          onComplete={handleWelcomeComplete} 
          userName={session?.user?.name}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="flex items-center gap-4">
            <Link href="/blueprints" className="text-sm hover:underline">
              Blueprints
            </Link>
            <ThemeToggle />
            <UserMenu />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                Welcome back
                {session?.user?.name ? `, ${session.user.name}` : ""}!
              </h1>
              <p className="mt-1 text-muted-foreground">
                Here&apos;s what&apos;s happening with your blueprints
              </p>
            </div>
            <Button asChild>
              <Link href="/wizard">
                <Wand2 className="mr-2 h-4 w-4" />
                New Configuration
              </Link>
            </Button>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column: Quick Actions + My Templates */}
            <div className="space-y-8 lg:col-span-2">
              {/* Quick Actions */}
              <div>
                <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {quickActions.map((action) => (
                    <Link
                      key={action.href}
                      href={action.href}
                      className={`group relative overflow-hidden rounded-lg border p-5 transition-all hover:border-primary hover:shadow-md ${
                        action.primary
                          ? "border-primary bg-primary/5"
                          : "bg-card"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className={`rounded-lg p-2 ${
                            action.primary
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <action.icon className="h-5 w-5" />
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                      </div>
                      <h3 className="mt-3 font-semibold">{action.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>

              {/* My Blueprints */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">My Blueprints</h2>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/blueprints/create">
                      <Plus className="mr-2 h-4 w-4" />
                      Create New
                    </Link>
                  </Button>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-20 animate-pulse rounded-lg bg-muted"
                      />
                    ))}
                  </div>
                ) : dashboardData?.myTemplates.length === 0 ? (
                  <div className="rounded-lg border bg-card p-8 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold">No blueprints yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Create your first blueprint to share with the community
                    </p>
                    <Button asChild className="mt-4" size="sm">
                      <Link href="/blueprints/create">
                        <Upload className="mr-2 h-4 w-4" />
                        Share Blueprint
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dashboardData?.myTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="rounded-lg bg-muted p-2">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-medium">{template.name}</h4>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Download className="h-3 w-3" />
                                {template.downloads}
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                {template.favorites}
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs ${
                                  template.isPublic
                                    ? "bg-green-500/10 text-green-600"
                                    : "bg-yellow-500/10 text-yellow-600"
                                }`}
                              >
                                {template.isPublic ? "Public" : "Private"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" asChild title="View">
                            <Link href={`/blueprints/${template.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild title="Edit">
                            <Link href={`/blueprints/${template.id}/edit`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Favorite Blueprints */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Favorite Blueprints</h2>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/blueprints">
                      Browse All
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                {loading ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-24 animate-pulse rounded-lg bg-muted"
                      />
                    ))}
                  </div>
                ) : !dashboardData?.favoriteTemplates ||
                  dashboardData.favoriteTemplates.length === 0 ? (
                  <div className="rounded-lg border bg-card p-6 text-center">
                    <Heart className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <h3 className="font-medium">No favorites yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Browse blueprints and click the heart to save them here
                    </p>
                    <Button
                      asChild
                      className="mt-4"
                      size="sm"
                      variant="outline"
                    >
                      <Link href="/blueprints">Browse Blueprints</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {dashboardData.favoriteTemplates
                      .slice(0, 4)
                      .map((template) => (
                        <Link
                          key={template.id}
                          href={`/blueprints/${template.id}`}
                          className="group rounded-lg border bg-card p-4 transition-colors hover:border-primary"
                        >
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <h4 className="truncate font-medium group-hover:text-primary">
                                {template.name}
                              </h4>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {template.isOfficial
                                  ? "LynxPrompt"
                                  : template.author}
                              </p>
                            </div>
                            {template.isOfficial && (
                              <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                                Official
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Download className="h-3 w-3" />
                              {template.downloads}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {template.favorites}
                            </span>
                          </div>
                        </Link>
                      ))}
                  </div>
                )}
              </div>

              {/* Purchased Blueprints */}
              {dashboardData?.purchasedBlueprints && dashboardData.purchasedBlueprints.length > 0 && (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Purchased Blueprints</h2>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/blueprints">
                        Browse More
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {dashboardData.purchasedBlueprints.map((blueprint) => (
                      <Link
                        key={blueprint.id}
                        href={`/blueprints/${blueprint.id}`}
                        className="group rounded-lg border bg-card p-4 transition-colors hover:border-primary"
                      >
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <h4 className="truncate font-medium group-hover:text-primary">
                              {blueprint.name}
                            </h4>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              by {blueprint.author}
                            </p>
                          </div>
                          <span className="ml-2 rounded bg-gradient-to-r from-purple-500/10 to-pink-500/10 px-1.5 py-0.5 text-xs font-medium text-purple-600 dark:text-purple-400">
                            €{(blueprint.price / 100).toFixed(2)}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <ShoppingBag className="h-3 w-3" />
                            Purchased
                          </span>
                          <span className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            {blueprint.downloads}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Activity Feed + Getting Started */}
            <div className="space-y-8">
              {/* Saved Preferences & Static Files */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Wizard Preferences</h2>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowPreferences(!showPreferences)}
                  >
                    <FolderCog className="mr-2 h-4 w-4" />
                    {showPreferences ? "Hide" : "Manage"}
                  </Button>
                </div>

                {showPreferences && (
                  preferencesLoading ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
                      ))}
                    </div>
                  ) : (
                    <PreferencesPanel 
                      preferences={preferences}
                      onUpdate={handleUpdatePreference}
                      onDelete={handleDeletePreference}
                    />
                  )
                )}

                {!showPreferences && (
                  <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-muted p-2">
                        <FolderCog className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {Object.keys(preferences).length > 0 
                            ? `${Object.values(preferences).reduce((acc, cat) => acc + Object.keys(cat).length, 0)} saved items`
                            : "No saved preferences"
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Static files, licenses, and wizard settings
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div>
                <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>
                <div className="rounded-lg border bg-card">
                  {loading ? (
                    <div className="space-y-3 p-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-12 animate-pulse rounded bg-muted"
                        />
                      ))}
                    </div>
                  ) : dashboardData?.recentActivity.length === 0 ? (
                    <div className="p-8 text-center">
                      <Activity className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        No activity yet
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {dashboardData?.recentActivity
                        .slice(0, 6)
                        .map((activity) => (
                          <div
                            key={activity.id}
                            className="flex items-start gap-3 p-4"
                          >
                            <div
                              className={`rounded-full p-2 ${
                                activity.isOwnDownload
                                  ? "bg-blue-500/10"
                                  : "bg-green-500/10"
                              }`}
                            >
                              <Download
                                className={`h-3 w-3 ${
                                  activity.isOwnDownload
                                    ? "text-blue-500"
                                    : "text-green-500"
                                }`}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm">
                                {activity.isOwnDownload ? (
                                  <>
                                    You downloaded{" "}
                                    <span className="font-medium">
                                      {activity.templateName}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    Someone downloaded{" "}
                                    <span className="font-medium">
                                      {activity.templateName}
                                    </span>
                                  </>
                                )}
                              </p>
                              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatDate(activity.createdAt)}
                                {activity.platform && (
                                  <span className="ml-2 rounded bg-muted px-1.5 py-0.5">
                                    {activity.platform}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Earn Money CTA */}
              <div className="rounded-lg border bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-green-500/10 p-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Turn prompts into income</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Have a great AI config? Share it and earn <strong>70% of each sale</strong>.
                      Even wizard-generated configs can be shared!
                    </p>
                    <Button
                      asChild
                      className="mt-4 bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <Link href="/blueprints/create">
                        <Upload className="mr-2 h-4 w-4" />
                        Share & Earn
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Analytics Preview */}
              <div className="rounded-lg border bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold">Analytics</h3>
                  <BarChart3 className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Detailed analytics coming soon! Track your template
                  performance, downloads over time, and earnings.
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards - moved to end */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Blueprints Created
                  </p>
                  <p className="text-2xl font-bold">
                    {loading ? "-" : stats.templatesCreated}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-green-500/10 p-3">
                  <Download className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Downloads
                  </p>
                  <p className="text-2xl font-bold">
                    {loading ? "-" : stats.totalDownloads}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-pink-500/10 p-3">
                  <Heart className="h-6 w-6 text-pink-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Favorites Given
                  </p>
                  <p className="text-2xl font-bold">
                    {loading ? "-" : stats.totalFavorites}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-blue-500/10 p-3">
                  <TrendingUp className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Linked Accounts
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">
                      {loading ? "-" : stats.linkedProviders.length}
                    </p>
                    {!loading && stats.linkedProviders.length > 0 && (
                      <div className="flex gap-1">
                        {stats.linkedProviders.map((p) => (
                          <span key={p} className="text-muted-foreground">
                            {getProviderIcon(p)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

