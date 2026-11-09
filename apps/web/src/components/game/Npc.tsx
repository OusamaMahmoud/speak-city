"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import type { NpcDef } from "@speak-city/shared";
import { useGame } from "./store";

/**
 * Characters are Mixamo-rigged glTF models. The animations live on the Xbot rig; every frame we
 * copy each Xbot bone's rotation (relative to its T-pose) onto the visible character, so any
 * Mixamo character works even when its bones have different rest orientations.
 * To use your own Mixamo characters: export them as glb (T-pose, "mixamorig" skeleton) into
 * public/models and point MODEL_FILES at them.
 */
const MODEL_FILES = { female: "/models/Michelle.glb", male: "/models/Soldier.glb", mannequin: "/models/Xbot.glb" } as const;
const ANIM_FILE = "/models/Xbot.glb";

const q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion(), q3 = new THREE.Quaternion(), v = new THREE.Vector3();
function relQ(bone: THREE.Object3D, root: THREE.Object3D, out: THREE.Quaternion) {
  bone.getWorldQuaternion(out); root.getWorldQuaternion(q3); return out.premultiply(q3.invert());
}
const quatOnly = (c: THREE.AnimationClip) => { const k = c.clone(); k.tracks = k.tracks.filter((t) => t.name.endsWith(".quaternion")); return k; };

function applyTPose(root: THREE.Object3D, clips: THREE.AnimationClip[]) {
  const tp = clips.find((a) => /tpose/i.test(a.name));
  if (!tp) return;
  const m = new THREE.AnimationMixer(root); m.clipAction(quatOnly(tp)).play(); m.update(0); m.stopAllAction();
}

export function Npc({ def }: { def: NpcDef }) {
  const gltf = useLoader(GLTFLoader, MODEL_FILES[def.model]);
  const anim = useLoader(GLTFLoader, ANIM_FILE);
  const group = useRef<THREE.Group>(null);
  const native = def.model !== "female"; /* Soldier and Xbot play their own clips; others are retargeted */

  const rig = useMemo(() => {
    const root = SkeletonUtils.clone(gltf.scene);
    root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; m.userData.npc = def.id;
      if (def.outfit?.tint) { m.material = new THREE.MeshStandardMaterial({ color: def.outfit.tint, metalness: 0.85, roughness: 0.3 }); } } });
    applyTPose(root, gltf.animations);
    root.updateMatrixWorld(true);
    let top: number | null = null, lo = Infinity;
    root.traverse((o) => { if ((o as THREE.Bone).isBone) { o.getWorldPosition(v); if (/HeadTop_End/.test(o.name)) top = v.y; lo = Math.min(lo, v.y); } });
    const height = def.model === "female" ? 1.68 : def.model === "male" ? 1.8 : 1.75;
    root.scale.multiplyScalar(height / ((top ?? 1.7) - lo || 1.7));
    root.updateMatrixWorld(true);
    lo = Infinity; root.traverse((o) => { if ((o as THREE.Bone).isBone) { o.getWorldPosition(v); lo = Math.min(lo, v.y); } });
    root.position.y -= lo; root.updateMatrixWorld(true);
    const bones: Record<string, THREE.Bone> = {};
    root.traverse((o) => { if ((o as THREE.Bone).isBone) bones[o.name] = o as THREE.Bone; });

    let src: THREE.Object3D | null = null;
    const pairs: { t: THREE.Bone; s: THREE.Bone; sR: THREE.Quaternion; tR: THREE.Quaternion }[] = [];
    let mixer: THREE.AnimationMixer;
    const actions: Record<string, THREE.AnimationAction> = {};
    if (native) {
      mixer = new THREE.AnimationMixer(root);
      const idle = (def.model === "mannequin" ? anim.animations : gltf.animations).find((a) => /idle/i.test(a.name));
      if (idle) { actions.idle = mixer.clipAction(quatOnly(idle)); actions.idle.play(); }
    } else {
      src = SkeletonUtils.clone(anim.scene); src.updateMatrixWorld(true);
      const sb: Record<string, THREE.Bone> = {};
      src.traverse((o) => { if ((o as THREE.Bone).isBone) sb[o.name] = o as THREE.Bone; });
      for (const [name, t] of Object.entries(bones)) if (sb[name] && !/_End$/.test(name)) pairs.push({ t, s: sb[name], sR: relQ(sb[name], src, new THREE.Quaternion()).invert(), tR: relQ(t, root, new THREE.Quaternion()) });
      mixer = new THREE.AnimationMixer(src);
      for (const n of ["idle", "agree", "headShake"]) { const c = anim.animations.find((a) => a.name === n); if (c) actions[n] = mixer.clipAction(quatOnly(c)); }
      actions.agree?.setLoop(THREE.LoopOnce, 1); actions.headShake?.setLoop(THREE.LoopOnce, 1);
      actions.idle?.play();
      mixer.addEventListener("finished", () => { actions.idle?.reset().fadeIn(0.3).play(); });
    }
    const head = Object.values(bones).find((b) => /Head$/.test(b.name)) ?? null;
    const headTop = Object.values(bones).find((b) => /HeadTop_End$/.test(b.name)) ?? null;
    const chest = Object.values(bones).find((b) => /Spine2$/.test(b.name)) ?? null;
    const hips = Object.values(bones).find((b) => /Hips$/.test(b.name)) ?? null;
    return { root, src, pairs, mixer, actions, head, headTop, chest, hips };
  }, [gltf, anim, def.id, def.model, def.outfit?.tint, native]);

  const gesture = useGame((s) => (s.gesture?.npc === def.id ? s.gesture : null));
  const gestRef = useRef<{ type: string; t: number } | null>(null);
  useEffect(() => {
    if (!gesture) return;
    const a = rig.actions[gesture.type];
    if (a && !native) { rig.actions.idle?.fadeOut(0.25); a.reset().setEffectiveWeight(1).fadeIn(0.25).play(); }
    else gestRef.current = { type: gesture.type, t: performance.now() };
  }, [gesture, rig, native]);

  const talking = useGame((s) => s.talkingTo === def.id);
  const hat = useRef<THREE.Group>(null), apron = useRef<THREE.Group>(null), costume = useRef<THREE.Group>(null);
  const base = def.rotY;

  useFrame(({ camera }, dt) => {
    rig.mixer.update(dt);
    if (rig.src) {
      rig.src.updateMatrixWorld(true); rig.root.updateMatrixWorld(true);
      rig.root.getWorldQuaternion(q2); const rootW = q2.clone();
      for (const p of rig.pairs) {
        relQ(p.s, rig.src, q1); q1.multiply(p.sR).multiply(p.tR); q1.premultiply(rootW);
        p.t.parent!.getWorldQuaternion(q3); p.t.quaternion.copy(q3.invert().multiply(q1)); p.t.updateMatrixWorld(true);
      }
    }
    const g = gestRef.current;
    if (g && rig.head) { const k = (performance.now() - g.t) / 1000; if (k < 1.2) { const a = Math.sin(k * Math.PI * 4) * 0.22 * (1 - k / 1.2); if (g.type === "agree") rig.head.rotateX(a); else rig.head.rotateY(a); } }
    /* turn toward the player when close or talking */
    const grp = group.current!;
    const dx = camera.position.x - grp.position.x, dz = camera.position.z - grp.position.z;
    const want = (Math.hypot(dx, dz) < 5 || talking) && def.model !== "mannequin" ? Math.atan2(dx, dz) : base;
    const yo = def.model === "male" ? Math.PI : 0;
    const dy = ((want + yo - grp.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    grp.rotation.y += dy * Math.min(1, dt * 3);
    /* accessories follow bones in world space */
    grp.updateMatrixWorld(true);
    const inv = grp.matrixWorld.clone().invert();
    if (hat.current && rig.headTop) { rig.headTop.getWorldPosition(v); v.applyMatrix4(inv); hat.current.position.copy(v); }
    if (apron.current && rig.chest) { rig.chest.getWorldPosition(v); v.applyMatrix4(inv); apron.current.position.set(v.x, v.y, v.z); }
    if (costume.current && rig.hips) { rig.hips.getWorldPosition(v); v.applyMatrix4(inv); costume.current.position.set(v.x, 0, v.z); }
  });

  const o = def.outfit ?? {};
  const facing = def.model === "male" ? -1 : 1;
  return (
    <group ref={group} position={def.pos} rotation={[0, def.rotY + (def.model === "male" ? Math.PI : 0), 0]} userData={{ tap: { npc: def.id } }}>
      <primitive object={rig.root} />
      {o.hat && <group ref={hat}>
        {o.hat === "chef" && <><mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.11, 0.1, 0.16, 16]} /><meshStandardMaterial color="#ffffff" roughness={0.8} /></mesh><mesh position={[0, 0.13, 0]} scale={[1, 0.6, 1]}><sphereGeometry args={[0.15, 16, 10]} /><meshStandardMaterial color="#ffffff" roughness={0.8} /></mesh></>}
        {o.hat === "cap" && <><mesh position={[0, -0.04, 0]}><sphereGeometry args={[0.115, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#2E86DE" /></mesh><mesh position={[0, -0.04, 0.12 * facing]} rotation={[-0.15 * facing, 0, 0]}><boxGeometry args={[0.18, 0.012, 0.12]} /><meshStandardMaterial color="#2E86DE" /></mesh></>}
        {o.hat === "scarf" && <mesh position={[0, -0.07, 0]}><sphereGeometry args={[0.13, 16, 10, 0, Math.PI * 2, 0, Math.PI / 1.7]} /><meshStandardMaterial color="#C0392B" roughness={0.9} /></mesh>}
      </group>}
      {o.apron && <group ref={apron}><mesh position={[0, -0.25, 0.13 * facing]}><boxGeometry args={[0.34, 0.6, 0.02]} /><meshStandardMaterial color={o.apron} roughness={0.9} /></mesh></group>}
      {o.costume === "hotdog" && <group ref={costume}>
        <mesh position={[0, 1.15, 0]} castShadow><cylinderGeometry args={[0.36, 0.34, 1.5, 20]} /><meshStandardMaterial color="#B5482F" roughness={0.6} /></mesh>
        <mesh position={[0, 1.9, 0]} castShadow><sphereGeometry args={[0.36, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#B5482F" roughness={0.6} /></mesh>
        {[-0.44, 0.44].map((x) => <mesh key={x} position={[x, 1.05, 0]} castShadow><boxGeometry args={[0.2, 1.3, 0.75]} /><meshStandardMaterial color="#E8B46A" roughness={0.9} /></mesh>)}
        <mesh position={[0, 1.72, 0.35 * facing]} rotation={[0, facing < 0 ? Math.PI : 0, 0]}><circleGeometry args={[0.17, 20]} /><meshStandardMaterial color="#C98E6B" side={THREE.DoubleSide} /></mesh>
        {[-0.06, 0.06].map((x) => <mesh key={x} position={[x, 1.75, 0.36 * facing]}><sphereGeometry args={[0.022, 8, 6]} /><meshStandardMaterial color="#14162B" /></mesh>)}
        <mesh position={[0, 1.3, 0.35 * facing]} rotation={[0, 0, 0.6]}><torusGeometry args={[0.24, 0.035, 6, 24, Math.PI * 1.4]} /><meshStandardMaterial color="#FFC94D" /></mesh>
      </group>}
    </group>
  );
}
