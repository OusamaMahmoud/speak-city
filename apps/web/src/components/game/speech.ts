"use client";
/** Text-to-speech and speech recognition helpers (browser APIs, no server). */
let voices: SpeechSynthesisVoice[] = [];
function load() {
  try { voices = speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang)); } catch { /* not supported */ }
}
if (typeof window !== "undefined" && "speechSynthesis" in window) { load(); speechSynthesis.onvoiceschanged = load; }

export function speak(text: string, opts: { pitch?: number; rate?: number; voice?: number } = {}) {
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-GB";
    const gb = voices.filter((v) => /GB/i.test(v.lang));
    const pool = gb.length ? gb : voices;
    if (pool.length) u.voice = pool[(opts.voice ?? 0) % pool.length];
    u.pitch = opts.pitch ?? 1;
    u.rate = opts.rate ?? 0.95;
    speechSynthesis.speak(u);
  } catch { /* not supported */ }
}

type Rec = { lang: string; interimResults: boolean; onresult: (e: any) => void; onerror: (e: any) => void; onend: () => void; start: () => void };
export const canListen = () => typeof window !== "undefined" && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

/** Listens once and resolves with what the person said. */
export function listen(): Promise<string> {
  return new Promise((resolve, reject) => {
    const C = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!C) return reject(new Error("unsupported"));
    const r: Rec = new C();
    r.lang = "en-US";
    r.interimResults = false;
    let said = "";
    r.onresult = (e) => { said = e.results[0][0].transcript; };
    r.onerror = (e) => reject(new Error(e.error || "error"));
    r.onend = () => resolve(said);
    r.start();
  });
}

/** Share of the target's words that appear in what was said (0..1). */
export function matchScore(said: string, target: string) {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z' ]/g, " ").split(/\s+/).filter(Boolean);
  const a = norm(said), b = norm(target);
  return b.length ? b.filter((w) => a.includes(w)).length / b.length : 0;
}

let ac: AudioContext | null = null;
export function tone(freqs: number[], d = 0.12, type: OscillatorType = "triangle", v = 0.06) {
  try {
    ac = ac ?? new AudioContext();
    let t = ac.currentTime;
    for (const f of freqs) {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d); t += d * 0.9;
    }
  } catch { /* audio blocked */ }
}
export const sfx = {
  ding: () => tone([880, 1320]),
  buzz: () => tone([150, 110], 0.16, "sawtooth", 0.04),
  pop: () => tone([990, 1480], 0.07),
  beep: () => tone([1760], 0.08, "square", 0.04),
};
