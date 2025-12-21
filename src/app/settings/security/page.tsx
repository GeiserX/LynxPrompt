"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ArrowLeft,
  Key,
  Trash2,
  Plus,
  Shield,
  Smartphone,
  Laptop,
  Clock,
} from "lucide-react";
import { startRegistration } from "@simplewebauthn/browser";

interface Passkey {
  id: string;
  name: string | null;
  credentialDeviceType: string;
  credentialBackedUp: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

export default function SecuritySettingsPage() {
  const { data: session, status } = useSession();
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [passkeyName, setPasskeyName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchPasskeys();
    }
  }, [status]);

  const fetchPasskeys = async () => {
    try {
      const res = await fetch("/api/auth/passkey/list");
      if (res.ok) {
        const data = await res.json();
        setPasskeys(data);
      }
    } catch {
      setError("Failed to load passkeys");
    } finally {
      setLoading(false);
    }
  };

  const registerPasskey = async () => {
    setRegistering(true);
    setError(null);
    setSuccess(null);

    try {
      // Get registration options
      const optionsRes = await fetch("/api/auth/passkey/register/options", {
        method: "POST",
      });
      if (!optionsRes.ok) {
        throw new Error("Failed to get registration options");
      }
      const options = await optionsRes.json();

      // Start WebAuthn registration
      const attResp = await startRegistration(options);

      // Verify registration
      const verifyRes = await fetch("/api/auth/passkey/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response: attResp,
          name: passkeyName || "My Passkey",
        }),
      });

      if (!verifyRes.ok) {
        throw new Error("Failed to verify registration");
      }

      setSuccess("Passkey registered successfully!");
      setPasskeyName("");
      setShowNameInput(false);
      fetchPasskeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register passkey");
    } finally {
      setRegistering(false);
    }
  };

  const deletePasskey = async (id: string) => {
    if (!confirm("Are you sure you want to delete this passkey?")) return;

    try {
      const res = await fetch("/api/auth/passkey/list", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setSuccess("Passkey deleted successfully");
        fetchPasskeys();
      } else {
        throw new Error("Failed to delete passkey");
      }
    } catch {
      setError("Failed to delete passkey");
    }
  };

  const getDeviceIcon = (type: string) => {
    if (type.includes("platform")) return <Laptop className="h-5 w-5" />;
    return <Smartphone className="h-5 w-5" />;
  };

  if (status === "loading" || loading) {
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
            Please sign in to manage your security settings.
          </p>
          <Button asChild className="mt-4">
            <Link href="/auth/signin">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">LynxPrompt</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8">
        <div className="container mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Security Settings</h1>
                <p className="text-muted-foreground">
                  Manage your passkeys and security options
                </p>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
              {success}
            </div>
          )}

          {/* Passkeys Section */}
          <div className="rounded-xl border bg-card p-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="font-semibold">Passkeys</h2>
                  <p className="text-sm text-muted-foreground">
                    Passwordless authentication using biometrics or security keys
                  </p>
                </div>
              </div>
            </div>

            {/* Passkey List */}
            {passkeys.length > 0 ? (
              <div className="mb-6 space-y-3">
                {passkeys.map((passkey) => (
                  <div
                    key={passkey.id}
                    className="flex items-center justify-between rounded-lg border bg-muted/30 p-4"
                  >
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(passkey.credentialDeviceType)}
                      <div>
                        <p className="font-medium">{passkey.name || "Passkey"}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Created{" "}
                            {new Date(passkey.createdAt).toLocaleDateString()}
                          </span>
                          {passkey.lastUsedAt && (
                            <span>
                              Last used{" "}
                              {new Date(passkey.lastUsedAt).toLocaleDateString()}
                            </span>
                          )}
                          {passkey.credentialBackedUp && (
                            <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-green-600">
                              Backed up
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePasskey(passkey.id)}
                      className="text-red-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mb-6 rounded-lg border border-dashed bg-muted/30 p-8 text-center">
                <Key className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No passkeys registered yet
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add a passkey for faster, more secure sign-in
                </p>
              </div>
            )}

            {/* Add Passkey */}
            {showNameInput ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={passkeyName}
                  onChange={(e) => setPasskeyName(e.target.value)}
                  placeholder="Passkey name (e.g., MacBook Pro)"
                  className="flex-1 rounded-lg border bg-background px-3 py-2"
                  autoFocus
                />
                <Button onClick={registerPasskey} disabled={registering}>
                  {registering ? "Registering..." : "Register"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowNameInput(false);
                    setPasskeyName("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button onClick={() => setShowNameInput(true)} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Passkey
              </Button>
            )}
          </div>

          {/* Account Info */}
          <div className="mt-6 rounded-xl border bg-card p-6">
            <h2 className="mb-4 font-semibold">Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span>{session?.user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role</span>
                <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {session?.user?.role || "USER"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              © 2025 LynxPrompt by{" "}
              <a
                href="https://geiser.cloud"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                Geiser Cloud
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}




