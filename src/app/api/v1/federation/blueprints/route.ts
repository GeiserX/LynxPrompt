import { NextRequest, NextResponse } from "next/server";
import { envBool } from "@/lib/feature-flags";
import { prismaUsers } from "@/lib/db-users";

export async function GET(request: NextRequest) {
  if (!envBool("ENABLE_FEDERATION", true)) {
    return NextResponse.json({ error: "Federation disabled" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  const where = { OR: [{ visibility: "PUBLIC" as const }, { isPublic: true }] };

  const blueprints = await prismaUsers.userTemplate.findMany({
    where,
    select: {
      id: true,
      name: true,
      description: true,
      type: true,
      tier: true,
      category: true,
      tags: true,
      downloads: true,
      favorites: true,
      createdAt: true,
      updatedAt: true,
      user: { select: { name: true, displayName: true } },
    },
    orderBy: { downloads: "desc" },
    take: limit,
    skip: offset,
  });

  const total = await prismaUsers.userTemplate.count({ where });

  const formatted = blueprints.map((b) => ({
    id: b.id,
    name: b.name,
    description: b.description,
    type: b.type,
    tier: b.tier,
    category: b.category,
    tags: b.tags,
    downloads: b.downloads,
    favorites: b.favorites,
    author: b.user?.displayName || b.user?.name || "Anonymous",
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  }));

  return NextResponse.json({ blueprints: formatted, total, limit, offset });
}
