import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev_secret_change_me");
const COOKIE_NAME = "pf_v7pp2_token";

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
};

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  const token = await new SignJWT({ sub: user.id, email: user.email, role: user.role, fullName: user.fullName })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret);
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, { httpOnly: true, sameSite: "lax", secure: false, path: "/" });
  return { id: user.id, email: user.email, fullName: user.fullName, role: user.role };
}

export async function logout() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", { expires: new Date(0), path: "/" });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      id: String(payload.sub),
      email: String(payload.email),
      fullName: String(payload.fullName),
      role: String(payload.role),
    };
  } catch {
    return null;
  }
}

export async function requireRole(roles: string[]) {
  const user = await getSessionUser();
  if (!user || !roles.includes(user.role)) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}
