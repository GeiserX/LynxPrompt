import { PasskeyGuard } from "@/components/passkey-guard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PasskeyGuard>{children}</PasskeyGuard>;
}
