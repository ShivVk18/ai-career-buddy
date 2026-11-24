"use client";

import { useEffect, useRef } from "react";

// Ported from design/ascendai-pixel.html (scene generator). Seeded, crisp, redraws on resize.
const SCENES = {
  morning: { sky: ["#7EC4F2", "#A9DAF7", "#D6EEFB", "#FBE9D7"], sun: { x: 0.78, y: 0.2, r: 7, c: "#FFF3B0" }, clouds: 6, hills: [[0.7, "#A6DB8C", 6, 0.05], [0.78, "#82C96E", 5, 0.07], [0.86, "#5FAF57", 4, 0.09]], flowers: ["#F6B9CB", "#FFE48A", "#FFFFFF"] },
  noon: { sky: ["#8CCDF5", "#C9E8FA"], clouds: 3, hills: [[0.62, "#B9E3A2", 4, 0.08], [0.74, "#7FC56A", 4, 0.1]], flowers: ["#FFE48A"] },
  meadow: { sky: ["#A3D5F5", "#DDF0FB"], clouds: 2, hills: [[0.58, "#A9DD8F", 5, 0.06], [0.7, "#7CC368", 4, 0.09]], flowers: ["#F6B9CB", "#FFFFFF"] },
  meadowwide: { sky: ["#86C8F3", "#B5DEF8", "#E2F2FC"], clouds: 7, hills: [[0.55, "#B8E2A0", 7, 0.03], [0.66, "#93D07A", 6, 0.05], [0.78, "#6DBC5F", 5, 0.07], [0.9, "#51A24D", 4, 0.09]], flowers: ["#F6B9CB", "#FFE48A", "#FFFFFF", "#BCAEF2"] },
  pink: { sky: ["#F5B3C8", "#F9D3DE", "#FCE8EC"], sun: { x: 0.2, y: 0.32, r: 6, c: "#FFF6F0" }, clouds: 2, hills: [[0.62, "#C7A6E8", 4, 0.06], [0.74, "#9C86D6", 4, 0.08]] },
  sea: { sky: ["#94D0F5", "#D3ECFB"], clouds: 3, sea: { y: 0.58, c: ["#5DAEE3", "#4A9BD6", "#3C88C4"] }, hills: [[0.56, "#A2C8A0", 3, 0.12]] },
  peaks: { sky: ["#9DCDF0", "#DCEFF9"], peaks: { y: 0.48, c: "#8A94B8", snow: "#F4F7FB" }, clouds: 2, hills: [[0.7, "#9ED489", 4, 0.08], [0.8, "#6FBC60", 3, 0.1]] },
  lemon: { sky: ["#FFE48A", "#FFF1BE", "#FFF8DE"], sun: { x: 0.82, y: 0.26, r: 8, c: "#FFFFFF" }, clouds: 1, hills: [[0.64, "#C5E08A", 4, 0.07], [0.76, "#99CC66", 4, 0.09]], flowers: ["#FFFFFF"] },
  dusk: { sky: ["#3B2E6E", "#7B4E9E", "#E58BA8", "#FFC7A2"], stars: true, sun: { x: 0.24, y: 0.62, r: 9, c: "#FFE6B8" }, hills: [[0.72, "#5E3F7E", 5, 0.05], [0.84, "#3E2B5C", 4, 0.08]] },
  night: { sky: ["#0F1235", "#1B1F55", "#2C2A6B"], stars: true, sun: { x: 0.8, y: 0.2, r: 6, c: "#FFF3D1" }, hills: [[0.72, "#1E2A55", 5, 0.05], [0.84, "#131B3D", 4, 0.08]] },
};

export const PIXEL_SCENE_VARIANTS = Object.keys(SCENES);

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const rng = (seed) => () => ((seed = (Math.imul(seed ^ (seed >>> 15), 1 | seed) + 0x6d2b79f5) | 0), (seed >>> 0) / 4294967296);

function draw(cv, variant, seed) {
  const s = SCENES[variant] || SCENES.morning;
  const r = cv.getBoundingClientRect();
  if (!r.width || !r.height) return;
  const W = Math.max(120, Math.round(r.width / 5));
  const H = Math.max(40, Math.round((W * r.height) / r.width));
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d");
  const img = ctx.createImageData(W, H);
  const d = img.data;
  const R = rng(seed * 977 + W);
  const put = (x, y, c) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 4;
    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
  };
  const sky = s.sky.map(hex);
  const n = sky.length - 1;
  for (let y = 0; y < H; y++) {
    const t = (y / (H * 0.8)) * n;
    const b = Math.min(n, Math.floor(t));
    const f = t - b;
    for (let x = 0; x < W; x++) {
      const z = f < 0.7 ? 0 : ((f - 0.7) / 0.3) * 16;
      put(x, y, sky[Math.min(n, z > BAYER[(x % 4) + (y % 4) * 4] ? b + 1 : b)]);
    }
  }
  if (s.stars) {
    for (let i = 0; i < (W * H) / 260; i++) {
      const x = (R() * W) | 0, y = (R() * H * 0.5) | 0;
      put(x, y, R() < 0.3 ? [255, 240, 200] : [255, 255, 255]);
    }
  }
  if (s.sun) {
    const c = hex(s.sun.c), cx = s.sun.x * W, cy = s.sun.y * H, rr = (s.sun.r * W) / 200;
    for (let y = -rr; y <= rr; y++) for (let x = -rr; x <= rr; x++) if (x * x + y * y <= rr * rr) put((cx + x) | 0, (cy + y) | 0, c);
  }
  for (let k = 0; k < (s.clouds || 0); k++) {
    const cx = (R() * W) | 0, cy = ((R() * 0.32 + 0.05) * H) | 0, w = (((R() * 14 + 10) * W) / 200) | 0;
    for (let x = 0; x < w; x++) {
      const h = Math.round(Math.sin((x / w) * Math.PI) * w * 0.28) + 1;
      for (let y = 0; y < h; y++) put(cx + x, cy - y, y === 0 ? [226, 238, 248] : [255, 255, 255]);
    }
  }
  if (s.peaks) {
    const c = hex(s.peaks.c), sn = hex(s.peaks.snow), base = s.peaks.y * H;
    const P = [[0.1, 0.55], [0.3, 0.28], [0.48, 0.5], [0.66, 0.18], [0.86, 0.42], [1.05, 0.6]];
    for (let x = 0; x < W; x++) {
      const u = x / W;
      let h = H;
      for (let i = 0; i < P.length - 1; i++) {
        if (u >= P[i][0] && u <= P[i + 1][0]) {
          const f = (u - P[i][0]) / (P[i + 1][0] - P[i][0]);
          h = (P[i][1] + (P[i + 1][1] - P[i][1]) * f) * H + base * 0.4;
        }
      }
      for (let y = h | 0; y < H; y++) put(x, y, y < h + H * 0.06 ? sn : c);
    }
  }
  if (s.sea) {
    const cs = s.sea.c.map(hex);
    for (let y = (s.sea.y * H) | 0; y < H; y++) {
      const b = Math.max(0, Math.min(cs.length - 1, Math.floor((y - s.sea.y * H) / ((H - s.sea.y * H) / cs.length))));
      for (let x = 0; x < W; x++) put(x, y, R() < 0.03 ? [255, 255, 255] : cs[b]);
    }
  }
  (s.hills || []).forEach(([yy, col, amp, fr], li) => {
    const c = hex(col), hi = c.map((v) => Math.min(255, v + 22)), ph = R() * 10;
    for (let x = 0; x < W; x++) {
      const h = yy * H + Math.sin(x * fr * 200 / W + ph) * amp * H / 60 + Math.sin(x * fr * 2.7 * 200 / W + ph * 2) * amp * H / 150;
      for (let y = Math.round(h); y < H; y++) put(x, y, y === Math.round(h) ? hi : c);
    }
    if (li === s.hills.length - 1 && s.flowers) {
      for (let i = 0; i < W / 3; i++) {
        const x = (R() * W) | 0, y = (yy * H + R() * (H - yy * H) + 3) | 0;
        put(x, y, hex(s.flowers[(R() * s.flowers.length) | 0]));
      }
    }
  });
  ctx.putImageData(img, 0, 0);
}

/** Pixel sky/landscape. Fills its parent (position it with className). */
export default function PixelScene({ variant = "morning", seed = 7, className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    let raf = 0;
    const go = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => draw(cv, variant, seed));
    };
    go();
    const ro = new ResizeObserver(go);
    ro.observe(cv);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [variant, seed]);
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={`block h-full w-full ${className}`}
      style={{ imageRendering: "pixelated" }}
    />
  );
}
