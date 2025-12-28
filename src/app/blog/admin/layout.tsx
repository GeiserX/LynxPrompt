import { PasskeyGuard } from "@/components/passkey-guard";

export default function BlogAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PasskeyGuard>{children}</PasskeyGuard>;
}



