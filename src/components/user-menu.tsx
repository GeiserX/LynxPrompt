"use client";

import { useState, useRef, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { getGravatarUrl } from "@/lib/utils";

export function UserMenu() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status === "loading") {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />;
  }

  if (status === "unauthenticated" || !session) {
    return (
      <Button asChild size="sm">
        <Link href="/auth/signin">Sign In</Link>
      </Button>
    );
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-sm transition-colors hover:bg-muted"
      >
        <img
          src={
            session.user.image ||
            (session.user.email
              ? getGravatarUrl(session.user.email, 48)
              : undefined)
          }
          alt=""
          className="h-6 w-6 rounded-full"
          onError={(e) => {
            // Fallback to identicon on error
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
          }}
        />
        <span className="hidden max-w-[100px] truncate sm:inline">
          {session.user.name || session.user.email?.split("@")[0]}
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border bg-background shadow-lg">
          {/* User info header */}
          <div className="border-b px-4 py-3">
            <p className="truncate font-medium">
              {session.user.name || "User"}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {session.user.email}
            </p>
          </div>

          {/* Menu items */}
          <div className="p-2">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              <User className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </div>

          {/* Sign out */}
          <div className="border-t p-2">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 dark:text-red-400 transition-colors hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

