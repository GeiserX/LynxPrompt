import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import {
  FeatureFlagsProvider,
  useFeatureFlags,
} from "@/components/providers/feature-flags-provider";

function FlagConsumer() {
  const flags = useFeatureFlags();
  return (
    <div>
      <span data-testid="appName">{flags.appName}</span>
      <span data-testid="enableAI">{String(flags.enableAI)}</span>
      <span data-testid="enableEmailAuth">{String(flags.enableEmailAuth)}</span>
    </div>
  );
}

describe("FeatureFlagsProvider", () => {
  beforeEach(() => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render children", async () => {
    await act(async () => {
      render(
        <FeatureFlagsProvider>
          <div data-testid="child">Hello</div>
        </FeatureFlagsProvider>,
      );
    });
    expect(screen.getByTestId("child")).toHaveTextContent("Hello");
  });

  it("should provide default flags", async () => {
    await act(async () => {
      render(
        <FeatureFlagsProvider>
          <FlagConsumer />
        </FeatureFlagsProvider>,
      );
    });
    expect(screen.getByTestId("appName")).toHaveTextContent("LynxPrompt");
    expect(screen.getByTestId("enableAI")).toHaveTextContent("false");
    expect(screen.getByTestId("enableEmailAuth")).toHaveTextContent("true");
  });

  it("should merge initialFlags with defaults", async () => {
    await act(async () => {
      render(
        <FeatureFlagsProvider
          initialFlags={{ appName: "CustomApp", enableAI: true }}
        >
          <FlagConsumer />
        </FeatureFlagsProvider>,
      );
    });
    expect(screen.getByTestId("appName")).toHaveTextContent("CustomApp");
    expect(screen.getByTestId("enableAI")).toHaveTextContent("true");
    expect(screen.getByTestId("enableEmailAuth")).toHaveTextContent("true");
  });

  it("should fetch flags from /api/config/public and update", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ appName: "FetchedApp", enableAI: true }),
        { status: 200 },
      ),
    );

    render(
      <FeatureFlagsProvider>
        <FlagConsumer />
      </FeatureFlagsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("appName")).toHaveTextContent("FetchedApp");
    });
    expect(screen.getByTestId("enableAI")).toHaveTextContent("true");
  });

  it("should call /api/config/public on mount", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );

    render(
      <FeatureFlagsProvider>
        <FlagConsumer />
      </FeatureFlagsProvider>,
    );

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith("/api/config/public");
    });
  });

  it("should handle fetch failure gracefully", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    render(
      <FeatureFlagsProvider>
        <FlagConsumer />
      </FeatureFlagsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("appName")).toHaveTextContent("LynxPrompt");
    });
  });
});
