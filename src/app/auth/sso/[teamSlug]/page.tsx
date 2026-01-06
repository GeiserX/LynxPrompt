"use client";

import { useState, useEffect, use } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { 
  Building2, 
  Loader2, 
  AlertCircle, 
  ArrowLeft,
  Shield,
  KeyRound,
  ExternalLink 
} from "lucide-react";

interface SSOConfig {
  configured: boolean;
  provider?: "SAML" | "OIDC" | "LDAP";
  enabled?: boolean;
  teamName?: string;
  teamId?: string;
  error?: string;
}

export default function SSOLoginPage({ 
  params 
}: { 
  params: Promise<{ teamSlug: string }> 
}) {
  const { teamSlug } = use(params);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  
  const [loading, setLoading] = useState(true);
  const [ssoConfig, setSsoConfig] = useState<SSOConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initiating, setInitiating] = useState(false);

  // Fetch team SSO config
  useEffect(() => {
    async function fetchSSOConfig() {
      try {
        const res = await fetch(`/api/auth/sso/team/${teamSlug}`);
        const data = await res.json();
        
        if (!res.ok) {
          setError(data.error || "Failed to load SSO configuration");
          setSsoConfig(null);
        } else {
          setSsoConfig(data);
        }
      } catch (err) {
        console.error("SSO config fetch error:", err);
        setError("Failed to load SSO configuration");
      } finally {
        setLoading(false);
      }
    }

    fetchSSOConfig();
  }, [teamSlug]);

  const handleSSOLogin = async () => {
    if (!ssoConfig?.configured || !ssoConfig?.enabled) return;

    setInitiating(true);
    setError(null);

    try {
      // Initiate SSO authentication
      const res = await fetch(`/api/auth/sso/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          teamSlug,
          callbackUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to initiate SSO");
        setInitiating(false);
        return;
      }

      // Redirect to SSO provider
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        setError("SSO provider did not return a redirect URL");
        setInitiating(false);
      }
    } catch (err) {
      console.error("SSO initiation error:", err);
      setError("Failed to initiate SSO authentication");
      setInitiating(false);
    }
  };

  const getProviderIcon = (provider?: string) => {
    switch (provider) {
      case "SAML":
        return <Shield className="h-6 w-6" />;
      case "OIDC":
        return <KeyRound className="h-6 w-6" />;
      case "LDAP":
        return <Building2 className="h-6 w-6" />;
      default:
        return <Building2 className="h-6 w-6" />;
    }
  };

  const getProviderName = (provider?: string) => {
    switch (provider) {
      case "SAML":
        return "SAML 2.0";
      case "OIDC":
        return "OpenID Connect";
      case "LDAP":
        return "LDAP / Active Directory";
      default:
        return "SSO";
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-teal-600/10 to-cyan-600/10 p-8">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <div className="rounded-xl bg-white/90 px-4 py-2 shadow-lg backdrop-blur-sm dark:bg-neutral-900/90">
            <Logo />
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-8 shadow-xl">
          {loading ? (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="h-10 w-10 animate-spin text-teal-500" />
              <p className="mt-4 text-muted-foreground">Loading SSO configuration...</p>
            </div>
          ) : error ? (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="mt-4 text-xl font-bold">SSO Error</h2>
              <p className="mt-2 text-muted-foreground">{error}</p>
              <Button variant="outline" className="mt-6" asChild>
                <Link href="/auth/signin">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign In
                </Link>
              </Button>
            </div>
          ) : !ssoConfig?.configured ? (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="mt-4 text-xl font-bold">SSO Not Configured</h2>
              <p className="mt-2 text-muted-foreground">
                SSO has not been set up for this team. Please contact your administrator.
              </p>
              <Button variant="outline" className="mt-6" asChild>
                <Link href="/auth/signin">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Use Another Sign-In Method
                </Link>
              </Button>
            </div>
          ) : !ssoConfig.enabled ? (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="mt-4 text-xl font-bold">SSO Disabled</h2>
              <p className="mt-2 text-muted-foreground">
                SSO is configured but currently disabled for {ssoConfig.teamName || "this team"}.
              </p>
              <Button variant="outline" className="mt-6" asChild>
                <Link href="/auth/signin">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Use Another Sign-In Method
                </Link>
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">
                {getProviderIcon(ssoConfig.provider)}
              </div>
              <h2 className="mt-4 text-xl font-bold">
                Sign in to {ssoConfig.teamName || teamSlug}
              </h2>
              <p className="mt-2 text-muted-foreground">
                Using {getProviderName(ssoConfig.provider)}
              </p>

              <Button
                onClick={handleSSOLogin}
                disabled={initiating}
                className="mt-6 w-full bg-teal-600 hover:bg-teal-700"
                size="lg"
              >
                {initiating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Redirecting to SSO...
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-2 h-5 w-5" />
                    Continue with SSO
                  </>
                )}
              </Button>

              <p className="mt-4 text-xs text-muted-foreground">
                You will be redirected to your organization&apos;s identity provider to sign in.
              </p>

              <div className="mt-6 border-t pt-6">
                <Link 
                  href="/auth/signin" 
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="mr-1 inline h-3 w-3" />
                  Use a different sign-in method
                </Link>
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="text-primary hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}





