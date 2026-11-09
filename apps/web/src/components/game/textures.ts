"use client";
import * as THREE from "three";

const cache = new Map<string, THREE.CanvasTexture>();

/** A sign face drawn on a canvas: big label, optional smaller sub-line. */
export function signTexture(label: string, sub = "", bg = "#14162B", fg = "#FFC94D", aspect = 4) {
  const key = [label, sub, bg, fg, aspect.toFixed(2)].join("|");
  const hit = cache.get(key);
  if (hit) return hit;
  const H = 256, W = Math.min(2048, Math.round(H * aspect));
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const g = cv.getContext("2d")!;
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle";
  const fit = (text: string, size: number, maxW: number) => {
    let s = size;
    do { g.font = `bold ${s}px Arial, Helvetica, sans-serif`; s -= 4; } while (g.measureText(text).width > maxW && s > 10);
  };
  if (sub) {
    fit(label, H * 0.46, W * 0.9); g.fillText(label, W / 2, H * 0.38);
    g.globalAlpha = 0.85; fit(sub, H * 0.24, W * 0.9); g.fillText(sub, W / 2, H * 0.76);
  } else {
    fit(label, H * 0.62, W * 0.9); g.fillText(label, W / 2, H / 2);
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  cache.set(key, t);
  return t;
}

/** Repeating tile / cobble / belt textures. */
export function patternTexture(kind: "tiles" | "cobbles" | "belt" | "waffle", repeat: [number, number]) {
  const key = `${kind}:${repeat.join("x")}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const cv = document.createElement("canvas");
  cv.width = cv.height = 256;
  const g = cv.getContext("2d")!;
  if (kind === "tiles") {
    g.fillStyle = "#E8E4DA"; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = "#CFC9BB"; g.lineWidth = 3;
    for (let i = 0; i <= 256; i += 128) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke(); }
  } else if (kind === "cobbles") {
    g.fillStyle = "#3A3550"; g.fillRect(0, 0, 256, 256);
    const cols = ["#4A4466", "#433D5C", "#3F3956", "#4D4769"];
    for (let y = 0; y < 8; y++) for (let x = 0; x < 9; x++) { g.fillStyle = cols[(x * 7 + y * 3) % 4]; g.beginPath(); g.roundRect(x * 32 + (y % 2) * 16 - 16 + 2, y * 32 + 2, 28, 28, 6); g.fill(); }
  } else if (kind === "belt") {
    g.fillStyle = "#2A2D3A"; g.fillRect(0, 0, 256, 256); g.fillStyle = "#3A3E50";
    for (let y = 0; y < 256; y += 32) g.fillRect(0, y, 256, 8);
  } else {
    g.fillStyle = "#D9A15B"; g.fillRect(0, 0, 256, 256); g.fillStyle = "#B57A35";
    for (let i = 0; i < 256; i += 42) { g.fillRect(i, 0, 10, 256); g.fillRect(0, i, 256, 10); }
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = 8;
  cache.set(key, t);
  return t;
}
