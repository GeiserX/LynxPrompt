import { redirect } from "next/navigation";

export default async function TemplateDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/blueprints/${id}`);
}
