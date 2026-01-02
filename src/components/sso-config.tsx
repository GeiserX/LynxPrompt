"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Loader2,
  Check,
  X,
  AlertCircle,
  Key,
  Globe,
  Lock,
  Server,
} from "lucide-react";

interface SSOConfig {
  configured: boolean;
  provider?: "SAML" | "OIDC" | "LDAP";
  enabled?: boolean;
  allowedDomains?: string[];
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

  // Form state
  const [provider, setProvider] = useState<"SAML" | "OIDC" | "LDAP">("SAML");
  const [enabled, setEnabled] = useState(false);
  const [allowedDomains, setAllowedDomains] = useState("");

  // SAML fields
  const [entityId, setEntityId] = useState("");
  const [ssoUrl, setSsoUrl] = useState("");
  const [certificate, setCertificate] = useState("");

  // OIDC fields
  const [issuer, setIssuer] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");

  // LDAP fields
  const [ldapHost, setLdapHost] = useState("");
  const [ldapPort, setLdapPort] = useState(389);
  const [baseDn, setBaseDn] = useState("");
  const [bindDn, setBindDn] = useState("");
  const [bindPassword, setBindPassword] = useState("");

  const [showForm, setShowForm] = useState(false);

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
          setProvider(data.provider);
          setEnabled(data.enabled);
          setAllowedDomains((data.allowedDomains || []).join(", "));
          
          // Pre-fill config fields based on provider
          if (data.config) {
            if (data.provider === "SAML") {
              setEntityId(data.config.entityId as string || "");
              setSsoUrl(data.config.ssoUrl as string || "");
              setCertificate(data.config.certificate as string || "");
            } else if (data.provider === "OIDC") {
              setIssuer(data.config.issuer as string || "");
              setClientId(data.config.clientId as string || "");
            } else if (data.provider === "LDAP") {
              setLdapHost(data.config.host as string || "");
              setLdapPort(data.config.port as number || 389);
              setBaseDn(data.config.baseDn as string || "");
              setBindDn(data.config.bindDn as string || "");
            }
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
      let configData: Record<string, unknown> = {
        provider,
        enabled,
        allowedDomains: allowedDomains.split(",").map(d => d.trim()).filter(Boolean),
      };

      if (provider === "SAML") {
        configData = {
          ...configData,
          entityId,
          ssoUrl,
          certificate,
        };
      } else if (provider === "OIDC") {
        configData = {
          ...configData,
          issuer,
          clientId,
          clientSecret: clientSecret || undefined,
        };
      } else if (provider === "LDAP") {
        configData = {
          ...configData,
          host: ldapHost,
          port: ldapPort,
          baseDn,
          bindDn,
          bindPassword: bindPassword || undefined,
        };
      }

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
                {ssoConfig.provider === "SAML" && <Key className="h-5 w-5 text-blue-500" />}
                {ssoConfig.provider === "OIDC" && <Globe className="h-5 w-5 text-green-500" />}
                {ssoConfig.provider === "LDAP" && <Server className="h-5 w-5 text-purple-500" />}
                <div>
                  <p className="font-medium">{ssoConfig.provider} Authentication</p>
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

            {ssoConfig.allowedDomains && ssoConfig.allowedDomains.length > 0 && (
              <div className="mt-3 border-t pt-3">
                <p className="text-xs text-muted-foreground">Allowed domains:</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {ssoConfig.allowedDomains.map((domain) => (
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
                Configure SAML 2.0, OpenID Connect, or LDAP for your team.
              </p>
              <Button onClick={() => setShowForm(true)} className="w-full">
                <Lock className="mr-2 h-4 w-4" />
                Configure SSO
              </Button>
            </div>
          )}

          {showForm && (
            <div className="space-y-4">
              {/* Provider selection */}
              <div>
                <label className="mb-2 block text-sm font-medium">Provider</label>
                <div className="flex gap-2">
                  {(["SAML", "OIDC", "LDAP"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setProvider(p)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        provider === p
                          ? "border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400"
                          : "hover:bg-muted"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* SAML fields */}
              {provider === "SAML" && (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Identity Provider Entity ID
                    </label>
                    <input
                      type="url"
                      value={entityId}
                      onChange={(e) => setEntityId(e.target.value)}
                      placeholder="https://idp.example.com/metadata"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">SSO Login URL</label>
                    <input
                      type="url"
                      value={ssoUrl}
                      onChange={(e) => setSsoUrl(e.target.value)}
                      placeholder="https://idp.example.com/sso/saml"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      X.509 Certificate (PEM format)
                    </label>
                    <textarea
                      value={certificate}
                      onChange={(e) => setCertificate(e.target.value)}
                      placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                      rows={4}
                      className="w-full rounded-lg border bg-background px-3 py-2 font-mono text-xs"
                    />
                  </div>
                </>
              )}

              {/* OIDC fields */}
              {provider === "OIDC" && (
                <>
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
                </>
              )}

              {/* LDAP fields */}
              {provider === "LDAP" && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium">LDAP Host</label>
                      <input
                        type="text"
                        value={ldapHost}
                        onChange={(e) => setLdapHost(e.target.value)}
                        placeholder="ldap.example.com"
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Port</label>
                      <input
                        type="number"
                        value={ldapPort}
                        onChange={(e) => setLdapPort(parseInt(e.target.value) || 389)}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Base DN</label>
                    <input
                      type="text"
                      value={baseDn}
                      onChange={(e) => setBaseDn(e.target.value)}
                      placeholder="dc=example,dc=com"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Bind DN</label>
                    <input
                      type="text"
                      value={bindDn}
                      onChange={(e) => setBindDn(e.target.value)}
                      placeholder="cn=admin,dc=example,dc=com"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Bind Password {ssoConfig?.configured && "(leave blank to keep current)"}
                    </label>
                    <input
                      type="password"
                      value={bindPassword}
                      onChange={(e) => setBindPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </>
              )}

              {/* Common fields */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Allowed Email Domains (optional)
                </label>
                <input
                  type="text"
                  value={allowedDomains}
                  onChange={(e) => setAllowedDomains(e.target.value)}
                  placeholder="example.com, company.org"
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Comma-separated list of allowed email domains. Leave empty to allow all.
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

