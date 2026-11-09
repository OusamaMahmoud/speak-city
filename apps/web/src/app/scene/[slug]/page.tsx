import { notFound } from "next/navigation";
import type { SceneDef } from "@speak-city/shared";
import { api, ApiError } from "@/lib/api";
import { GameLoader } from "@/components/game/GameLoader";

export const dynamic = "force-dynamic";

export default async function ScenePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const data = await api<{ content: SceneDef; foundWords: string[]; completed: boolean }>(`/scenes/${encodeURIComponent(slug)}`);
    return <GameLoader scene={data.content} foundWords={data.foundWords} />;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
}
