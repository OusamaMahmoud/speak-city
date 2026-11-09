"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import type { Grade } from "@speak-city/shared";
import { gradeWord } from "@/app/actions";
import type { ReviewItem } from "@/lib/api";
import { speak } from "@/components/game/speech";

const BOX_NAMES = ["جديد", "يوم", "٣ أيام", "أسبوع", "أسبوعين", "شهر"];

export function ReviewClient({ items, boxes }: { items: ReviewItem[]; boxes: Record<string, number> }) {
  const [queue, setQueue] = useState(items);
  const [shown, setShown] = useState(false);
  const [pending, start] = useTransition();
  const cur = queue[0];
  const grade = (g: Grade) => {
    if (!cur) return;
    start(async () => {
      await gradeWord(cur.wordId, g);
      setShown(false);
      setQueue((q) => (g === "again" ? [...q.slice(1), q[0]] : q.slice(1)));
    });
  };
  return (
    <main className="page">
      <div className="wrap" style={{ maxWidth: 520 }}>
        <div className="topbar"><Link href="/" className="link">→ الخريطة</Link><span style={{ color: "#c9cbe0", fontFamily: "var(--f-en)" }}>LEFT {queue.length}</span></div>
        <h1 className="brand" style={{ fontSize: 40 }}>Daily Review</h1>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 6, margin: "8px 0 16px" }}>
          {BOX_NAMES.map((n, i) => (
            <div key={n} style={{ background: "rgba(255,255,255,.06)", borderRadius: 8, textAlign: "center", padding: "6px 2px", fontSize: 12, color: "#c9cbe0" }}>
              <b style={{ display: "block", fontFamily: "var(--f-en)", fontSize: 18, color: i >= 3 ? "var(--mint)" : "#fff" }}>{boxes[i + 1] ?? 0}</b>{n}
            </div>
          ))}
        </div>
        {!cur ? (
          <div className="card" style={{ textAlign: "center" }}><p style={{ fontSize: 22, fontWeight: 700, margin: "6px 0" }}>✓ خلّصت مراجعة النهارده</p><p>ارجع بكرة، أو ادخل مشهد وادوّر على كلمات جديدة.</p><Link href="/" className="btn go" style={{ display: "inline-block", textDecoration: "none" }}>الخريطة</Link></div>
        ) : (
          <div className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>{cur.scene ? `🎬 ${cur.scene}` : ""}</div>
            <p style={{ fontSize: 26, fontWeight: 700, margin: "8px 0" }}>{cur.ar}</p>
            <p style={{ color: "var(--muted)", fontSize: 14 }}>قولها بالإنجليزي بصوت عالي، وبعدين اكشف</p>
            {!shown ? (
              <button className="btn go" onClick={() => { setShown(true); speak(cur.text); }}>اكشف</button>
            ) : (
              <>
                <div style={{ borderTop: "2px dashed var(--line)", marginTop: 12, paddingTop: 12 }}>
                  <div className="en" style={{ fontSize: 30, fontWeight: 600, color: "var(--chili)" }}>{cur.text}</div>
                  <div className="en" style={{ marginTop: 6 }}>“{cur.example}”</div>
                  <button className="link" style={{ color: "var(--muted)" }} onClick={() => speak(cur.example, { rate: 0.85 })}>🔊 اسمع الجملة</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 14 }}>
                  <button className="btn" disabled={pending} onClick={() => grade("again")} style={{ borderColor: "var(--chili)", color: "var(--chili)" }}>نسيتها</button>
                  <button className="btn" disabled={pending} onClick={() => grade("hard")}>صعبة</button>
                  <button className="btn" disabled={pending} onClick={() => grade("good")} style={{ borderColor: "var(--mint)", color: "var(--mint)" }}>عارفها</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
