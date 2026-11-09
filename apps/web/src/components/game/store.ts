"use client";
import { create } from "zustand";
import type { DialogueStep, NpcDef, SceneDef } from "@speak-city/shared";
import { sfx, speak } from "./speech";

export type Tray =
  | null
  | { kind: "word"; word: string; isNew: boolean }
  | { kind: "pickup"; item: string; isNew: boolean }
  | { kind: "say"; npc: string; en: string; ar: string }
  | { kind: "dialog"; npc: string; key: string; step: number; wrong: string[]; answered: string | null }
  | { kind: "list" };

type State = {
  scene: SceneDef | null;
  found: Set<string>;
  pending: string[];
  got: Set<string>;
  visited: Set<string>;
  dialogsDone: Set<string>;
  questDone: Set<string>;
  counter: number | null;
  mistakes: number;
  tray: Tray;
  trayH: number;
  ended: boolean;
  /** the end card was shown and dismissed; keep exploring without showing it again */
  endedOnce: boolean;
  loading: boolean;
  effect: { name: string; t: number } | null;
  gesture: { npc: string; type: "agree" | "headShake"; t: number } | null;
  talkingTo: string | null;
  init: (scene: SceneDef, foundWords: string[]) => void;
  learn: (words: string[]) => boolean;
  tapWord: (word: string, tag?: string) => void;
  tapTag: (tag: string) => void;
  pickup: (item: string) => void;
  talk: (npcId: string) => void;
  answer: (en: string) => void;
  next: () => void;
  close: () => void;
  openList: () => void;
  setTrayH: (h: number) => void;
  takePending: () => string[];
};

const npcOf = (s: SceneDef, id: string) => s.npcs.find((n) => n.id === id) as NpcDef;
export const voiceOf = (n: NpcDef) => ({ pitch: n.voicePitch, voice: n.model === "female" ? 1 : 0 });

function questDone(s: SceneDef, st: Pick<State, "dialogsDone" | "got" | "visited">) {
  const done = new Set<string>();
  for (const q of s.quest) {
    const ok = (!q.dialogue || st.dialogsDone.has(q.dialogue)) && (!q.items || q.items.every((i) => st.got.has(i))) && (!q.visit || q.visit.every((v) => st.visited.has(v)));
    if (ok) done.add(q.id);
  }
  return done;
}

export const useGame = create<State>((set, get) => ({
  scene: null, found: new Set(), pending: [], got: new Set(), visited: new Set(), dialogsDone: new Set(), questDone: new Set(),
  counter: null, mistakes: 0, tray: null, trayH: 0, ended: false, endedOnce: false, loading: false, effect: null, gesture: null, talkingTo: null,

  init: (scene, foundWords) => set({
    scene, found: new Set(foundWords), pending: [], got: new Set(), visited: new Set(), dialogsDone: new Set(), questDone: new Set(),
    counter: scene.counter?.start ?? null, mistakes: 0, tray: null, ended: false, endedOnce: false, effect: null, gesture: null, talkingTo: null,
  }),

  learn: (words) => {
    const { found, pending, scene } = get();
    const known = new Set(scene?.words.map((w) => w.en));
    const fresh = words.filter((w) => known.has(w) && !found.has(w));
    if (!fresh.length) return false;
    const f = new Set(found); fresh.forEach((w) => f.add(w));
    set({ found: f, pending: [...pending, ...fresh] });
    sfx.pop();
    return true;
  },

  tapWord: (word, tag) => {
    if (tag) get().tapTag(tag);
    const isNew = get().learn([word]);
    speak(word);
    set({ tray: { kind: "word", word, isNew }, talkingTo: null });
  },

  tapTag: (tag) => {
    const s = get().scene!;
    if (get().visited.has(tag)) return;
    const visited = new Set(get().visited); visited.add(tag);
    set({ visited, questDone: questDone(s, { ...get(), visited }) });
    checkEnd(get, set);
  },

  pickup: (item) => {
    const s = get().scene!;
    const it = s.items.find((i) => i.id === item);
    if (!it) return;
    if (get().got.has(item)) { get().tapWord(it.word); return; }
    const got = new Set(get().got); got.add(item);
    const isNew = get().learn([it.word]);
    sfx.ding();
    speak(`${it.en}. ${it.word}`);
    set({ got, tray: { kind: "pickup", item, isNew }, questDone: questDone(s, { ...get(), got }) });
    checkEnd(get, set);
  },

  talk: (npcId) => {
    const s = get().scene!;
    const n = npcOf(s, npcId);
    if (n.word) get().learn([n.word]);
    const d = n.dialogues.find((x) => !get().dialogsDone.has(x.key));
    const say = (en: string, ar: string) => { speak(en, voiceOf(n)); set({ tray: { kind: "say", npc: npcId, en, ar }, talkingTo: npcId }); };
    if (!d) return say(...n.idleLine);
    if (d.requires && !get().questDone.has(d.requires)) return say(...(n.lockedLine ?? n.idleLine));
    const step = s.dialogues[d.key][0];
    speak(step.npc, voiceOf(n));
    set({ tray: { kind: "dialog", npc: npcId, key: d.key, step: 0, wrong: [], answered: null }, talkingTo: npcId });
  },

  answer: (en) => {
    const t = get().tray;
    if (!t || t.kind !== "dialog" || t.answered) return;
    const s = get().scene!;
    const step: DialogueStep = s.dialogues[t.key][t.step];
    const opt = step.options.find((o) => o.en === en);
    if (!opt) return;
    const n = npcOf(s, t.npc);
    if (!opt.ok) {
      sfx.buzz();
      set({ tray: { ...t, wrong: [...t.wrong, en] }, mistakes: get().mistakes + 1, gesture: { npc: t.npc, type: "headShake", t: performance.now() } });
      return;
    }
    sfx.ding();
    speak(en, { rate: 0.92 });
    setTimeout(() => speak(step.after, voiceOf(n)), 1400);
    if (step.teaches) get().learn(step.teaches);
    let counter = get().counter;
    if (step.effect?.startsWith("pay:") && counter !== null) counter -= Number(step.effect.slice(4));
    set({ tray: { ...t, answered: en }, counter, gesture: { npc: t.npc, type: "agree", t: performance.now() }, effect: step.effect ? { name: step.effect, t: performance.now() } : get().effect });
  },

  next: () => {
    const t = get().tray;
    if (!t || t.kind !== "dialog") return;
    const s = get().scene!;
    const steps = s.dialogues[t.key];
    if (t.step + 1 < steps.length) {
      const n = npcOf(s, t.npc);
      speak(steps[t.step + 1].npc, voiceOf(n));
      set({ tray: { kind: "dialog", npc: t.npc, key: t.key, step: t.step + 1, wrong: [], answered: null } });
      return;
    }
    const dialogsDone = new Set(get().dialogsDone); dialogsDone.add(t.key);
    set({ dialogsDone, tray: null, talkingTo: null, questDone: questDone(s, { ...get(), dialogsDone }) });
    checkEnd(get, set);
  },

  close: () => set({ tray: null, talkingTo: null }),
  openList: () => { get().learn(["grocery list"]); set({ tray: { kind: "list" } }); },
  setTrayH: (h) => set({ trayH: h }),
  takePending: () => { const p = get().pending; set({ pending: [] }); return p; },
}));

function checkEnd(get: () => State, set: (p: Partial<State>) => void) {
  const s = get().scene!;
  if (!get().ended && !get().endedOnce && s.quest.every((q) => get().questDone.has(q.id))) setTimeout(() => set({ ended: true, tray: null }), 1200);
}

/** The hint for the next unfinished quest step. */
export function currentHint(s: SceneDef, done: Set<string>) {
  return s.quest.find((q) => !done.has(q.id))?.ar ?? "كمّل دوّر على باقي الكلمات 🔎";
}
