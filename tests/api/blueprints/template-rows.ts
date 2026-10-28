// In-memory stand-in for the templateDownload / templateFavorite tables, so a
// test runs the route's real deleteMany filter over rows shaped the way the
// app stores them. POST /api/blueprints/[id]/download stores the id the client
// sent (bp_ prefix); the favorite routes store the bare id.
export type TemplateRow = { templateId: string; templateType?: string };
type Where = { templateId: string | { in: string[] }; templateType?: string };

function matches(row: TemplateRow, where: Where) {
  const id = where.templateId;
  if (typeof id === "string" ? row.templateId !== id : !id.in.includes(row.templateId)) return false;
  return !where.templateType || row.templateType === where.templateType;
}

export function templateRows(rows: TemplateRow[]) {
  return {
    rows,
    deleteMany: async ({ where }: { where: Where }) => {
      const before = rows.length;
      rows.splice(0, rows.length, ...rows.filter((r) => !matches(r, where)));
      return { count: before - rows.length };
    },
  };
}
