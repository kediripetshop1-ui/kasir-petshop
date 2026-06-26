import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const SESSION_COOKIE = "kasir_session";
const SESSION_DAYS = 7;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function login(username: string, password: string) {
  const user = await db.user.findUnique({ where: { username } });
  if (!user) return null;
  const ok = await verifyPassword(password, user.password);
  if (!ok) return null;

  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const session = await db.session.create({
    data: { userId: user.id, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  return user;
}

export async function logout() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    await db.session.delete({ where: { id: sessionId } }).catch(() => {});
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}
