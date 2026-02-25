"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface FeatureFlags {
  enableGithubOAuth: boolean;
  enableGoogleOAuth: boolean;
  enableEmailAuth: boolean;
  enablePasskeys: boolean;
  enableTurnstile: boolean;
  enableSSO: boolean;
  enableUserRegistration: boolean;
  enableAI: boolean;
  enableBlog: boolean;
  enableSupportForum: boolean;
  enableStripe: boolean;
  appName: string;
  appUrl: string;
  appLogoUrl: string;
}

const defaultFlags: FeatureFlags = {
  enableGithubOAuth: false,
  enableGoogleOAuth: false,
  enableEmailAuth: true,
  enablePasskeys: true,
  enableTurnstile: false,
  enableSSO: false,
  enableUserRegistration: true,
  enableAI: false,
  enableBlog: false,
  enableSupportForum: false,
  enableStripe: false,
  appName: "LynxPrompt",
  appUrl: "http://localhost:3000",
  appLogoUrl: "",
};

const FeatureFlagsContext = createContext<FeatureFlags>(defaultFlags);

export function useFeatureFlags() {
  return useContext(FeatureFlagsContext);
}

export function FeatureFlagsProvider({
  children,
  initialFlags,
}: {
  children: React.ReactNode;
  initialFlags?: Partial<FeatureFlags>;
}) {
  const [flags, setFlags] = useState<FeatureFlags>({
    ...defaultFlags,
    ...initialFlags,
  });

  useEffect(() => {
    fetch("/api/config/public")
      .then((res) => res.json())
      .then((data) => setFlags((prev) => ({ ...prev, ...data })))
      .catch(() => {});
  }, []);

  return (
    <FeatureFlagsContext.Provider value={flags}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}
