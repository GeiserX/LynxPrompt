export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initFederation } = await import("@/lib/federation");
    initFederation();
  }
}
