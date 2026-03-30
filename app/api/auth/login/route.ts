import { NextResponse } from "next/server";
import { login } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const user = await login(body.email, body.password);
  if (!user) return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
  return NextResponse.json({ ok: true, data: user });
}
