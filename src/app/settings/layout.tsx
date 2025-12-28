import { PasskeyGuard } from "@/components/passkey-guard";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PasskeyGuard>{children}</PasskeyGuard>;
}



