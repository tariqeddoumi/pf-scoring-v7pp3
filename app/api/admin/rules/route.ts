import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await requireRole(["ADMIN"]);
  const data = await prisma.noGoRule.findMany({ orderBy: [{ severity: "asc" }, { code: "asc" }] });
  return NextResponse.json({ ok: true, data });
}

export async function POST(request: Request) {
  await requireRole(["ADMIN"]);
  const body = await request.json();
  const created = await prisma.noGoRule.create({ data: body });
  return NextResponse.json({ ok: true, data: created });
}
