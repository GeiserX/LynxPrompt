import { PasskeyGuard } from "@/components/passkey-guard";

export default function EditBlueprintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PasskeyGuard>{children}</PasskeyGuard>;
}













