"use client";

import React, { useEffect, useRef } from "react";

// Deterministic PRNG (Mulberry32)
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 4x4 Bayer Dither Matrix for authentic retro dithering
const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

// Color palettes for all 9 variants
const SCENE_PALETTES = {
  morning: {
    sky: ["#89B9E8", "#B5D6F4", "#FAD8CD", "#FFE6A8"],
    sun: { color: "#FFF4CC", glow: "#FFE8A3", x: 0.75, y: 0.28, radius: 7 },
    hills: [
      { color: "#8AA6A3", height: 0.45, freq: 0.04, amp: 8 },
      { color: "#5F8D7E", height: 0.62, freq: 0.05, amp: 10 },
      { color: "#3B7362", height: 0.78, freq: 0.03, amp: 12 },
    ],
    clouds: true,
    stars: false,
    flowers: true,
  },
  noon: {
    sky: ["#5CA4E8", "#88C0F5", "#B8DEFC", "#E5F2FE"],
    sun: { color: "#FFFFFF", glow: "#FFF5CC", x: 0.5, y: 0.18, radius: 8 },
    hills: [
      { color: "#74A892", height: 0.48, freq: 0.03, amp: 7 },
      { color: "#4E8F75", height: 0.65, freq: 0.05, amp: 10 },
      { color: "#2E755B", height: 0.8, freq: 0.04, amp: 12 },
    ],
    clouds: true,
    stars: false,
    flowers: true,
  },
  meadow: {
    sky: ["#83C2EC", "#B2DEF8", "#E0F4EC", "#F4FAF6"],
    sun: { color: "#FFF8D6", glow: "#FFEFA6", x: 0.25, y: 0.22, radius: 7 },
    hills: [
      { color: "#7BAE7F", height: 0.4, freq: 0.03, amp: 8 },
      { color: "#529958", height: 0.58, freq: 0.04, amp: 11 },
      { color: "#2F7C4B", height: 0.75, freq: 0.02, amp: 14 },
    ],
    clouds: true,
    stars: false,
    flowers: true,
  },
  meadowwide: {
    sky: ["#79BEEB", "#A8D7F5", "#D8EFE4", "#F0F8F3"],
    sun: { color: "#FFFBE6", glow: "#FFF0B3", x: 0.8, y: 0.2, radius: 7 },
    hills: [
      { color: "#8CB990", height: 0.35, freq: 0.02, amp: 6 },
      { color: "#5E9E68", height: 0.52, freq: 0.03, amp: 9 },
      { color: "#347F4E", height: 0.7, freq: 0.02, amp: 12 },
    ],
    clouds: true,
    stars: false,
    flowers: true,
  },
  pink: {
    sky: ["#8B80B6", "#BFA7D0", "#ECA7BF", "#FCD4DC"],
    sun: { color: "#FFF0F5", glow: "#FDD1E0", x: 0.35, y: 0.25, radius: 7 },
    hills: [
      { color: "#8E728E", height: 0.45, freq: 0.04, amp: 8 },
      { color: "#A8698A", height: 0.62, freq: 0.05, amp: 11 },
      { color: "#6C435F", height: 0.78, freq: 0.03, amp: 13 },
    ],
    clouds: true,
    stars: false,
    flowers: true,
  },
  sea: {
    sky: ["#639AD6", "#92BEEC", "#C8E1F8", "#FCEEE2"],
    sun: { color: "#FFE8B8", glow: "#FFD480", x: 0.5, y: 0.32, radius: 8 },
    hills: [
      { color: "#54799E", height: 0.48, freq: 0.04, amp: 7 },
    ],
    sea: { color: "#26547C", surface: "#3A73A6", foam: "#E5F2FC", height: 0.66 },
    clouds: true,
    stars: false,
    flowers: false,
  },
  peaks: {
    sky: ["#517EA8", "#7AA2C7", "#B5CEE4", "#E8EFF5"],
    sun: { color: "#FFFDF2", glow: "#E8EDF2", x: 0.7, y: 0.2, radius: 6 },
    peaks: [
      { color: "#5C6B73", snow: "#F0F4F8", height: 0.32, width: 35 },
      { color: "#495861", snow: "#E4ECF2", height: 0.4, width: 45 },
      { color: "#36454F", snow: "#D8E3EB", height: 0.5, width: 55 },
    ],
    hills: [
      { color: "#2A3A40", height: 0.75, freq: 0.03, amp: 12 },
    ],
    clouds: true,
    stars: false,
    flowers: false,
  },
  lemon: {
    sky: ["#6CAECB", "#A4D0DD", "#FEE79A", "#FFF3BE"],
    sun: { color: "#FFFCEB", glow: "#FFE27D", x: 0.6, y: 0.26, radius: 8 },
    hills: [
      { color: "#7FA37C", height: 0.45, freq: 0.03, amp: 8 },
      { color: "#5E875B", height: 0.62, freq: 0.05, amp: 10 },
      { color: "#3C6339", height: 0.78, freq: 0.03, amp: 12 },
    ],
    clouds: true,
    stars: false,
    flowers: true,
  },
  dusk: {
    sky: ["#1C162E", "#30264D", "#5E395E", "#A45564", "#D88B77"],
    moon: { color: "#FFF3D1", crater: "#E4D3A5", x: 0.78, y: 0.22, radius: 7 },
    hills: [
      { color: "#352744", height: 0.48, freq: 0.03, amp: 8 },
      { color: "#241A32", height: 0.65, freq: 0.05, amp: 10 },
      { color: "#160F22", height: 0.8, freq: 0.03, amp: 12 },
    ],
    clouds: false,
    stars: true,
    flowers: false,
  },
};

function hexToRgb(hex) {
  const bigint = parseInt(hex.replace("#", ""), 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function rgbToHex(r, g, b) {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

function lerpColor(c1, c2, t) {
  const rgb1 = hexToRgb(c1);
  const rgb2 = hexToRgb(c2);
  return {
    r: rgb1.r + (rgb2.r - rgb1.r) * t,
    g: rgb1.g + (rgb2.g - rgb1.g) * t,
    b: rgb1.b + (rgb2.b - rgb1.b) * t,
  };
}

export default function PixelScene({
  variant = "morning",
  seed = 42,
  className = "",
  style = {},
  showBorder = false,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let animationFrameId;

    const render = () => {
      const rect = container.getBoundingClientRect();
      const displayW = Math.max(100, Math.floor(rect.width));
      const displayH = Math.max(60, Math.floor(rect.height));

      // Draw at ~width/5 resolution for crisp pixelation
      const pixelScale = 5;
      const w = Math.max(48, Math.floor(displayW / pixelScale));
      const h = Math.max(24, Math.floor(displayH / pixelScale));

      canvas.width = w;
      canvas.height = h;

      const rand = mulberry32(seed + w * 7 + h * 13);
      const palette = SCENE_PALETTES[variant] || SCENE_PALETTES.morning;

      ctx.imageSmoothingEnabled = false;

      // 1. Draw Dithered Sky
      const skyBands = palette.sky;
      const numBands = skyBands.length;

      for (let y = 0; y < h; y++) {
        const t = y / h;
        const segment = t * (numBands - 1);
        const idx = Math.min(Math.floor(segment), numBands - 2);
        const frac = segment - idx;

        const cA = skyBands[idx];
        const cB = skyBands[idx + 1];

        for (let x = 0; x < w; x++) {
          const threshold = BAYER_4X4[y % 4][x % 4] / 16;
          const chosen = frac > threshold ? cB : cA;
          ctx.fillStyle = chosen;
          ctx.fillRect(x, y, 1, 1);
        }
      }

      // 2. Stars (if night/dusk)
      if (palette.stars) {
        ctx.fillStyle = "#FFFFFF";
        for (let i = 0; i < Math.floor(w * 0.45); i++) {
          const sx = Math.floor(rand() * w);
          const sy = Math.floor(rand() * (h * 0.6));
          const bright = rand();
          ctx.globalAlpha = bright > 0.6 ? 1.0 : bright > 0.3 ? 0.7 : 0.4;
          ctx.fillRect(sx, sy, 1, 1);
        }
        ctx.globalAlpha = 1.0;
      }

      // 3. Sun or Moon
      if (palette.sun) {
        const { color, glow, x: px, y: py, radius } = palette.sun;
        const cx = Math.floor(w * px);
        const cy = Math.floor(h * py);

        // Sun Glow
        ctx.fillStyle = glow;
        for (let dy = -radius - 2; dy <= radius + 2; dy++) {
          for (let dx = -radius - 2; dx <= radius + 2; dx++) {
            if (dx * dx + dy * dy <= (radius + 2) * (radius + 2)) {
              if ((cx + dx + cy + dy) % 2 === 0) {
                ctx.fillRect(cx + dx, cy + dy, 1, 1);
              }
            }
          }
        }

        // Sun Core
        ctx.fillStyle = color;
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            if (dx * dx + dy * dy <= radius * radius) {
              ctx.fillRect(cx + dx, cy + dy, 1, 1);
            }
          }
        }
      } else if (palette.moon) {
        const { color, crater, x: px, y: py, radius } = palette.moon;
        const cx = Math.floor(w * px);
        const cy = Math.floor(h * py);

        ctx.fillStyle = color;
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const dist = dx * dx + dy * dy;
            // Crescent cutout
            const cutoutDist = (dx - 2.5) * (dx - 2.5) + (dy - 1.5) * (dy - 1.5);
            if (dist <= radius * radius && cutoutDist >= (radius - 1) * (radius - 1)) {
              ctx.fillRect(cx + dx, cy + dy, 1, 1);
            }
          }
        }
      }

      // 4. Pixel Clouds
      if (palette.clouds) {
        const cloudCount = Math.max(2, Math.floor(w / 40));
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";

        for (let c = 0; c < cloudCount; c++) {
          const cx = Math.floor(rand() * (w + 20) - 10);
          const cy = Math.floor(10 + rand() * (h * 0.35));
          const cWidth = Math.floor(12 + rand() * 16);

          // Draw cloud puffs
          for (let i = 0; i < cWidth; i++) {
            const puffH = Math.floor(Math.sin((i / cWidth) * Math.PI) * 4) + 1;
            ctx.fillRect(cx + i, cy - puffH, 1, puffH * 2);
          }
        }
      }

      // 5. Peaks (if variant === "peaks")
      if (palette.peaks) {
        palette.peaks.forEach((peakDef, idx) => {
          const peakX = Math.floor((w * (0.2 + idx * 0.3)) % w);
          const peakY = Math.floor(h * peakDef.height);
          const pWidth = peakDef.width;

          // Draw triangular peak
          for (let py = peakY; py < h; py++) {
            const progress = (py - peakY) / (h - peakY);
            const currentW = Math.floor(progress * pWidth);

            for (let dx = -currentW; dx <= currentW; dx++) {
              const xPos = peakX + dx;
              if (xPos >= 0 && xPos < w) {
                // Snow top vs rock body
                if (progress < 0.25 || (progress < 0.35 && (xPos + py) % 2 === 0)) {
                  ctx.fillStyle = peakDef.snow;
                } else {
                  ctx.fillStyle = dx > 0 ? peakDef.color : "#404F58";
                }
                ctx.fillRect(xPos, py, 1, 1);
              }
            }
          }
        });
      }

      // 6. Sea (if variant === "sea")
      if (palette.sea) {
        const seaY = Math.floor(h * palette.sea.height);

        // Sea base
        ctx.fillStyle = palette.sea.color;
        ctx.fillRect(0, seaY, w, h - seaY);

        // Animated / dithered wave lines
        for (let y = seaY; y < h; y++) {
          for (let x = 0; x < w; x++) {
            if ((x + y * 3) % 8 === 0) {
              ctx.fillStyle = palette.sea.surface;
              ctx.fillRect(x, y, 2, 1);
            }
            if (y === seaY && (x % 4 === 0 || x % 4 === 1)) {
              ctx.fillStyle = palette.sea.foam;
              ctx.fillRect(x, y, 1, 1);
            }
          }
        }
      }

      // 7. Layered Hills
      if (palette.hills) {
        palette.hills.forEach((hill, layerIdx) => {
          const baseY = Math.floor(h * hill.height);
          const phase = rand() * 10;
          ctx.fillStyle = hill.color;

          for (let x = 0; x < w; x++) {
            const wave = Math.sin(x * hill.freq + phase) * hill.amp;
            const hillTop = Math.floor(baseY + wave);

            if (hillTop < h) {
              ctx.fillRect(x, hillTop, 1, h - hillTop);

              // Dither edge on top of hill
              if (hillTop > 0 && x % 2 === 0) {
                ctx.fillRect(x, hillTop - 1, 1, 1);
              }
            }
          }
        });
      }

      // 8. Wildflowers (meadow / morning / noon)
      if (palette.flowers) {
        const flowerColors = ["#FFE48A", "#F6B9CB", "#FFFFFF", "#A9DAF7"];
        const numFlowers = Math.floor(w * 0.4);

        for (let f = 0; f < numFlowers; f++) {
          const fx = Math.floor(rand() * w);
          const fy = Math.floor(h * (0.8 + rand() * 0.18));
          const flowerColor = flowerColors[Math.floor(rand() * flowerColors.length)];

          ctx.fillStyle = flowerColor;
          ctx.fillRect(fx, fy, 1, 1);
          // Tiny green stem dot underneath
          ctx.fillStyle = "#1E583C";
          ctx.fillRect(fx, fy + 1, 1, 1);
        }
      }
    };

    render();

    const resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(render);
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [variant, seed]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none ${showBorder ? "border border-line" : ""} ${className}`}
      style={style}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{
          imageRendering: "pixelated",
          filter: "contrast(1.02)",
        }}
      />
    </div>
  );
}
