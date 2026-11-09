"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import type { SceneDef } from "@speak-city/shared";
import { useGame } from "./store";
import { World } from "./World";
import { EndCard, Hud, Tray } from "./Overlay";
import { completeScene, saveWords } from "@/app/actions";

/** Sends newly found words to the API every few seconds, and the result when the scene ends. */
function useSync(slug: string) {
  const ended = useGame((s) => s.ended);
  const sent = useRef(false);
  useEffect(() => {
    const flush = async () => {
      const words = useGame.getState().takePending();
      if (!words.length) return;
      try { await saveWords(words); } catch { useGame.setState((s) => ({ pending: [...words, ...s.pending] })); }
    };
    const id = setInterval(flush, 2500);
    const onHide = () => { void flush(); };
    addEventListener("pagehide", onHide);
    return () => { clearInterval(id); removeEventListener("pagehide", onHide); void flush(); };
  }, [slug]);
  useEffect(() => {
    if (!ended || sent.current) return;
    sent.current = true;
    void (async () => {
      const words = useGame.getState().takePending();
      if (words.length) await saveWords(words).catch(() => undefined);
      await completeScene(slug, useGame.getState().mistakes).catch(() => undefined);
    })();
  }, [ended, slug]);
}

export default function Game({ scene, foundWords }: { scene: SceneDef; foundWords: string[] }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const loading = useGame((s) => s.loading);
  useEffect(() => { useGame.getState().init(scene, foundWords); setReady(true); }, [scene, foundWords]);
  /* ?debug exposes the game store in the console, for testing */
  useEffect(() => { if (location.search.includes("debug")) (window as unknown as { game: typeof useGame }).game = useGame; }, []);
  useSync(scene.slug);
  const [intro, setIntro] = useState(true);
  if (!ready || useGame.getState().scene?.slug !== scene.slug) return null;
  return (
    <div className="g-root" dir="rtl">
      <Canvas shadows dpr={[1, 1.75]} camera={{ fov: 62, near: 0.05, far: 90, position: [0, 1.62, 0] }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.95 }}
        onCreated={(r) => { if (location.search.includes("debug")) (window as unknown as { r3f: typeof r }).r3f = r; }}>
        <World />
      </Canvas>
      <div className="g-cross" />
      <Hud />
      <Tray />
      <EndCard onMap={() => { router.push("/"); router.refresh(); }} />
      {(intro || loading) && (
        <div className="g-cover">
          <div className="g-card" style={{ maxWidth: 460, width: "100%" }}>
            <div className="g-top"><b>SCENE {scene.order} · PAGE {scene.page}</b></div>
            <h2 className="g-end-t en">{scene.title}</h2>
            <p style={{ lineHeight: 1.8 }}>{scene.intro}</p>
            <p className="g-npc-ar">🔎 {scene.words.length} كلمة من الكتاب مستخبية في المشهد.</p>
            <div className="g-row" style={{ justifyContent: "center" }}>
              <button className="btn go" disabled={loading} onClick={() => setIntro(false)}>{loading ? "بيحمّل الشخصيات…" : "ادخل"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
