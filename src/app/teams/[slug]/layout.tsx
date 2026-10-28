import { PasskeyGuard } from "@/components/passkey-guard";

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PasskeyGuard>{children}</PasskeyGuard>;
}
