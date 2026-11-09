"use client";
import dynamic from "next/dynamic";
import type { SceneDef } from "@speak-city/shared";

/** The 3D game only runs in the browser. */
const Game = dynamic(() => import("./Game"), { ssr: false, loading: () => <div className="g-root" /> });

export function GameLoader(props: { scene: SceneDef; foundWords: string[] }) {
  return <Game {...props} />;
}
