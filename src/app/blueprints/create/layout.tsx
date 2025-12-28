import { PasskeyGuard } from "@/components/passkey-guard";

export default function CreateBlueprintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PasskeyGuard>{children}</PasskeyGuard>;
}



