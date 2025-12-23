import { redirect } from "next/navigation";

// Redirect to the new blueprints/create path
export default function TemplatesCreateRedirect() {
  redirect("/blueprints/create");
}
