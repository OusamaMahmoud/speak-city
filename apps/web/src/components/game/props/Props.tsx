"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { PropDef } from "@speak-city/shared";
import { Food } from "../Food";
import { signTexture, patternTexture } from "../textures";
import { useGame } from "../store";
import { sfx } from "../speech";

type V3 = [number, number, number];
const Std = ({ c, r = 0.7, m = 0 }: { c: string; r?: number; m?: number }) => <meshStandardMaterial color={c} roughness={r} metalness={m} />;
function Box({ s, p = [0, 0, 0], c, r, m, rot }: { s: V3; p?: V3; c: string; r?: number; m?: number; rot?: V3 }) {
  return <mesh position={p} rotation={rot} castShadow receiveShadow><boxGeometry args={s} /><Std c={c} r={r} m={m} /></mesh>;
}
const PALETTES: Record<string, string[]> = {
  mixed: ["#E0522F", "#FFC94D", "#2E86DE", "#21A87A", "#F78FB3", "#8E6CEF", "#FF9F43", "#F4F1E6", "#C0392B", "#16A085", "#2C3E50", "#D35400"],
  rice: ["#F2EAD3", "#E8DDBF", "#F5E7C6", "#E0522F"],
  cans: ["#C0392B", "#B03A2E", "#D35400", "#E67E22"],
  imported: ["#8E6CEF", "#2C3E50", "#16A085", "#F4F1E6", "#D35400"],
  brands: ["#E0522F", "#FFC94D", "#2E86DE", "#21A87A", "#F78FB3", "#8E6CEF"],
};

/** Wraps a prop so a tap on any of its meshes reaches the store. */
function Tap({ def, children }: { def: PropDef; children: React.ReactNode }) {
  const tap = def.word || def.item || def.tag ? { word: def.word, item: def.item, tag: def.tag } : undefined;
  return <group position={def.pos} rotation={[0, def.rotY ?? 0, 0]} userData={tap ? { tap } : {}}>{children}</group>;
}

/** Products on one face of a shelf, merged into one mesh with per-vertex colours (one draw call). */
function ProductRow({ len, face, depth, palette, seed, levels = [0.14, 0.64, 1.14, 1.64], gapLevel }: { len: number; face: number; depth: number; palette: string[]; seed: number; levels?: number[]; gapLevel?: number }) {
  const geom = useMemo(() => {
    let s = Math.abs(Math.round(seed)) + 1; const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const parts: THREE.BufferGeometry[] = [], c = new THREE.Color();
    for (const [li, y] of levels.entries()) {
      if (li === gapLevel) continue;
      let z = -len / 2 + 0.12;
      while (z < len / 2 - 0.12) {
        const w = 0.14 + rnd() * 0.12, h = 0.2 + rnd() * 0.18, d = 0.22;
        const g = new THREE.BoxGeometry(d, h, w).toNonIndexed();
        g.translate(face * (depth / 2 - d / 2 - 0.02), y + 0.02 + h / 2, z + w / 2);
        c.set(palette[Math.floor(rnd() * palette.length)]);
        const n = g.attributes.position.count, col = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) c.toArray(col, i * 3);
        g.setAttribute("color", new THREE.BufferAttribute(col, 3));
        g.deleteAttribute("uv");
        parts.push(g); z += w + 0.03;
      }
    }
    const merged = mergeGeometries(parts)!;
    parts.forEach((g) => g.dispose());
    return merged;
  }, [len, face, depth, palette, seed, levels, gapLevel]);
  return <mesh geometry={geom} castShadow receiveShadow><meshStandardMaterial vertexColors roughness={0.55} /></mesh>;
}

function ShelfRun({ def }: { def: PropDef }) {
  const [depth, , len] = def.size ?? [0.5, 2.1, 6];
  const faces = def.kind === "both" ? [-1, 1] : def.kind === "-x" ? [-1] : [1];
  const pal = (def.color ?? "mixed").split("|");
  return (<Tap def={def}>
    <Box s={[0.06, 2.1, len]} p={[def.kind === "both" ? 0 : (def.kind === "-x" ? depth / 2 - 0.03 : -depth / 2 + 0.03), 1.05, 0]} c="#C9CDD2" r={0.5} m={0.3} />
    {[0.12, 0.62, 1.12, 1.62].map((y) => <Box key={y} s={[depth, 0.04, len]} p={[0, y, 0]} c="#B7BCC2" r={0.4} m={0.4} />)}
    <Box s={[depth, 0.12, len]} p={[0, 0.06, 0]} c="#2A2D3A" />
    {[-len / 2, len / 2].map((z) => <Box key={z} s={[depth, 2.1, 0.05]} p={[0, 1.05, z]} c="#AEB4BA" r={0.5} m={0.3} />)}
    {faces.map((f, i) => <ProductRow key={f} len={len} face={f} depth={depth} palette={PALETTES[pal[i] ?? pal[0]] ?? PALETTES.mixed} seed={7 + i * 13 + Math.round(def.pos[0] * 10)} gapLevel={pal[i] === "rice" ? 2 : undefined} />)}
  </Tap>);
}

function Sign({ def }: { def: PropDef }) {
  const [w, h] = def.size ?? [1.6, 0.4, 0];
  const [bg, fg] = (def.color ?? "#14162B|#FFC94D").split("|");
  const tex = useMemo(() => signTexture(def.label ?? "", def.sub, bg, fg, w / h), [def.label, def.sub, bg, fg, w, h]);
  const face = <mesh><planeGeometry args={[w, h]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>;
  return (<Tap def={def}>
    {face}
    {def.kind === "hang" && <><group rotation={[0, Math.PI, 0]} position={[0, 0, -0.005]}>{face}</group>
      {[-w * 0.35, w * 0.35].map((x) => <mesh key={x} position={[x, (4 - def.pos[1]) / 2, 0]}><cylinderGeometry args={[0.008, 0.008, 4 - def.pos[1], 4]} /><Std c="#555" m={0.5} /></mesh>)}</>}
    {def.kind === "stand" && <><group rotation={[0, Math.PI, 0]} position={[0, 0, -0.005]}>{face}</group><mesh position={[0, -h / 2 - 0.15, 0]}><cylinderGeometry args={[0.01, 0.01, 0.3, 4]} /><Std c="#333" /></mesh></>}
  </Tap>);
}

/** Invisible tappable strip in front of a shelf face. */
function Hotspot({ def }: { def: PropDef }) {
  return <Tap def={def}><mesh visible={false}><boxGeometry args={def.size ?? [0.2, 1.8, 6]} /><meshBasicMaterial /></mesh></Tap>;
}

function Pickup({ def }: { def: PropDef }) {
  const got = useGame((s) => (def.item ? s.got.has(def.item) : false));
  const ring = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => { if (ring.current) ring.current.rotation.z += dt; });
  if (got) return null;
  const k = def.kind;
  return (<Tap def={def}>
    {k === "riceBag" && <><Box s={[0.24, 0.36, 0.34]} c="#F5E7C6" r={0.8} /><Box s={[0.245, 0.1, 0.345]} p={[0, 0.06, 0]} c="#E0522F" r={0.8} /></>}
    {k === "can" && <mesh castShadow><cylinderGeometry args={[0.07, 0.07, 0.2, 20]} /><Std c="#C0392B" r={0.35} m={0.6} /></mesh>}
    {k === "milk" && <><Box s={[0.16, 0.3, 0.16]} c="#ffffff" r={0.5} /><Box s={[0.165, 0.08, 0.165]} p={[0, -0.03, 0]} c="#2E86DE" r={0.5} /></>}
    {k === "bread" && <mesh scale={[2.2, 1, 1.1]} castShadow><sphereGeometry args={[0.11, 14, 10]} /><Std c="#C98B4A" r={0.85} /></mesh>}
    {k === "icecream" && <><Box s={[0.24, 0.14, 0.32]} c="#F78FB3" r={0.5} /><Box s={[0.245, 0.04, 0.325]} p={[0, 0.05, 0]} c="#ffffff" /></>}
    <mesh ref={ring} rotation={[k === "riceBag" || k === "can" ? 0 : -Math.PI / 2, k === "riceBag" || k === "can" ? Math.PI / 2 : 0, 0]} position={k === "riceBag" ? [0.13, 0, 0] : k === "can" ? [0.09, 0, 0] : [0, 0.22, 0]}>
      <ringGeometry args={[0.16, 0.2, 28]} /><meshBasicMaterial color="#FFC94D" side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  </Tap>);
}

function ProduceStand({ def }: { def: PropDef }) {
  const fruits: [string, number][] = [["#D63A2F", 0.08], ["#F39C12", 0.085], ["#7DBE3C", 0.07], ["#E74C3C", 0.06], ["#F1C40F", 0.07], ["#8E44AD", 0.05]];
  return (<Tap def={def}>
    <Box s={[3, 0.85, 1.4]} p={[0, 0.42, 0]} c="#8C5A3C" r={0.85} />
    {fruits.map(([c, r], i) => { const cx = -1.15 + (i % 3) * 1.15, cz = i < 3 ? -0.33 : 0.33; return (<group key={i}>
      <Box s={[1, 0.18, 0.6]} p={[cx, 0.92, cz]} c="#B07A4E" r={0.9} />
      {Array.from({ length: 18 }, (_, k) => <mesh key={k} position={[cx - 0.38 + (k % 6) * 0.15, 1.06 + Math.floor(k / 12) * 0.07, cz - 0.18 + (Math.floor(k / 6) % 2) * 0.2]} castShadow><sphereGeometry args={[r, 12, 10]} /><Std c={c} r={0.45} /></mesh>)}
    </group>); })}
  </Tap>);
}

function Fridge({ def }: { def: PropDef }) {
  return (<Tap def={def}>
    <Box s={[5, 2.4, 1]} p={[0, 1.2, 0]} c="#E9EEF1" r={0.4} m={0.2} />
    <mesh position={[0, 1.25, -0.38]}><boxGeometry args={[4.7, 2, 0.1]} /><meshStandardMaterial color="#DFF3FF" emissive="#BFE6FF" emissiveIntensity={0.7} /></mesh>
    {[0.45, 0.95, 1.45, 1.95].map((y) => <Box key={y} s={[4.7, 0.03, 0.8]} p={[0, y, 0]} c="#C9D3D9" r={0.3} m={0.5} />)}
    {Array.from({ length: 48 }, (_, k) => <Box key={k} s={[0.14, 0.28, 0.14]} p={[-2.2 + (k % 16) * 0.29, 0.61 + Math.floor(k / 16) * 0.5, 0.05]} c={["#ffffff", "#E8F4FF", "#FFF8E1", "#F1F8E9"][k % 4]} r={0.5} />)}
    <mesh position={[0, 1.25, 0.49]}><boxGeometry args={[4.8, 2.1, 0.03]} /><meshStandardMaterial color="#B9DDE6" roughness={0.05} transparent opacity={0.22} /></mesh>
    <Sign def={{ type: "sign", pos: [0, 2.65, 0.52], size: [1.6, 0.4, 0], label: "DAIRY", color: "#2E86DE|#ffffff" }} />
  </Tap>);
}

function BakeryCounter({ def }: { def: PropDef }) {
  return (<Tap def={def}>
    <Box s={[4, 1, 1.2]} p={[0, 0.5, 0]} c="#8C5A3C" r={0.8} /><Box s={[4.1, 0.06, 1.3]} p={[0, 1.03, 0]} c="#E9E3D2" r={0.4} />
    {Array.from({ length: 14 }, (_, k) => <mesh key={k} position={[-1.6 + (k % 7) * 0.45, 1.13, -0.25 + Math.floor(k / 7) * 0.45]} scale={[2, 0.9, 1]} castShadow><sphereGeometry args={[0.1, 12, 8]} /><Std c={["#C98B4A", "#B5733A", "#D9A15B"][k % 3]} r={0.85} /></mesh>)}
    <Sign def={{ type: "sign", pos: [0, 2.4, -0.6], size: [1.8, 0.45, 0], label: "BAKERY", color: "#8C5A3C|#FFF1B8" }} />
  </Tap>);
}

function Freezer({ def }: { def: PropDef }) {
  return (<Tap def={def}>
    <Box s={[1.4, 0.9, 4]} p={[0, 0.45, 0]} c="#E9EEF1" r={0.4} m={0.2} />
    <mesh position={[0, 0.88, 0]}><boxGeometry args={[1.2, 0.05, 3.8]} /><meshStandardMaterial color="#E8F7FF" emissive="#BFE6FF" emissiveIntensity={0.45} /></mesh>
    {Array.from({ length: 18 }, (_, k) => <Box key={k} s={[0.22, 0.1, 0.3]} p={[-0.35 + (k % 3) * 0.35, 0.93, -1.6 + Math.floor(k / 3) * 0.6]} c={["#F78FB3", "#8E6CEF", "#FFC94D", "#ffffff", "#21A87A"][k % 5]} r={0.5} />)}
    <group position={[-0.72, 2.3, 0]} rotation={[0, -Math.PI / 2, 0]}><Sign def={{ type: "sign", pos: [0, 0, 0], size: [2.2, 0.45, 0], label: "FROZEN FOOD", color: "#2E86DE|#ffffff" }} /></group>
  </Tap>);
}

function Trolley({ def }: { def: PropDef }) {
  return (<Tap def={def}>
    <mesh position={[0, 0.75, 0]}><boxGeometry args={[0.55, 0.4, 0.85]} /><meshStandardMaterial color="#B9C2C9" roughness={0.3} metalness={0.9} wireframe /></mesh>
    <Box s={[0.56, 0.02, 0.86]} p={[0, 0.55, 0]} c="#A9B1B8" r={0.3} m={0.9} />
    {[-0.25, 0.25].flatMap((x) => [-0.38, 0.38].map((z) => <group key={`${x}${z}`}><Box s={[0.03, 0.55, 0.03]} p={[x, 0.28, z]} c="#A9B1B8" r={0.3} m={0.9} />
      <mesh position={[x, 0.05, z]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.05, 0.05, 0.04, 10]} /><Std c="#222" /></mesh></group>))}
    <Box s={[0.6, 0.04, 0.04]} p={[0, 1.05, 0.48]} c="#E0522F" r={0.5} />
  </Tap>);
}

function Baskets({ def }: { def: PropDef }) {
  return <Tap def={def}>{Array.from({ length: 6 }, (_, i) => <Box key={i} s={[0.5, 0.25, 0.36]} p={[0, 0.13 + i * 0.09, 0]} c="#E0522F" r={0.5} />)}
    <Box s={[0.04, 0.2, 0.36]} p={[-0.22, 0.75, 0]} c="#14162B" /><Box s={[0.04, 0.2, 0.36]} p={[0.22, 0.75, 0]} c="#14162B" /></Tap>;
}

function ServiceDesk({ def }: { def: PropDef }) {
  return (<Tap def={def}>
    <Box s={[1.2, 1.05, 2.4]} p={[0, 0.52, 0]} c="#2A2D3A" r={0.6} /><Box s={[1.25, 0.05, 2.45]} p={[0, 1.07, 0]} c="#E9E3D2" r={0.4} />
    <group position={[0.62, 2.3, 0]} rotation={[0, Math.PI / 2, 0]}><Sign def={{ type: "sign", pos: [0, 0, 0], size: [2.4, 0.45, 0], label: "CUSTOMER SERVICE", color: "#14162B|#FFC94D" }} /></group>
  </Tap>);
}

function BargainBin({ def }: { def: PropDef }) {
  return (<Tap def={def}>
    <mesh position={[0, 0.4, 0]} castShadow><cylinderGeometry args={[0.7, 0.6, 0.8, 24, 1, true]} /><meshStandardMaterial color="#E0522F" roughness={0.5} side={THREE.DoubleSide} /></mesh>
    {Array.from({ length: 18 }, (_, k) => <Box key={k} s={[0.18, 0.12, 0.24]} p={[Math.sin(k * 2.1) * 0.4, 0.74 + (k % 3) * 0.04, Math.cos(k * 1.7) * 0.4]} rot={[0, k, 0]} c={PALETTES.mixed[k % 12]} r={0.6} />)}
    <mesh position={[0, 1.05, 0]}><cylinderGeometry args={[0.02, 0.02, 0.7, 6]} /><Std c="#444" m={0.6} /></mesh>
    <Sign def={{ type: "sign", kind: "stand", pos: [0, 1.55, 0], size: [1.2, 0.4, 0], label: "BARGAIN BIN", sub: "everything £1", color: "#FFC94D|#E0522F" }} />
  </Tap>);
}

/** Checkout counter: belt, scanner (beeps on "scan"), screen (price), receipt printer. */
function Checkout({ def }: { def: PropDef }) {
  const effect = useGame((s) => s.effect);
  const laser = useRef<THREE.MeshBasicMaterial>(null);
  const receipt = useRef<THREE.Mesh>(null);
  const belt = useMemo(() => patternTexture("belt", [1, 6]).clone(), []);
  const screen = useMemo(() => { const cv = document.createElement("canvas"); cv.width = 256; cv.height = 128; const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return { cv, t }; }, []);
  const price = useRef(0), printT = useRef(0);
  const draw = (txt: string) => { const g = screen.cv.getContext("2d")!; g.fillStyle = "#0E2A22"; g.fillRect(0, 0, 256, 128); g.fillStyle = "#56F2B4"; g.font = "bold 44px monospace"; g.textAlign = "center"; g.fillText(txt, 128, 78); screen.t.needsUpdate = true; };
  useEffect(() => { draw("EGP 0"); }, []);
  useEffect(() => {
    if (!effect) return;
    if (effect.name === "scan") {
      let k = 0; const ps = [60, 22, 18, 15, 30];
      const id = setInterval(() => { sfx.beep(); if (laser.current) laser.current.opacity = 0.95; setTimeout(() => laser.current && (laser.current.opacity = 0.5), 150); price.current += ps[k]; draw(`EGP ${price.current}`); if (++k >= ps.length) clearInterval(id); }, 450);
      return () => clearInterval(id);
    }
    if (effect.name === "fix") { price.current -= 20; draw(`EGP ${price.current}`); }
    if (effect.name === "receipt") printT.current = performance.now();
  }, [effect]);
  useFrame((_, dt) => {
    belt.offset.y = (belt.offset.y + dt * 0.2) % 1;
    if (printT.current && receipt.current) { const k = Math.min(1, (performance.now() - printT.current) / 900); receipt.current.scale.y = 1 + k * 14; receipt.current.position.y = 1.08 + k * 0.13; }
  });
  return (<Tap def={def}>
    <Box s={[0.9, 0.9, 3.4]} p={[0, 0.45, 0]} c="#2D6A5A" r={0.6} /><Box s={[0.95, 0.05, 3.45]} p={[0, 0.92, 0]} c="#E9E3D2" r={0.35} />
    <group userData={{ tap: { word: "checkout" } }}><mesh position={[0, 0.96, -0.5]}><boxGeometry args={[0.6, 0.03, 2.2]} /><meshStandardMaterial map={belt} roughness={0.8} /></mesh></group>
    <group userData={{ tap: { word: "barcode" } }}><Box s={[0.36, 0.04, 0.32]} p={[0, 0.96, 0.85]} c="#111318" r={0.2} m={0.5} />
      <mesh position={[0, 0.985, 0.85]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.28, 0.24]} /><meshBasicMaterial ref={laser} color="#ff3030" transparent opacity={0.5} toneMapped={false} /></mesh></group>
    <Box s={[0.4, 0.28, 0.36]} p={[0.3, 1.08, 1.35]} c="#E9E3D2" r={0.4} />
    <mesh position={[0.1, 1.42, 1.35]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[0.42, 0.21]} /><meshBasicMaterial map={screen.t} toneMapped={false} /></mesh>
    <group userData={{ tap: { word: "receipt" } }}><Box s={[0.22, 0.14, 0.22]} p={[0.25, 1.0, 1.75]} c="#2A2D3A" r={0.4} />
      <mesh ref={receipt} position={[0.25, 1.08, 1.66]}><planeGeometry args={[0.12, 0.02]} /><meshStandardMaterial color="#ffffff" side={THREE.DoubleSide} /></mesh></group>
    <group position={[-0.25, 0.95, 1.6]} userData={{ tap: { word: "plastic bag" } }}>{[0, 1, 2, 3].map((i) => <mesh key={i} position={[i * 0.012, 0.2, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[0.3, 0.38]} /><meshStandardMaterial color="#F4F7FA" side={THREE.DoubleSide} transparent opacity={0.9} roughness={0.4} /></mesh>)}</group>
    <group position={[-0.2, 1.2, -1.4]} userData={{ tap: { word: "reusable bag" } }}><Box s={[0.24, 0.5, 0.46]} c="#F2C14E" r={0.9} />
      <group position={[-0.125, 0.02, 0]} rotation={[0, -Math.PI / 2, 0]}><Sign def={{ type: "sign", pos: [0, 0, 0], size: [0.4, 0.2, 0], label: "I ♥ ALEX", color: "#F2C14E|#14162B" }} /></group></group>
  </Tap>);
}

function QueuePosts({ def }: { def: PropDef }) {
  return (<Tap def={def}>
    {[0, 1.4, 2.8].map((z) => <group key={z}><Box s={[0.06, 1, 0.06]} p={[0, 0.5, z]} c="#2A2D3A" r={0.3} m={0.8} /><mesh position={[0, 0.03, z]}><cylinderGeometry args={[0.18, 0.2, 0.05, 16]} /><Std c="#2A2D3A" r={0.3} m={0.8} /></mesh></group>)}
    {[0.7, 2.1].map((z) => <mesh key={z} position={[0, 0.9, z]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.02, 0.02, 1.4, 6]} /><Std c="#C0392B" /></mesh>)}
  </Tap>);
}

/** Market stall: counter facing local +z, posts, striped awning, name board. */
function Stall({ def }: { def: PropDef }) {
  const c = def.color ?? "#E0522F";
  return (<Tap def={def}>
    <Box s={[2.6, 1, 1.1]} p={[0, 0.5, 0]} c="#5B3F2E" r={0.85} /><Box s={[2.7, 0.05, 1.2]} p={[0, 1.02, 0]} c="#8C6A4E" r={0.7} />
    {[-1.25, 1.25].map((x) => <Box key={x} s={[0.08, 2.5, 0.08]} p={[x, 1.25, -0.5]} c="#2A2338" />)}
    {[-1.25, 1.25].map((x) => <Box key={`f${x}`} s={[0.06, 1.5, 0.06]} p={[x, 1.75, 0.5]} c="#2A2338" />)}
    {Array.from({ length: 7 }, (_, i) => <Box key={i} s={[0.42, 0.05, 1.5]} p={[-1.26 + i * 0.42, 2.55, 0.05]} rot={[0.22, 0, 0]} c={i % 2 ? "#FFF1D6" : c} r={0.8} />)}
    <Sign def={{ type: "sign", pos: [0, 2.95, 0.55], size: [2.3, 0.5, 0], label: def.label ?? "", color: `#14162B|#FFC94D` }} />
    {[-1, -0.5, 0, 0.5, 1].map((x) => <mesh key={x} position={[x, 2.3, 0.6]}><sphereGeometry args={[0.05, 8, 6]} /><meshBasicMaterial color="#FFE2A8" toneMapped={false} /></mesh>)}
  </Tap>);
}

function Cart({ def }: { def: PropDef }) {
  return (<Tap def={def}>
    <Box s={[2.2, 0.9, 1]} p={[0, 0.75, 0]} c="#C0392B" r={0.4} /><Box s={[2.3, 0.08, 1.1]} p={[0, 1.22, 0]} c="#E9E3D2" r={0.3} m={0.4} />
    {[-0.8, 0.8].map((x) => <mesh key={x} position={[x, 0.3, 0.52]}><torusGeometry args={[0.28, 0.07, 8, 16]} /><Std c="#14162B" /></mesh>)}
    {[-1, 1].map((x) => <Box key={x} s={[0.06, 1.6, 0.06]} p={[x, 2, -0.4]} c="#14162B" />)}
    <mesh position={[0, 3.05, -0.2]} castShadow><coneGeometry args={[1.7, 0.6, 10]} /><Std c="#FFC94D" r={0.8} /></mesh>
    <group position={[0, 0.82, 0.51]}><Sign def={{ type: "sign", pos: [0, 0, 0], size: [1.8, 0.45, 0], label: "HOT DOGS £3", color: "#FFF1B8|#C0392B" }} /></group>
  </Tap>);
}

/** Food-hall counter: long counter facing local +z with a name board. */
function Counter({ def }: { def: PropDef }) {
  const [len] = def.size ?? [5, 1, 1.1];
  return (<Tap def={def}>
    <Box s={[len, 1, 1.1]} p={[0, 0.5, 0]} c="#3A3E50" r={0.6} /><Box s={[len + 0.1, 0.06, 1.2]} p={[0, 1.02, 0]} c="#F4F1E6" r={0.25} m={0.1} />
    <Box s={[len, 0.12, 0.04]} p={[0, 0.85, 0.56]} c={def.color ?? "#E0522F"} r={0.5} />
    <Box s={[len, 2.6, 0.12]} p={[0, 2.3, -1.1]} c="#2A2D3A" r={0.8} />
    <Sign def={{ type: "sign", pos: [0, 2.95, -1.03], size: [Math.min(len - 0.4, 3.2), 0.6, 0], label: def.label ?? "", color: `${def.color ?? "#E0522F"}|#ffffff` }} />
  </Tap>);
}

function Table({ def }: { def: PropDef }) {
  return (<Tap def={def}>
    <mesh position={[0, 0.76, 0]} castShadow receiveShadow><cylinderGeometry args={[0.6, 0.6, 0.05, 24]} /><Std c="#8C5A3C" r={0.6} /></mesh>
    <mesh position={[0, 0.38, 0]}><cylinderGeometry args={[0.05, 0.05, 0.76, 8]} /><Std c="#2A2338" m={0.4} /></mesh>
    {[0, 1, 2, 3].map((i) => { const a = (i * Math.PI) / 2; return <group key={i} position={[Math.sin(a) * 0.95, 0, Math.cos(a) * 0.95]} rotation={[0, a, 0]}>
      <Box s={[0.42, 0.05, 0.42]} p={[0, 0.46, 0]} c="#E0522F" r={0.5} /><Box s={[0.42, 0.45, 0.05]} p={[0, 0.7, 0.2]} c="#E0522F" r={0.5} />
      <mesh position={[0, 0.23, 0]}><cylinderGeometry args={[0.03, 0.03, 0.46, 6]} /><Std c="#333" m={0.5} /></mesh></group>; })}
  </Tap>);
}

function FoodProp({ def }: { def: PropDef }) {
  return <Tap def={def}><Food kind={def.kind ?? ""} /></Tap>;
}

export const PROPS: Record<string, (p: { def: PropDef }) => React.ReactNode> = {
  shelfRun: ShelfRun, sign: Sign, productHotspot: Hotspot, pickup: Pickup, produceStand: ProduceStand, fridge: Fridge,
  bakeryCounter: BakeryCounter, freezer: Freezer, trolley: Trolley, baskets: Baskets, serviceDesk: ServiceDesk,
  bargainBin: BargainBin, checkout: Checkout, queuePosts: QueuePosts, stall: Stall, cart: Cart, counter: Counter,
  table: Table, food: FoodProp, block: () => null,
};
