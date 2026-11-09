"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "./store";

type Tap = { word?: string; item?: string; tag?: string; npc?: string };
const RADIUS = 0.32, SPEED = 2.4, EYE = 1.62;

/** First-person player: WASD/arrows, tap the floor to walk, drag to look, tap things to interact. */
export function Player() {
  const { camera, gl, scene } = useThree();
  const s = useGame((st) => st.scene)!;
  const P = useRef({ x: s.start.x, z: s.start.z, yaw: s.start.yaw, pitch: -0.06, target: null as null | { x: number; z: number }, bob: 0 });
  const keys = useRef<Record<string, boolean>>({});
  const blocks = useMemo(() => s.props.filter((p) => p.type === "block").map((p) => {
    const [w, , d] = p.size ?? [1, 1, 1];
    return { x0: p.pos[0] - w / 2, x1: p.pos[0] + w / 2, z0: p.pos[2] - d / 2, z1: p.pos[2] + d / 2 };
  }), [s]);
  const [bx0, bx1, bz0, bz1] = s.bounds;
  const collide = (x: number, z: number) => x < bx0 || x > bx1 || z < bz0 || z > bz1 || blocks.some((b) => x > b.x0 - RADIUS && x < b.x1 + RADIUS && z > b.z0 - RADIUS && z < b.z1 + RADIUS);

  useEffect(() => {
    const kd = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true; };
    const ku = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    addEventListener("keydown", kd); addEventListener("keyup", ku);
    const el = gl.domElement;
    let down: { x: number; y: number; lx: number; ly: number; drag: boolean } | null = null;
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    const pd = (e: PointerEvent) => { down = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, drag: false }; try { el.setPointerCapture(e.pointerId); } catch { /* ignore */ } };
    const pm = (e: PointerEvent) => {
      if (!down) return;
      if (!down.drag && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) down.drag = true;
      if (down.drag) {
        P.current.yaw += (e.clientX - down.lx) * 0.005;
        P.current.pitch = THREE.MathUtils.clamp(P.current.pitch + (e.clientY - down.ly) * 0.004, -0.9, 0.6);
        down.lx = e.clientX; down.ly = e.clientY;
      }
    };
    const pu = (e: PointerEvent) => {
      const wasTap = down && !down.drag; down = null;
      const st = useGame.getState();
      if (!wasTap || st.ended || st.tray?.kind === "dialog") return;
      const r = el.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      for (const h of ray.intersectObjects(scene.children, true)) {
        if (!h.object.visible && !findTap(h.object)) continue;
        if (h.object.userData.floor) { P.current.target = { x: h.point.x, z: h.point.z }; return; }
        const tap = findTap(h.object);
        if (!tap) continue;
        const dist = Math.hypot(h.point.x - P.current.x, h.point.z - P.current.z);
        const walk = (stop: number) => { const dx = h.point.x - P.current.x, dz = h.point.z - P.current.z, d = Math.hypot(dx, dz); P.current.target = { x: P.current.x + (dx / d) * (d - stop), z: P.current.z + (dz / d) * (d - stop) }; };
        if (tap.npc) { if (dist > 3.2) walk(1.6); else st.talk(tap.npc); return; }
        if (tap.item) { if (dist > 2.6) walk(1.2); else st.pickup(tap.item); return; }
        if (tap.word) { if (dist > 7) walk(2); else st.tapWord(tap.word, tap.tag); return; }
        if (tap.tag) { st.tapTag(tap.tag); return; }
      }
    };
    el.addEventListener("pointerdown", pd); el.addEventListener("pointermove", pm); el.addEventListener("pointerup", pu);
    return () => { removeEventListener("keydown", kd); removeEventListener("keyup", ku); el.removeEventListener("pointerdown", pd); el.removeEventListener("pointermove", pm); el.removeEventListener("pointerup", pu); };
  }, [gl, camera, scene]);

  useFrame(({ size }, dt) => {
    const st = useGame.getState();
    const p = P.current, k = keys.current;
    const frozen = st.ended || st.tray?.kind === "dialog";
    let vx = 0, vz = 0;
    if (!frozen) {
      const f = (k.w || k.arrowup ? 1 : 0) - (k.s || k.arrowdown ? 1 : 0), sd = (k.d ? 1 : 0) - (k.a ? 1 : 0);
      if (k.arrowleft) p.yaw += dt * 1.8; if (k.arrowright) p.yaw -= dt * 1.8;
      if (f || sd) { p.target = null; vx = -Math.sin(p.yaw) * f + Math.cos(p.yaw) * sd; vz = -Math.cos(p.yaw) * f - Math.sin(p.yaw) * sd; }
      else if (p.target) {
        const dx = p.target.x - p.x, dz = p.target.z - p.z, d = Math.hypot(dx, dz);
        if (d < 0.25) p.target = null; else { vx = dx / d; vz = dz / d; const want = Math.atan2(-dx, -dz); p.yaw += (((want - p.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * Math.min(1, dt * 3); }
      }
      const L = Math.hypot(vx, vz);
      if (L) {
        const sp = (SPEED * dt) / L, nx = p.x + vx * sp, nz = p.z + vz * sp;
        if (!collide(nx, nz)) { p.x = nx; p.z = nz; } else if (!collide(nx, p.z)) p.x = nx; else if (!collide(p.x, nz)) p.z = nz; else p.target = null;
        p.bob += dt * 9;
      }
    }
    /* while talking, turn to look at the person */
    if (st.talkingTo) {
      const n = st.scene?.npcs.find((x) => x.id === st.talkingTo);
      if (n) {
        const dx = n.pos[0] - p.x, dz = n.pos[2] - p.z, d = Math.hypot(dx, dz);
        const want = Math.atan2(-dx, -dz), wantPitch = Math.atan2(1.45 - EYE, Math.max(0.5, d));
        p.yaw += (((want - p.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * Math.min(1, dt * 4);
        p.pitch += (wantPitch - p.pitch) * Math.min(1, dt * 4);
      }
    }
    camera.position.set(p.x, EYE + Math.sin(p.bob) * 0.02, p.z);
    camera.rotation.set(p.pitch, p.yaw, 0, "YXZ");
    /* keep the scene centred in the area above the bottom tray */
    const cam = camera as THREE.PerspectiveCamera, ph = st.trayH, w = size.width, h = size.height, H = h + ph;
    cam.aspect = w / H;
    cam.fov = w / Math.max(1, h - ph) < 0.8 ? 70 : 60;
    cam.setViewOffset(w, H, 0, ph, w, h);
    cam.updateProjectionMatrix();
  });
  return null;
}

function findTap(o: THREE.Object3D | null): (Tap & { floor?: boolean }) | null {
  while (o) { if (o.userData.tap) return o.userData.tap as Tap; if (o.userData.npc) return { npc: o.userData.npc }; o = o.parent; }
  return null;
}
