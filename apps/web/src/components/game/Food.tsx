"use client";
import { useMemo } from "react";
import * as THREE from "three";
import { patternTexture } from "./textures";

type V3 = [number, number, number];
const Std = ({ c, r = 0.6, m = 0, t, o }: { c: string; r?: number; m?: number; t?: number; o?: number }) =>
  <meshStandardMaterial color={c} roughness={r} metalness={m} transparent={t !== undefined} opacity={o ?? 1} />;
const Box = ({ s, p = [0, 0, 0], c, r, rot }: { s: V3; p?: V3; c: string; r?: number; rot?: V3 }) => (
  <mesh position={p} rotation={rot} castShadow receiveShadow><boxGeometry args={s} /><Std c={c} r={r} /></mesh>);
const Cyl = ({ rt, rb, h, p = [0, 0, 0], c, seg = 20, r, m, rot, open }: { rt: number; rb: number; h: number; p?: V3; c: string; seg?: number; r?: number; m?: number; rot?: V3; open?: boolean }) => (
  <mesh position={p} rotation={rot} castShadow><cylinderGeometry args={[rt, rb, h, seg, 1, open]} /><Std c={c} r={r} m={m} /></mesh>);
const Ball = ({ rad, p = [0, 0, 0], c, sc, r }: { rad: number; p?: V3; c: string; sc?: V3; r?: number }) => (
  <mesh position={p} scale={sc} castShadow><sphereGeometry args={[rad, 16, 12]} /><Std c={c} r={r} /></mesh>);
const Glass = ({ rt, rb, h, p = [0, 0, 0], c = "#E8F4FF" }: { rt: number; rb: number; h: number; p?: V3; c?: string }) => (
  <mesh position={p}><cylinderGeometry args={[rt, rb, h, 20]} /><meshStandardMaterial color={c} roughness={0.05} transparent opacity={0.45} /></mesh>);
const Plate = ({ rad = 0.17, c = "#F4F1E6" }: { rad?: number; c?: string }) => <Cyl rt={rad} rb={rad * 0.8} h={0.02} p={[0, 0.01, 0]} c={c} r={0.3} />;

/** Seeded scatter so piles look natural but stay the same every render. */
function scatter(n: number, seed: number, fn: (rnd: () => number, i: number) => React.ReactNode) {
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  return Array.from({ length: n }, (_, i) => fn(rnd, i));
}

export function Food({ kind }: { kind: string }) {
  const waffleTex = useMemo(() => patternTexture("waffle", [2, 2]), []);
  switch (kind) {
    case "hotdog": return (<group>
      <Ball rad={0.06} sc={[2.6, 0.75, 1]} p={[0, 0.04, 0]} c="#E8B46A" r={0.85} />
      <Ball rad={0.035} sc={[4.2, 1, 1]} p={[0, 0.075, 0]} c="#B5482F" r={0.4} />
      <mesh position={[0, 0.11, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.08, 0.008, 4, 20, Math.PI * 4]} /><Std c="#FFC94D" /></mesh></group>);
    case "burger": return (<group><Plate />
      <Cyl rt={0.11} rb={0.1} h={0.04} p={[0, 0.04, 0]} c="#D9A15B" /><Cyl rt={0.115} rb={0.115} h={0.035} p={[0, 0.08, 0]} c="#5A2E1A" r={0.8} />
      <Box s={[0.2, 0.01, 0.2]} p={[0, 0.1, 0]} rot={[0, 0.6, 0]} c="#FFC94D" /><Cyl rt={0.12} rb={0.12} h={0.012} p={[0, 0.11, 0]} c="#6CB33E" />
      <mesh position={[0, 0.115, 0]} castShadow><sphereGeometry args={[0.11, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><Std c="#D9A15B" r={0.7} /></mesh></group>);
    case "fries": return (<group>
      <Cyl rt={0.07} rb={0.05} h={0.14} p={[0, 0.07, 0]} c="#E0522F" seg={4} />
      {scatter(14, 3, (r, i) => <Box key={i} s={[0.012, 0.12, 0.012]} p={[(r() - 0.5) * 0.08, 0.17, (r() - 0.5) * 0.08]} rot={[(r() - 0.5) * 0.4, 0, (r() - 0.5) * 0.4]} c="#F5C542" />)}</group>);
    case "soda": return (<group>
      <Cyl rt={0.05} rb={0.04} h={0.18} p={[0, 0.09, 0]} c="#E0522F" r={0.4} /><Cyl rt={0.052} rb={0.052} h={0.012} p={[0, 0.185, 0]} c="#ffffff" />
      <Cyl rt={0.005} rb={0.005} h={0.12} p={[0.01, 0.24, 0]} rot={[0, 0, 0.15]} c="#ffffff" /></group>);
    case "cups": return (<group>{[0, 1, 2].map((i) => <Cyl key={i} rt={0.045} rb={0.035} h={0.12} p={[(i - 1) * 0.11, 0.06, 0]} c={i === 1 ? "#ffffff" : "#F4F1E6"} r={0.5} />)}
      <Cyl rt={0.045} rb={0.035} h={0.12} p={[0, 0.17, 0]} c="#F4F1E6" /></group>);
    case "shawarma": return (<group>
      <Cyl rt={0.02} rb={0.02} h={0.75} p={[0, 0.37, 0]} c="#9AA0A6" m={0} r={0.3} />
      <Cyl rt={0.09} rb={0.16} h={0.5} p={[0, 0.35, 0]} c="#8B4A2B" r={0.9} seg={16} />
      <Box s={[0.05, 0.6, 0.3]} p={[-0.2, 0.35, 0]} c="#E0522F" r={0.4} /></group>);
    case "falafel": return (<group><Plate />{scatter(7, 5, (r, i) => <Ball key={i} rad={0.028} p={[(r() - 0.5) * 0.18, 0.04 + (i > 4 ? 0.04 : 0), (r() - 0.5) * 0.18]} c="#7A4A22" r={0.95} />)}</group>);
    case "kebab": return (<group><Plate rad={0.2} />{[-0.05, 0.05].map((z) => (<group key={z} position={[0, 0.04, z]}>
      <Cyl rt={0.004} rb={0.004} h={0.34} rot={[0, 0, Math.PI / 2]} c="#B0B0B0" />
      {[-0.1, -0.03, 0.04, 0.11].map((x, i) => <Box key={x} s={[0.05, 0.045, 0.045]} p={[x, 0, 0]} c={i % 2 ? "#E0522F" : "#6B3A1E"} r={0.85} />)}</group>))}</group>);
    case "sandwich": return (<group><Plate />{[-0.05, 0.06].map((x, i) => (<group key={x} position={[x, 0.06, 0]} rotation={[0, i * 0.6, Math.PI / 2 - 0.25]}>
      <mesh castShadow><cylinderGeometry args={[0.09, 0.09, 0.03, 3]} /><Std c="#E9D3A8" r={0.9} /></mesh>
      <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.085, 0.085, 0.012, 3]} /><Std c="#6CB33E" /></mesh></group>))}</group>);
    case "popcorn": return (<group>
      <Cyl rt={0.08} rb={0.06} h={0.2} p={[0, 0.1, 0]} c="#E0522F" seg={4} />
      {scatter(18, 7, (r, i) => <Ball key={i} rad={0.022} p={[(r() - 0.5) * 0.12, 0.21 + r() * 0.05, (r() - 0.5) * 0.12]} c="#FFF6D8" r={0.9} />)}</group>);
    case "crepe": return (<group>
      <Cyl rt={0.17} rb={0.17} h={0.03} p={[0, 0.015, 0]} c="#2A2A2A" r={0.3} m={0.5} /><Cyl rt={0.15} rb={0.15} h={0.006} p={[0, 0.034, 0]} c="#F2D29B" r={0.8} />
      <mesh position={[0.02, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.06, 16]} /><Std c="#5A2E1A" /></mesh></group>);
    case "waffle": return (<group><Plate />
      <mesh position={[0, 0.03, 0]} castShadow><boxGeometry args={[0.18, 0.03, 0.18]} /><meshStandardMaterial map={waffleTex} roughness={0.8} /></mesh>
      <Ball rad={0.05} sc={[1.4, 0.4, 1]} p={[0.02, 0.05, 0]} c="#4A2511" r={0.3} /></group>);
    case "candy": return (<group>{[-0.1, 0.1].map((x, i) => (<group key={x} position={[x, 0, 0]}>
      <Glass rt={0.07} rb={0.07} h={0.2} p={[0, 0.1, 0]} />
      {scatter(14, 11 + i, (r, k) => <Ball key={k} rad={0.016} p={[(r() - 0.5) * 0.09, 0.02 + r() * 0.15, (r() - 0.5) * 0.09]} c={["#F78FB3", "#8E6CEF", "#FFC94D", "#21A87A", "#E0522F"][k % 5]} r={0.2} />)}</group>))}</group>);
    case "icecream": return (<group>{[-0.06, 0.06].map((x, i) => (<group key={x} position={[x, 0, 0]}>
      <mesh position={[0, 0.06, 0]} rotation={[Math.PI, 0, 0]} castShadow><coneGeometry args={[0.035, 0.12, 12]} /><Std c="#D9A15B" r={0.9} /></mesh>
      <Ball rad={0.04} p={[0, 0.13, 0]} c={i ? "#F78FB3" : "#FFF1D6"} r={0.6} /></group>))}</group>);
    case "doughnut": return (<group><Plate />{[-0.05, 0.06].map((x, i) => (
      <mesh key={x} position={[x, 0.035, i * 0.05]} rotation={[-Math.PI / 2, 0, 0]} castShadow><torusGeometry args={[0.045, 0.025, 10, 20]} /><Std c={i ? "#F78FB3" : "#5A2E1A"} r={0.5} /></mesh>))}</group>);
    case "taco": return (<group><Plate />
      <mesh position={[0, 0.06, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.07, 0.07, 0.14, 20, 1, true, 0, Math.PI]} /><meshStandardMaterial color="#F2C14E" side={THREE.DoubleSide} roughness={0.8} /></mesh>
      <Box s={[0.1, 0.02, 0.12]} p={[0, 0.06, 0]} c="#6CB33E" /><Box s={[0.08, 0.02, 0.1]} p={[0, 0.075, 0]} c="#8B4A2B" /></group>);
    case "pizzaSlice": return (<group><Plate />
      <mesh position={[0, 0.03, 0]} rotation={[0, 0.3, 0]} castShadow><cylinderGeometry args={[0.16, 0.16, 0.025, 3, 1, false, 0, Math.PI / 3]} /><Std c="#F2C14E" r={0.8} /></mesh>
      {scatter(4, 13, (r, i) => <Cyl key={i} rt={0.014} rb={0.014} h={0.006} p={[0.03 + r() * 0.07, 0.045, 0.02 + r() * 0.06]} c="#C0392B" />)}</group>);
    case "dumplings": return (<group>
      <Cyl rt={0.14} rb={0.13} h={0.08} p={[0, 0.04, 0]} c="#C49A6C" r={0.9} />
      {scatter(5, 17, (r, i) => <mesh key={i} position={[(i % 3 - 1) * 0.07, 0.085, (i > 2 ? 0.04 : -0.03)]} castShadow><sphereGeometry args={[0.035, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><Std c="#F7F1E3" r={0.7} /></mesh>)}</group>);
    case "lemonade": return (<group>
      <Glass rt={0.07} rb={0.07} h={0.26} p={[0, 0.13, 0]} c="#FFF39A" /><Cyl rt={0.066} rb={0.066} h={0.18} p={[0, 0.09, 0]} c="#FFE45C" r={0.1} />
      {[0.05, 0.13].map((y) => <Cyl key={y} rt={0.03} rb={0.03} h={0.008} p={[0, y + 0.05, 0]} c="#C8E64C" />)}</group>);
    case "juice": return (<group>
      <Box s={[0.3, 0.06, 0.18]} p={[0, 0.03, 0]} c="#E9E3D2" />
      {[["#FF9F43", -0.08], ["#21A87A", 0.08]].map(([c, x]) => (<group key={String(c)} position={[Number(x), 0.06, 0]}>
        <Glass rt={0.06} rb={0.06} h={0.22} p={[0, 0.11, 0]} /><Cyl rt={0.056} rb={0.056} h={0.17} p={[0, 0.09, 0]} c={String(c)} r={0.1} /></group>))}</group>);
    case "bottles": return (<group>{[-0.1, 0, 0.1].map((x, i) => (<group key={x} position={[x, 0, (i % 2) * 0.04]}>
      <Glass rt={0.025} rb={0.03} h={0.16} p={[0, 0.08, 0]} /><Cyl rt={0.026} rb={0.028} h={0.12} p={[0, 0.065, 0]} c={["#FF9F43", "#F5C542", "#E0522F"][i]} r={0.1} />
      <Cyl rt={0.012} rb={0.012} h={0.04} p={[0, 0.18, 0]} c="#E8F4FF" /><Cyl rt={0.013} rb={0.013} h={0.015} p={[0, 0.205, 0]} c="#21A87A" /></group>))}</group>);
    case "sushi": return (<group>
      <Box s={[0.32, 0.03, 0.16]} p={[0, 0.015, 0]} c="#8C5A3C" />
      {[-0.11, -0.04, 0.03, 0.1].map((x, i) => (<group key={x} position={[x, 0.05, 0]}>
        <Cyl rt={0.028} rb={0.028} h={0.04} c="#14211A" /><Cyl rt={0.022} rb={0.022} h={0.042} c="#F7F7F2" />
        <Cyl rt={0.01} rb={0.01} h={0.044} c={i % 2 ? "#FF8A65" : "#21A87A"} /></group>))}
      <Ball rad={0.012} p={[0.13, 0.04, 0.05]} c="#8BC34A" /></group>);
    case "noodles": case "pasta": return (<group>
      <Cyl rt={0.11} rb={0.07} h={0.08} p={[0, 0.04, 0]} c={kind === "noodles" ? "#C0392B" : "#F4F1E6"} r={0.3} />
      <mesh position={[0, 0.085, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1, 0.35]} castShadow><torusKnotGeometry args={[0.055, 0.012, 100, 8, 3, 7]} /><Std c={kind === "noodles" ? "#F2D27A" : "#F5C542"} r={0.6} /></mesh>
      {kind === "pasta" && <Ball rad={0.03} sc={[1.5, 0.4, 1.5]} p={[0, 0.1, 0]} c="#C0392B" />}</group>);
    case "rice": return (<group><Cyl rt={0.08} rb={0.05} h={0.07} p={[0, 0.035, 0]} c="#2E86DE" r={0.3} /><Ball rad={0.075} sc={[1, 0.5, 1]} p={[0, 0.075, 0]} c="#FAFAF5" r={0.95} /></group>);
    case "curry": return (<group><Cyl rt={0.1} rb={0.07} h={0.07} p={[0, 0.035, 0]} c="#F4F1E6" r={0.3} /><Cyl rt={0.093} rb={0.093} h={0.01} p={[0, 0.066, 0]} c="#E08A1E" r={0.4} />
      {scatter(5, 19, (r, i) => <Box key={i} s={[0.025, 0.02, 0.025]} p={[(r() - 0.5) * 0.12, 0.074, (r() - 0.5) * 0.12]} c="#F7E0B5" />)}</group>);
    case "soySauce": return (<group><Cyl rt={0.03} rb={0.04} h={0.14} p={[0, 0.07, 0]} c="#2B1A12" r={0.1} /><Cyl rt={0.02} rb={0.02} h={0.03} p={[0, 0.155, 0]} c="#C0392B" /></group>);
    case "pizza": return (<group><Cyl rt={0.18} rb={0.18} h={0.015} p={[0, 0.008, 0]} c="#8C5A3C" />
      <Cyl rt={0.16} rb={0.16} h={0.02} p={[0, 0.025, 0]} c="#F2C14E" r={0.8} /><Cyl rt={0.145} rb={0.145} h={0.005} p={[0, 0.037, 0]} c="#D9442C" />
      {scatter(9, 23, (r, i) => <Cyl key={i} rt={0.018} rb={0.018} h={0.006} p={[(r() - 0.5) * 0.2, 0.042, (r() - 0.5) * 0.2]} c={i % 3 ? "#FFF1D6" : "#6CB33E"} />)}</group>);
    case "baguette": return (<group><Ball rad={0.04} sc={[5, 1, 1]} p={[0, 0.04, 0]} c="#C98B4A" r={0.85} />
      {[-0.1, 0, 0.1].map((x) => <Box key={x} s={[0.04, 0.006, 0.05]} p={[x, 0.078, 0]} rot={[0, 0.6, 0]} c="#E9C58E" />)}</group>);
    case "paella": return (<group>
      <Cyl rt={0.2} rb={0.19} h={0.04} p={[0, 0.02, 0]} c="#2A2A2A" m={0.6} r={0.3} /><Cyl rt={0.185} rb={0.185} h={0.01} p={[0, 0.04, 0]} c="#F5B700" r={0.8} />
      {scatter(10, 29, (r, i) => <Box key={i} s={[0.03, 0.015, 0.02]} p={[(r() - 0.5) * 0.28, 0.05, (r() - 0.5) * 0.28]} c={["#E0522F", "#21A87A", "#FF8A65"][i % 3]} />)}</group>);
    case "croissant": return (<group><Plate /><mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow><torusGeometry args={[0.055, 0.03, 10, 16, Math.PI * 1.1]} /><Std c="#D9922E" r={0.7} /></mesh></group>);
    case "cheese": return (<group><mesh position={[0, 0.045, 0]} castShadow><cylinderGeometry args={[0.12, 0.12, 0.09, 3, 1, false, 0, Math.PI / 2.5]} /><Std c="#F5D04A" r={0.6} /></mesh>
      <Cyl rt={0.07} rb={0.07} h={0.07} p={[0.1, 0.035, 0.05]} c="#F7E7A0" r={0.6} /></group>);
    case "hummus": return (<group><Cyl rt={0.11} rb={0.07} h={0.05} p={[0, 0.025, 0]} c="#3F6E7A" r={0.3} /><Cyl rt={0.1} rb={0.1} h={0.01} p={[0, 0.05, 0]} c="#E6CFA0" r={0.95} />
      <mesh position={[0, 0.056, 0]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[0.04, 0.006, 4, 20]} /><Std c="#9C8A1C" r={0.2} /></mesh></group>);
    case "pita": return (<group>{[0, 1, 2].map((i) => <Cyl key={i} rt={0.11} rb={0.11} h={0.012} p={[i * 0.01, 0.006 + i * 0.013, 0]} c={i === 2 ? "#E9C58E" : "#DDB377"} r={0.95} />)}</group>);
    case "lemons": return (<group><Cyl rt={0.12} rb={0.08} h={0.05} p={[0, 0.025, 0]} c="#ffffff" r={0.3} />
      {scatter(5, 31, (r, i) => <Ball key={i} rad={0.035} sc={[1.25, 1, 1]} p={[(r() - 0.5) * 0.12, 0.07, (r() - 0.5) * 0.12]} c="#F7E03C" r={0.5} />)}</group>);
    case "tacos": return (<group>{[-0.08, 0.08].map((x) => <group key={x} position={[x, 0, 0]}><Food kind="taco" /></group>)}</group>);
    case "burrito": return (<group><Plate rad={0.2} /><Ball rad={0.045} sc={[3.2, 1, 1]} p={[0, 0.05, 0]} c="#EBD7B0" r={0.9} />
      <Ball rad={0.046} sc={[1.6, 1.02, 1.02]} p={[0.07, 0.05, 0]} c="#C7CDD3" r={0.2} /></group>);
    case "nachos": return (<group><Plate rad={0.18} />{scatter(16, 37, (r, i) => <mesh key={i} position={[(r() - 0.5) * 0.2, 0.03 + r() * 0.04, (r() - 0.5) * 0.2]} rotation={[r() * 1.2, r() * 3, r()]} castShadow><cylinderGeometry args={[0.035, 0.035, 0.004, 3]} /><Std c="#F2C14E" /></mesh>)}
      <Ball rad={0.04} sc={[1, 0.4, 1]} p={[0, 0.07, 0]} c="#F5D04A" /></group>);
    case "empanada": return (<group><Plate />{[-0.05, 0.06].map((x, i) => <mesh key={x} position={[x, 0.025, i * 0.04]} rotation={[-Math.PI / 2, 0, i]} castShadow><cylinderGeometry args={[0.065, 0.065, 0.03, 20, 1, false, 0, Math.PI]} /><Std c="#D9922E" r={0.8} /></mesh>)}</group>);
    case "salsa": return (<group><Cyl rt={0.08} rb={0.06} h={0.06} p={[0, 0.03, 0]} c="#F4F1E6" r={0.3} /><Cyl rt={0.075} rb={0.075} h={0.01} p={[0, 0.058, 0]} c="#C0392B" r={0.7} />
      {scatter(6, 41, (r, i) => <Box key={i} s={[0.014, 0.01, 0.014]} p={[(r() - 0.5) * 0.1, 0.066, (r() - 0.5) * 0.1]} c={i % 2 ? "#21A87A" : "#F4F1E6"} />)}</group>);
    case "chili": return (<group><Cyl rt={0.1} rb={0.07} h={0.05} p={[0, 0.025, 0]} c="#14162B" r={0.3} />
      {scatter(6, 43, (r, i) => <mesh key={i} position={[(r() - 0.5) * 0.1, 0.065, (r() - 0.5) * 0.1]} rotation={[Math.PI / 2, 0, r() * 3]} castShadow><coneGeometry args={[0.015, 0.09, 8]} /><Std c="#D3271B" r={0.3} /></mesh>)}</group>);
    case "tomatoBox": return (<group><Box s={[0.4, 0.14, 0.26]} p={[0, 0.07, 0]} c="#C49A6C" r={0.9} />{[-0.1, 0, 0.1].map((x) => <Ball key={x} rad={0.055} p={[x, 0.17, 0]} c="#E0302A" r={0.35} />)}</group>);
    default: return <Box s={[0.15, 0.15, 0.15]} p={[0, 0.075, 0]} c="#F78FB3" />;
  }
}
