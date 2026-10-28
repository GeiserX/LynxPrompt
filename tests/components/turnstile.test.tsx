import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, act } from "@testing-library/react";

// The widget re-issues a token after the old one expires or after the
// server used one up; that new token has to reach the parent.

vi.mock("@/components/providers/feature-flags-provider", () => ({
  useFeatureFlags: () => ({ enableTurnstile: true }),
}));

vi.mock("next/script", () => ({
  default: ({ onLoad }: { onLoad?: () => void }) => {
    // Load "immediately" after mount, like a cached script
    setTimeout(() => onLoad?.(), 0);
    return null;
  },
}));

type RenderOptions = {
  callback: (token: string) => void;
  "expired-callback"?: () => void;
};

let widgetOptions: RenderOptions | null;
const reset = vi.fn();

beforeEach(() => {
  widgetOptions = null;
  reset.mockClear();
  window.turnstile = {
    render: (_el, options) => {
      widgetOptions = options as RenderOptions;
      return "widget-1";
    },
    reset,
    remove: vi.fn(),
  };
  vi.spyOn(global, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ turnstileSiteKey: "site-key" }), { status: 200 }),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  delete window.turnstile;
});

async function mountWidget(props: { resetSignal?: number } = {}) {
  const { Turnstile } = await import("@/components/turnstile");
  const onSuccess = vi.fn();
  const onExpire = vi.fn();
  const view = render(<Turnstile onSuccess={onSuccess} onExpire={onExpire} {...props} />);
  await waitFor(() => expect(widgetOptions).not.toBeNull());
  return { Turnstile, onSuccess, onExpire, view };
}

describe("Turnstile", () => {
  it("hands the token issued after expiry to the parent", async () => {
    const { onSuccess, onExpire } = await mountWidget();

    act(() => widgetOptions!.callback("first"));
    act(() => widgetOptions!["expired-callback"]!());
    act(() => widgetOptions!.callback("second"));

    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(onSuccess.mock.calls.map((c) => c[0])).toEqual(["first", "second"]);
  });

  it("resets the widget when resetSignal changes and passes on the new token", async () => {
    const { Turnstile, onSuccess, onExpire, view } = await mountWidget({ resetSignal: 0 });

    act(() => widgetOptions!.callback("first"));
    view.rerender(<Turnstile onSuccess={onSuccess} onExpire={onExpire} resetSignal={1} />);
    expect(reset).toHaveBeenCalledWith("widget-1");

    act(() => widgetOptions!.callback("second"));
    expect(onSuccess.mock.calls.map((c) => c[0])).toEqual(["first", "second"]);
  });
});
