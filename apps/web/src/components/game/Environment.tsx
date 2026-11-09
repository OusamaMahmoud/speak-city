"use client";
import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { SceneDef } from "@speak-city/shared";
import { patternTexture, signTexture } from "./textures";

function useRoomEnv(intensity: number) {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env; scene.environmentIntensity = intensity;
    return () => { scene.environment = null; env.dispose(); pm.dispose(); };
  }, [gl, scene, intensity]);
}

/** A shop interior sized to the scene bounds: tiled floor, walls, ceiling lights, glass front. */
export function Indoor({ scene }: { scene: SceneDef }) {
  useRoomEnv(0.6);
  const [x0, x1, z0, z1] = scene.bounds;
  const W = x1 - x0 + 0.8, D = z1 - z0 + 0.8, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const floor = useMemo(() => patternTexture("tiles", [W / 2, D / 2]), [W, D]);
  const panels = useMemo(() => { const out: [number, number][] = []; for (let x = x0 + 3; x < x1 - 1; x += 4) for (let z = z0 + 2; z < z1 - 1; z += 3.5) out.push([x, z]); return out; }, [x0, x1, z0, z1]);
  return (<>
    <color attach="background" args={["#E9EEF0"]} />
    <hemisphereLight args={["#ffffff", "#C9C2B0", 0.9]} />
    <directionalLight position={[6, 12, 6]} intensity={1.6} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004}
      shadow-camera-left={-13} shadow-camera-right={13} shadow-camera-top={11} shadow-camera-bottom={-11} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0, cz]} receiveShadow userData={{ floor: true }}><planeGeometry args={[W, D]} /><meshStandardMaterial map={floor} roughness={0.28} /></mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[cx, 4, cz]}><planeGeometry args={[W, D]} /><meshStandardMaterial color="#F4F4F0" roughness={0.95} /></mesh>
    {panels.map(([x, z]) => <mesh key={`${x}${z}`} rotation={[Math.PI / 2, 0, 0]} position={[x, 3.98, z]}><planeGeometry args={[1.6, 0.5]} /><meshBasicMaterial color="#ffffff" toneMapped={false} /></mesh>)}
    {[[cx, 2, z0 - 0.4, W, 4, 0.2], [x0 - 0.4, 2, cz, 0.2, 4, D], [x1 + 0.4, 2, cz, 0.2, 4, D]].map(([x, y, z, w, h, d], i) =>
      <mesh key={i} position={[x, y, z]} receiveShadow><boxGeometry args={[w, h, d]} /><meshStandardMaterial color="#DDE6E3" roughness={0.9} /></mesh>)}
    <mesh position={[cx, 3.75, z0 - 0.28]}><boxGeometry args={[W, 0.5, 0.05]} /><meshStandardMaterial color="#21A87A" /></mesh>
    {[-1, 1].map((s) => <mesh key={s} position={[cx + s * (W / 4 + 1.1), 2, z1 + 0.4]}><boxGeometry args={[W / 2 - 2.2, 4, 0.06]} /><meshStandardMaterial color="#B9DDE6" roughness={0.05} transparent opacity={0.28} /></mesh>)}
  </>);
}

/** A London night street: cobbles, two rows of buildings, string lights. */
export function Street({ scene }: { scene: SceneDef }) {
  const [, , z0, z1] = scene.bounds;
  const L = z1 - z0 + 16, cz = (z0 + z1) / 2;
  const cob = useMemo(() => patternTexture("cobbles", [6, L / 2]), [L]);
  const buildings = useMemo(() => {
    const cols = ["#7A4E6D", "#3F6E7A", "#A0634A", "#56507F", "#2F6B57", "#8C5A3C", "#4B5E8F", "#7D3F4F"];
    const out: { x: number; z: number; w: number; h: number; c: string; side: number }[] = [];
    for (const side of [-1, 1]) { let z = z0 - 8, i = side > 0 ? 3 : 0; while (z < z1 + 8) { const w = 4 + ((i * 37) % 3); out.push({ x: side * 8.5, z: z + w / 2, w, h: 6 + ((i * 53) % 5), c: cols[i % 8], side }); z += w + 0.1; i++; } }
    return out;
  }, [z0, z1]);
  const winOn = useMemo(() => new THREE.MeshBasicMaterial({ color: "#FFD98A", toneMapped: false }), []);
  const winOff = useMemo(() => new THREE.MeshStandardMaterial({ color: "#23243C" }), []);
  const bulbs = useMemo(() => { const out: [number, number, number, string][] = []; for (let z = z0; z < z1; z += 4) for (let x = -5; x <= 5; x += 0.8) out.push([x, 4.4 - Math.sin(((x + 5) / 10) * Math.PI) * 0.6, z, ["#FFC94D", "#FF8A5B", "#FFF1B8", "#7FE0C0"][Math.round((x + 5) / 0.8) % 4]]); return out; }, [z0, z1]);
  return (<>
    <color attach="background" args={["#1B1F3A"]} />
    <fog attach="fog" args={["#1B1F3A", 14, 36]} />
    <hemisphereLight args={["#9AA3E0", "#3A3150", 1.25]} />
    <directionalLight position={[-6, 12, 8]} intensity={0.6} color="#C9D2FF" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={14} shadow-camera-bottom={-14} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, cz]} receiveShadow userData={{ floor: true }}><planeGeometry args={[30, L]} /><meshStandardMaterial map={cob} roughness={0.85} /></mesh>
    {buildings.map((b, i) => (<group key={i} position={[b.x, 0, b.z]}>
      <mesh position={[0, b.h / 2, 0]} receiveShadow><boxGeometry args={[4, b.h, b.w]} /><meshStandardMaterial color={b.c} roughness={0.9} /></mesh>
      {Array.from({ length: Math.floor((b.h - 1) / 1.6) }, (_, r) => Array.from({ length: Math.max(1, Math.floor(b.w / 1.4)) }, (_, c) =>
        <mesh key={`${r}-${c}`} position={[-b.side * 2.01, 1.8 + r * 1.6, -b.w / 2 + 0.7 + c * 1.4]} rotation={[0, -b.side * Math.PI / 2, 0]} material={(i + r + c) % 3 ? winOn : winOff}><planeGeometry args={[0.7, 0.9]} /></mesh>))}
    </group>))}
    {bulbs.map(([x, y, z, c], i) => <mesh key={i} position={[x, y, z]}><sphereGeometry args={[0.07, 8, 6]} /><meshBasicMaterial color={c} toneMapped={false} /></mesh>)}
    {[0.2, 0.55, 0.85].map((f) => <pointLight key={f} position={[0, 3.8, z0 + (z1 - z0) * f]} intensity={9} distance={13} decay={1.6} color="#FFB65C" />)}
    <EntranceArch z={z1 - 2.1} />
  </>);
}

function EntranceArch({ z }: { z: number }) {
  const tex = useMemo(() => signTexture("NIGHT MARKET", "open till late", "#14162B", "#FFC94D", 4.5), []);
  return (<group position={[0, 0, z]}>
    {[-4.8, 4.8].map((x) => <mesh key={x} position={[x, 2.4, 0]}><boxGeometry args={[0.25, 4.8, 0.25]} /><meshStandardMaterial color="#2A2338" /></mesh>)}
    <mesh position={[0, 4.6, 0]} rotation={[0, Math.PI, 0]}><planeGeometry args={[4.5, 1]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
    <mesh position={[0, 4.6, -0.01]}><planeGeometry args={[4.5, 1]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
  </group>);
}
