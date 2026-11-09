import Link from "next/link";
import { api, type Me, type SceneSummary } from "@/lib/api";
import { logout } from "./actions";

export const dynamic = "force-dynamic";

/** The map: one card per scene (= one page of the book) and the road to 5000 words. */
export default async function MapPage() {
  const [me, scenes] = await Promise.all([api<Me>("/me"), api<SceneSummary[]>("/scenes")]);
  const pct = (me.stats.wordsFound / me.stats.bookTotal) * 100;
  return (
    <main className="page">
      <div className="wrap">
        <div className="topbar">
          <span style={{ color: "#c9cbe0" }}>أهلاً {me.name} 👋</span>
          <form action={logout}><button className="link">خروج</button></form>
        </div>
        <h1 className="brand">Speak City</h1>
        <p className="sub">كل مشهد هو صفحة من كتابك. امشي جوه المشهد، دوس على الحاجات عشان تتعلم أسماءها، واتكلم مع الناس.</p>
        <div className="book">
          <div><span className="n">{me.stats.wordsFound}</span> <span style={{ color: "#c9cbe0" }}>/ {me.stats.bookTotal} كلمة من الكتاب</span></div>
          <div className="bar"><i style={{ width: `${Math.max(pct, 0.3)}%` }} /></div>
        </div>
        {me.stats.wordsFound > 0 && (
          <Link href="/review" className="review-cta">
            <span><b>مراجعة النهارده</b><br /><span style={{ fontSize: 14, color: "var(--muted)" }}>٥ دقايق بتثبّت الكلمات اللي لقيتها</span></span>
            <span className="n">{me.stats.due}</span>
          </Link>
        )}
        <div className="scenes">
          {scenes.map((s) => (
            <Link key={s.slug} href={`/scene/${s.slug}`} className="scene">
              <span className="num">{s.order}</span>
              <span style={{ minWidth: 0 }}>
                <div className="t">{s.title}</div>
                <div className="a">{s.titleAr} · صفحة {s.page}</div>
              </span>
              <span className="m"><b>{s.found}</b>/{s.words} words<br />{s.completed ? "✓ CLEARED" : "▶ PLAY"}</span>
            </Link>
          ))}
        </div>
        <p className="how">🖐 <b>المشي:</b> دوس على الأرض مكان ما عايز تروح، أو WASD / الأسهم.<br />👀 <b>البص حوالين:</b> اسحب بصباعك أو بالماوس.<br />🔎 <b>التعلم:</b> دوس على أي حاجة أو أي شخص.</p>
      </div>
    </main>
  );
}
