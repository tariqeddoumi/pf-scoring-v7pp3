import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { setSessionCookie, signAuthToken, verifyPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) return NextResponse.redirect(new URL('/login', request.url));

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return NextResponse.redirect(new URL('/login', request.url));

  const token = await signAuthToken({ userId: user.id, email: user.email, role: user.role });
  await setSessionCookie(token);
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
