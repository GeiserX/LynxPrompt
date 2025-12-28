import { PasskeyGuard } from "@/components/passkey-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PasskeyGuard>{children}</PasskeyGuard>;
}



