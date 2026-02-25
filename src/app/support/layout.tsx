import { notFound } from "next/navigation";
import { ENABLE_SUPPORT_FORUM } from "@/lib/feature-flags";

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!ENABLE_SUPPORT_FORUM) notFound();
  return children;
}
