import { PasskeyGuard } from "@/components/passkey-guard";

export default function TeamsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PasskeyGuard>{children}</PasskeyGuard>;
}
