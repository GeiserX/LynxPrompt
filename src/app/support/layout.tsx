import { notFound } from "next/navigation";
import { envBool } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!envBool("ENABLE_SUPPORT_FORUM", false)) notFound();
  return children;
}
