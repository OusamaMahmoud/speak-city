import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const TOKEN_COOKIE = "sc_token";
const API_URL = process.env.API_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/**
 * Calls the NestJS API from the server (Server Components and Server Actions).
 * Sends the user's token from the httpOnly cookie. On 401 it sends the user to /login.
 */
export async function api<T>(path: string, init: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  const res = await fetch(`${API_URL}${path}`, {
    method: init.method ?? "GET",
    headers: {
      "content-type": "application/json",
      ...(token && init.auth !== false ? { authorization: `Bearer ${token}` } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  if (res.status === 401 && init.auth !== false) redirect("/login");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg = Array.isArray(data.message) ? data.message.join(", ") : data.message;
    throw new ApiError(res.status, msg ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export type Me = { id: number; name: string; email: string; stats: { wordsFound: number; due: number; bookTotal: number } };
export type SceneSummary = { slug: string; order: number; title: string; titleAr: string; page: number; words: number; found: number; completed: boolean };
export type ReviewItem = { wordId: number; text: string; ar: string; example: string; box: number; scene: string | null };
