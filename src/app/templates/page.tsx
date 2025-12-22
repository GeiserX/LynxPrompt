import { redirect } from "next/navigation";

// Redirect /templates to /blueprints
export default function TemplatesPage() {
  redirect("/blueprints");
}
