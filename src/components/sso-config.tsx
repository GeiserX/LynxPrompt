"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Loader2,
  Check,
  X,
  AlertCircle,
  Globe,
  Lock,
} from "lucide-react";

interface SSOConfig {
  configured: boolean;
  provider?: string;
  enabled?: boolean;
  allowedDomains?: string[];
  verifiedDomains?: string[];
  pendingDomains?: { domain: string; record: { name: string; value: string } }[];
  config?: Record<string, unknown>;
  lastSyncAt?: string;
  updatedAt?: string;
}

interface SSOConfigPanelProps {
  teamId: string;
}

export function SSOConfigPanel({ teamId }: SSOConfigPanelProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [ssoConfig, setSsoConfig] = useState<SSOConfig | null>(null);

  // Form state. OpenID Connect is the only provider.
  const [enabled, setEnabled] = useState(false);
  const [allowedDomains, setAllowedDomains] = useState("");
  const [issuer, setIssuer] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);

  useEffect(() => {
    fetchSSOConfig();
  }, [teamId]);

  const fetchSSOConfig = async () => {
    try {
      const res = await fetch(`/api/teams/${teamId}/sso`);
      const data = await res.json();
      
      if (res.ok) {
        setSsoConfig(data);
        if (data.configured) {
          setEnabled(data.enabled);
          setAllowedDomains((data.allowedDomains || []).join(", "));
          
          // The client secret comes back masked; never pre-fill it
          if (data.config) {
            setIssuer(data.config.issuer as string || "");
            setClientId(data.config.clientId as string || "");
          }
        }
      }
    } catch {
      setError("Failed to load SSO configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const configData = {
        provider: "OIDC",
        enabled,
        allowedDomains: allowedDomains.split(",").map(d => d.trim()).filter(Boolean),
        issuer,
        clientId,
        clientSecret: clientSecret || undefined,
      };

      const res = await fetch(`/api/teams/${teamId}/sso`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save SSO configuration");
      }

      setSuccess(data.message);
      setShowForm(false);
      fetchSSOConfig();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/teams/${teamId}/sso`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !ssoConfig?.enabled }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to toggle SSO");
      }

      setSuccess(data.message);
      fetchSSOConfig();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle");
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyDomain = async (domain: string) => {
    setVerifying(domain);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/teams/${teamId}/sso/verify-domain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to verify domain");
      }

      setSuccess(`${domain} is verified`);
      fetchSSOConfig();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify domain");
    } finally {
      setVerifying(null);
    }
  };

  const handleRemove = async () => {
    if (!confirm("Are you sure you want to remove SSO configuration? This cannot be undone.")) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/teams/${teamId}/sso`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to remove SSO");
      }

      setSuccess(data.message);
      setSsoConfig({ configured: false });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <Shield className="h-5 w-5 text-teal-500" />
        Enterprise SSO
      </h2>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-600 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
          <Check className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      {ssoConfig?.configured && !showForm ? (
        <div className="space-y-4">
          {/* Current config display */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">
                    {ssoConfig.provider === "OIDC" ? "OpenID Connect" : ssoConfig.provider}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {ssoConfig.enabled ? "Enabled" : "Disabled"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {ssoConfig.enabled ? (
                  <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                    <Check className="h-4 w-4" /> Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <X className="h-4 w-4" /> Inactive
                  </span>
                )}
              </div>
            </div>

            {ssoConfig.provider !== "OIDC" && (
              <p className="mt-3 border-t pt-3 text-sm text-muted-foreground">
                {ssoConfig.provider} sign-in is not supported and signs nobody in. Edit the
                configuration to use OpenID Connect instead.
              </p>
            )}

            {(ssoConfig.verifiedDomains?.length ?? 0) > 0 && (
              <div className="mt-3 border-t pt-3">
                <p className="text-xs text-muted-foreground">Verified domains:</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {ssoConfig.verifiedDomains!.map((domain) => (
                    <span
                      key={domain}
                      className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                    >
                      @{domain}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(ssoConfig.pendingDomains?.length ?? 0) > 0 && (
              <div className="mt-3 space-y-3 border-t pt-3">
                <p className="text-xs text-muted-foreground">
                  Not verified yet. SSO signs in nobody on these domains until you add this TXT
                  record to the domain&apos;s DNS and press Verify:
                </p>
                {ssoConfig.pendingDomains!.map(({ domain, record }) => (
                  <div key={domain} className="rounded-lg border p-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">@{domain}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVerifyDomain(domain)}
                        disabled={verifying !== null}
                      >
                        {verifying === domain && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                        Verify
                      </Button>
                    </div>
                    <p className="mt-2 text-muted-foreground">Name</p>
                    <code className="block break-all">{record.name}</code>
                    <p className="mt-1 text-muted-foreground">Value</p>
                    <code className="block break-all">{record.value}</code>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleToggle}
              disabled={saving}
              className="flex-1"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : ssoConfig.enabled ? (
                <X className="mr-2 h-4 w-4" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              {ssoConfig.enabled ? "Disable" : "Enable"} SSO
            </Button>
            <Button variant="outline" onClick={() => setShowForm(true)}>
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={handleRemove}
              disabled={saving}
              className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
            >
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <>
          {!showForm && !ssoConfig?.configured && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Configure OpenID Connect (OIDC) sign-in for your team.
              </p>
              <Button onClick={() => setShowForm(true)} className="w-full">
                <Lock className="mr-2 h-4 w-4" />
                Configure SSO
              </Button>
            </div>
          )}

          {showForm && (
            <div className="space-y-4">
              {/* OIDC fields */}
              <div>
                <label className="mb-1 block text-sm font-medium">Issuer URL</label>
                <input
                  type="url"
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  placeholder="https://accounts.google.com"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Client ID</label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="your-client-id"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Client Secret {ssoConfig?.configured && "(leave blank to keep current)"}
                </label>
                <input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
              </div>

              {/* Common fields */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Email Domains
                </label>
                <input
                  type="text"
                  value={allowedDomains}
                  onChange={(e) => setAllowedDomains(e.target.value)}
                  placeholder="example.com, company.org"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Comma-separated. SSO signs in only addresses on these domains, each once you
                  prove you own it with a DNS record.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="enabled" className="text-sm">
                  Enable SSO immediately after saving
                </label>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Configuration
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
