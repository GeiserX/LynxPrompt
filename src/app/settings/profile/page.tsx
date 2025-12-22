import { redirect } from "next/navigation";

export default function ProfileSettingsPage() {
  redirect("/settings?tab=profile");
}
