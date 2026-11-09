"use client";
import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useGame, currentHint, voiceOf } from "./store";
import { canListen, listen, matchScore, speak, sfx } from "./speech";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
function shuffle<T>(a: T[]) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

export function Hud() {
  const scene = useGame((s) => s.scene)!;
  const found = useGame((s) => s.found);
  const got = useGame((s) => s.got);
  const counter = useGame((s) => s.counter);
  const inScene = scene.words.filter((w) => found.has(w.en)).length;
  return (
    <div className="g-hud">
      <div><Link href="/" className="pill">◀ Map</Link><span className="pill">🔎 {inScene}/{scene.words.length}</span></div>
      <div>
        {scene.items.length > 0 && <button className="pill" onClick={() => useGame.getState().openList()}>📝 {got.size}/{scene.items.length}</button>}
        {counter !== null && <span className="pill dark">{scene.counter?.label}{counter}</span>}
      </div>
    </div>
  );
}

/** Bottom tray: hint, word card, pickup card, lines and dialogues. */
export function Tray() {
  const st = useGame();
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current!; const ro = new ResizeObserver(() => useGame.getState().setTrayH(el.offsetHeight)); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const scene = st.scene!;
  const t = st.tray;
  let body: React.ReactNode;
  if (!t) body = st.ended ? null : <div className="g-hint">{currentHint(scene, st.questDone)}</div>;
  else if (t.kind === "word" || t.kind === "pickup") {
    const word = t.kind === "word" ? t.word : scene.items.find((i) => i.id === t.item)!.word;
    const w = scene.words.find((x) => x.en === word)!;
    const item = t.kind === "pickup" ? scene.items.find((i) => i.id === t.item) : null;
    body = (<div className="g-card">
      <div className="g-top"><b>{item ? `✓ ${item.en.toUpperCase()} IN YOUR BASKET` : "WORD"} {t.isNew && <span className="g-new">NEW +1</span>}</b>
        <span><button className="g-icon" onClick={() => speak(`${w.en}. ${w.example}`, { rate: 0.85 })} aria-label="اسمع">🔊</button> <button className="g-icon" onClick={st.close} aria-label="اقفل">✕</button></span></div>
      <p className="g-word en">{w.en}</p><p className="g-ar">{w.ar}</p><p className="g-ex en">“{w.example}”</p>
    </div>);
  } else if (t.kind === "list") {
    body = (<div className="g-card"><div className="g-top"><b>MUM&apos;S GROCERY LIST</b><button className="g-icon" onClick={st.close}>✕</button></div>
      <ul className="g-list">{scene.items.map((i) => <li key={i.id} className={st.got.has(i.id) ? "got" : ""}>{i.en}<small>{st.got.has(i.id) ? "✓" : i.ar}</small></li>)}</ul></div>);
  } else if (t.kind === "say") {
    const n = scene.npcs.find((x) => x.id === t.npc)!;
    body = (<div className="g-card"><div className="g-top"><b>{n.role.toUpperCase()} · {n.name.toUpperCase()}</b><span><button className="g-icon" onClick={() => speak(t.en, voiceOf(n))}>🔊</button> <button className="g-icon" onClick={st.close}>✕</button></span></div>
      <p className="g-npc en">{t.en}</p><p className="g-npc-ar">{t.ar}</p></div>);
  } else {
    body = <Dialog key={`${t.key}-${t.step}`} />;
  }
  return <div className="g-tray" ref={ref}>{body}</div>;
}

function Dialog() {
  const st = useGame();
  const t = st.tray as Extract<NonNullable<typeof st.tray>, { kind: "dialog" }>;
  const scene = st.scene!;
  const n = scene.npcs.find((x) => x.id === t.npc)!;
  const step = scene.dialogues[t.key][t.step];
  const opts = useMemo(() => shuffle(step.options), [step]);
  const [showAr, setShowAr] = useState(false);
  const [heard, setHeard] = useState<string | null>(null);
  const last = t.wrong[t.wrong.length - 1];
  const why = last ? step.options.find((o) => o.en === last)?.why : null;
  const isLast = t.step === scene.dialogues[t.key].length - 1;
  const mic = async () => {
    setHeard("…");
    try { const said = await listen(); const sc = matchScore(said, t.answered!); setHeard(`${said || "—"}  ${sc >= 0.7 ? "👍" : "↻"}`); if (sc >= 0.7) sfx.ding(); }
    catch { setHeard("المايك مش متاح. قولها بصوت عالي وكمّل."); }
  };
  return (<div className="g-card">
    <div className="g-top"><b>{n.role.toUpperCase()} · {n.name.toUpperCase()}</b>
      {!t.answered && <span><button className="g-icon" onClick={() => speak(step.npc, { ...voiceOf(n), rate: 0.8 })}>🔊</button> <button className="g-icon" onClick={() => setShowAr((v) => !v)}>ترجمة</button></span>}</div>
    <p className="g-npc en">{t.answered ? step.after : step.npc}</p>
    {!t.answered && showAr && <p className="g-npc-ar">{step.ar}</p>}
    {!t.answered ? (<>
      <div className="g-opts">{opts.map((o) => <button key={o.en} className={`g-opt en ${t.wrong.includes(o.en) ? "bad" : ""}`} disabled={t.wrong.includes(o.en)} onClick={() => st.answer(o.en)}>{o.en}</button>)}</div>
      {why && <div className="g-fb"><b>{n.name} مستغرب…</b> <span dangerouslySetInnerHTML={{ __html: why }} /></div>}
    </>) : (<>
      <div className="g-ok"><div className="g-ok-l">✓ قولها بصوت عالي ٣ مرات</div><div className="g-ok-line en">{t.answered}</div>
        {heard && <div className="g-heard en">{heard}</div>}</div>
      <div className="g-row"><button className="btn" onClick={() => speak(t.answered!)}>🔊 اسمع</button><button className="btn" onClick={() => speak(t.answered!, { rate: 0.65 })}>🐢 ببطء</button>
        {canListen() && <button className="btn" onClick={mic}>🎤 قولها</button>}<span style={{ flex: 1 }} /><button className="btn go" onClick={st.next}>{isLast ? "تمام" : "كمّل ←"}</button></div>
    </>)}
  </div>);
}

export function EndCard({ onMap }: { onMap: () => void }) {
  const st = useGame();
  const scene = st.scene!;
  if (!st.ended) return null;
  const missing = scene.words.filter((w) => !st.found.has(w.en));
  return (<div className="g-cover"><div className="g-card" style={{ width: "100%", maxWidth: 460 }}>
    <div className="g-top"><b>SCENE {scene.order} CLEARED</b></div>
    <h2 className="g-end-t en">{scene.outro.title}</h2>
    <p>{scene.outro.ar}</p>
    <p>لقيت <b>{scene.words.length - missing.length}/{scene.words.length}</b> كلمة من صفحة {scene.page}. غلطات: {st.mistakes}</p>
    {missing.length > 0 && <p className="g-npc-ar">لسه فيه {missing.length} كلمة مستخبية في المشهد. ارجع دوّر عليها:</p>}
    <div className="g-recap">{scene.words.map((w) => <div key={w.en} className={st.found.has(w.en) ? "" : "miss"}><span className="en">{st.found.has(w.en) ? w.en : "• • •"}</span><span>{st.found.has(w.en) ? w.ar : "لسه"}</span></div>)}</div>
    <div className="g-row" style={{ justifyContent: "center" }}><button className="btn" onClick={() => useGame.setState({ ended: false, tray: null, endedOnce: true })}>كمّل دوّر</button><button className="btn go" onClick={onMap}>الخريطة</button></div>
  </div></div>);
}
