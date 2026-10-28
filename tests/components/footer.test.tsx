import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "@/components/footer";
import { FeatureFlagsProvider } from "@/components/providers/feature-flags-provider";

describe("Footer", () => {
  beforeEach(() => {
    vi.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    // The browser has no server env; the flags must come from the provider
    delete process.env.ENABLE_BLOG;
    delete process.env.ENABLE_SUPPORT_FORUM;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows Blog and Support when the server flags say so", () => {
    render(
      <FeatureFlagsProvider initialFlags={{ enableBlog: true, enableSupportForum: true }}>
        <Footer />
      </FeatureFlagsProvider>
    );
    expect(screen.getByRole("link", { name: /blog/i })).toHaveAttribute("href", "/blog");
    expect(screen.getByRole("link", { name: /support/i })).toHaveAttribute("href", "/support");
  });

  it("hides them when the flags are off", () => {
    render(
      <FeatureFlagsProvider initialFlags={{ enableBlog: false, enableSupportForum: false }}>
        <Footer />
      </FeatureFlagsProvider>
    );
    expect(screen.queryByRole("link", { name: /blog/i })).toBeNull();
  });
});
