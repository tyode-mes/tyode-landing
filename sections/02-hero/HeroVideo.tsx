"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { scrollBus } from "@/lib/scrollBus";
import styles from "./HeroVideo.module.css";

/** One set of packed clips (colour on top, AI depth underneath), made by the pack script. */
export type HeroClips = {
  /** idle loop, tyre assembled (forward + reversed, loops seamlessly) */
  assembled: string;
  /** the robots pulling the tyre apart, scrubbed by scroll */
  breakApart: string;
  /** idle loop, tyre fully apart */
  exploded: string;
  /** first frame as a JPG, shown instantly while the clips load */
  poster: string;
  /**
   * Optional: the break-apart clip as a raw stream (H.264 Annex B .h264, or VP9 .ivf), every
   * frame a keyframe. Browsers with WebCodecs decode its frames directly instead of seeking
   * the video, which makes scrubbing instant and perfectly in step with the scroll.
   */
  breakStream?: string;
};

type HeroVideoProps = {
  /** Normal video, used only when 3D isn't available (old browser / reduced motion). */
  src: string;
  /** Full-quality clips (1080p) for desktops. */
  hd: HeroClips;
  /** Lighter clips (720p) for phones, weaker laptops and slow connections. */
  sd?: HeroClips;
  /** How tall the scroll area is, in screen heights. */
  scrollLength?: number;
};

const FPS = 24;
const BREAK_FIRST = 24;
const BREAK_LAST = 124;
const range = (a: number, b: number) =>
  a <= b ? Array.from({ length: b - a + 1 }, (_, i) => a + i) : Array.from({ length: a - b + 1 }, (_, i) => a - i);

const SHARPNESS = [0.89, 0.90, 0.90, 0.90, 0.89, 0.89, 1.00, 1.00, 1.00, 1.00, 0.94, 0.94, 0.86, 0.82, 0.82, 0.84, 0.85, 0.85, 0.85, 0.85, 0.85, 0.87, 0.88, 0.89, 0.97, 1.00, 0.97, 0.94, 0.93, 0.92, 0.90, 0.90, 0.92, 0.92, 0.93, 0.93, 0.98, 0.97, 1.00, 0.99, 0.99, 1.00, 0.98, 0.97, 0.98, 0.97, 0.94, 0.92, 0.92, 0.93, 0.92, 0.88, 0.92, 0.92, 0.92, 0.83, 0.78, 0.80, 0.82, 0.78, 0.75, 0.71, 0.73, 0.74, 0.74, 0.74, 0.81, 0.75, 0.74, 0.72, 0.74, 0.76, 0.83, 0.85, 0.87, 0.86, 0.88, 0.87, 0.90, 0.91, 0.94, 0.91, 0.91, 0.92, 0.91, 0.91, 0.91, 0.91, 0.91, 0.92, 0.92, 0.92, 0.92, 0.92, 0.93, 0.94, 1.00, 0.98, 0.98, 0.98, 0.97];
const SHARP_ENOUGH = 0.9;

const IDLE_ASSEMBLED = { lo: 25, hi: 52, period: 9.5 };
const IDLE_EXPLODED = { lo: 109, hi: 124, period: 8.5 };
const HOVER_PERIOD = 8;
const HOVER_FADE_IN = 1.4;
const BACKDROP = { color: [0.82, 0.82, 0.824], floor: 0.045, pool: 0.03, falloff: 0.05 };
const DEPTH = 0.36;
const LAYERS = ["Batch", "Build", "Cure", "Check", "Ship", "Claim"];
const SCALE = { share: 0.19, min: 80, max: 288 };
const BAND = {
  top: 0.56,
  bottom: 0.14,
  lift: 0.2,
  opacity: 1,
  parallax: 0.35,
  label: "Trace · Check · Explain",
  labelSize: 12.5,
  labelX: 0.635,
};
const EXIT = { span: 0.75, lead: 0.2, rise: 0.2, melt: 0.12, page: [0.925, 0.925, 0.929] };
const LOOP_A = [...range(25, 52), ...range(51, 26)];
const LOOP_B = [...range(109, 124), ...range(123, 110)];

/* ================================================================== */
/*  Shaders                                                            */
/* ================================================================== */

const SAMPLE = /* glsl */ `
uniform sampler2D uVid;
uniform float uHalfTexel;
uniform float uFgLo;
uniform float uFgHi;

vec3 colorOf(sampler2D s, vec2 uv) {
  float v = clamp(mix(0.5, 1.0, uv.y), 0.5 + uHalfTexel * 2.0, 1.0);
  return textureLod(s, vec2(uv.x, v), 0.0).rgb;
}
float depthOf(sampler2D s, vec2 uv) {
  float v = clamp(mix(0.25, 0.5, clamp(uv.y, 0.0, 1.0)), 0.25 + uHalfTexel * 2.0, 0.5 - uHalfTexel * 2.0);
  return textureLod(s, vec2(clamp(uv.x, 0.0, 1.0), v), 0.0).r;
}
float alphaOf(sampler2D s, vec2 uv) {
  float v = clamp(mix(0.0, 0.25, clamp(uv.y, 0.0, 1.0)), uHalfTexel * 2.0, 0.25 - uHalfTexel * 2.0);
  return smoothstep(0.06, 0.94, textureLod(s, vec2(clamp(uv.x, 0.0, 1.0), v), 0.0).r);
}
vec4 cubicW(float v) {
  vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v;
  vec4 s = n * n * n;
  float x = s.x;
  float y = s.y - 4.0 * s.x;
  float z = s.z - 4.0 * s.y + 6.0 * s.x;
  return vec4(x, y, z, 6.0 - x - y - z) * (1.0 / 6.0);
}
float alphaSmooth(sampler2D s, vec2 uv) {
  float v = clamp(mix(0.0, 0.25, clamp(uv.y, 0.0, 1.0)), uHalfTexel * 6.0, 0.25 - uHalfTexel * 6.0);
  float q = textureLod(s, vec2(clamp(uv.x, 0.0, 1.0), v), 0.0).r;
  if (q < 0.01 || q > 0.99) return smoothstep(0.06, 0.94, q);
  vec2 ts = vec2(textureSize(s, 0));
  vec2 t = vec2(clamp(uv.x, 0.0, 1.0), v) * ts - 0.5;
  vec2 f = fract(t);
  t -= f;
  vec4 xc = cubicW(f.x);
  vec4 yc = cubicW(f.y);
  vec4 c = t.xxyy + vec2(-0.5, 1.5).xyxy;
  vec4 sw = vec4(xc.xz + xc.yw, yc.xz + yc.yw);
  vec4 off = (c + vec4(xc.yw, yc.yw) / sw) / ts.xxyy;
  float s0 = textureLod(s, off.xz, 0.0).r;
  float s1 = textureLod(s, off.yz, 0.0).r;
  float s2 = textureLod(s, off.xw, 0.0).r;
  float s3 = textureLod(s, off.yw, 0.0).r;
  float sx = sw.x / (sw.x + sw.y);
  float sy = sw.z / (sw.z + sw.w);
  return smoothstep(0.06, 0.94, mix(mix(s3, s2, sx), mix(s1, s0, sx), sy));
}
vec3 colorAt(vec2 uv) { return colorOf(uVid, uv); }
float depthAt(vec2 uv) { return depthOf(uVid, uv); }
float alphaAt(vec2 uv) { return alphaOf(uVid, uv); }
float fgAt(float d) { return smoothstep(uFgLo, uFgHi, d); }
`;

const QUAD_VS = /* glsl */ `#version 300 es
layout(location = 0) in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const BG_VS = /* glsl */ `#version 300 es
layout(location = 0) in vec2 aPos;
uniform mat4 uVP;
uniform float uAspect;
uniform float uScale;
uniform float uZ;
uniform float uK;
out vec2 vUv;
void main() {
  vec3 p = vec3(aPos.x * uAspect * uScale * 0.5, aPos.y * uScale * 0.5, uZ);
  vUv = vec2(p.x / uAspect, p.y) * uK + 0.5;
  gl_Position = uVP * vec4(p, 1.0);
}`;

const BG_FS = /* glsl */ `#version 300 es
precision highp float;
uniform vec3 uBackdrop;
uniform vec3 uLight;
in vec2 vUv;
layout(location = 0) out vec4 o;
layout(location = 1) out vec4 oCov;

void main() {
  vec2 uv = vUv;
  float floorGlow = uLight.x * smoothstep(0.75, -0.1, uv.y);
  vec2 c = (uv - vec2(0.52, 0.42)) * vec2(1.25, 1.0);
  float pool = uLight.y * exp(-dot(c, c) * 2.2);
  float falloff = uLight.z * smoothstep(0.35, 1.05, length((uv - 0.5) * vec2(1.1, 1.0)));
  o = vec4(uBackdrop * (1.0 + floorGlow + pool - falloff), 1.0);
  oCov = vec4(0.0);
}`;

const GEO_FS = /* glsl */ `#version 300 es
precision highp float;
${SAMPLE}
uniform vec2 uGrid;
out vec4 o;
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5) / uGrid;
  vec2 cell = 1.0 / uGrid;
  float d0 = depthAt(uv);
  float a0 = alphaAt(uv);
  float dm = d0;
  float am = a0;
  for (int k = 0; k < 28; k++) {
    float r = k < 8 ? 0.7 : (k < 16 ? 1.35 : 2.0);
    float a = k < 8 ? float(k) * 0.7854 : (k < 16 ? float(k - 8) * 0.7854 + 0.3927 : float(k - 16) * 0.5236);
    vec2 p = uv + vec2(cos(a), sin(a)) * r * cell;
    float d = depthAt(p);
    dm = max(dm, d);
    am = max(am, alphaAt(p));
  }
  float fg = smoothstep(0.2, 0.6, max(am, fgAt(dm) * 0.5));
  o = vec4(dm, fg, d0, 1.0);
}`;

const MESH_VS = /* glsl */ `#version 300 es
precision highp float;
layout(location = 0) in vec2 aUv;
uniform sampler2D uGeo;
uniform int   uCols;
uniform mat4  uVP;
uniform float uAspect;
uniform float uDepth;
uniform float uSep;
uniform float uVel;
uniform float uTime;
out vec2  vUv;
out float vGeo;
out float vD0;

void main() {
  vec2 uv = aUv;
  vec4 g = texelFetch(uGeo, ivec2(gl_VertexID % uCols, gl_VertexID / uCols), 0);
  float dm = g.r;
  float fg = g.g;
  float z = dm * uDepth + fg * uSep - (1.0 - fg) * uSep * 0.7;
  z += sin(uv.y * 16.0 + uv.x * 5.0 - uTime * 7.0) * uVel * 0.004 * (0.25 + fg);
  vUv = uv;
  vGeo = dm;
  vD0 = g.b;
  gl_Position = uVP * vec4((uv.x - 0.5) * uAspect, uv.y - 0.5, z, 1.0);
}`;

const MESH_FS = /* glsl */ `#version 300 es
precision highp float;
${SAMPLE}
uniform sampler2D uPrev;
uniform float uMix;
uniform float uApart;
uniform float uUvArea;
in vec2  vUv;
in float vGeo;
in float vD0;
layout(location = 0) out vec4 o;
layout(location = 1) out vec4 oCov;

void main() {
  vec3 col = mix(colorOf(uPrev, vUv), colorAt(vUv), uMix);
  float dP = mix(depthOf(uPrev, vUv), depthAt(vUv), uMix);
  float mask = mix(alphaSmooth(uPrev, vUv), alphaSmooth(uVid, vUv), uMix);
  float edge = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
  float border = smoothstep(0.0, 0.07, edge);
  vec2 du = dFdx(vUv);
  vec2 dv = dFdy(vUv);
  float stretch = uUvArea / max(abs(du.x * dv.y - du.y * dv.x), 1e-12);
  /* Fully suppress edge spike tearing during inter-frame crossfades */
  float blendGuard = 1.0 - 3.4 * uMix * (1.0 - uMix);
  float spike = smoothstep(2.3, 4.6, stretch) * smoothstep(0.07, 0.16, abs(dP - vD0)) * clamp(blendGuard, 0.0, 1.0);
  float behind = vGeo - dP;
  float fringe = smoothstep(1.5, 2.4, stretch) * (1.0 - smoothstep(0.55, 0.9, mask));
  float apartA = mask * (1.0 - smoothstep(0.24, 0.44, behind)) * (1.0 - spike) * (1.0 - fringe);
  float alpha = mix(mask * (1.0 - spike), apartA, uApart) * border;
  if (alpha < 0.004) discard;
  o = vec4(col * alpha, alpha);
  oCov = vec4(mask * clamp(alpha / max(border, 0.001), 0.0, 1.0), 0.0, 0.0, alpha);
}`;

const POST_FS = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform vec2  uRes;
uniform float uVel;
uniform float uSharp;
uniform float uTAlpha;
uniform sampler2D uCov;
uniform vec4  uBand;
uniform sampler2D uLabel;
uniform vec3  uLabelBox;
uniform float uBandX;
uniform vec3  uInk;
uniform float uExit;
uniform vec4  uCard;
uniform float uCardR;
uniform float uShade;
uniform vec3  uPage;
uniform float uMelt;
in vec2 vUv;
out vec4 o;

float cardDist(vec2 p) {
  vec2 c = 0.5 * (uCard.xy + uCard.zw);
  vec2 q = abs(p - c) - 0.5 * (uCard.zw - uCard.xy) + uCardR;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uCardR;
}

void main() {
  vec2 px = 1.0 / uRes;
  vec3 c = texture(uScene, vUv).rgb;
  vec3 a = texture(uScene, vUv + vec2(0.0, px.y)).rgb;
  vec3 b = texture(uScene, vUv - vec2(px.x, 0.0)).rgb;
  vec3 d = texture(uScene, vUv + vec2(px.x, 0.0)).rgb;
  vec3 e = texture(uScene, vUv - vec2(0.0, px.y)).rgb;

  vec3 mn = min(c, min(min(a, b), min(d, e)));
  vec3 mx = max(c, max(max(a, b), max(d, e)));
  vec3 amp = sqrt(clamp(min(mn, 1.0 - mx) / max(mx, 1e-4), 0.0, 1.0));
  vec3 w = -amp / mix(8.0, 5.0, uSharp);
  vec3 col = (c + (a + b + d + e) * w) / (1.0 + 4.0 * w);

  float split = smoothstep(0.45, 1.3, abs(uVel));
  if (split > 0.001) {
    vec2 dir = (vUv - 0.5) * abs(uVel) * 0.0011;
    col.r = mix(col.r, texture(uScene, vUv + dir).r, split);
    col.b = mix(col.b, texture(uScene, vUv - dir).b, split);
  }
  if (uTAlpha > 0.0) {
    float cov = texture(uCov, vUv).r;
    if (uBand.w > 0.0) {
      float y = gl_FragCoord.y - uBand.z * (gl_FragCoord.x - uBandX);
      float aa = 0.75;
      float band = smoothstep(uBand.x - aa, uBand.x + aa, y) * (1.0 - smoothstep(uBand.y - aa, uBand.y + aa, y));
      col = mix(col, vec3(1.0), band * (1.0 - cov) * uBand.w);
      float bc = 0.5 * (uBand.x + uBand.y);
      vec2 lu = vec2((gl_FragCoord.x - uLabelBox.x) / (uLabelBox.y - uLabelBox.x), (y - (bc - 0.5 * uLabelBox.z)) / uLabelBox.z);
      if (lu.x > 0.0 && lu.x < 1.0 && lu.y > 0.0 && lu.y < 1.0) {
        col = mix(col, uInk, texture(uLabel, lu).a * band * (1.0 - cov) * uBand.w);
      }
    }
  }
  if (uExit > 0.001) {
    vec2 px2 = 1.0 / uRes;
    float mc = texture(uCov, vUv).r;
    float cd = cardDist(gl_FragCoord.xy);
    float inCard = 1.0 - smoothstep(-0.75, 0.75, cd);
    col = mix(col, vec3(1.0), 0.35 * uExit * (1.0 - mc) * (1.0 - smoothstep(0.0, 1.6, abs(cd + 1.0))));
    if (inCard < 1.0) {
      vec3 page = uPage;
      float sd = cardDist(gl_FragCoord.xy + vec2(0.0, uShade * 0.45));
      float sh = 1.0 - smoothstep(-uShade * 0.3, uShade * 2.2, sd);
      page *= 1.0 - 0.11 * uExit * sh * sh;
      float ms = 0.0;
      for (int i = 0; i < 12; i++) {
        float fi = float(i) + 0.5;
        float ang = fi * 2.39996;
        vec2 q = vUv + (vec2(0.0, uShade * 0.6) + vec2(cos(ang), sin(ang)) * sqrt(fi / 12.0) * uShade * 0.9) * px2;
        ms += texture(uCov, q).r;
      }
      float melt = mix(1.0, smoothstep(0.0, uMelt, gl_FragCoord.y), uExit);
      page = mix(uPage, page * (1.0 - 0.15 * uExit * ms / 12.0), melt);
      col = mix(page, col, max(inCard, mc * melt));
    }
  }
  float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  col += (n - 0.5) * (1.5 / 255.0);
  o = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

/* ================================================================== */
/*  WebGL + math helpers                                               */
/* ================================================================== */

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

function makeProgram(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error("[HeroVideo] shader: " + gl.getShaderInfoLog(s));
    }
    return s;
  };
  const p = gl.createProgram()!;
  const v = compile(gl.VERTEX_SHADER, vs);
  const f = compile(gl.FRAGMENT_SHADER, fs);
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  gl.deleteShader(v);
  gl.deleteShader(f);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error("[HeroVideo] link: " + gl.getProgramInfoLog(p));
  }
  const cache = new Map<string, WebGLUniformLocation | null>();
  const u = (name: string) => {
    if (!cache.has(name)) cache.set(name, gl.getUniformLocation(p, name));
    return cache.get(name)!;
  };
  return { p, u };
}

function perspectiveInto(out: Float32Array, fovy: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan(fovy / 2);
  const nf = 1 / (near - far);
  out.fill(0);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[14] = 2 * far * near * nf;
}

function lookAtInto(
  out: Float32Array,
  ex: number, ey: number, ez: number,
  tx: number, ty: number, tz: number,
  ux: number, uy: number, uz: number
) {
  let zx = ex - tx, zy = ey - ty, zz = ez - tz;
  let l = Math.hypot(zx, zy, zz) || 1;
  zx /= l; zy /= l; zz /= l;
  let xx = uy * zz - uz * zy, xy = uz * zx - ux * zz, xz = ux * zy - uy * zx;
  l = Math.hypot(xx, xy, xz) || 1;
  xx /= l; xy /= l; xz /= l;
  const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
  out[0] = xx; out[1] = yx; out[2] = zx; out[3] = 0;
  out[4] = xy; out[5] = yy; out[6] = zy; out[7] = 0;
  out[8] = xz; out[9] = yz; out[10] = zz; out[11] = 0;
  out[12] = -(xx * ex + xy * ey + xz * ez);
  out[13] = -(yx * ex + yy * ey + yz * ez);
  out[14] = -(zx * ex + zy * ey + zz * ez);
  out[15] = 1;
}

function multiplyInto(out: Float32Array, a: Float32Array, b: Float32Array) {
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
      out[c * 4 + r] = s;
    }
}

/* ================================================================== */
/*  Clip Cache & WebCodecs Stream (Farthest-From-Center LRU Cache)     */
/* ================================================================== */

const CLIP_CACHE = "tyode-hero-clips-v5";

async function cachedClip(url: string, signal: AbortSignal): Promise<{ url: string; blob: boolean }> {
  try {
    if (typeof caches === "undefined") throw new Error("no Cache Storage");
    const cache = await caches.open(CLIP_CACHE);
    let res = await cache.match(url);
    if (!res) {
      res = await fetch(url, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      try {
        await cache.put(url, res.clone());
      } catch {
        /* storage full or private mode */
      }
    }
    const data = await res.blob();
    return { url: URL.createObjectURL(data), blob: true };
  } catch {
    return { url, blob: false };
  }
}

function warmClip(url: string) {
  if (typeof caches === "undefined") return;
  caches
    .open(CLIP_CACHE)
    .then(async (cache) => {
      if (await cache.match(url)) return;
      const res = await fetch(url);
      if (res.ok) await cache.put(url, res);
    })
    .catch(() => {});
}

type FrameStream = {
  count: number;
  get(i: number): VideoFrame | undefined;
  want(center: number, vel: number): void;
  below(f: number): number;
  above(f: number): number;
  cached(): number;
  failed(): boolean;
  close(): void;
};

function parseStream(buf: Uint8Array): { codec: string; chunks: Uint8Array[] } | null {
  const chunks: Uint8Array[] = [];
  if (buf[0] === 0x44 && buf[1] === 0x4b && buf[2] === 0x49 && buf[3] === 0x46) {
    const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    const fourcc = String.fromCharCode(buf[8], buf[9], buf[10], buf[11]);
    const codec = fourcc === "VP90" ? "vp09.00.10.08" : fourcc === "VP80" ? "vp8" : fourcc === "AV01" ? "av01.0.08M.08" : "";
    if (!codec) return null;
    let o = dv.getUint16(6, true);
    while (o + 12 <= buf.length) {
      const size = dv.getUint32(o, true);
      if (o + 12 + size > buf.length) break;
      chunks.push(buf.subarray(o + 12, o + 12 + size));
      o += 12 + size;
    }
    return chunks.length ? { codec, chunks } : null;
  }
  const starts: number[] = [];
  let codec = "";
  let hasAud = false;
  for (let pass = 0; pass < 2 && !starts.length; pass++) {
    const cut = pass === 0 ? 9 : 7;
    for (let i = 0; i + 3 < buf.length; i++) {
      if (buf[i] !== 0 || buf[i + 1] !== 0 || buf[i + 2] !== 1) continue;
      const type = buf[i + 3] & 0x1f;
      if (type === 9) hasAud = true;
      if (type === 7 && !codec && i + 6 < buf.length) {
        const h = (x: number) => x.toString(16).padStart(2, "0");
        codec = `avc1.${h(buf[i + 4])}${h(buf[i + 5])}${h(buf[i + 6])}`;
      }
      if (type === cut) starts.push(i > 0 && buf[i - 1] === 0 ? i - 1 : i);
      i += 2;
    }
    if (pass === 0 && !hasAud) starts.length = 0;
  }
  if (!codec || !starts.length) return null;
  for (let k = 0; k < starts.length; k++) chunks.push(buf.subarray(starts[k], k + 1 < starts.length ? starts[k + 1] : buf.length));
  return { codec, chunks };
}

async function openFrameStream(url: string, signal: AbortSignal, maxFrames: number): Promise<FrameStream | null> {
  if (typeof VideoDecoder === "undefined" || typeof EncodedVideoChunk === "undefined") return null;
  try {
    let res: Response | undefined;
    if (typeof caches !== "undefined") {
      const cache = await caches.open(CLIP_CACHE).catch(() => undefined);
      res = await cache?.match(url);
      if (!res) {
        res = await fetch(url, { signal });
        if (!res.ok) return null;
        await cache?.put(url, res.clone()).catch(() => {});
      }
    } else {
      res = await fetch(url, { signal });
      if (!res.ok) return null;
    }
    const parsed = parseStream(new Uint8Array(await res.arrayBuffer()));
    if (!parsed || signal.aborted) return null;
    const config: VideoDecoderConfig = { codec: parsed.codec, optimizeForLatency: true };
    const support = await VideoDecoder.isConfigSupported(config).catch(() => null);
    if (!support?.supported || signal.aborted) return null;

    const { chunks } = parsed;
    const frames = new Map<number, VideoFrame>();
    const inflight = new Set<number>();
    let lastCenter = 0;
    let errors = 0;
    let closed = false;
    let flushing = false;
    let dec: VideoDecoder;

    // Always evict the frame farthest from the current scrub position (never thrashes on direction flip)
    const evict = () => {
      while (frames.size > maxFrames) {
        let worstIdx = -1;
        let worstDist = -1;
        for (const i of frames.keys()) {
          const d = Math.abs(i - lastCenter);
          if (d > worstDist) {
            worstDist = d;
            worstIdx = i;
          }
        }
        if (worstIdx < 0) return;
        frames.get(worstIdx)?.close();
        frames.delete(worstIdx);
      }
    };

    const make = () => {
      dec = new VideoDecoder({
        output: (fr) => {
          const i = Math.round(fr.timestamp / 1000);
          inflight.delete(i);
          if (closed || frames.has(i)) fr.close();
          else {
            frames.set(i, fr);
            evict();
          }
        },
        error: () => {
          inflight.clear();
          flushing = false;
          if (!closed && ++errors <= 3) make();
        },
      });
      dec.configure(config);
    };
    make();

    const flush = () => {
      if (flushing || closed || dec.state !== "configured") return;
      flushing = true;
      dec.flush().then(
        () => {
          flushing = false;
          if (inflight.size) flush();
        },
        () => {
          flushing = false;
        }
      );
    };

    const near = (f: number, dir: number) => {
      const start = dir < 0 ? Math.floor(f + 1e-6) : Math.ceil(f - 1e-6);
      for (let k = 0; k <= 8; k++) {
        const i = start + dir * k;
        if (frames.has(i)) return i;
      }
      return -1;
    };

    return {
      count: chunks.length,
      get: (i) => frames.get(i),
      below: (f) => near(f, -1),
      above: (f) => near(f, 1),
      cached: () => frames.size,
      failed: () => errors > 3,
      want(center, vel) {
        if (closed || errors > 3 || dec.state !== "configured") return;
        const c = clamp(Math.round(center), 0, chunks.length - 1);
        lastCenter = c;
        const dir = Math.abs(vel) > 0.4 ? Math.sign(vel) : 0;
        const ahead = Math.min(22, 6 + Math.round(Math.abs(vel) * 0.2));
        const behind = Math.min(12, 6 + Math.round(ahead / 3));
        const lo = Math.max(0, c - (dir < 0 ? ahead : behind));
        const hi = Math.min(chunks.length - 1, c + (dir > 0 ? ahead : behind));
        let queued = false;
        for (let k = 0; k <= ahead; k++) {
          for (const i of dir >= 0 ? [c + k, c - k] : [c - k, c + k]) {
            if (i < lo || i > hi || frames.has(i) || inflight.has(i)) continue;
            if (inflight.size >= 12) break;
            inflight.add(i);
            dec.decode(new EncodedVideoChunk({ type: "key", timestamp: i * 1000, data: chunks[i] }));
            queued = true;
          }
        }
        if (queued) flush();
      },
      close() {
        closed = true;
        for (const fr of frames.values()) fr.close();
        frames.clear();
        try {
          if (dec.state !== "closed") dec.close();
        } catch {
          /* already closed */
        }
      },
    };
  } catch {
    return null;
  }
}

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

export default function HeroVideo({
  src,
  hd,
  sd,
  scrollLength = 2.5,
}: HeroVideoProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const breakRef = useRef<HTMLVideoElement>(null);
  const loopARef = useRef<HTMLVideoElement>(null);
  const loopBRef = useRef<HTMLVideoElement>(null);
  const fallbackRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"gl" | "fallback">("gl");

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const overlay = overlayRef.current;
    const canvas = canvasRef.current;
    if (!section || !stage || !overlay || !canvas) return;

    if (mode === "fallback") {
      stage.dataset.mode = "fallback";
      const fb = fallbackRef.current;
      if (fb) {
        fb.muted = true;
        fb.play().catch(() => {});
      }
      return;
    }
    const vT = breakRef.current;
    const vA = loopARef.current;
    const vB = loopBRef.current;
    if (!vT || !vA || !vB) return;
    const allVideos = [vA, vT, vB];
    for (const v of allVideos) {
      v.muted = true;
      v.defaultMuted = true;
    }

    const goFallback = () => {
      const id = requestAnimationFrame(() => setMode("fallback"));
      return () => cancelAnimationFrame(id);
    };
    const motionParam = new URLSearchParams(window.location.search).get("motion");
    if (motionParam === "flat") return goFallback();
    const calm = motionParam === "calm";
    const motionK = calm ? 0 : 1;

    /* ---------- Quality tier ---------- */
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean; effectiveType?: string };
    };
    const smallScreen = Math.min(window.innerWidth, window.innerHeight) < 700 || window.innerWidth < 900;
    const weakDevice = (nav.deviceMemory ?? 8) <= 4 || (nav.hardwareConcurrency ?? 8) <= 4;
    const slowNet = !!nav.connection?.saveData || /(^|-)(2g|3g)$/.test(nav.connection?.effectiveType ?? "");
    const lite = !!sd && (smallScreen || weakDevice || slowNet);
    const clips = lite && sd ? sd : hd;
    const GRID_X = lite ? 180 : 260;
    const GRID_Y = lite ? 102 : 146;
    const MAX_DPR = lite ? 1.0 : 1.5;

    const gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    });
    if (!gl) return goFallback();

    let geoProg, bgProg, meshProg, postProg;
    try {
      geoProg = makeProgram(gl, QUAD_VS, GEO_FS);
      bgProg = makeProgram(gl, BG_VS, BG_FS);
      meshProg = makeProgram(gl, MESH_VS, MESH_FS);
      postProg = makeProgram(gl, QUAD_VS, POST_FS);
    } catch (err) {
      console.error(err);
      return goFallback();
    }

    /* ---------- Band label texture ---------- */
    const LABEL_PX = 56;
    const labelTex = gl.createTexture();
    let labelW = 0;
    let labelH = 0;
    const abort = new AbortController();
    const drawTitle = () => {
      if (abort.signal.aborted) return;
      const family = getComputedStyle(stage).fontFamily || "sans-serif";
      const lc = document.createElement("canvas");
      const l = lc.getContext("2d")!;
      const setLabel = () => {
        l.font = `500 ${LABEL_PX}px ${family}`;
        (l as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${LABEL_PX * 0.14}px`;
      };
      setLabel();
      const lt = BAND.label.toUpperCase();
      const lm = l.measureText(lt);
      const lpad = Math.ceil(LABEL_PX * 0.2);
      lc.width = Math.ceil(lm.width) + lpad * 2;
      lc.height = Math.ceil(LABEL_PX * 1.4);
      setLabel();
      l.fillStyle = "#fff";
      l.textBaseline = "middle";
      l.fillText(lt, lpad, lc.height / 2);
      gl.bindTexture(gl.TEXTURE_2D, labelTex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, lc);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      labelW = lc.width;
      labelH = lc.height;
    };
    document.fonts.ready.then(drawTitle, drawTitle);

    /* ---------- Geometry ---------- */
    const quadVao = gl.createVertexArray();
    const quadBuf = gl.createBuffer();
    gl.bindVertexArray(quadVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const uvs = new Float32Array((GRID_X + 1) * (GRID_Y + 1) * 2);
    let idxCursor = 0;
    for (let y = 0; y <= GRID_Y; y++)
      for (let x = 0; x <= GRID_X; x++) {
        uvs[idxCursor++] = x / GRID_X;
        uvs[idxCursor++] = y / GRID_Y;
      }
    const idx = new Uint16Array(GRID_X * GRID_Y * 6);
    idxCursor = 0;
    for (let y = 0; y < GRID_Y; y++)
      for (let x = 0; x < GRID_X; x++) {
        const a = y * (GRID_X + 1) + x;
        const c = a + GRID_X + 1;
        idx[idxCursor++] = a; idx[idxCursor++] = a + 1; idx[idxCursor++] = c;
        idx[idxCursor++] = a + 1; idx[idxCursor++] = c + 1; idx[idxCursor++] = c;
      }
    const meshVao = gl.createVertexArray();
    const meshBuf = gl.createBuffer();
    const meshIdx = gl.createBuffer();
    gl.bindVertexArray(meshVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, meshBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, meshIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    gl.bindVertexArray(null);

    /* ---------- Textures & framebuffers ---------- */
    const setLinearClamp = () => {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    };
    const vidTexs = [gl.createTexture()!, gl.createTexture()!];
    gl.bindTexture(gl.TEXTURE_2D, vidTexs[1]);
    setLinearClamp();
    let curTex = 0;
    gl.bindTexture(gl.TEXTURE_2D, vidTexs[0]);
    setLinearClamp();

    const geoTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, geoTex);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, GRID_X + 1, GRID_Y + 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const geoFbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, geoFbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, geoTex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    let sceneTex = gl.createTexture();
    let covTex = gl.createTexture();
    const sceneDepth = gl.createRenderbuffer();
    const sceneFbo = gl.createFramebuffer();

    const MAX_TEX = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    let outW = 0, outH = 0, sceneW = 0, sceneH = 0;
    const resizeScene = (w: number, h: number) => {
      const rw = Math.min(MAX_TEX, Math.max(1, w));
      const rh = Math.min(MAX_TEX, Math.max(1, h));
      if (rw === sceneW && rh === sceneH) return;
      sceneW = rw;
      sceneH = rh;
      gl.deleteTexture(sceneTex);
      sceneTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, sceneTex);
      gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, rw, rh);
      setLinearClamp();
      gl.bindRenderbuffer(gl.RENDERBUFFER, sceneDepth);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, rw, rh);
      gl.deleteTexture(covTex);
      covTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, covTex);
      gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R8, rw, rh);
      setLinearClamp();
      gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sceneTex, 0);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, covTex, 0);
      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, sceneDepth);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };

    let secTop = 0, secH = 1, vh = window.innerHeight;
    let cssW = window.innerWidth, cssH = window.innerHeight;
    const measure = () => {
      cssW = canvas.clientWidth || window.innerWidth;
      cssH = canvas.clientHeight || window.innerHeight;
      const r = section.getBoundingClientRect();
      secTop = r.top + window.scrollY;
      secH = section.offsetHeight;
      vh = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const w = Math.max(1, Math.round(cssW * dpr));
      const h = Math.max(1, Math.round(cssH * dpr));
      if (w !== outW || h !== outH) {
        outW = canvas.width = w;
        outH = canvas.height = h;
        resizeScene(w, h);
      }
    };
    measure();
    const unsubResize = scrollBus.onResize(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(section);

    /* ---------- Pointer ---------- */
    let hasPointer = false;
    let mouseX = 0, mouseY = 0, msX = 0, msY = 0, mvX = 0, mvY = 0;
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      hasPointer = true;
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    stage.dataset.mode = "gl";

    /* ---------- Clips & WebCodecs pre-warm ---------- */
    const mid = (index: number) => (index + 0.5) / FPS;
    const indexAt = (time: number, length: number) =>
      clamp(Math.floor(time * FPS + 1e-4), 0, length - 1);
    const tBreak = (orig: number) => mid(clamp(Math.round(orig), BREAK_FIRST, BREAK_LAST) - BREAK_FIRST);
    const tInLoop = (loop: number[], orig: number) => {
      let best = 0;
      for (let k = 0; k < loop.length; k++) if (Math.abs(loop[k] - orig) < Math.abs(loop[best] - orig)) best = k;
      return mid(best);
    };

    let playBlocked = false;
    const play = (v: HTMLVideoElement) => {
      if (!v.getAttribute("src")) return;
      v.play().catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "NotAllowedError") playBlocked = true;
      });
    };
    if (typeof caches !== "undefined") {
      caches
        .keys()
        .then((keys) => keys.filter((k) => k.startsWith("tyode-hero-clips-") && k !== CLIP_CACHE).forEach((k) => caches.delete(k)))
        .catch(() => {});
    }
    const blobUrls: string[] = [];
    const attach = async (v: HTMLVideoElement, url: string, preferStream: boolean) => {
      if (preferStream && typeof caches !== "undefined") {
        const hit = await caches.open(CLIP_CACHE).then((c) => c.match(url)).catch(() => undefined);
        if (!hit) {
          v.preload = "auto";
          v.src = url;
          warmClip(url);
          return;
        }
      }
      const clip = await cachedClip(url, abort.signal);
      if (abort.signal.aborted) {
        if (clip.blob) URL.revokeObjectURL(clip.url);
        return;
      }
      if (clip.blob) blobUrls.push(clip.url);
      v.preload = "auto";
      v.src = clip.url;
    };

    attach(vA, clips.assembled, true).then(() => {
      if (!abort.signal.aborted) play(vA);
    });

    let stream: FrameStream | null = null;
    let streamState: "off" | "loading" | "ready" | "failed" = "off";
    let shownBreak = BREAK_FIRST;
    let restLoaded = false;
    const switchBreakToVideo = () => {
      streamState = "failed";
      attach(vT, clips.breakApart, false);
    };
    const loadRest = () => {
      if (restLoaded) return;
      restLoaded = true;
      attach(vB, clips.exploded, false);
      if (!clips.breakStream) {
        attach(vT, clips.breakApart, false);
        return;
      }
      streamState = "loading";
      openFrameStream(clips.breakStream, abort.signal, lite ? 36 : 64).then((st) => {
        if (abort.signal.aborted) return st?.close();
        if (st && st.count === BREAK_LAST - BREAK_FIRST + 1) {
          stream = st;
          streamState = "ready";
          // Immediately warm opening ramp so first scroll is 0ms instant
          st.want(38 - BREAK_FIRST, 2);
        } else {
          st?.close();
          switchBreakToVideo();
        }
      });
    };
    vA.addEventListener("loadeddata", loadRest, { once: true });
    const restTimer = window.setTimeout(loadRest, 250);

    const fresh = new Map<HTMLVideoElement, boolean>([[vA, true], [vB, true], [vT, true]]);
    const rvfc: { v: HTMLVideoElement; id: number }[] = [];
    if ("requestVideoFrameCallback" in HTMLVideoElement.prototype) {
      for (const v of allVideos) {
        const entry = { v, id: 0 };
        const cb = () => {
          fresh.set(v, true);
          entry.id = v.requestVideoFrameCallback(cb);
        };
        entry.id = v.requestVideoFrameCallback(cb);
        rvfc.push(entry);
      }
    }
    let uploadedFrom: HTMLVideoElement | null = null;
    let uploadedIndex = -1;
    let texW = 0, texH = 0;

    /* ---------- Render loop ---------- */
    let raf = 0;
    let running = false;
    let last = performance.now();
    const start = last;
    let vel = 0;
    let prog = 0;
    let exitS = 0;
    type Clip = "A" | "B" | "T";
    let shown: Clip = "A";
    let pendingTo: Clip | null = null;
    let pendingTime = 0;
    let pendingFrame = 0;

    // Cinema-weighted scrub state (silky inertia synced to scrollBus)
    let eS = 0;
    let anchorLo = 44;
    let anchorHi = 109;
    let stillFor = 0;
    let settleOffset = 0;
    let settleTarget = 0;
    let settlePlanned = false;
    let idleSide = 0;
    let idleMix = 0;
    let idlePhase = 0;
    let holdMix = 0;
    let holdPhase = 0;
    let manualTime = 0;
    let hasFrame = false;
    let firstFrameAt = 0;
    let wasVisible = true;
    let cssP = "", cssX = "", cssY = "";
    let captionOn = false;

    let frameAt = 0;
    let frameGap = 1000 / FPS;
    let measuredGap = 1000 / FPS;
    let fPrev = -1;
    let fVel = 0;
    let fNow = 44;
    const texF = [-1, -1];
    let newestTex = 0;
    let lastGeoTex: WebGLTexture | null = null;
    let lastGeoFrame = -1;

    const proj = new Float32Array(16);
    const view = new Float32Array(16);
    const vp = new Float32Array(16);
    const fov = (32 * Math.PI) / 180;
    const fgLo = 0.14;
    const fgHi = 0.3;
    let halfTexel = 0.5 / 1620;

    const setSample = (pr: ReturnType<typeof makeProgram>) => {
      gl.uniform1i(pr.u("uVid"), 0);
      gl.uniform1f(pr.u("uHalfTexel"), halfTexel);
      gl.uniform1f(pr.u("uFgLo"), fgLo);
      gl.uniform1f(pr.u("uFgHi"), fgHi);
    };
    const clipVideo = (c: Clip) => (c === "A" ? vA : c === "B" ? vB : vT);
    const curBreak = () =>
      streamState === "ready" && stream ? shownBreak : BREAK_FIRST + indexAt(vT.currentTime, BREAK_LAST - BREAK_FIRST + 1);

    const isNearViewport = (y: number) => y + vh > secTop - 150 && y < secTop + secH + 150;

    const stopLoop = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const startLoop = () => {
      if (running || document.hidden) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const onVisibility = () => {
      if (document.hidden) {
        for (const v of allVideos) v.pause();
        stopLoop();
      } else if (isNearViewport(scrollBus.getState().y)) {
        startLoop();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const unsubScroll = scrollBus.subscribe((bus) => {
      if (!running && isNearViewport(bus.y)) {
        startLoop();
      }
    });

    const frame = (now: number) => {
      if (!running) return;
      const bus = scrollBus.getState();
      const scrollY = bus.y;

      if (!isNearViewport(scrollY)) {
        if (wasVisible) for (const v of allVideos) v.pause();
        wasVisible = false;
        stopLoop();
        return;
      }
      wasVisible = true;
      raf = requestAnimationFrame(frame);

      const rawMs = now - last;
      const dt = Math.min(rawMs / 1000, 0.05);
      last = now;
      const t = (now - start) / 1000;

      if (stream && stream.failed()) {
        stream.close();
        stream = null;
        switchBreakToVideo();
      }
      const useStream = streamState === "ready" && stream !== null;
      const streamFirst = streamState === "loading" || useStream;

      // Wide, cinema-weighted scrub curve synced smoothly to scrollBus.y
      const breakPx = Math.max(secH - vh * (1 + EXIT.span), 1);
      const target = clamp((scrollY - secTop) / breakPx, 0, 1);
      const exitTarget = clamp((scrollY - secTop - breakPx + EXIT.lead * vh) / ((EXIT.span + EXIT.lead) * vh), 0, 1);

      exitS += (exitTarget - exitS) * (1 - Math.exp(-dt * 10));
      const exitE = 1 - Math.pow(1 - smooth(0, 1, exitS), 2);

      prog += (target - prog) * (1 - Math.exp(-dt * 8.5));

      const normVel = clamp(bus.velocity / Math.max(vh * 1.8, 1), -2.5, 2.5);
      vel += (normVel - vel) * (1 - Math.exp(-dt * 5.5));
      const velFx = Math.tanh(vel * 0.85) * 0.9 * motionK;

      if (!hasPointer) {
        mouseX = Math.sin(t * 0.31) * 0.55 * motionK;
        mouseY = Math.cos(t * 0.23) * 0.35 * motionK;
      }
      mvX += ((mouseX - msX) * 20 - mvX * 7.2) * dt;
      mvY += ((mouseY - msY) * 20 - mvY * 7.2) * dt;
      msX += mvX * dt;
      msY += mvY * dt;

      // Spread explosion across 88% of Hero track & glide with silky mechanical weight
      const eTarget = smooth(0, 0.88, target);
      eS += (eTarget - eS) * (1 - Math.exp(-dt * 7.5));
      if (Math.abs(eTarget - eS) < 0.00025) eS = eTarget;

      const scrollActive = Math.abs(bus.velocity) > 4 || Math.abs(eTarget - eS) > 0.0015;
      stillFor = scrollActive ? 0 : stillFor + dt;

      if (shown === "A" || shown === "B") {
        fPrev = -1;
        const v = shown === "A" ? vA : vB;
        const loop = shown === "A" ? LOOP_A : LOOP_B;
        const leaving = shown === "A" ? eTarget > 0.0015 || eS > 0.0015 : eTarget < 0.9985 || eS < 0.9985;
        if (leaving && !pendingTo) {
          const f = loop[indexAt(v.currentTime, loop.length)];
          anchorLo = shown === "A" ? clamp(f, 25, 52) : 52;
          anchorHi = shown === "B" ? clamp(f, 109, 124) : 109;
          loadRest();
          settleOffset = settleTarget = 0;
          settlePlanned = false;
          // Preserve current video texture in newestTex so the first frame of T crossfades smoothly
          texF[newestTex] = f;
          texF[1 - newestTex] = -1;
          fPrev = f;
          fNow = f;
          fVel = 0;
          pendingTo = "T";
          pendingTime = tBreak(f);
          pendingFrame = f;
          if (streamFirst) stream?.want(f - BREAK_FIRST, 1);
          else vT.currentTime = pendingTime;
        } else if (!leaving && !pendingTo && useStream) {
          // Hand off seamlessly to direct-decode stream as soon as the current frame is decoded
          const f = loop[indexAt(v.currentTime, loop.length)];
          stream!.want(f - BREAK_FIRST, 0);
          if (stream!.get(f - BREAK_FIRST)) {
            anchorLo = shown === "A" ? clamp(f, 25, 52) : 52;
            anchorHi = shown === "B" ? clamp(f, 109, 124) : 109;
            texF[newestTex] = f;
            texF[1 - newestTex] = -1;
            fPrev = f;
            fNow = f;
            fVel = 0;
            pendingTo = "T";
            pendingTime = tBreak(f);
            pendingFrame = f;
          } else if (v.paused && !playBlocked) {
            play(v);
          }
        } else if (!leaving && !pendingTo) {
          if (playBlocked) {
            manualTime += dt;
            const want = mid(Math.floor(manualTime * FPS) % loop.length);
            if (!v.seeking && Math.abs(v.currentTime - want) > 0.5 / FPS) v.currentTime = want;
          } else if (v.paused) {
            play(v);
          }
        }
      } else {
        const base = anchorLo + (anchorHi - anchorLo) * eS;
        const midway = eTarget > 0.004 && eTarget < 0.996;
        const trulyIdle = stillFor > 0.45;

        // Gently settle onto nearest crisp frame only after glide has completely finished
        if (!trulyIdle || !midway) {
          settleTarget = 0;
          settlePlanned = false;
          settleOffset *= Math.exp(-dt * 8);
        } else if (!settlePlanned) {
          settlePlanned = true;
          const curF = Math.round(base);
          let bestOff = 0;
          if (SHARPNESS[clamp(curF - BREAK_FIRST, 0, SHARPNESS.length - 1)] < SHARP_ENOUGH) {
            for (let k = 1; k <= 4; k++) {
              const fUp = curF + k;
              const fDn = curF - k;
              if (fUp <= BREAK_LAST && SHARPNESS[fUp - BREAK_FIRST] >= SHARP_ENOUGH) { bestOff = k; break; }
              if (fDn >= BREAK_FIRST && SHARPNESS[fDn - BREAK_FIRST] >= SHARP_ENOUGH) { bestOff = -k; break; }
            }
          }
          settleTarget = bestOff;
        }
        settleOffset += (settleTarget - settleOffset) * (1 - Math.exp(-dt * 3.5));

        // Phase-continuous gentle idle sway at top/bottom (starts at exact current frame — zero snap!)
        let idleDelta = 0;
        if (useStream && trulyIdle && !midway && !calm) {
          const side = eTarget < 0.5 ? -1 : 1;
          const idle = side < 0 ? IDLE_ASSEMBLED : IDLE_EXPLODED;
          const midF = (idle.lo + idle.hi) * 0.5;
          const ampF = (idle.hi - idle.lo) * 0.5;
          if (idleSide !== side) {
            idleSide = side;
            idleMix = 0;
            const norm = clamp((midF - base) / Math.max(ampF, 1e-4), -1, 1);
            idlePhase = Math.acos(norm);
          }
          idleMix += (1 - idleMix) * (1 - Math.exp(-dt * 1.8));
          idlePhase += dt * ((Math.PI * 2) / idle.period) * motionK;
          const targetFrame = midF - ampF * Math.cos(idlePhase);
          idleDelta = (targetFrame - base) * idleMix;
        } else {
          idleMix *= Math.exp(-dt * 6);
          if (idleMix < 0.002) {
            idleMix = 0;
            idleSide = 0;
          }
        }

        const holdTarget = !calm && trulyIdle && midway ? 1 : 0;
        holdMix += (holdTarget - holdMix) * (1 - Math.exp(-dt * (holdTarget > holdMix ? HOVER_FADE_IN : 6)));
        if (holdMix > 0.001) holdPhase += dt * ((Math.PI * 2) / HOVER_PERIOD);

        const fWant = clamp(base + settleOffset + idleDelta, BREAK_FIRST, BREAK_LAST);
        if (fPrev >= 0) fVel += ((fWant - fPrev) / Math.max(dt, 1e-3) - fVel) * (1 - Math.exp(-dt * 8));
        fPrev = fWant;
        fNow = fWant;

        const lead = clamp(fVel * 0.025, -2, 2);
        const reqC = clamp(Math.round(fWant + lead), BREAK_FIRST, BREAK_LAST);
        const want = tBreak(reqC);
        if (useStream) {
          stream!.want(fWant - BREAK_FIRST, fVel);
        } else if (!vT.seeking && texF[0] !== reqC && texF[1] !== reqC && Math.abs(vT.currentTime - want) > 0.5 / FPS) {
          vT.currentTime = want;
        }

        if (scrollActive) {
          pendingTo = null;
        } else if (
          !useStream &&
          !pendingTo &&
          stillFor > 0.35 &&
          (eS < 0.003 || eS > 0.997) &&
          !vT.seeking &&
          Math.abs(curBreak() - fWant) <= 1
        ) {
          const toA = eS < 0.5;
          const v = toA ? vA : vB;
          pendingTime = tInLoop(toA ? LOOP_A : LOOP_B, curBreak());
          v.currentTime = pendingTime;
          manualTime = pendingTime;
          pendingTo = toA ? "A" : "B";
        }
      }

      if (pendingTo) {
        const v = clipVideo(pendingTo);
        let ready: boolean;
        if (pendingTo === "T" && streamFirst) {
          stream?.want(pendingFrame - BREAK_FIRST, 0);
          ready = !!stream?.get(pendingFrame - BREAK_FIRST);
        } else {
          ready = !v.seeking && v.readyState >= 2 && Math.abs(v.currentTime - pendingTime) < 0.6 / FPS;
        }
        if (ready) {
          const from = clipVideo(shown);
          if (pendingTo !== "T") texF[0] = texF[1] = -1;
          shown = pendingTo;
          pendingTo = null;
          if (from !== v) from.pause();
          if (shown !== "T") play(v);
        }
      }

      const video = clipVideo(shown);
      const frameIndex = Math.floor(video.currentTime * FPS + 1e-4);
      let newFrame = false;
      const fromStream = shown === "T" && useStream;

      if (fromStream && stream) {
        const rel = fNow - BREAK_FIRST;
        let a = stream.below(rel);
        let b = stream.above(rel);
        if (a < 0) a = b;
        if (b < 0) b = a;
        if (a >= 0) {
          const lo = a + BREAK_FIRST;
          const hi = b + BREAK_FIRST;
          const need = lo === hi ? [lo] : [lo, hi];
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
          for (const n of need) {
            if (texF[0] === n || texF[1] === n) continue;
            const other = need.find((m) => m !== n);
            const targetTex =
              other !== undefined && texF[0] === other ? 1
              : other !== undefined && texF[1] === other ? 0
              : Math.abs(texF[0] - fNow) > Math.abs(texF[1] - fNow) ? 0 : 1;
            const fr = stream.get(n - BREAK_FIRST)!;
            gl.bindTexture(gl.TEXTURE_2D, vidTexs[targetTex]);
            if (fr.displayWidth === texW && fr.displayHeight === texH) {
              gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, fr);
            } else {
              texW = fr.displayWidth;
              texH = fr.displayHeight;
              halfTexel = 0.5 / texH;
              gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fr);
            }
            texF[targetTex] = n;
            newestTex = curTex = targetTex;
            frameAt = now;
            newFrame = true;
            if (!hasFrame) {
              hasFrame = true;
              firstFrameAt = t;
              stage.dataset.ready = "true";
            }
          }
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
          if (lo === hi) newestTex = curTex = texF[0] === lo ? 0 : 1;
          else curTex = Math.abs(fNow - lo) <= Math.abs(hi - fNow) ? (texF[0] === lo ? 0 : 1) : texF[0] === hi ? 0 : 1;
          shownBreak = texF[curTex];
        }
      }

      if (
        !fromStream &&
        video.readyState >= 2 &&
        video.videoWidth > 0 &&
        (!hasFrame || video !== uploadedFrom || fresh.get(video) || frameIndex !== uploadedIndex)
      ) {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        if (video.videoWidth !== texW || video.videoHeight !== texH) {
          texW = video.videoWidth;
          texH = video.videoHeight;
          halfTexel = 0.5 / texH;
          for (const tx of vidTexs) {
            gl.bindTexture(gl.TEXTURE_2D, tx);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
          }
        } else {
          let targetTex = 1 - newestTex;
          if (shown === "T") {
            const n = BREAK_FIRST + frameIndex;
            if (texF[0] === n) targetTex = 0;
            else if (texF[1] === n) targetTex = 1;
            else targetTex = 1 - newestTex;
            texF[targetTex] = n;
          }
          newestTex = targetTex;
          curTex = targetTex;
          gl.bindTexture(gl.TEXTURE_2D, vidTexs[targetTex]);
          gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, video);
          const gap = now - frameAt;
          if (gap > 4 && gap < 140) measuredGap += (gap - measuredGap) * 0.25;
          frameGap = clamp(measuredGap, 36, 75);
        }
        frameAt = now;
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        fresh.set(video, false);
        uploadedFrom = video;
        uploadedIndex = frameIndex;
        newFrame = true;
        if (!hasFrame) {
          hasFrame = true;
          firstFrameAt = t;
          stage.dataset.ready = "true";
        }
      }
      if (!hasFrame) return;

      const aspect = texW / (texH * 0.5);

      // ---- Smooth temporal frame blending (no hard cuts even on brisk scrubs or video-seek fallback) ----
      let blendFrom = 1 - newestTex;
      let blendTo = newestTex;
      let blendMix = smooth(0, 1, clamp((now - frameAt) / frameGap, 0, 1));
      if (shown === "T" && texF[0] >= 0 && texF[1] >= 0) {
        const loIdx = texF[0] <= texF[1] ? 0 : 1;
        const hiIdx = 1 - loIdx;
        const span = texF[hiIdx] - texF[loIdx];
        if (fromStream && span > 0 && span <= 12 && fNow >= texF[loIdx] - 0.5 && fNow <= texF[hiIdx] + 0.5) {
          blendFrom = loIdx;
          blendTo = hiIdx;
          blendMix = clamp((fNow - texF[loIdx]) / span, 0, 1);
        } else if (span > 0) {
          // Video-seek fallback or rapid jump: smoothly dissolve into newestTex over frameGap
          blendFrom = 1 - newestTex;
          blendTo = newestTex;
          blendMix = smooth(0, 1, clamp((now - frameAt) / Math.max(frameGap, 50), 0, 1));
        } else {
          blendTo = newestTex;
          blendFrom = 1 - newestTex;
          blendMix = 1;
        }
      }

      // ---- Scroll choreography ----
      const intro = 1 - smooth(0, 2.4, t - firstFrameAt);
      const introE = intro * intro;
      const sep = (eS * 0.18 + holdMix * 0.03 * (0.5 + 0.5 * Math.sin(t * 0.5))) * (1 - introE);
      const depthAmt = (DEPTH + Math.abs(velFx) * 0.022) * (1 - introE);

      const driftX = (Math.sin(t * 0.13) * 0.6 + Math.sin(t * 0.071 + 1.3) * 0.4) * motionK;
      const driftY = (Math.sin(t * 0.097 + 0.4) * 0.6 + Math.sin(t * 0.053) * 0.4) * motionK;
      const arc = smooth(0, 1, prog);
      const push = smooth(0.15, 0.85, prog);
      const lean = velFx;
      const sa = sceneW / sceneH;
      let dist = (0.5 / Math.tan(fov / 2)) * Math.min(1, aspect / sa) * 1.14;
      dist *= (1 - push * 0.05) * (1 - introE * 0.05);
      const yaw = -0.06 + arc * 0.22 + msX * 0.13 + driftX * 0.025 + holdMix * 0.04 * Math.sin(t * 0.22);
      const pitch =
        0.03 - smooth(0.1, 0.9, prog) * 0.09 + msY * 0.085 + driftY * 0.018 + lean * 0.01 + holdMix * 0.018 * Math.sin(t * 0.29);
      const roll = -arc * 0.035 + msX * 0.012 + lean * 0.005;
      const tx = -smooth(0.3, 1, prog) * 0.04;
      const tz = 0.08;
      perspectiveInto(proj, fov, sa, 0.02, 20);
      lookAtInto(
        view,
        tx + dist * Math.sin(yaw) * Math.cos(pitch),
        dist * Math.sin(pitch),
        tz + dist * Math.cos(yaw) * Math.cos(pitch),
        tx, 0, tz,
        Math.sin(roll), Math.cos(roll), 0
      );
      multiplyInto(vp, proj, view);

      // Pass 1: bake mesh geometry synced to dominant frame
      const geoTargetIdx = blendMix >= 0.5 ? blendTo : blendFrom;
      const geoTargetTex = vidTexs[geoTargetIdx];
      const geoTargetFrame = texF[geoTargetIdx];
      if (newFrame || lastGeoTex !== geoTargetTex || lastGeoFrame !== geoTargetFrame) {
        lastGeoTex = geoTargetTex;
        lastGeoFrame = geoTargetFrame;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, geoTargetTex);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);
        gl.bindVertexArray(quadVao);
        gl.bindFramebuffer(gl.FRAMEBUFFER, geoFbo);
        gl.viewport(0, 0, GRID_X + 1, GRID_Y + 1);
        gl.useProgram(geoProg.p);
        setSample(geoProg);
        gl.uniform2f(geoProg.u("uGrid"), GRID_X, GRID_Y);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, geoTex);
      gl.activeTexture(gl.TEXTURE0);

      // Pass 2: 3D scene
      gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFbo);
      gl.viewport(0, 0, sceneW, sceneH);
      gl.clearBufferfv(gl.COLOR, 0, [BACKDROP.color[0], BACKDROP.color[1], BACKDROP.color[2], 1]);
      gl.clearBufferfv(gl.COLOR, 1, [0, 0, 0, 0]);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.disable(gl.BLEND);

      const bgZ = -0.55 - sep;
      gl.useProgram(bgProg.p);
      gl.uniform3f(bgProg.u("uBackdrop"), BACKDROP.color[0], BACKDROP.color[1], BACKDROP.color[2]);
      gl.uniform3f(bgProg.u("uLight"), BACKDROP.floor, BACKDROP.pool, BACKDROP.falloff);
      gl.uniformMatrix4fv(bgProg.u("uVP"), false, vp);
      gl.uniform1f(bgProg.u("uAspect"), aspect);
      gl.uniform1f(bgProg.u("uScale"), 3.2);
      gl.uniform1f(bgProg.u("uZ"), bgZ);
      gl.uniform1f(bgProg.u("uK"), dist / (dist - bgZ));
      gl.bindVertexArray(quadVao);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(meshProg.p);
      setSample(meshProg);
      gl.uniformMatrix4fv(meshProg.u("uVP"), false, vp);
      gl.uniform1f(meshProg.u("uAspect"), aspect);
      gl.uniform1f(meshProg.u("uDepth"), depthAmt);
      gl.uniform1f(meshProg.u("uSep"), sep);
      gl.uniform1f(meshProg.u("uVel"), velFx);
      gl.uniform1f(meshProg.u("uTime"), t);
      gl.uniform1i(meshProg.u("uGeo"), 3);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, vidTexs[blendTo]);
      gl.activeTexture(gl.TEXTURE4);
      gl.bindTexture(gl.TEXTURE_2D, vidTexs[blendFrom]);
      gl.activeTexture(gl.TEXTURE0);
      gl.uniform1i(meshProg.u("uPrev"), 4);
      gl.uniform1f(meshProg.u("uMix"), blendMix);
      gl.uniform1i(meshProg.u("uCols"), GRID_X + 1);
      gl.uniform1f(meshProg.u("uApart"), smooth(0.15, 0.7, eS));
      {
        const imgPx = sceneH / (2 * dist * Math.tan(fov / 2));
        gl.uniform1f(meshProg.u("uUvArea"), 1 / (aspect * imgPx * imgPx));
      }
      gl.bindVertexArray(meshVao);
      gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);

      // Pass 3: post-process to screen
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, outW, outH);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      gl.useProgram(postProg.p);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, sceneTex);
      gl.uniform1i(postProg.u("uScene"), 2);
      gl.uniform2f(postProg.u("uRes"), outW, outH);
      gl.uniform1f(postProg.u("uVel"), velFx);
      const magnify = clamp(outH / Math.max(texH * 0.5, 1) - 1, 0, 1);
      gl.uniform1f(postProg.u("uSharp"), clamp(0.35 + magnify * 0.4, 0, 1));
      {
        const fontPx = clamp(cssW * SCALE.share, SCALE.min, SCALE.max);
        const gutter = clamp(cssW * 0.04, 20, 56);
        const tA = clamp(1 - prog * 1.8, 0, 1) * smooth(0.1, 1.2, t - firstFrameAt);
        const kk = outW / cssW;
        const fsz = fontPx * (1 - prog * 0.12);
        const base = cssH - gutter * 1.15 - prog * 0.18 * cssH - fsz * BAND.lift + msY * 14 * BAND.parallax;
        const yTop = base - fsz * BAND.top;
        const yBot = base - fsz * BAND.bottom;
        gl.uniform4f(postProg.u("uBand"), (cssH - yBot) * kk, (cssH - yTop) * kk, -roll * 0.9, BAND.opacity * tA);
        gl.uniform1f(postProg.u("uBandX"), cssW * 0.5 * kk);
        const ls = BAND.labelSize / LABEL_PX;
        const lx0 = cssW * BAND.labelX;
        const lFits = lx0 + labelW * ls < cssW - 12;
        gl.uniform3f(postProg.u("uLabelBox"), lx0 * kk, (lx0 + (lFits ? labelW * ls : 0)) * kk, labelH * ls * kk);
        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, labelTex);
        gl.uniform1i(postProg.u("uLabel"), 4);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, covTex);
        gl.uniform1i(postProg.u("uCov"), 3);
        gl.activeTexture(gl.TEXTURE2);
        gl.uniform1f(postProg.u("uTAlpha"), tA);
        gl.uniform3f(postProg.u("uInk"), 0.047, 0.047, 0.051);
      }
      {
        const k = outW / cssW;
        gl.uniform1f(postProg.u("uExit"), exitE);
        gl.uniform4f(postProg.u("uCard"), -100 * k, cssH * EXIT.rise * exitE * k, (cssW + 100) * k, (cssH + 100) * k);
        gl.uniform1f(postProg.u("uCardR"), 0);
        gl.uniform1f(postProg.u("uMelt"), cssH * EXIT.melt * k);
        gl.uniform1f(postProg.u("uShade"), 34 * k);
        gl.uniform3f(postProg.u("uPage"), EXIT.page[0], EXIT.page[1], EXIT.page[2]);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, covTex);
        gl.uniform1i(postProg.u("uCov"), 3);
        gl.activeTexture(gl.TEXTURE2);
      }
      gl.bindVertexArray(quadVao);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.bindVertexArray(null);
      gl.activeTexture(gl.TEXTURE0);

      const p3 = prog.toFixed(3);
      const x3 = msX.toFixed(3);
      const y3 = msY.toFixed(3);
      if (p3 !== cssP) overlay.style.setProperty("--p", (cssP = p3));
      if (x3 !== cssX) overlay.style.setProperty("--mx", (cssX = x3));
      if (y3 !== cssY) overlay.style.setProperty("--my", (cssY = y3));
      const capOn = prog > 0.4 && prog < 0.99;
      if (capOn !== captionOn) {
        captionOn = capOn;
        if (capOn) overlay.dataset.caption = "";
        else delete overlay.dataset.caption;
      }
    };

    if (isNearViewport(scrollBus.getState().y)) {
      startLoop();
    }

    return () => {
      stopLoop();
      unsubScroll();
      unsubResize();
      abort.abort();
      stream?.close();
      window.clearTimeout(restTimer);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
      vA.removeEventListener("loadeddata", loadRest);
      ro.disconnect();
      for (const v of allVideos) {
        v.pause();
        v.removeAttribute("src");
        v.load();
      }
      for (const u of blobUrls) URL.revokeObjectURL(u);
      for (const { v, id } of rvfc) v.cancelVideoFrameCallback(id);
      [...vidTexs, sceneTex, covTex].forEach((tx) => gl.deleteTexture(tx));
      [quadBuf, meshBuf, meshIdx].forEach((b) => gl.deleteBuffer(b));
      [quadVao, meshVao].forEach((v) => gl.deleteVertexArray(v));
      [geoFbo, sceneFbo].forEach((f) => gl.deleteFramebuffer(f));
      gl.deleteTexture(geoTex);
      gl.deleteRenderbuffer(sceneDepth);
      [geoProg, bgProg, meshProg, postProg].forEach((pr) => gl.deleteProgram(pr.p));
      gl.deleteTexture(labelTex);
      delete stage.dataset.ready;
    };
  }, [mode, hd, sd]);

  return (
    <section
      id="top"
      ref={sectionRef}
      className={styles.hero}
      style={{ height: `${(scrollLength + (mode === "gl" ? EXIT.span : 0)) * 100}vh` }}
    >
      <div ref={stageRef} className={styles.stage}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={styles.poster}
          src={hd.poster}
          srcSet={sd ? `${sd.poster} 1280w, ${hd.poster} 1920w` : undefined}
          sizes="100vw"
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          decoding="async"
        />
        {mode === "gl" ? (
          <>
            <video ref={loopARef} className={styles.videoPacked} muted loop playsInline preload="none" aria-hidden="true" />
            <video ref={breakRef} className={styles.videoPacked} muted playsInline preload="none" aria-hidden="true" />
            <video ref={loopBRef} className={styles.videoPacked} muted loop playsInline preload="none" aria-hidden="true" />
          </>
        ) : (
          <video ref={fallbackRef} className={styles.video} src={src}
            muted loop playsInline autoPlay preload="auto" aria-hidden="true" />
        )}
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />

        <div ref={overlayRef} className={styles.overlay}>
          <div className={styles.topRow}>
            <span className={styles.pill}>Trace · Check · Explain</span>
          </div>

          <div className={styles.sub}>
            <h1 className={styles.lead}>
              <span className={styles.line}>
                <span>One passport.</span>
              </span>
              <span className={styles.line}>
                <span>Every solid tyre.</span>
              </span>
            </h1>
            <p className={styles.body}>
              A digital passport that follows each solid tyre from compound batch to export
              container, keeps its quality results and helps explain why a tyre failed, all
              without interrupting production.
            </p>
            <div className={styles.layers} aria-hidden="true">
              <span className={styles.rule}>
                <span className={styles.marker} />
              </span>
              <ol className={styles.names}>
                {LAYERS.map((name, i) => (
                  <li key={name} style={{ "--i": i / (LAYERS.length - 1) } as CSSProperties}>
                    {name}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <p className={styles.caption}>
            Every tyre traced.
            <br />
            Every fault explained.
          </p>
        </div>
      </div>
    </section>
  );
}