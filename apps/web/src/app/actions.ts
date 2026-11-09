"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Grade } from "@speak-city/shared";
import { api, ApiError, TOKEN_COOKIE } from "@/lib/api";

async function setSession(token: string) {
  (await cookies()).set(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "1",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export type AuthState = { error?: string };

export async function login(_: AuthState, form: FormData): Promise<AuthState> {
  try {
    const { token } = await api<{ token: string }>("/auth/login", { method: "POST", auth: false, body: { email: form.get("email"), password: form.get("password") } });
    await setSession(token);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Couldn't reach the server. Try again." };
  }
  redirect("/");
}

export async function register(_: AuthState, form: FormData): Promise<AuthState> {
  try {
    const { token } = await api<{ token: string }>("/auth/register", { method: "POST", auth: false, body: { name: form.get("name"), email: form.get("email"), password: form.get("password") } });
    await setSession(token);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Couldn't reach the server. Try again." };
  }
  redirect("/");
}

export async function logout() {
  (await cookies()).delete(TOKEN_COOKIE);
  redirect("/login");
}

/** Saves words the player found in a scene. Returns the user's new total. */
export async function saveWords(words: string[]) {
  if (!words.length) return { added: 0, total: 0 };
  return api<{ added: number; total: number }>("/progress/words", { method: "POST", body: { words } });
}

export async function completeScene(slug: string, mistakes: number) {
  const r = await api<{ ok: boolean; bestMistakes: number }>(`/scenes/${encodeURIComponent(slug)}/complete`, { method: "POST", body: { mistakes } });
  revalidatePath("/");
  return r;
}

export async function gradeWord(wordId: number, grade: Grade) {
  return api<{ box: number; dueAt: string }>(`/review/${wordId}`, { method: "POST", body: { grade } });
}
