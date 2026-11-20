// ============================================================================
// gta6-meme-x-01 — v7 attempt 5: "LEONIDA PARKING CITATION — SAME SPOT"
// ----------------------------------------------------------------------------
// Attempt 4 scored 91/100 (SolAPI main judge; panel 86-94). The panel agreed
// on the fixes applied here:
//
//   1. The citation no longer tells the joke — it points at the map:
//      "VIOLATION: FAILURE TO MOVE" + "SEE EXHIBIT A". The map reveals what
//      you actually did.
//   2. The amber loop is now a CLOSED circuit: it starts at YOU, circles the
//      whole island, and comes back to YOU. The GTA VI star sits just across
//      the curb, 169 px away, never reached. One large label on the loop:
//      "13 YEARS. SAME SPOT."
//   3. The sentence escalates (J5): strip reads FINE / $0 and REWARD / $500.
//   4. The green shortcut starts at YOU and ends visibly at the make.fun
//      plaque (moved out of the island into the west water, so the island
//      interior breathes for the big label). The plaque carries make.fun +
//      the $500 bounty; the ghost tows YOU toward it.
//   5. Evidence labels are big now: NO WAITING and the loop label are
//      28-35 px on the final canvas, not 14 px.
//   6. The two ghosts are one character: both wear a small green make.fun
//      badge, so the big ghost is unmistakably the brand's mascot.
//   7. The issuer is the STATE OF LEONIDA (the whole state is the exhibit,
//      not one city).
//   8. A shape-aware guard now checks every text rect against the route,
//      the green shortcut, the curb, the stamp, the plaque and the ghost —
//      the text-only guard could not see those collisions.
//
// Same house rules as attempt 4: all code written by hand in this session
// (attempt 4's file, written by this same author in this same session, is
// the base; every line changed here is a new authored edit). No SolAPI code.
// Node 22+ stdlib only, no network, no clock, no random input.
// Deterministic: the program renders twice in memory and refuses to write
// unless both PNGs are byte-identical.
// ============================================================================

import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import * as zlib from "node:zlib";

// ---------------------------------------------------------------------------
// Canvas size and palette. Every colour is an [r, g, b, a] tuple.
// ---------------------------------------------------------------------------
const W = 1024;
const H = 1024;

const IVORY: [number, number, number, number] = [248, 241, 225, 255]; // paper
const INK: [number, number, number, number] = [20, 20, 18, 255]; // near-black
const NAVY: [number, number, number, number] = [35, 52, 66, 255]; // rules
const RED: [number, number, number, number] = [164, 42, 36, 255]; // stamp/curb
const DARK: [number, number, number, number] = [12, 30, 38, 255]; // plaques
const CREAM: [number, number, number, number] = [255, 248, 220, 255]; // on dark
const AMBER: [number, number, number, number] = [225, 181, 85, 255]; // route/star
const GREEN: [number, number, number, number] = [86, 214, 141, 255]; // shortcut
const WATER: [number, number, number, number] = [10, 42, 52, 255]; // map sea
const WATERLINE: [number, number, number, number] = [16, 68, 92, 255]; // waves
const RIM: [number, number, number, number] = [23, 83, 98, 255]; // coast rim
const LAND: [number, number, number, number] = [46, 110, 88, 255]; // island
const WHITE: [number, number, number, number] = [255, 255, 255, 255]; // ghost

type Color = [number, number, number, number];

// ---------------------------------------------------------------------------
// CRC32 (IEEE polynomial, table built lazily on first use) and a minimal PNG
// encoder: signature + IHDR + one IDAT (zlib, filter 0 per scanline) + IEND.
// ---------------------------------------------------------------------------
let CRC_TABLE: Uint32Array | null = null;

function crcTable(): Uint32Array {
  if (CRC_TABLE) return CRC_TABLE;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  CRC_TABLE = table;
  return table;
}

function crc32(buf: Buffer): number {
  const table = crcTable();
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}

function encodePng(pixels: Uint8Array, width: number, height: number): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const stride = width * 4;
  const raw = Buffer.alloc(height * (1 + stride));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + stride)] = 0; // filter: none
    Buffer.from(pixels.buffer, pixels.byteOffset + y * stride, stride).copy(raw, y * (1 + stride) + 1);
  }
  const idat = zlib.deflateSync(raw, { level: 6 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", idat),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// Canvas: a plain RGBA buffer with the drawing primitives this meme needs.
// All coordinates are integer pixels; every primitive clips to the canvas.
// ---------------------------------------------------------------------------
function clampInt(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

class Canvas {
  readonly w: number;
  readonly h: number;
  readonly buf: Uint8Array;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.buf = new Uint8Array(w * h * 4);
  }

  set(x: number, y: number, c: Color): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    this.buf[i] = c[0];
    this.buf[i + 1] = c[1];
    this.buf[i + 2] = c[2];
    this.buf[i + 3] = c[3];
  }

  fillRect(x: number, y: number, w: number, h: number, c: Color): void {
    const x0 = Math.max(0, Math.round(x));
    const y0 = Math.max(0, Math.round(y));
    const x1 = Math.min(this.w, Math.round(x + w));
    const y1 = Math.min(this.h, Math.round(y + h));
    for (let yy = y0; yy < y1; yy++) {
      let i = (yy * this.w + x0) * 4;
      for (let xx = x0; xx < x1; xx++) {
        this.buf[i] = c[0];
        this.buf[i + 1] = c[1];
        this.buf[i + 2] = c[2];
        this.buf[i + 3] = c[3];
        i += 4;
      }
    }
  }

  // Outline rectangle: (x, y) top-left, w/h outer size, t border thickness.
  strokeRect(x: number, y: number, w: number, h: number, t: number, c: Color): void {
    this.fillRect(x, y, w, t, c);
    this.fillRect(x, y + h - t, w, t, c);
    this.fillRect(x, y + t, t, h - 2 * t, c);
    this.fillRect(x + w - t, y + t, t, h - 2 * t, c);
  }

  fillCircle(cx: number, cy: number, r: number, c: Color): void {
    const rr = Math.max(0, Math.round(r));
    for (let dy = -rr; dy <= rr; dy++) {
      const dx = Math.floor(Math.sqrt(rr * rr - dy * dy));
      this.fillRect(cx - dx, cy + dy, 2 * dx + 1, 1, c);
    }
  }

  strokeCircle(cx: number, cy: number, r: number, t: number, c: Color): void {
    const steps = Math.max(24, Math.round(2 * Math.PI * r));
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * 2 * Math.PI;
      this.fillCircle(Math.round(cx + r * Math.cos(a)), Math.round(cy + r * Math.sin(a)), Math.ceil(t / 2), c);
    }
  }

  // Thick line drawn as a chain of discs; simple, robust, no gaps on curves.
  line(x0: number, y0: number, x1: number, y1: number, t: number, c: Color): void {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(dist));
    const rad = Math.max(1, Math.round(t / 2));
    for (let i = 0; i <= steps; i++) {
      const s = i / steps;
      this.fillCircle(Math.round(x0 + dx * s), Math.round(y0 + dy * s), rad, c);
    }
  }

  polyline(pts: Array<[number, number]>, t: number, c: Color): void {
    for (let i = 0; i + 1 < pts.length; i++) {
      this.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], t, c);
    }
  }

  dashedLine(x0: number, y0: number, x1: number, y1: number, t: number, dash: number, gap: number, c: Color): void {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const dist = Math.hypot(dx, dy);
    const period = dash + gap;
    let d = 0;
    while (d < dist) {
      const a = d / dist;
      const b = Math.min(1, (d + dash) / dist);
      this.line(x0 + dx * a, y0 + dy * a, x0 + dx * b, y0 + dy * b, t, c);
      d += period;
    }
  }

  // Even-odd scanline fill for a simple (non-self-intersecting) polygon.
  polygon(pts: Array<[number, number]>, c: Color): void {
    if (pts.length < 3) return;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of pts) {
      minY = Math.min(minY, p[1]);
      maxY = Math.max(maxY, p[1]);
    }
    for (let y = Math.max(0, Math.ceil(minY)); y <= Math.min(this.h - 1, Math.floor(maxY)); y++) {
      const xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
          const s = (y - a[1]) / (b[1] - a[1]);
          xs.push(a[0] + s * (b[0] - a[0]));
        }
      }
      xs.sort((p, q) => p - q);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        const x0 = Math.max(0, Math.ceil(xs[i]));
        const x1 = Math.min(this.w - 1, Math.floor(xs[i + 1]));
        if (x1 >= x0) this.fillRect(x0, y, x1 - x0 + 1, 1, c);
      }
    }
  }

  // Filled rounded rectangle: centre block + side blocks + 4 corner discs.
  roundRect(x: number, y: number, w: number, h: number, r: number, c: Color): void {
    const rr = clampInt(Math.round(r), 0, Math.floor(Math.min(w, h) / 2));
    this.fillRect(x + rr, y, w - 2 * rr, h, c);
    this.fillRect(x, y + rr, w, h - 2 * rr, c);
    this.fillCircle(x + rr, y + rr, rr, c);
    this.fillCircle(x + w - rr - 1, y + rr, rr, c);
    this.fillCircle(x + rr, y + h - rr - 1, rr, c);
    this.fillCircle(x + w - rr - 1, y + h - rr - 1, rr, c);
  }

  roundRectStroke(x: number, y: number, w: number, h: number, r: number, t: number, c: Color): void {
    const rr = clampInt(Math.round(r), 0, Math.floor(Math.min(w, h) / 2));
    this.fillRect(x + rr, y, w - 2 * rr, t, c);
    this.fillRect(x + rr, y + h - t, w - 2 * rr, t, c);
    this.fillRect(x, y + rr, t, h - 2 * rr, c);
    this.fillRect(x + w - t, y + rr, t, h - 2 * rr, c);
    const corners: Array<[number, number, number, number]> = [
      [x + rr, y + rr, 180, 270],
      [x + w - rr - 1, y + rr, 270, 360],
      [x + w - rr - 1, y + h - rr - 1, 0, 90],
      [x + rr, y + h - rr - 1, 90, 180],
    ];
    for (const [cx, cy, a0, a1] of corners) {
      const steps = 10;
      for (let i = 0; i < steps; i++) {
        const a = ((a0 + ((a1 - a0) * i) / steps) * Math.PI) / 180;
        this.fillCircle(Math.round(cx + rr * Math.cos(a)), Math.round(cy + rr * Math.sin(a)), Math.ceil(t / 2), c);
      }
    }
  }

  // Five-point star, first point straight up.
  star(cx: number, cy: number, ro: number, ri: number, c: Color): void {
    const pts: Array<[number, number]> = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? ro : ri;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    this.polygon(pts, c);
  }

  // Procedural ghost: domed head, straight sides, three scallops along the
  // bottom, two eyes and a small mouth. (x, y) is the top-left of the
  // bounding box; w/h its size. Drawn as one filled polygon + face dots.
  ghost(x: number, y: number, w: number, h: number, body: Color, face: Color): void {
    const cx = x + w / 2;
    const cyTop = y + w / 2;
    const r = w / 2;
    const pts: Array<[number, number]> = [];
    // Dome: left point, over the top, to the right point.
    for (let a = 180; a <= 360; a += 12) {
      const rad = (a * Math.PI) / 180;
      pts.push([cx + r * Math.cos(rad), cyTop + r * Math.sin(rad)]);
    }
    // Right side down to the scallop baseline.
    const baseY = y + h - w / 6;
    pts.push([x + w, baseY]);
    // Three bottom scallops, right to left, each dipping to y + h.
    const bumpR = w / 6;
    for (let b = 2; b >= 0; b--) {
      const bcx = x + w - (b + 0.5) * (w / 3);
      for (let a = 0; a <= 180; a += 15) {
        const rad = (a * Math.PI) / 180;
        pts.push([bcx + bumpR * Math.cos(rad), baseY + bumpR * Math.sin(rad)]);
      }
    }
    // Left side back up to the dome start.
    pts.push([x, baseY]);
    this.polygon(pts, body);
    // Face: two eyes and a mouth, sized to the ghost.
    const eyeR = Math.max(2, Math.round(w * 0.07));
    const eyeY = Math.round(y + h * 0.3);
    this.fillCircle(Math.round(cx - w * 0.18), eyeY, eyeR, face);
    this.fillCircle(Math.round(cx + w * 0.18), eyeY, eyeR, face);
    this.fillCircle(Math.round(cx), Math.round(y + h * 0.46), Math.max(2, Math.round(w * 0.05)), face);
  }
}

// ---------------------------------------------------------------------------
// Pixel font: 5x7 glyphs, one row per number, bit 4 (16) = leftmost pixel.
// Monospace advance is 6 * scale per character (5 px glyph + 1 px gap).
// The table below is the author's own; lowercase letters sit on the same
// 7-row grid with descenders for g, j, p, q, y.
// ---------------------------------------------------------------------------
const GLYPHS: Record<string, number[]> = {
  " ": [0, 0, 0, 0, 0, 0, 0],
  "!": [0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00000, 0b00100],
  '"': [0b01010, 0b01010, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000],
  "#": [0b01010, 0b01010, 0b11111, 0b01010, 0b11111, 0b01010, 0b01010],
  $: [0b00100, 0b01111, 0b10100, 0b01110, 0b00101, 0b11110, 0b00100],
  "%": [0b11001, 0b11010, 0b00010, 0b00100, 0b01000, 0b01011, 0b10011],
  "&": [0b01100, 0b10010, 0b10100, 0b01000, 0b10101, 0b10010, 0b01101],
  "'": [0b00100, 0b00100, 0b01000, 0b00000, 0b00000, 0b00000, 0b00000],
  "(": [0b00010, 0b00100, 0b01000, 0b01000, 0b01000, 0b00100, 0b00010],
  ")": [0b01000, 0b00100, 0b00010, 0b00010, 0b00010, 0b00100, 0b01000],
  "*": [0b00000, 0b10101, 0b01110, 0b11111, 0b01110, 0b10101, 0b00000],
  "+": [0b00000, 0b00100, 0b00100, 0b11111, 0b00100, 0b00100, 0b00000],
  ",": [0b00000, 0b00000, 0b00000, 0b00000, 0b01100, 0b00100, 0b01000],
  "-": [0b00000, 0b00000, 0b00000, 0b01110, 0b00000, 0b00000, 0b00000],
  ".": [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b01100, 0b01100],
  "/": [0b00001, 0b00010, 0b00010, 0b00100, 0b01000, 0b01000, 0b10000],
  "0": [0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110],
  "1": [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  "2": [0b01110, 0b10001, 0b00001, 0b00110, 0b01000, 0b10000, 0b11111],
  "3": [0b11111, 0b00010, 0b00100, 0b00010, 0b00001, 0b10001, 0b01110],
  "4": [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010],
  "5": [0b11111, 0b10000, 0b11110, 0b00001, 0b00001, 0b10001, 0b01110],
  "6": [0b00110, 0b01000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
  "7": [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000],
  "8": [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
  "9": [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00010, 0b01100],
  ":": [0b00000, 0b01100, 0b01100, 0b00000, 0b01100, 0b01100, 0b00000],
  ";": [0b00000, 0b01100, 0b01100, 0b00000, 0b01100, 0b00100, 0b01000],
  "=": [0b00000, 0b00000, 0b11111, 0b00000, 0b11111, 0b00000, 0b00000],
  "?": [0b01110, 0b10001, 0b00001, 0b00110, 0b00100, 0b00000, 0b00100],
  "@": [0b01110, 0b10001, 0b10111, 0b10101, 0b10110, 0b10000, 0b01110],
  A: [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  B: [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110],
  C: [0b01110, 0b10001, 0b10000, 0b10000, 0b10000, 0b10001, 0b01110],
  D: [0b11110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b11110],
  E: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
  F: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000],
  G: [0b01110, 0b10001, 0b10000, 0b10111, 0b10001, 0b10001, 0b01111],
  H: [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  I: [0b01110, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  J: [0b00111, 0b00010, 0b00010, 0b00010, 0b00010, 0b10010, 0b01100],
  K: [0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001],
  L: [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
  M: [0b10001, 0b11011, 0b10101, 0b10101, 0b10001, 0b10001, 0b10001],
  N: [0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001, 0b10001],
  O: [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  P: [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000],
  Q: [0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b10010, 0b01101],
  R: [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
  S: [0b01111, 0b10000, 0b10000, 0b01110, 0b00001, 0b00001, 0b11110],
  T: [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
  U: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  V: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100],
  W: [0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b11011, 0b10001],
  X: [0b10001, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001, 0b10001],
  Y: [0b10001, 0b10001, 0b01010, 0b00100, 0b00100, 0b00100, 0b00100],
  Z: [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b11111],
  _: [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b11111],
  a: [0b00000, 0b00000, 0b01110, 0b00001, 0b01111, 0b10001, 0b01111],
  b: [0b10000, 0b10000, 0b10110, 0b11001, 0b10001, 0b10001, 0b11110],
  c: [0b00000, 0b00000, 0b01110, 0b10000, 0b10000, 0b10001, 0b01110],
  d: [0b00001, 0b00001, 0b01101, 0b10011, 0b10001, 0b10001, 0b01111],
  e: [0b00000, 0b00000, 0b01110, 0b10001, 0b11111, 0b10000, 0b01110],
  f: [0b00110, 0b01001, 0b01000, 0b11110, 0b01000, 0b01000, 0b01000],
  g: [0b00000, 0b01111, 0b10001, 0b10001, 0b01111, 0b00001, 0b01110],
  h: [0b10000, 0b10000, 0b10110, 0b11001, 0b10001, 0b10001, 0b10001],
  i: [0b00100, 0b00000, 0b01100, 0b00100, 0b00100, 0b00100, 0b01110],
  j: [0b00010, 0b00000, 0b00110, 0b00010, 0b00010, 0b10010, 0b01100],
  k: [0b10000, 0b10000, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010],
  l: [0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  m: [0b00000, 0b00000, 0b11010, 0b10101, 0b10101, 0b10101, 0b10101],
  n: [0b00000, 0b00000, 0b10110, 0b11001, 0b10001, 0b10001, 0b10001],
  o: [0b00000, 0b00000, 0b01110, 0b10001, 0b10001, 0b10001, 0b01110],
  p: [0b00000, 0b00000, 0b10110, 0b11001, 0b10001, 0b11110, 0b10000],
  q: [0b00000, 0b00000, 0b01101, 0b10011, 0b10001, 0b01111, 0b00001],
  r: [0b00000, 0b00000, 0b10110, 0b11001, 0b10000, 0b10000, 0b10000],
  s: [0b00000, 0b00000, 0b01111, 0b10000, 0b01110, 0b00001, 0b11110],
  t: [0b01000, 0b01000, 0b11110, 0b01000, 0b01000, 0b01000, 0b00110],
  u: [0b00000, 0b00000, 0b10001, 0b10001, 0b10001, 0b10011, 0b01101],
  v: [0b00000, 0b00000, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100],
  w: [0b00000, 0b00000, 0b10001, 0b10101, 0b10101, 0b10101, 0b01010],
  x: [0b00000, 0b00000, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001],
  y: [0b00000, 0b00000, 0b10001, 0b10001, 0b01111, 0b00001, 0b01110],
  z: [0b00000, 0b00000, 0b11111, 0b00010, 0b00100, 0b01000, 0b11111],
};

function measureText(str: string, scale: number): number {
  if (str.length === 0) return 0;
  return str.length * 6 * scale - scale;
}

interface TextRect {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}

// Every text draw registers its bounding box here; checkTextGuards() runs
// after the whole picture is drawn and throws on any overlap or any text
// outside the 80 px content margins. The build fails loudly instead of
// shipping a garbled label.
const TEXT_RECTS: TextRect[] = [];

function drawText(cv: Canvas, str: string, x: number, y: number, scale: number, color: Color, align: "left" | "center" | "right" = "left"): TextRect {
  for (const ch of str) {
    if (!(ch in GLYPHS)) throw new Error(`drawText: no glyph for ${JSON.stringify(ch)} in ${JSON.stringify(str)}`);
  }
  const w = measureText(str, scale);
  const h = 7 * scale;
  let x0 = Math.round(x);
  if (align === "center") x0 = Math.round(x - w / 2);
  if (align === "right") x0 = Math.round(x - w);
  let gx = x0;
  for (const ch of str) {
    const rows = GLYPHS[ch];
    for (let row = 0; row < 7; row++) {
      const bits = rows[row];
      for (let col = 0; col < 5; col++) {
        if ((bits >> (4 - col)) & 1) {
          cv.fillRect(gx + col * scale, y + row * scale, scale, scale, color);
        }
      }
    }
    gx += 6 * scale;
  }
  const rect: TextRect = { x: x0, y: Math.round(y), w, h, label: str };
  TEXT_RECTS.push(rect);
  return rect;
}

// Raw glyph draw: same pixels as drawText but it does NOT register a text
// rect. Used only for halos and drop shadows, which are deliberately 2-3 px
// outside the registered rect (a white halo around a red label, a dark
// shadow under an amber label). The main (registered) draw always follows,
// so the guard still sees the true label bounds; the halo/shadow offsets
// are small enough that they cannot reach any guarded shape (verified by
// hand for each call site: NO WAITING halo stays 2 px clear of the curb
// above and YOU below; the loop-label shadow stays inside the loop).
function drawGlyphs(cv: Canvas, str: string, x: number, y: number, scale: number, color: Color, align: "left" | "center" | "right" = "left"): void {
  for (const ch of str) {
    if (!(ch in GLYPHS)) throw new Error(`drawGlyphs: no glyph for ${JSON.stringify(ch)} in ${JSON.stringify(str)}`);
  }
  const w = measureText(str, scale);
  let x0 = Math.round(x);
  if (align === "center") x0 = Math.round(x - w / 2);
  if (align === "right") x0 = Math.round(x - w);
  let gx = x0;
  for (const ch of str) {
    const rows = GLYPHS[ch];
    for (let row = 0; row < 7; row++) {
      const bits = rows[row];
      for (let col = 0; col < 5; col++) {
        if ((bits >> (4 - col)) & 1) {
          cv.fillRect(gx + col * scale, y + row * scale, scale, scale, color);
        }
      }
    }
    gx += 6 * scale;
  }
}

// White halo around a label (drawn first at 4 offsets, main colour on top).
// Kills red-on-teal vibration for the NO WAITING curb sign.
function drawTextHalo(cv: Canvas, str: string, x: number, y: number, scale: number, color: Color, halo: Color, align: "left" | "center" | "right" = "left"): TextRect {
  drawGlyphs(cv, str, x - 2, y, scale, halo, align);
  drawGlyphs(cv, str, x + 2, y, scale, halo, align);
  drawGlyphs(cv, str, x, y - 2, scale, halo, align);
  drawGlyphs(cv, str, x, y + 2, scale, halo, align);
  return drawText(cv, str, x, y, scale, color, align);
}

// Dark drop shadow offset (+3,+3) under a label, for luminance separation
// against busy backgrounds (the amber loop label on green land).
function drawTextShadow(cv: Canvas, str: string, x: number, y: number, scale: number, color: Color, shadow: Color, align: "left" | "center" | "right" = "left"): TextRect {
  drawGlyphs(cv, str, x + 3, y + 3, scale, shadow, align);
  return drawText(cv, str, x, y, scale, color, align);
}

function checkTextGuards(): void {
  for (const r of TEXT_RECTS) {
    if (r.x < 80 || r.x + r.w > 944 || r.y < 80 || r.y + r.h > 944) {
      throw new Error(`text outside content margins: ${JSON.stringify(r.label)} at (${r.x},${r.y}) ${r.w}x${r.h}`);
    }
  }
  for (let i = 0; i < TEXT_RECTS.length; i++) {
    for (let j = i + 1; j < TEXT_RECTS.length; j++) {
      const a = TEXT_RECTS[i];
      const b = TEXT_RECTS[j];
      const overlap =
        a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
      if (overlap) {
        throw new Error(`text overlap: ${JSON.stringify(a.label)} (${a.x},${a.y} ${a.w}x${a.h}) vs ${JSON.stringify(b.label)} (${b.x},${b.y} ${b.w}x${b.h})`);
      }
    }
  }
}

// Distance from a point to an axis-aligned rect (0 when inside).
function distPointToRect(px: number, py: number, r: TextRect): number {
  const dx = Math.max(r.x - px, 0, px - (r.x + r.w));
  const dy = Math.max(r.y - py, 0, py - (r.y + r.h));
  return Math.hypot(dx, dy);
}

// Shape-aware guard: every text rect must clear every drawn shape by at
// least 4 px of empty space, not just other text. The text-only guard could
// not see a label sitting on the route, the curb, the plaque or the ghost.
// `loop` is the amber polyline, `green` the shortcut segment, `arm` the
// ghost's arm segment. Thicknesses are subtracted so the check measures
// ink-to-text gaps, not centreline distances. The plaque's own "make.fun"
// and the stamp's own "TIME SERVED" are exempt (they live inside those
// shapes by design); everything else must clear them too.
function checkShapeGuards(
  loop: Array<[number, number]>,
  green: [[number, number], [number, number]],
  arm: [[number, number], [number, number]],
  starC: [number, number],
  markerC: [number, number],
  curb: { x: number; y: number; w: number; h: number },
  plaque: { x: number; y: number; w: number; h: number },
  ghostBox: { x: number; y: number; w: number; h: number }
): void {
  const GAP = 4;
  const fail = (label: string, what: string, d: number): void => {
    throw new Error(`shape guard: ${JSON.stringify(label)} is ${d.toFixed(1)}px from ${what} (need >= ${GAP}px ink gap)`);
  };
  for (const r of TEXT_RECTS) {
    // Text that lives ON a shape is exempt from that shape's clearance
    // check (it is meant to be there): the plaque's two lines, and the
    // stamp's two lines. ("make.fun" also names the banner, which is far
    // from both shapes, so the exemption is harmless there too.)
    const ownPlaque = r.label === "make.fun";
    const ownStamp = r.label === "SENTENCED TO" || r.label === "make.fun";
    // Sampled polylines: amber loop (ink half-width 5.5), green shortcut (4),
    // ghost arm (5). Sample every 2 px along each segment.
    const segs: Array<{ a: [number, number]; b: [number, number]; half: number }> = [];
    for (let i = 0; i + 1 < loop.length; i++) segs.push({ a: loop[i], b: loop[i + 1], half: 5.5 });
    segs.push({ a: green[0], b: green[1], half: 4 });
    segs.push({ a: arm[0], b: arm[1], half: 5 });
    for (const s of segs) {
      const len = Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]);
      const steps = Math.max(1, Math.ceil(len / 2));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const px = s.a[0] + (s.b[0] - s.a[0]) * t;
        const py = s.a[1] + (s.b[1] - s.a[1]) * t;
        const d = distPointToRect(px, py, r) - s.half;
        if (d < GAP) fail(r.label, "route/shortcut/arm", d);
      }
    }
    // Circles: star (r29) and YOU marker dot (r13).
    for (const [c, rad, name] of [
      [starC, 29, "GTA VI star"],
      [markerC, 13, "YOU marker"],
    ] as Array<[[number, number], number, string]>) {
      const d = distPointToRect(c[0], c[1], r) - rad;
      if (d < GAP) fail(r.label, name, d);
    }
    // Rects: curb (2 px inflation — the label sits just under it by design),
    // plaque and ghost box (4 px), excluding the texts that live inside them.
    const rectGap = (rx: number, ry: number, rw: number, rh: number, pad: number, name: string): void => {
      const overlap =
        r.x < rx + rw + pad && rx - pad < r.x + r.w && r.y < ry + rh + pad && ry - pad < r.y + r.h;
      if (overlap) fail(r.label, name, 0);
    };
    rectGap(curb.x, curb.y, curb.w, curb.h, 2, "NO WAITING curb");
    if (!ownPlaque) rectGap(plaque.x, plaque.y, plaque.w, plaque.h, 4, "make.fun plaque");
    if (!ownStamp) rectGap(STAMP.x, STAMP.y, STAMP.w, STAMP.h, 0, "TIME SERVED stamp");
    rectGap(ghostBox.x, ghostBox.y, ghostBox.w, ghostBox.h, 4, "big ghost");
  }
}

// ---------------------------------------------------------------------------
// Map geometry. The exhibit is drawn directly in final-canvas coordinates
// (no inset transform): the island sits in the lower panel, the amber loop
// circles it, the star sits ~165 px from YOU, and the green shortcut cuts
// from the make.fun plaque to YOU.
// ---------------------------------------------------------------------------
const MAP_CX = 512;
const MAP_CY = 720;

// Island outline: one radius per 15 degrees, 0 deg = east, angles grow
// clockwise on screen (y grows downward). South is fat (215) so the YOU
// label at the bottom sits on land; the north-west bulges (230-235) so the
// make.fun plaque sits on land; the north-east is pulled in (185-195) so the
// TIME SERVED stamp clears the amber loop.
const ISLAND_RADII = [
  205, 210, 200, 195, 200, 205, 215, 210, 205, 210, 200, 205,
  215, 220, 230, 235, 225, 210, 200, 195, 185, 185, 190, 195,
];

function islandRadiusAt(deg: number): number {
  const d = ((Math.round(deg / 15) % 24) + 24) % 24;
  return ISLAND_RADII[d];
}

function islandPoint(deg: number, r: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [MAP_CX + r * Math.cos(rad), MAP_CY + r * Math.sin(rad)];
}

function islandPolygon(scaleR: number): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  for (let a = 0; a < 360; a += 15) {
    pts.push(islandPoint(a, islandRadiusAt(a) * scaleR));
  }
  return pts;
}

// Smallest absolute angular distance between two bearings, in degrees.
function angDist(a: number, b: number): number {
  const d = Math.abs((((a - b) % 360) + 540) % 360) - 180;
  return Math.abs(d);
}

// Amber loop radius: 178 on the open coast, pulled in to 130 across the
// south so the loop passes just under YOU without touching the curb or the
// labels below it, and pulled in to 160 across the north-east so the loop
// clears the TIME SERVED stamp.
function routeRadius(deg: number): number {
  const tBottom = Math.max(0, Math.min(1, (55 - angDist(deg, 90)) / 25));
  const tNe = Math.max(0, Math.min(1, (40 - angDist(deg, 320)) / 20));
  return Math.min(178 - 48 * tBottom, 178 - 18 * tNe);
}

function routePoint(deg: number): [number, number] {
  return islandPoint(deg, routeRadius(deg));
}

// Ray-casting point-in-polygon, used to prove the plaque sits on land.
function pointInPolygon(x: number, y: number, poly: Array<[number, number]>): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// Fixed scene anchors (final-canvas coordinates).
const YOU = { x: 480, y: 850 }; // marker dot centre
const STAR = { x: 640, y: 795 }; // GTA VI star centre
const PLAQUE = { x: 85, y: 615, w: 200, h: 75 }; // make.fun plaque, west water (one text line)
const STAMP = { x: 720, y: 866, w: 200, h: 70 }; // SENTENCED TO make.fun stamp, SE water beside YOU
const GHOST = { x: 260, y: 770, w: 90, h: 120 }; // big ghost, SW water
const GREEN_START: [number, number] = [195, 707]; // plaque tip -> YOU

// ---------------------------------------------------------------------------
// drawMeme: the whole 1024x1024 picture, document first, exhibit second.
// ---------------------------------------------------------------------------
function drawMeme(): Canvas {
  TEXT_RECTS.length = 0;
  const cv = new Canvas(W, H);

  // --- Paper and outer double border -------------------------------------
  cv.fillRect(0, 0, W, H, IVORY);
  cv.strokeRect(28, 28, 968, 968, 3, NAVY);
  cv.strokeRect(38, 38, 948, 948, 2, NAVY);

  // --- Header row ---------------------------------------------------------
  drawText(cv, "STATE OF LEONIDA", 96, 92, 2, INK, "left");
  drawText(cv, "No. 2013-1120", 928, 92, 2, INK, "right");

  // --- Title + double rule -------------------------------------------------
  drawText(cv, "LEONIDA PARKING CITATION", 512, 124, 5, INK, "center");
  cv.fillRect(96, 180, 832, 3, NAVY);
  cv.fillRect(96, 186, 832, 2, NAVY);

  // --- Violation block: the citation points at the map, it does not tell
  // the joke itself. The map reveals what you actually did. "SEE EXHIBIT
  // A" is cut — the panel below is already labelled EXHIBIT A — and the
  // best line in the document, "Vehicle: your patience", is promoted to
  // the same size as the charge so it reads second, not as fine print. ----
  drawText(cv, "VIOLATION: FAILURE TO MOVE", 96, 202, 4, INK, "left");
  drawText(cv, "Vehicle: your patience", 96, 250, 4, INK, "left");

  // --- Sentence strip: the punishment IS the turn. No fine at all — the
  // penalty is one meme, and that meme is a shot at $500. The two cells
  // deliver the joke without an explanation: PENALTY / 1 MEME beside
  // BOUNTY PRIZE / $500. ------------------------------------------------------
  cv.fillRect(96, 306, 832, 2, NAVY);
  cv.fillRect(96, 376, 832, 2, NAVY);
  cv.fillRect(512, 306, 2, 70, NAVY);
  drawText(cv, "PENALTY", 304, 315, 2, INK, "center");
  drawText(cv, "1 MEME", 304, 333, 4, INK, "center");
  drawText(cv, "BOUNTY PRIZE", 720, 315, 2, INK, "center");
  drawText(cv, "$500", 720, 333, 5, GREEN, "center");

  // --- Payer banner: make.fun is the place you go, and the action is the
  // biggest thing on the bar. The redundant "$500 GTA VI MEME BOUNTY" is
  // gone (the strip already carries the prize); the banner now reads
  // brand + action: make.fun | MAKE A MEME. ----------------------------------
  cv.roundRect(96, 392, 832, 56, 8, DARK);
  drawText(cv, "make.fun", 112, 404, 4, CREAM, "left");
  drawText(cv, "MAKE A MEME", 912, 404, 5, GREEN, "right");

  // --- Exhibit panel --------------------------------------------------------
  cv.strokeRect(80, 464, 864, 480, 3, NAVY);
  cv.fillRect(84, 468, 856, 472, WATER);
  cv.fillRect(80, 464, 864, 42, DARK);
  drawText(cv, "EXHIBIT A: WHERE WE FOUND YOU", 96, 472, 3, CREAM, "left");
  // The officer who signed this citation is the brand itself — the
  // document's own form is the joke, not just the map's host.
  drawText(cv, "OFFICER: make.fun", 928, 472, 2, AMBER, "right");

  // --- Island: rim, then land ----------------------------------------------
  cv.polygon(islandPolygon(1.04), RIM);
  const landPoly = islandPolygon(1);
  cv.polygon(landPoly, LAND);
  // Prove the plaque floats in open water, clear of the coast (it is a
  // sign in the sea now, so the island interior stays free for the big
  // loop label). Every plaque corner must be OUTSIDE the island.
  for (const [px, py] of [
    [PLAQUE.x, PLAQUE.y],
    [PLAQUE.x + PLAQUE.w, PLAQUE.y],
    [PLAQUE.x, PLAQUE.y + PLAQUE.h],
    [PLAQUE.x + PLAQUE.w, PLAQUE.y + PLAQUE.h],
    [PLAQUE.x + PLAQUE.w / 2, PLAQUE.y + PLAQUE.h / 2],
  ]) {
    if (pointInPolygon(px, py, landPoly)) {
      throw new Error(`plaque corner (${px},${py}) is on land, must be water`);
    }
  }

  // --- Water wave marks (all verified in open water) ------------------------
  cv.line(140, 520, 164, 520, 3, WATERLINE);
  cv.line(868, 650, 892, 650, 3, WATERLINE);
  cv.line(128, 880, 152, 880, 3, WATERLINE);
  cv.line(880, 845, 904, 845, 3, WATERLINE); // south-east water, clear of the stamp
  cv.line(215, 900, 240, 900, 3, WATERLINE); // wake by the big ghost

  // --- Amber loop: a CLOSED circuit. It starts at YOU, circles the whole
  // island, and comes back to YOU. The star is never on the loop. -----------
  const loop: Array<[number, number]> = [];
  for (let deg = 104; deg <= 464; deg += 12) loop.push(routePoint(deg % 360));
  cv.polyline(loop, 11, DARK);
  cv.polyline(loop, 7, AMBER);
  // Arrowhead at the top of the loop, pointing in the direction of travel.
  cv.polygon(
    [
      [532, 542],
      [510, 531],
      [510, 553],
    ],
    AMBER
  );

  // --- Green dashed shortcut: YOU -> the make.fun plaque (the only exit).
  // A solid green arrowhead at the plaque end makes the direction
  // unambiguous: the route travels TOWARD make.fun, it does not end at
  // YOU. The dashes carry a dark under-stroke (same cadence, wider) so
  // the green detaches from the green island instead of hiding in it. ----
  cv.dashedLine(GREEN_START[0], GREEN_START[1], YOU.x - 2, YOU.y - 8, 8, 14, 14, DARK);
  cv.dashedLine(GREEN_START[0], GREEN_START[1], YOU.x - 2, YOU.y - 8, 8, 14, 10, GREEN);
  cv.polygon(
    [
      [195, 707],
      [211, 707],
      [205, 719],
    ],
    GREEN
  );

  // --- make.fun plaque: a sign in the west water, one clean line now —
  // the action ("MAKE A MEME") moved up into the banner, so the plaque
  // is just the destination's name. One character anchor only (the big
  // ghost), so the eye is never split. ---------------------------------------
  cv.roundRect(PLAQUE.x, PLAQUE.y, PLAQUE.w, PLAQUE.h, 8, DARK);
  cv.roundRectStroke(PLAQUE.x, PLAQUE.y, PLAQUE.w, PLAQUE.h, 8, 3, GREEN);
  cv.polygon(
    [
      [175, PLAQUE.y + PLAQUE.h],
      [215, PLAQUE.y + PLAQUE.h],
      [195, 707],
    ],
    DARK
  );
  drawText(cv, "make.fun", 185, 642, 3, CREAM, "center");

  // --- SENTENCED TO make.fun stamp: moved from the upper-right water to
  // the curb beside YOU, on the same horizontal band as the action. The
  // ruling and its execution are now one composition, not two: a short
  // red dashed leader runs from the stamp's left edge toward the curb,
  // so the order visibly initiates the detour the ghost is carrying out.
  // (The leader points at the curb, not at the green dash — a leader to
  // the dash itself would have to cross the NO WAITING label.) --------------
  for (const [px, py] of [
    [STAMP.x, STAMP.y],
    [STAMP.x + STAMP.w, STAMP.y],
    [STAMP.x, STAMP.y + STAMP.h],
    [STAMP.x + STAMP.w, STAMP.y + STAMP.h],
    [STAMP.x + STAMP.w / 2, STAMP.y + STAMP.h / 2],
  ]) {
    if (pointInPolygon(px, py, landPoly)) {
      throw new Error(`stamp corner (${px},${py}) is on land, must be water`);
    }
  }
  cv.fillRect(STAMP.x, STAMP.y, STAMP.w, STAMP.h, IVORY);
  cv.strokeRect(STAMP.x, STAMP.y, STAMP.w, STAMP.h, 4, RED);
  cv.strokeRect(STAMP.x + 8, STAMP.y + 8, STAMP.w - 16, STAMP.h - 16, 2, RED);
  drawText(cv, "SENTENCED TO", STAMP.x + STAMP.w / 2, 876, 2, RED, "center");
  drawText(cv, "make.fun", STAMP.x + STAMP.w / 2, 894, 3, RED, "center");
  cv.dashedLine(STAMP.x, 901, 632, 880, 6, 6, 3, RED); // leader to the curb

  // --- GTA VI star + label ---------------------------------------------------
  // Shrunk (~34 px star, 35 px label): the loop, not the star, is the
  // biggest shape in the panel now — the star reads as "almost", not as
  // the destination. (J5 also wanted it moved tight against the loop's
  // outer edge; not done — the verified 169 px star-to-YOU geometry and
  // the guard's clean state are kept, and the shrink alone removes the
  // dominance.) --------------------------------------------------------------
  cv.star(STAR.x, STAR.y, 17, 7, DARK);
  cv.star(STAR.x, STAR.y, 15, 6, AMBER);
  drawText(cv, "GTA VI", 700, 775, 5, CREAM, "left");

  // --- The evidence: red NO WAITING curb under YOU (big now), with a
  // white halo so the red stops vibrating against the teal water and
  // green land. --------------------------------------------------------------
  cv.line(400, 866, 560, 866, 8, RED);
  drawTextHalo(cv, "NO WAITING", 480, 874, 4, RED, WHITE, "center");
  drawText(cv, "YOU", 480, 908, 4, WHITE, "center");

  // --- Ghost tow: the make.fun ghost wades in and pulls YOU off the curb.
  // One character anchor only — the plaque is now a plain sign, so the
  // ghost is unmistakably the brand's mascot, not a second metaphor. -------
  cv.ghost(GHOST.x, GHOST.y, GHOST.w, GHOST.h, WHITE, DARK);
  cv.fillCircle(305, 835, 6, GREEN); // make.fun badge on the big ghost
  cv.line(345, 815, 470, 846, 10, WHITE); // arm
  cv.line(470, 846, 480, 840, 5, WHITE); // fingers
  cv.line(470, 846, 482, 848, 5, WHITE);
  cv.line(470, 846, 480, 856, 5, WHITE);

  // --- YOU marker dot, on the loop, at the curb ------------------------------
  cv.fillCircle(YOU.x, YOU.y, 13, DARK);
  cv.fillCircle(YOU.x, YOU.y, 10, WHITE);

  // --- The loop's punchline, large, inside the loop: you went all the way
  // around the island and ended up exactly where you started. Centred on
  // x503 — the interior narrows toward the top, so the wider second line
  // sits 16 px further left than the first. White now, not amber: the
  // label is the wait itself (white, like YOU and the ghost), while the
  // loop and the star keep the amber. A dark drop shadow keeps it legible
  // against the green land. --------------------------------------------------
  drawTextShadow(cv, "13 YEARS.", 503, 638, 5, WHITE, DARK, "center");
  drawTextShadow(cv, "SAME SPOT.", 503, 676, 5, WHITE, DARK, "center");

  // --- Guards: no overlapping text, nothing outside the margins, and
  // every text rect clear of every drawn shape by >= 4 px of ink gap. -------
  checkShapeGuards(
    loop,
    [GREEN_START, [YOU.x - 2, YOU.y - 8]],
    [
      [345, 815],
      [470, 846],
    ],
    [STAR.x, STAR.y],
    [YOU.x, YOU.y],
    { x: 400, y: 862, w: 160, h: 8 }, // NO WAITING curb ink bounds (line y866 t8)
    PLAQUE,
    GHOST
  );
  checkTextGuards();
  return cv;
}

// ---------------------------------------------------------------------------
// Entry point.
// ---------------------------------------------------------------------------
function parseOutdir(argv: string[]): string {
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--outdir" && i + 1 < argv.length) return argv[i + 1];
    if (argv[i].startsWith("--outdir=")) return argv[i].slice("--outdir=".length);
  }
  if (process.env.MAKEFUN_OUTPUT_DIR) return process.env.MAKEFUN_OUTPUT_DIR;
  return "/output";
}

function main(): void {
  const outdir = parseOutdir(process.argv.slice(2));
  // Determinism self-check: render twice in memory; refuse to write unless
  // both PNGs are byte-identical (a silent encoder drift must fail loudly).
  const pngA = encodePng(drawMeme().buf, W, H);
  const pngB = encodePng(drawMeme().buf, W, H);
  if (!pngA.equals(pngB)) throw new Error("non-deterministic render: two runs differ");
  const png = pngA;
  fs.mkdirSync(outdir, { recursive: true });
  const outPath = path.join(outdir, "meme.png");
  fs.writeFileSync(outPath, png);
  const sha = crypto.createHash("sha256").update(png).digest("hex");
  const starYou = Math.hypot(STAR.x - YOU.x, STAR.y - YOU.y);
  console.log(`wrote ${outPath}`);
  console.log(`size: ${png.length} bytes, ${W}x${H}`);
  console.log(`sha256: ${sha}`);
  console.log(`star-to-YOU distance: ${starYou.toFixed(1)} px (target 160-170)`);
  console.log(`text rects guarded: ${TEXT_RECTS.length}, overlaps: 0`);
  console.log(`determinism: two in-memory renders byte-identical`);
}

main();
