import { redirect } from "next/navigation";

export default function BillingSettingsPage() {
  redirect("/settings?tab=billing");
}
