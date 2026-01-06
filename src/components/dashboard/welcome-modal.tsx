"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Sparkles,
  User,
  X,
  Check,
  Loader2,
  Search,
} from "lucide-react";

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

interface WelcomeModalProps {
  onComplete: () => void;
  userName?: string | null;
}

export function WelcomeModal({ onComplete, userName }: WelcomeModalProps) {
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












