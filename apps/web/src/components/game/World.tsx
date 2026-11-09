"use client";
import { Suspense, useEffect } from "react";
import { useGame } from "./store";
import { PROPS } from "./props/Props";
import { Indoor, Street } from "./Environment";
import { Npc } from "./Npc";
import { Player } from "./Player";

function Loading() {
  useEffect(() => { useGame.setState({ loading: true }); return () => useGame.setState({ loading: false }); }, []);
  return null;
}

export function World() {
  const scene = useGame((s) => s.scene)!;
  return (<>
    {scene.environment === "street" ? <Street scene={scene} /> : <Indoor scene={scene} />}
    {scene.props.map((p, i) => { const C = PROPS[p.type]; return C ? <C key={i} def={p} /> : null; })}
    <Suspense fallback={<Loading />}>{scene.npcs.map((n) => <Npc key={n.id} def={n} />)}</Suspense>
    <Player />
  </>);
}
