"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
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

/**
 * Frame layout of the three clips, as frame numbers of the ORIGINAL video (24 fps):
 *   breakApart     24 → 124            assembled → robots pull the tyre apart → exploded
 *   loopAssembled  25 → 52 → 26        forward then reversed, loops natively without a seam
 *   loopExploded  109 → 124 → 110      same for the exploded state
 * Re-pack the videos if you change these.
 */
const FPS = 24;
const BREAK_FIRST = 24;
const BREAK_LAST = 124;
const range = (a: number, b: number) =>
  a <= b ? Array.from({ length: b - a + 1 }, (_, i) => a + i) : Array.from({ length: a - b + 1 }, (_, i) => a - i);
/**
 * How sharp each frame of the break-apart clip is (original frames 24..124, 1 = crispest
 * nearby). Frames ~79-95 are motion-blurred where the parts fly apart fastest. When you stop
 * scrolling mid-way, the video glides on slowly to the nearest crisp frame instead of
 * freezing on a blurred one. Re-measure if the video changes.
 */
const SHARPNESS = [0.89, 0.90, 0.90, 0.90, 0.89, 0.89, 1.00, 1.00, 1.00, 1.00, 0.94, 0.94, 0.86, 0.82, 0.82, 0.84, 0.85, 0.85, 0.85, 0.85, 0.85, 0.87, 0.88, 0.89, 0.97, 1.00, 0.97, 0.94, 0.93, 0.92, 0.90, 0.90, 0.92, 0.92, 0.93, 0.93, 0.98, 0.97, 1.00, 0.99, 0.99, 1.00, 0.98, 0.97, 0.98, 0.97, 0.94, 0.92, 0.92, 0.93, 0.92, 0.88, 0.92, 0.92, 0.92, 0.83, 0.78, 0.80, 0.82, 0.78, 0.75, 0.71, 0.73, 0.74, 0.74, 0.74, 0.81, 0.75, 0.74, 0.72, 0.74, 0.76, 0.83, 0.85, 0.87, 0.86, 0.88, 0.87, 0.90, 0.91, 0.94, 0.91, 0.91, 0.92, 0.91, 0.91, 0.91, 0.91, 0.91, 0.92, 0.92, 0.92, 0.92, 0.92, 0.93, 0.94, 1.00, 0.98, 0.98, 0.98, 0.97];
const SHARP_ENOUGH = 0.9;

/** How much further one mouse-wheel notch moves the hero than normal scrolling would. */
const WHEEL_BOOST = 2;

/**
 * Idle motion (tweak to taste). With direct decoding, the idle loops at either end are slow,
 * eased sways through these frames instead of the 24 fps clips. Seconds per full back-and-forth.
 */
const IDLE_ASSEMBLED = { lo: 25, hi: 52, period: 9 };
const IDLE_EXPLODED = { lo: 109, hi: 124, period: 8 };
/** Hover when you stop part-way: seconds per sway, and how slowly it fades in (lower = slower) */
const HOVER_PERIOD = 8;
const HOVER_FADE_IN = 1.6;
/**
 * The studio backdrop behind the machine: one colour (#d1d1d1 as 0..1 RGB), lit like a
 * real backdrop. floor = how much lighter it gets towards the bottom, pool = the soft light in
 * the middle, falloff = how much it darkens towards the edges.
 */
const BACKDROP = { color: [0.82, 0.82, 0.824], floor: 0.045, pool: 0.03, falloff: 0.05 };
/** How strongly the depth pushes parts toward the camera (more = more 3D, more edge stretch) */
const DEPTH = 0.36;
/** The tyre's journey on its passport, named along the rule under the band (left to right) */
const LAYERS = ["Batch", "Build", "Cure", "Check", "Ship", "Claim"];
/** The band and the hero text are sized from this (css px): a share of the screen width, clamped */
const SCALE = { share: 0.19, min: 80, max: 288 };
/**
 * White band low across the full width of the hero. It sits in the scene between the backdrop
 * and the machine: the tyre and arms pass in front of it. It moves a little with the mouse and
 * tilts with the camera, so it reads as its own layer in depth. Sizes are shares of SCALE:
 * top/bottom = its edges above a reference line that sits `lift` above the bottom margin.
 */
const BAND = {
  top: 0.56,
  bottom: 0.14,
  lift: 0.2, // where its reference line sits above the bottom margin (share of the font size)
  opacity: 1,
  parallax: 0.35,
  // fine print printed inside the band (behind the machine, like the band itself)
  label: "Trace · Check · Explain",
  labelSize: 12.5, // css px
  labelX: 0.635, // where it starts, share of the screen width
};
/**
 * Leaving the hero: once the tyre is apart, scrolling on lifts the backdrop's bottom edge
 * like a blind, uncovering the page underneath, while the machine stays exactly where it is
 * and hangs over the edge (with a soft shadow on the page). Then the next section scrolls in.
 * span = extra scroll for this, in screens; rise = how far up the edge goes (share of the
 * screen); melt = bottom strip where the machine fades into the page (share of the screen),
 * so the bottom of the hero never shows as a hard line when it scrolls away.
 */
const EXIT = { span: 0.75, lead: 0.2, rise: 0.2, melt: 0.12, page: [0.925, 0.925, 0.929] };
const LOOP_A = [...range(25, 52), ...range(51, 26)];
const LOOP_B = [...range(109, 124), ...range(123, 110)];

/* ================================================================== */
/*  Shaders                                                            */
/* ================================================================== */

// Shared helpers. Each packed frame is stacked top to bottom as
//   colour (top half) | depth (next quarter) | alpha mask (bottom quarter)
// and the texture is flipped on upload, so in texture space v=1 is the top.
const SAMPLE = /* glsl */ `
uniform sampler2D uVid;
uniform float uHalfTexel; // half a texel vertically, keeps the parts from bleeding into each other
uniform float uFgLo;
uniform float uFgHi;

vec3 colorOf(sampler2D s, vec2 uv) {
  float v = clamp(mix(0.5, 1.0, uv.y), 0.5 + uHalfTexel * 2.0, 1.0);
  return textureLod(s, vec2(uv.x, v), 0.0).rgb;
}
float depthOf(sampler2D s, vec2 uv) { // 1 = near, 0 = far
  float v = clamp(mix(0.25, 0.5, clamp(uv.y, 0.0, 1.0)), 0.25 + uHalfTexel * 2.0, 0.5 - uHalfTexel * 2.0);
  return textureLod(s, vec2(clamp(uv.x, 0.0, 1.0), v), 0.0).r;
}
float alphaOf(sampler2D s, vec2 uv) { // 1 = machine, 0 = background (the precise AI matte)
  float v = clamp(mix(0.0, 0.25, clamp(uv.y, 0.0, 1.0)), uHalfTexel * 2.0, 0.25 - uHalfTexel * 2.0);
  return smoothstep(0.06, 0.94, textureLod(s, vec2(clamp(uv.x, 0.0, 1.0), v), 0.0).r);
}
// Smooth (bicubic B-spline, 4 taps) version of the mask, for the visible outline: the mask
// is stored at half height, and plain bilinear scaling turns its edges into little stairs
// when the video is magnified on big screens.
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
  // Away from the outline (most of the picture) the plain sample is all we need
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

/* ---------- Fullscreen quad (used by the geometry and post passes) ---------- */
const QUAD_VS = /* glsl */ `#version 300 es
layout(location = 0) in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

/* ---------- Pass 2a: background plane far behind the machine ---------- */
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
uniform vec3 uBackdrop;  // the backdrop's colour
uniform vec3 uLight;     // floor glow (lighter towards the bottom), centre glow, edge falloff
in vec2 vUv;
layout(location = 0) out vec4 o;
layout(location = 1) out vec4 oCov; // machine coverage (none here)

// A plain studio backdrop in one colour, lit like a real one: a little brighter where the
// light pools in the middle and towards the floor, falling off softly towards the edges.
// It's a plane far behind the machine, so it shifts slightly with the camera, as a real wall.
void main() {
  vec2 uv = vUv;
  float floorGlow = uLight.x * smoothstep(0.75, -0.1, uv.y);
  vec2 c = (uv - vec2(0.52, 0.42)) * vec2(1.25, 1.0);
  float pool = uLight.y * exp(-dot(c, c) * 2.2);
  float falloff = uLight.z * smoothstep(0.35, 1.05, length((uv - 0.5) * vec2(1.1, 1.0)));
  o = vec4(uBackdrop * (1.0 + floorGlow + pool - falloff), 1.0);
  oCov = vec4(0.0);
}`;

/* ---------- Pass 2b: the 3D displaced video mesh ---------- */
// The geometry uses a slightly "fattened" depth (max of neighbours), so the machine's
// 3D surface extends a little past its real outline. The exact outline is then cut
// per pixel in the fragment shader from the full-resolution depth map. Result: crisp,
// pixel-accurate edges instead of the grid's sawtooth.
// Geometry pre-pass: runs only when the video shows a new frame (24x a second). For every
// mesh vertex it bakes the "fattened" depth (max of neighbours, so parts keep their full
// outline) and how much it belongs to the machine into one small texture. The mesh then
// reads a single texel per vertex instead of fourteen, on every screen refresh.
const GEO_FS = /* glsl */ `#version 300 es
precision highp float;
${SAMPLE}
uniform vec2 uGrid;   // grid size in cells (vertices = cells + 1)
out vec4 o;
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5) / uGrid;
  vec2 cell = 1.0 / uGrid;
  // Max over three rings (0.7, 1.35 and 2 grid cells), so every edge pixel of the machine
  // lands on its own flat surface, never on a slanted triangle (that's what made a sawtooth)
  float d0 = depthAt(uv); // the real depth here (not fattened)
  float a0 = alphaAt(uv);
  float dm = d0;    // max over all rings
  float am = a0;
  for (int k = 0; k < 28; k++) {
    float r = k < 8 ? 0.7 : (k < 16 ? 1.35 : 2.0);
    float a = k < 8 ? float(k) * 0.7854 : (k < 16 ? float(k - 8) * 0.7854 + 0.3927 : float(k - 16) * 0.5236);
    vec2 p = uv + vec2(cos(a), sin(a)) * r * cell;
    float d = depthAt(p);
    dm = max(dm, d);
    am = max(am, alphaAt(p));
  }
  // Every point takes the full height of its surroundings (so outlines always sit on a flat
  // surface; anything less made the edges zig-zag into a sawtooth).
  // Saturated, so a part with a less confident mask (pale arm on a pale backdrop) still moves
  // as one solid piece instead of zig-zagging along its edge
  float fg = smoothstep(0.2, 0.6, max(am, fgAt(dm) * 0.5));
  o = vec4(dm, fg, d0, 1.0);
}`;

const MESH_VS = /* glsl */ `#version 300 es
precision highp float;
layout(location = 0) in vec2 aUv;
uniform sampler2D uGeo;  // baked by the geometry pre-pass
uniform int   uCols;     // vertices per grid row
uniform mat4  uVP;
uniform float uAspect;
uniform float uDepth;  // how far depth pushes things toward the camera
uniform float uSep;    // scroll-driven separation of machine vs background
uniform float uVel;
uniform float uTime;
out vec2  vUv;
out float vGeo;  // the (fattened) depth this bit of surface was built from
out float vD0;   // the real depth at the vertices, smoothly interpolated

void main() {
  vec2 uv = aUv;
  vec4 g = texelFetch(uGeo, ivec2(gl_VertexID % uCols, gl_VertexID / uCols), 0);
  float dm = g.r;
  float fg = g.g;
  float z = dm * uDepth + fg * uSep - (1.0 - fg) * uSep * 0.7;
  z += sin(uv.y * 16.0 + uv.x * 5.0 - uTime * 7.0) * uVel * 0.008 * (0.25 + fg);
  vUv = uv;
  vGeo = dm;
  vD0 = g.b;
  gl_Position = uVP * vec4((uv.x - 0.5) * uAspect, uv.y - 0.5, z, 1.0);
}`;

const MESH_FS = /* glsl */ `#version 300 es
precision highp float;
${SAMPLE}
uniform sampler2D uPrev;   // the previous video frame
uniform float uMix;        // 0..1 how far we are from the previous frame to the current one
uniform float uApart;      // 0..1 how far the parts have come apart
uniform float uProg;
uniform float uUvArea;     // video area one screen pixel covers when the surface faces the camera
in vec2  vUv;
in float vGeo;
in float vD0;
layout(location = 0) out vec4 o;
layout(location = 1) out vec4 oCov; // how much of this pixel is machine (premultiplied)

void main() {
  // Frame blending: ease from the previous video frame into the current one, so 24 fps
  // footage moves smoothly at the screen's refresh rate (colour, depth and mask together)
  vec3 col = mix(colorOf(uPrev, vUv), colorAt(vUv), uMix);

  // Per-pixel depth (full resolution)
  float dP = mix(depthOf(uPrev, vUv), depthAt(vUv), uMix);

  // Pixel-accurate cut-out from the AI matte packed into the video
  float mask = mix(alphaSmooth(uPrev, vUv), alphaSmooth(uVid, vUv), uMix);

  // Feather the video's own border so the frame edge never shows when the camera moves
  float edge = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
  float border = smoothstep(0.0, 0.07, edge);

  // Smeared strips ("spikes") between parts at different depths: there one screen pixel
  // covers far less of the video than normal. Measured from the geometry itself, so the
  // tread's own depth detail never gets cut.
  vec2 du = dFdx(vUv);
  vec2 dv = dFdy(vUv);
  float stretch = uUvArea / max(abs(du.x * dv.y - du.y * dv.x), 1e-12);
  // Only a real smear if the pixel also doesn't belong to this surface: on a sheet bridging
  // a depth jump, the pixel's own depth matches neither the slope in between. Genuinely
  // steep surfaces (an arm turning toward the camera) match it, so they're kept whole.
  float spike = smoothstep(2.0, 4.0, stretch) * smoothstep(0.05, 0.12, abs(dP - vD0));
  // A pixel that belongs well behind the surface it's drawn on (background around the
  // outline, or a far part right next to a near one)
  float behind = vGeo - dP;

  // Only the machine: the precise matte, minus far bits glued to near parts and spikes
  // (loose: rounded-off edges sit a little behind the surface and must stay). The video's own
  // backdrop (and the dust floating in it) is never drawn; the studio backdrop shows instead.
  // Soft, half-transparent mask fringe sitting on a stretched strip: that's the sawtooth
  // along pale edges (white arm on white backdrop). Solid machine pixels are never affected.
  float fringe = smoothstep(1.4, 2.2, stretch) * (1.0 - smoothstep(0.55, 0.9, mask));
  float apartA = mask * (1.0 - smoothstep(0.22, 0.4, behind)) * (1.0 - spike) * (1.0 - fringe);

  // At rest (parts together) the plain soft matte is cleanest: the geometric cuts above are
  // only needed once parts separate, and along the pale arms they'd leave a sawtooth edge.
  float alpha = mix(mask * (1.0 - spike), apartA, uApart) * border;
  if (alpha < 0.004) discard; // invisible: don't let it hide anything behind it
  o = vec4(col * alpha, alpha);
  // (ignores the fade at the video's border, so the band stays behind the machine there too)
  oCov = vec4(mask * clamp(alpha / max(border, 0.001), 0.0, 1.0), 0.0, 0.0, alpha);
}`;

/* ---------- Pass 3: to the screen ---------- */
// The 3D scene is rendered larger than the screen (supersampling). Here it's averaged
// down for anti-aliasing, lightly sharpened, and split into RGB only while scrolling
// fast. No colour grading: colours stay exactly as in the original video.
const POST_FS = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform vec2  uRes;    // output size in pixels
uniform float uVel;
uniform float uSharp;  // 0..1 sharpening strength
uniform float uTAlpha;
uniform sampler2D uCov;   // machine coverage
uniform vec4  uBand;      // band: bottom y, top y (device px, y up), slope, opacity
uniform sampler2D uLabel; // fine print inside the band (alpha)
uniform vec3  uLabelBox;  // label: left x, right x, height (device px)
uniform float uBandX;     // band tilt pivot x (device px)
uniform vec3  uInk;
uniform float uExit;      // 0..1 backdrop shrinking into a card
uniform vec4  uCard;      // card rect, device px (x0, y0, x1, y1, y up)
uniform float uCardR;     // corner radius, device px
uniform float uShade;     // shadow softness, device px
uniform vec3  uPage;      // page colour around the card
uniform float uMelt;      // height of the bottom strip where the machine fades out, device px
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

  // Contrast-adaptive sharpening (FidelityFX CAS style): strong on soft detail,
  // gentle on edges that are already crisp, so it adds clarity without halos.
  vec3 mn = min(c, min(min(a, b), min(d, e)));
  vec3 mx = max(c, max(max(a, b), max(d, e)));
  vec3 amp = sqrt(clamp(min(mn, 1.0 - mx) / max(mx, 1e-4), 0.0, 1.0));
  vec3 w = -amp / mix(8.0, 5.0, uSharp);
  vec3 col = (c + (a + b + d + e) * w) / (1.0 + 4.0 * w);

  // RGB split only while scrolling fast
  float split = smoothstep(0.35, 1.2, abs(uVel));
  if (split > 0.001) {
    vec2 dir = (vUv - 0.5) * abs(uVel) * 0.0016;
    col.r = mix(col.r, texture(uScene, vUv + dir).r, split);
    col.b = mix(col.b, texture(uScene, vUv - dir).b, split);
  }
  if (uTAlpha > 0.0) {
    float cov = texture(uCov, vUv).r;
    // White band: behind the machine (coverage), in front of the backdrop
    if (uBand.w > 0.0) {
      float y = gl_FragCoord.y - uBand.z * (gl_FragCoord.x - uBandX);
      float aa = 0.75;
      float band = smoothstep(uBand.x - aa, uBand.x + aa, y) * (1.0 - smoothstep(uBand.y - aa, uBand.y + aa, y));
      col = mix(col, vec3(1.0), band * (1.0 - cov) * uBand.w);
      // fine print, centred in the band, tilting with it, behind the machine like the band
      float bc = 0.5 * (uBand.x + uBand.y);
      vec2 lu = vec2((gl_FragCoord.x - uLabelBox.x) / (uLabelBox.y - uLabelBox.x), (y - (bc - 0.5 * uLabelBox.z)) / uLabelBox.z);
      if (lu.x > 0.0 && lu.x < 1.0 && lu.y > 0.0 && lu.y < 1.0) {
        col = mix(col, uInk, texture(uLabel, lu).a * band * (1.0 - cov) * uBand.w);
      }
    }
  }
  if (uExit > 0.001) {
    // The backdrop becomes a card; the machine (coverage) stays on top of everything
    vec2 px2 = 1.0 / uRes;
    float mc = texture(uCov, vUv).r;
    float cd = cardDist(gl_FragCoord.xy);
    float inCard = 1.0 - smoothstep(-0.75, 0.75, cd);
    // a fine light rim along the edge, like the edge of a sheet of paper
    col = mix(col, vec3(1.0), 0.35 * uExit * (1.0 - mc) * (1.0 - smoothstep(0.0, 1.6, abs(cd + 1.0))));
    if (inCard < 1.0) {
      vec3 page = uPage;
      // the card's own shadow, falling a little below it
      float sd = cardDist(gl_FragCoord.xy + vec2(0.0, uShade * 0.45));
      float sh = 1.0 - smoothstep(-uShade * 0.3, uShade * 2.2, sd);
      page *= 1.0 - 0.11 * uExit * sh * sh;
      // the machine's shadow on the page: soft, offset downwards
      float ms = 0.0;
      for (int i = 0; i < 16; i++) {
        float fi = float(i) + 0.5;
        float ang = fi * 2.39996;
        vec2 q = vUv + (vec2(0.0, uShade * 0.6) + vec2(cos(ang), sin(ang)) * sqrt(fi / 16.0) * uShade * 0.9) * px2;
        ms += texture(uCov, q).r;
      }
      // below the card everything melts into the page, so the bottom of the canvas never shows
      // as a hard line when the hero scrolls away
      float melt = mix(1.0, smoothstep(0.0, uMelt, gl_FragCoord.y), uExit);
      page = mix(uPage, page * (1.0 - 0.15 * uExit * ms / 16.0), melt);
      col = mix(page, col, max(inCard, mc * melt));
    }
  }
  // a whisper of grain: keeps the smooth backdrop from banding into steps
  float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  col += (n - 0.5) * (1.5 / 255.0);
  o = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

/* ================================================================== */
/*  Small WebGL + math helpers                                         */
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

/* Camera maths written into reusable buffers, so nothing is allocated per frame */
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
/*  Component                                                          */
/* ================================================================== */


/**
 * Clip cache. Each clip is kept in the browser's Cache Storage after the first visit, so
 * repeat visits load the full-quality clips straight from disk. Clips are then played from
 * memory (blob URLs): seeking never waits on the network, so scrubbing stays smooth.
 * Bump CLIP_CACHE when the videos change, so visitors get the new ones.
 */
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
        /* storage full or private mode: still play from memory this visit */
      }
    }
    const data = await res.blob();
    return { url: URL.createObjectURL(data), blob: true };
  } catch {
    return { url, blob: false }; // fall back to streaming from the server
  }
}

/** Starts caching a clip for next time without waiting for it. */
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

/**
 * Frame stream: decodes frames of the break-apart clip on demand with WebCodecs and keeps the
 * ones around the scroll position ready in memory. No video seeking, so no seek delay: the
 * frame you scroll to is usually decoded before you get there.
 */
type FrameStream = {
  count: number;
  /** decoded frame (clip index), if it's ready */
  get(i: number): VideoFrame | undefined;
  /** keep the frames around `center` decoded, more of them ahead in the direction of motion */
  want(center: number, vel: number): void;
  /** nearest ready frame at or below / at or above `f` (within 3 frames), or -1 */
  below(f: number): number;
  above(f: number): number;
  cached(): number;
  failed(): boolean;
  close(): void;
};

function parseStream(buf: Uint8Array): { codec: string; chunks: Uint8Array[] } | null {
  const chunks: Uint8Array[] = [];
  // IVF container (VP8 / VP9 / AV1)
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
  // H.264 Annex B: split into frames at the access-unit delimiters (or at each SPS)
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
    let keepLo = 0;
    let keepHi = 0;
    let errors = 0;
    let closed = false;
    let flushing = false;
    let dec: VideoDecoder;
    const evict = () => {
      if (frames.size <= maxFrames) return;
      for (const [i, fr] of frames) {
        if (i < keepLo || i > keepHi) {
          fr.close();
          frames.delete(i);
          if (frames.size <= maxFrames) return;
        }
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
          // e.g. the browser reclaimed the decoder: start a fresh one (give up after a few)
          inflight.clear();
          flushing = false;
          if (!closed && ++errors <= 3) make();
        },
      });
      dec.configure(config);
    };
    make();
    const flush = () => {
      // Some decoders hold the last frame back until flushed; flush whenever work is queued
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
      for (let k = 0; k <= 3; k++) {
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
        const c = Math.round(center);
        const dir = Math.abs(vel) > 0.5 ? Math.sign(vel) : 0;
        const ahead = Math.min(12, 2 + Math.round(Math.abs(vel) * 0.12));
        // a few frames are kept behind too, so a sudden change of direction is covered
        const behind = Math.min(5, 3 + Math.round(ahead / 4));
        keepLo = Math.max(0, c - (dir < 0 ? ahead : behind) - 1);
        keepHi = Math.min(chunks.length - 1, c + (dir > 0 ? ahead : behind) + 1);
        let queued = false;
        // nearest first, leaning towards where we're heading
        for (let k = 0; k <= ahead; k++) {
          for (const i of dir >= 0 ? [c + k, c - k] : [c - k, c + k]) {
            if (i < keepLo || i > keepHi || frames.has(i) || inflight.has(i)) continue;
            if (inflight.size >= 6) break;
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

export default function HeroVideo({
  src,
  hd,
  sd,
  scrollLength = 2.5,
}: HeroVideoProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const breakRef = useRef<HTMLVideoElement>(null);
  const loopARef = useRef<HTMLVideoElement>(null);
  const loopBRef = useRef<HTMLVideoElement>(null);
  const fallbackRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"gl" | "fallback">("gl");

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!section || !stage || !canvas) return;

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

    // OS "reduce motion" setting (Windows: animation effects off, which many PCs have): keep the
    // 3D hero, since it only moves when you scroll, but drop all motion that plays by itself
    // (idle sway, hover float, camera drift, ripple, colour split, wheel punch).
    // ?motion=full previews the full motion, ?motion=flat shows the plain video.
    // Switch to the plain video (deferred a frame: no state updates straight from an effect)
    const goFallback = () => {
      const id = requestAnimationFrame(() => setMode("fallback"));
      return () => cancelAnimationFrame(id);
    };
    const motionParam = new URLSearchParams(window.location.search).get("motion");
    if (motionParam === "flat") return goFallback();
    const calm = motionParam !== "full" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const motionK = calm ? 0 : 1;

    /* ---------- Quality tier ---------- */
    // Phones, low-memory / low-core devices and slow or data-saver connections get the
    // 720p clips and a lighter mesh. Everyone else gets 1080p.
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean; effectiveType?: string };
    };
    const smallScreen = Math.min(window.innerWidth, window.innerHeight) < 700 || window.innerWidth < 900;
    const weakDevice = (nav.deviceMemory ?? 8) <= 4 || (nav.hardwareConcurrency ?? 8) <= 4;
    const slowNet = !!nav.connection?.saveData || /(^|-)(2g|3g)$/.test(nav.connection?.effectiveType ?? "");
    const lite = !!sd && (smallScreen || weakDevice || slowNet);
    const clips = lite && sd ? sd : hd;
    const GRID_X = lite ? 200 : 320;
    const GRID_Y = lite ? 112 : 180;
    const MAX_SCALE = lite ? 1.0 : 1.5; // render scale relative to the screen (above 1 = anti-aliasing)
    const MIN_SCALE = 0.55;

    const gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    });
    if (!gl) {
      return goFallback();
    }

    /* ---------- Programs ---------- */
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
    const LABEL_PX = 56; // font size the label texture is drawn at
    const labelTex = gl.createTexture();
    let labelW = 0;
    let labelH = 0;
    const drawTitle = () => {
      if (abort.signal.aborted) return;
      const family = getComputedStyle(stage).fontFamily || "sans-serif";
      const mk = () => {
        const c = document.createElement("canvas");
        return [c, c.getContext("2d")!] as const;
      };
      const upload = (tex: WebGLTexture | null, c: HTMLCanvasElement, mip: boolean) => {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        if (mip) gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      };

      // fine print for the band
      const [lc, l] = mk();
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
      upload(labelTex, lc, true);
      labelW = lc.width;
      labelH = lc.height;
    };
    // wait for the web font, so the band label is never drawn in a fallback face
    document.fonts.ready.then(drawTitle, drawTitle);


    /* ---------- Geometry ---------- */
    const quadVao = gl.createVertexArray();
    const quadBuf = gl.createBuffer();
    gl.bindVertexArray(quadVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // The mesh: a grid of vertices that each get pushed toward the camera by depth
    const uvs = new Float32Array((GRID_X + 1) * (GRID_Y + 1) * 2);
    let i = 0;
    for (let y = 0; y <= GRID_Y; y++)
      for (let x = 0; x <= GRID_X; x++) {
        uvs[i++] = x / GRID_X;
        uvs[i++] = y / GRID_Y;
      }
    const idx = new Uint16Array(GRID_X * GRID_Y * 6);
    i = 0;
    for (let y = 0; y < GRID_Y; y++)
      for (let x = 0; x < GRID_X; x++) {
        const a = y * (GRID_X + 1) + x;
        const c = a + GRID_X + 1;
        idx[i++] = a; idx[i++] = a + 1; idx[i++] = c;
        idx[i++] = a + 1; idx[i++] = c + 1; idx[i++] = c;
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
    // Two video textures: the newest frame and the one before it (for frame blending)
    const vidTexs = [gl.createTexture(), gl.createTexture()];
    gl.bindTexture(gl.TEXTURE_2D, vidTexs[1]);
    setLinearClamp();
    let curTex = 0;
    let vidTex = vidTexs[0];
    gl.bindTexture(gl.TEXTURE_2D, vidTex);
    setLinearClamp();

    // Baked per-vertex geometry (see GEO_FS), one texel per mesh vertex
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
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    /* ---------- Sizes + automatic resolution ---------- */
    // The 3D scene renders at screen size x "scale". Scale starts at the anti-aliasing
    // level for this device and is lowered/raised automatically to keep frames smooth.
    const MAX_TEX = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    let outW = 0;
    let outH = 0;
    let sceneW = 0;
    let sceneH = 0;
    let scaleCap = MAX_SCALE;
    let scale = MAX_SCALE;

    const resizeScene = () => {
      const w = Math.min(MAX_TEX, Math.max(1, Math.round(outW * scale)));
      const h = Math.min(MAX_TEX, Math.max(1, Math.round(outH * scale)));
      if (w === sceneW && h === sceneH) return;
      sceneW = w;
      sceneH = h;
      // Fresh immutable texture at the new size (cheaper to sample than a resized one)
      gl.deleteTexture(sceneTex);
      sceneTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, sceneTex);
      gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, w, h);
      setLinearClamp();
      gl.bindRenderbuffer(gl.RENDERBUFFER, sceneDepth);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h);
      gl.deleteTexture(covTex);
      covTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, covTex);
      gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R8, w, h);
      setLinearClamp();
      gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sceneTex, 0);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, covTex, 0);
      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, sceneDepth);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };

    // Scroll geometry is measured here (on resize), never per frame, so the render loop
    // causes no layout work at all.
    let secTop = 0;
    let secH = 1;
    let exitS = 0; // smoothed exit progress
    let vh = window.innerHeight;
    let cssW = window.innerWidth;
    let cssH = window.innerHeight;
    const measure = () => {
      cssW = canvas.clientWidth || window.innerWidth;
      cssH = canvas.clientHeight || window.innerHeight;
      const r = section.getBoundingClientRect();
      secTop = r.top + window.scrollY;
      secH = section.offsetHeight;
      vh = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (w !== outW || h !== outH) {
        outW = canvas.width = w;
        outH = canvas.height = h;
        // keep the supersampled scene under ~3.6 million pixels
        scaleCap = clamp(Math.sqrt(3.6e6 / (w * h)), MIN_SCALE, MAX_SCALE);
        scale = Math.min(scale, scaleCap);
        resizeScene();
      }
    };
    measure();
    window.addEventListener("resize", measure);
    const ro = new ResizeObserver(measure);
    ro.observe(section);

    /* ---------- Input ---------- */
    let hasPointer = false;
    let mouseX = 0, mouseY = 0, msX = 0, msY = 0, mvX = 0, mvY = 0;
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      hasPointer = true;
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    /* ---------- Smooth mouse-wheel scrolling (only while the hero is pinned) ---------- */
    // A mouse wheel jumps ~100px per notch. Inside the hero, each notch instead moves a
    // target that the page glides towards, so the break-apart follows a smooth, weighty
    // motion. Past the hero, normal scrolling takes over. Trackpads, touch, keyboard and
    // the scrollbar keep working as usual.
    let wheelActive = false;
    let wheelTarget = 0;
    let wheelY = 0;
    let wheelSetY = 0; // where we last scrolled the page to
    let lastWheel = 0;
    let kick = 0; // short "punch" on each notch (depth pop + camera push), eased in and out
    let kickTarget = 0;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // pinch-zoom on trackpads
      const raw = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * vh : e.deltaY;
      if (raw === 0) return;
      // Real mouse wheels move in big chunky steps (~100px); trackpads send many small ones.
      // Mouse-wheel notches do twice as much inside the hero, so it never feels like a slog
      // (and normal amounts once the glide has carried on past it).
      const isMouseWheel = e.deltaMode !== 0 || Math.abs(raw) >= 40;
      const pastHero = wheelActive && (wheelTarget > secTop + secH - vh || wheelTarget < secTop);
      const dy = isMouseWheel && !pastHero ? raw * WHEEL_BOOST : raw;
      const heroEnd = secTop + secH - vh; // last scroll position where the hero is pinned
      if (!wheelActive) {
        // Only start gliding inside the hero; elsewhere the page scrolls as usual
        const y = window.scrollY;
        if (y < secTop - 1 || y > heroEnd + 1) return;
        if ((dy > 0 && y >= heroEnd - 0.5) || (dy < 0 && y <= secTop + 0.5)) return;
        wheelActive = true;
        wheelY = wheelSetY = y;
        wheelTarget = y;
      }
      // A running glide catches every notch, so a hard flick never drops back to raw, jumpy
      // scrolling half-way. It carries straight on past the end of the hero into the page
      // (no stop); once it settles outside the hero, normal scrolling takes over again.
      e.preventDefault();
      const maxY = Math.max(0, document.documentElement.scrollHeight - vh);
      wheelTarget = clamp(wheelTarget + dy, 0, maxY);
      lastWheel = performance.now();
      if (!calm) kickTarget = Math.min(1, kickTarget + Math.min(Math.abs(raw), 240) / 500);
    };
    window.addEventListener("wheel", onWheel, { passive: false });

    stage.dataset.mode = "gl";

    /* ---------- Clips: load the first loop now, the rest once it's playing ---------- */
    const mid = (index: number) => (index + 0.5) / FPS; // middle of a frame
    const indexAt = (time: number, length: number) =>
      clamp(Math.floor(time * FPS + 1e-4), 0, length - 1);
    const tBreak = (orig: number) => mid(clamp(Math.round(orig), BREAK_FIRST, BREAK_LAST) - BREAK_FIRST);
    // Time in a loop clip that shows a given original frame (prefers the forward half)
    const tInLoop = (loop: number[], orig: number) => {
      let best = 0;
      for (let k = 0; k < loop.length; k++) if (Math.abs(loop[k] - orig) < Math.abs(loop[best] - orig)) best = k;
      return mid(best);
    };

    let playBlocked = false; // e.g. iOS low-power mode refuses play(): we step frames ourselves
    const play = (v: HTMLVideoElement) => {
      if (!v.getAttribute("src")) return; // clip still loading
      v.play().catch((err: unknown) => {
        // Only a real autoplay refusal switches to manual frame stepping
        if (err instanceof DOMException && err.name === "NotAllowedError") playBlocked = true;
      });
    };
    // Clean up caches from older versions of the clips
    if (typeof caches !== "undefined") {
      caches
        .keys()
        .then((keys) => keys.filter((k) => k.startsWith("tyode-hero-clips-") && k !== CLIP_CACHE).forEach((k) => caches.delete(k)))
        .catch(() => {});
    }
    const abort = new AbortController();
    const blobUrls: string[] = [];
    const attach = async (v: HTMLVideoElement, url: string, preferStream: boolean) => {
      // First visit + first clip: stream it so the first frame shows as early as possible,
      // and store it in the cache in the background for next time.
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
    // Break-apart frames: decoded directly (WebCodecs) when possible, else by seeking the video
    let stream: FrameStream | null = null;
    let streamState: "off" | "loading" | "ready" | "failed" = "off";
    let shownBreak = -1; // original frame number on screen while scrubbing
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
      openFrameStream(clips.breakStream, abort.signal, lite ? 16 : 24).then((st) => {
        if (abort.signal.aborted) return st?.close();
        if (st && st.count === BREAK_LAST - BREAK_FIRST + 1) {
          stream = st;
          streamState = "ready";
        } else {
          st?.close();
          switchBreakToVideo();
        }
      });
    };
    vA.addEventListener("playing", loadRest, { once: true });
    const restTimer = window.setTimeout(loadRest, 2500);

    // Only re-upload the video to the GPU when it shows a new frame (24x a second), not on
    // every screen refresh. requestVideoFrameCallback says exactly when; the frame-number
    // check is a backup for browsers without it.
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
    let texW = 0;
    let texH = 0;

    // Background tab: stop the videos (the render loop already stops by itself)
    const onVisibility = () => {
      if (document.hidden) for (const v of allVideos) v.pause();
    };
    document.addEventListener("visibilitychange", onVisibility);

    /* ---------- Render loop ---------- */
    let raf = 0;
    let last = performance.now();
    const start = last;
    let vel = 0;
    let prog = 0;
    // Playback state. "shown" is the clip the 3D scene is textured from; switching to another
    // clip only happens once that clip has the matching frame ready (no flashes, no snaps).
    type Clip = "A" | "B" | "T";
    let shown: Clip = "A";
    let pendingTo: Clip | null = null;
    let pendingTime = 0;
    let pendingFrame = 0; // original frame the break-apart clip must show before switching to it
    let eS = 0; // explode amount 0..1 (spring-smoothed, gives scrolling some weight)
    let eV = 0;
    let anchorLo = 52; // scrub range in original frames: explode 0 → anchorLo, 1 → anchorHi
    let anchorHi = 109;
    let stillFor = 0; // seconds since the explode amount stopped moving
    // Glide after you stop scrolling mid-way (in original frames, added on top of the scroll position)
    let coast = 0;
    let coastTarget = 0;
    let coastDir = 1;
    let coastPlanned = false;
    let lastBase = 52;
    // Hover idle: when you stop part-way, the parts keep gently floating instead of freezing
    let holdMix = 0; // 0..1 how much hover is applied
    let holdAmp = 0; // video sway in frames (only through crisp frames)
    let holdAmpS = 0; // the same, eased, so the sway grows and shrinks gently
    // Idle sway at either end (direct decoding only): which end, eased speed, and phase
    let idleSide = 0; // -1 assembled end, +1 exploded end, 0 not idling
    let idleRamp = 0;
    let idlePhase = 0;
    let idleFrame = 0;
    let idleBase = 0; // the end frame the idle sway started from
    let idleOffset = 0; // idle sway, in frames, on top of the scroll position
    let holdDir = 1; // which way the part-way hover starts swaying (continues the scroll)
    let targetStill = 0;
    let lastETarget = 0;
    let holdCenter = -1;
    let holdPhase = 0;
    let manualTime = 0;
    let hasFrame = false;
    let firstFrameAt = 0;
    let wasVisible = true;
    let frameMs = 16.7; // smoothed frame time, drives the automatic resolution
    let refreshMs = 16.7; // the screen's refresh interval, learned from the fastest frames
    let lastAdjust = 0;
    let lastDrop = -10;
    let cssP = "", cssX = "", cssY = "";
    let captionOn = false;

    // Performance readout: add ?debug=1 to the URL
    const debug = new URLSearchParams(window.location.search).get("debug") === "1";
    const dbg = { raf: 0, renders: 0, uploads: 0, seeks: 0, worst: 0, since: performance.now() };
    let dbgEl: HTMLDivElement | null = null;
    if (debug) {
      dbgEl = document.createElement("div");
      dbgEl.style.cssText =
        "position:fixed;left:8px;bottom:8px;z-index:99999;padding:8px 10px;background:rgba(0,0,0,.75);color:#9f9;font:12px/1.5 ui-monospace,monospace;white-space:pre;pointer-events:none;border-radius:6px";
      document.body.appendChild(dbgEl);
    }
    let frameAt = 0; // when the current video frame was uploaded
    let frameGap = 1000 / FPS; // how long the blend into the newest frame should take (ms)
    let measuredGap = 1000 / FPS; // measured time between video frames arriving
    let fPrev = -1; // last wanted (fractional) frame while scrubbing
    let fVel = 0; // signed frames per second through the break-apart clip
    let fNow = 0; // exact (fractional) position in the break-apart clip, in original frames
    // Which original frame each video texture holds while scrubbing (-1 = not tracked).
    // While scrubbing we keep the two frames around the exact position and blend between
    // them by position, so there are no timing guesses and no pops.
    const texF = [-1, -1];
    let newestTex = 0;

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

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const rawMs = now - last;
      if (dbgEl) {
        dbg.raf++;
        dbg.worst = Math.max(dbg.worst, rawMs);
        const span = now - dbg.since;
        if (span > 500) {
          const per = 1000 / span;
          dbgEl.textContent =
            `tier        ${lite ? "720p (lite)" : "full"}  ${texW}x${texH}\n` +
            `screen fps  ${(dbg.raf * per).toFixed(0)}   rendered ${(dbg.renders * per).toFixed(0)}/s\n` +
            `slowest     ${dbg.worst.toFixed(0)} ms\n` +
            `video       ${(dbg.uploads * per).toFixed(0)} new frames/s   ${(dbg.seeks * per).toFixed(0)} seeks/s\n` +
            `render res  ${sceneW}x${sceneH} (scale ${scale.toFixed(2)})\n` +
            `clip        ${shown}${pendingTo ? " -> " + pendingTo : ""}\n` +
            `scrubbing   ${streamState === "ready" && stream ? `direct decode (${(stream as FrameStream).cached()} frames ready)` : streamState === "loading" ? "loading…" : "video seeking"}`;
          dbg.raf = dbg.renders = dbg.uploads = dbg.seeks = 0;
          dbg.worst = 0;
          dbg.since = now;
        }
      }
      const dt = Math.min(rawMs / 1000, 0.05);
      last = now;
      const t = (now - start) / 1000;

      // Smooth wheel glide (see onWheel)
      if (wheelActive) {
        if (Math.abs(window.scrollY - wheelSetY) > 3) {
          wheelActive = false; // something else scrolled the page (scrollbar, keyboard, link): let it
        } else {
          // Ease towards the target, but never faster than ~3 screens a second, so a hard
          // flick turns into a quick, smooth sweep instead of a jump
          const step = (wheelTarget - wheelY) * (1 - Math.exp(-dt * 14));
          const maxStep = vh * 3 * dt;
          wheelY += clamp(step, -maxStep, maxStep);
          if (Math.abs(wheelTarget - wheelY) < 0.3 && now - lastWheel > 160) {
            wheelY = wheelTarget;
            wheelActive = false;
          }
          window.scrollTo({ top: wheelY, behavior: "instant" });
          wheelSetY = window.scrollY;
        }
      }
      if (stream && stream.failed()) {
        stream.close();
        stream = null;
        switchBreakToVideo();
      }
      const useStream = streamState === "ready" && stream !== null;
      const streamFirst = streamState === "loading" || useStream; // the T clip comes from the stream
      kickTarget *= Math.exp(-dt * 4);
      kick += (kickTarget - kick) * (1 - Math.exp(-dt * 14));

      // Off-screen: pause everything and skip all work
      const scrollY = window.scrollY;
      const visible = scrollY + vh > secTop && scrollY < secTop + secH;
      if (!visible) {
        if (wasVisible) for (const v of allVideos) v.pause();
        wasVisible = false;
        return;
      }
      wasVisible = true;

      // Automatic resolution: drop quality as soon as frames come noticeably slower than the
      // screen refreshes, raise it again once there is headroom. The refresh interval is
      // learned from the fastest frames (60/120/144 Hz all work). The first seconds after the
      // first frame are ignored: loading hitches there say nothing about how heavy the scene is.
      if (rawMs < 250) frameMs += (rawMs - frameMs) * 0.08;
      if (rawMs > 5 && rawMs < 50)
        refreshMs = Math.min(17.5, refreshMs + (rawMs - refreshMs) * (rawMs < refreshMs ? 0.05 : 0.002));
      if (hasFrame && t - firstFrameAt > 2.5 && t - lastAdjust > 0.6) {
        lastAdjust = t;
        if (frameMs > Math.max(refreshMs * 1.35, 13) && scale > MIN_SCALE) {
          scale = Math.max(MIN_SCALE, scale * 0.85);
          lastDrop = t;
          resizeScene();
        } else if (frameMs < refreshMs * 1.1 && scale < scaleCap && t - lastDrop > 5) {
          scale = Math.min(scaleCap, scale * 1.07);
          resizeScene();
        }
      }

      // Scroll speed + progress (from cached measurements, no layout reads)
      const breakPx = Math.max(secH - vh * (1 + EXIT.span), 1); // scroll that drives the break-apart
      const target = clamp((scrollY - secTop) / breakPx, 0, 1);
      // after it, the exit (backdrop shrinks into a card)
      const exitTarget = clamp((scrollY - secTop - breakPx + EXIT.lead * vh) / ((EXIT.span + EXIT.lead) * vh), 0, 1);
      exitS += (exitTarget - exitS) * (1 - Math.exp(-dt * 11));
      const exitE = 1 - Math.pow(1 - smooth(0, 1, exitS), 2); // settles softly at the top
      const progBefore = prog;
      // (kept fairly quick: the wheel glide above already smooths mouse wheels)
      prog += (target - prog) * (1 - Math.exp(-dt * 18));
      // Scroll speed in screens/second, measured from the smoothed position (raw scroll
      // positions jump in whole pixels and uneven steps, which made the effects twitch)
      const instVel = dt > 0 ? ((prog - progBefore) / dt) * (breakPx / vh) : 0;
      vel += (clamp(instVel, -4, 4) - vel) * (1 - Math.exp(-dt * 8));
      // What the visual effects see: soft-saturating, so a flick looks like a fast scroll
      // instead of pinning every effect at its maximum
      const velFx = Math.tanh(vel / 1.6) * 1.2 * motionK;

      if (!hasPointer) {
        // Touch screens: a slow automatic orbit instead of the mouse
        mouseX = Math.sin(t * 0.31) * 0.55 * motionK;
        mouseY = Math.cos(t * 0.23) * 0.35 * motionK;
      }
      // Slightly under-damped spring: follows the mouse with a touch of weight
      mvX += ((mouseX - msX) * 20 - mvX * 7.2) * dt;
      mvY += ((mouseY - msY) * 20 - mvY * 7.2) * dt;
      msX += mvX * dt;
      msY += mvY * dt;

      // ---- Video: scroll breaks the tyre apart ----
      const eTarget = smooth(0, 0.72, target);
      const stiff = 130; // spring towards the scroll position: higher = follows more closely
      eV += ((eTarget - eS) * stiff - eV * 2 * Math.sqrt(stiff)) * dt;
      // At most ~80 video frames a second when seeking, however hard the flick: the video keeps up and
      // the motion stays fluid instead of skipping
      // (direct decoding keeps up with far more, so the cap is much looser then)
      const eVMax = (useStream ? 240 : 80) / Math.max(anchorHi - anchorLo, 20);
      eV = clamp(eV, -eVMax, eVMax);
      eS = clamp(eS + eV * dt, 0, 1);
      const moving = Math.abs(eTarget - eS) > 0.002 || Math.abs(eV) > 0.01;
      stillFor = moving ? 0 : stillFor + dt;
      // "You've stopped scrolling": the scroll position is no longer really moving. Idle motion
      // starts from here and blends in over whatever is still settling, instead of waiting
      // for every last bit of motion to stop first.
      const targetSpeed = (Math.abs(eTarget - lastETarget) * Math.max(anchorHi - anchorLo, 20)) / Math.max(dt, 1e-3);
      lastETarget = eTarget;
      targetStill = targetSpeed < 1.5 ? targetStill + dt : 0;
      const inputStill = targetStill > 0.06;

      let holdTarget = 0;
      if (shown === "A" || shown === "B") {
        fPrev = -1;
        const v = shown === "A" ? vA : vB;
        const loop = shown === "A" ? LOOP_A : LOOP_B;
        const leaving = shown === "A" ? eTarget > 0.003 || eS > 0.003 : eTarget < 0.997 || eS < 0.997;
        if (leaving && !pendingTo) {
          // Freeze on the frame on screen and cue the break-apart clip at that exact frame
          v.pause();
          const f = loop[indexAt(v.currentTime, loop.length)];
          if (shown === "A") {
            anchorLo = f;
            anchorHi = 109;
          } else {
            anchorLo = 52;
            anchorHi = f;
          }
          loadRest();
          lastBase = f;
          coast = 0;
          coastPlanned = false;
          texF[0] = texF[1] = f;
          fPrev = -1;
          fVel = 0;
          pendingTo = "T";
          pendingTime = tBreak(f);
          pendingFrame = f;
          if (streamFirst) stream?.want(f - BREAK_FIRST, 0);
          else vT.currentTime = pendingTime;
        } else if (!leaving && !pendingTo && useStream) {
          // Direct decoding is ready: take over from the loop clip at one of its turnarounds
          // (where it's momentarily still), then continue with the slow eased idle sway
          const f = loop[indexAt(v.currentTime, loop.length)];
          const lo = Math.min(...loop);
          const hi = Math.max(...loop);
          stream!.want(f - BREAK_FIRST, 0);
          if ((f === lo || f === hi) && stream!.get(f - BREAK_FIRST)) {
            if (shown === "A") {
              anchorLo = f;
              anchorHi = 109;
            } else {
              anchorLo = 52;
              anchorHi = f;
            }
            lastBase = f;
            coast = 0;
            coastPlanned = false;
            texF[0] = texF[1] = f;
            fPrev = -1;
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
        // Scrolling again from the idle sway at an end: fold the sway into the scroll range, so
        // the picture carries on from exactly where it is (no jump)
        let folded = false;
        if (idleSide !== 0 && !inputStill) {
          if (idleSide < 0) anchorLo += idleOffset;
          else anchorHi += idleOffset;
          idleSide = 0;
          idleRamp = 0;
          idleOffset = 0;
          folded = true;
        }
        const base = anchorLo + (anchorHi - anchorLo) * eS;
        const baseFinal = anchorLo + (anchorHi - anchorLo) * eTarget; // where the scroll is heading
        if (folded) lastBase = base;
        const dBase = base - lastBase;
        lastBase = base;
        const midway = eTarget > 0.004 && eTarget < 0.996;
        if (!inputStill) {
          if (Math.abs(dBase) > 0.01) coastDir = Math.sign(dBase);
          // Scrolling again: blend the extra glide out while the video keeps moving with the
          // scroll (at least half speed), so it never stalls or jumps back
          if (coast !== 0) {
            if (Math.sign(dBase) === Math.sign(coast)) {
              coast = Math.sign(coast) * Math.max(0, Math.abs(coast) - Math.abs(dBase) * 0.5);
            }
            coast *= Math.exp(-dt * 2.5);
          }
          coastTarget = coast;
          coastPlanned = false;
        } else if (midway) {
          // Stopped part-way: keep gliding slowly in the scroll direction to a crisp frame
          if (!coastPlanned) {
            coastPlanned = true;
            const from = Math.round(baseFinal + coast);
            let bestK = 2;
            let bestS = -1;
            for (let k = 2; k <= 16; k++) {
              const f = from + coastDir * k;
              if (f < BREAK_FIRST || f > BREAK_LAST) break;
              const sharpness = SHARPNESS[f - BREAK_FIRST];
              if (sharpness >= SHARP_ENOUGH) {
                bestK = k;
                break;
              }
              if (sharpness > bestS) {
                bestS = sharpness;
                bestK = k;
              }
            }
            coastTarget = coast + coastDir * bestK;
          }
          coast += (coastTarget - coast) * (1 - Math.exp(-dt * 1.8));
          // Hover starts right away and blends in on top of the glide
          holdTarget = 1;
          const center = Math.round(baseFinal + coastTarget);
          if (center !== holdCenter) {
            holdCenter = center;
            // sway as far as 3 frames each way, but only through crisp frames
            holdAmp = 3;
            while (holdAmp > 1) {
              let ok = true;
              for (let k = -holdAmp; k <= holdAmp; k++) {
                const f = center + k;
                if (f < BREAK_FIRST || f > BREAK_LAST || SHARPNESS[f - BREAK_FIRST] < 0.84) ok = false;
              }
              if (ok) break;
              holdAmp--;
            }
          }
        } else {
          coast *= Math.exp(-dt * 4); // at either end: settle exactly onto the end frame
          coastPlanned = false;
        }
        // Stopped at an end (direct decoding): slow eased sway through the idle frames. It starts
        // the moment you stop and is added on top of the last bit of settling, so it simply
        // continues the motion instead of waiting for it to finish.
        if (useStream && inputStill && !midway) {
          const side = eTarget < 0.5 ? -1 : 1;
          const idle = side < 0 ? IDLE_ASSEMBLED : IDLE_EXPLODED;
          const c = (idle.lo + idle.hi) / 2;
          const r = (idle.hi - idle.lo) / 2;
          if (idleSide !== side) {
            // start the sway from the end frame, moving away from the end we arrived at
            idleSide = side;
            idleRamp = 0;
            idleBase = clamp(baseFinal, idle.lo, idle.hi);
            const a = Math.acos(clamp((c - idleBase) / r, -1, 1)); // f = c - r*cos(phase)
            idlePhase = side < 0 ? 2 * Math.PI - a : a; // assembled: drift back down, exploded: up
            if (side < 0 && a < 1e-3) idlePhase = 0;
          }
          idleRamp += (1 - idleRamp) * (1 - Math.exp(-dt * 2.2)); // eases into motion
          idlePhase += dt * ((Math.PI * 2) / idle.period) * idleRamp * motionK;
          idleFrame = c - r * Math.cos(idlePhase);
          idleOffset = idleFrame - idleBase;
          holdTarget = 1; // gentle 3D float too
        }
        if (!midway) {
          holdAmp = 0; // the part-way sway only happens part-way
          holdCenter = -1;
        }
        holdAmpS += (holdAmp - holdAmpS) * (1 - Math.exp(-dt * 1.2));
        const sway = holdAmpS * holdMix * Math.sin(holdPhase) * holdDir;
        const fWant = clamp(base + coast + sway + (idleSide !== 0 ? idleOffset : 0), BREAK_FIRST, BREAK_LAST);
        if (fPrev >= 0) fVel += ((fWant - fPrev) / Math.max(dt, 1e-3) - fVel) * (1 - Math.exp(-dt * 8));
        fPrev = fWant;
        fNow = fWant;
        // Fetch the next frame one step early in the direction of motion, so by the time we
        // get there it's already decoded and we can blend into it smoothly
        const lead = clamp(fVel * 0.035, -3, 3); // ~one seek's worth of motion ahead
        const req =
          Math.abs(fVel) > 0.8
            ? fVel > 0 ? Math.ceil(fWant + lead - 0.02) : Math.floor(fWant + lead + 0.02)
            : Math.round(fWant);
        const reqC = clamp(req, BREAK_FIRST, BREAK_LAST);
        const want = tBreak(reqC);
        if (useStream) {
          stream!.want(fWant - BREAK_FIRST, fVel);
        } else if (!vT.seeking && texF[0] !== reqC && texF[1] !== reqC && Math.abs(vT.currentTime - want) > 0.5 / FPS) {
          vT.currentTime = want;
          dbg.seeks++;
        }
        if (moving) {
          pendingTo = null; // still scrolling: stay on the break-apart clip
        } else if (
          !useStream &&
          !pendingTo &&
          stillFor > 0.12 &&
          (eS < 0.004 || eS > 0.996) &&
          (useStream || !vT.seeking) &&
          Math.abs(curBreak() - fWant) <= 1
        ) {
          // Settled at an end: cue the matching loop at the same frame, then hand over
          const toA = eS < 0.5;
          const v = toA ? vA : vB;
          pendingTime = tInLoop(toA ? LOOP_A : LOOP_B, curBreak());
          v.currentTime = pendingTime;
          manualTime = pendingTime;
          pendingTo = toA ? "A" : "B";
        }
      }

      // Complete a pending switch once the target clip shows the right frame
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

      // Upload the shown clip's frame, only if it's a new one
      const video = clipVideo(shown);
      const frameIndex = Math.floor(video.currentTime * FPS + 1e-4);
      let newFrame = false;
      const fromStream = shown === "T" && useStream;
      if (fromStream && stream) {
        // Keep the two decoded frames on either side of the exact position in the textures
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
            const target =
              other !== undefined && texF[0] === other ? 1
              : other !== undefined && texF[1] === other ? 0
              : Math.abs(texF[0] - fNow) > Math.abs(texF[1] - fNow) ? 0 : 1;
            const fr = stream.get(n - BREAK_FIRST)!;
            gl.bindTexture(gl.TEXTURE_2D, vidTexs[target]);
            if (fr.displayWidth === texW && fr.displayHeight === texH) {
              gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, fr);
            } else {
              gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fr);
            }
            texF[target] = n;
            newestTex = curTex = target;
            frameAt = now;
            newFrame = true;
            dbg.uploads++;
          }
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
          if (lo === hi) newestTex = curTex = texF[0] === lo ? 0 : 1;
          else curTex = Math.abs(fNow - lo) <= Math.abs(hi - fNow) ? (texF[0] === lo ? 0 : 1) : texF[0] === hi ? 0 : 1;
          vidTex = vidTexs[curTex];
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
          // First frame (or a size change): fill both textures so there's nothing to blend from
          texW = video.videoWidth;
          texH = video.videoHeight;
          halfTexel = 0.5 / texH;
          for (const tx of vidTexs) {
            gl.bindTexture(gl.TEXTURE_2D, tx);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
          }
        } else {
          let target = 1 - newestTex; // loops: overwrite the older frame
          if (shown === "T") {
            // scrubbing: keep the frame closest to where we are, overwrite the other one
            const n = BREAK_FIRST + frameIndex;
            target = Math.abs(texF[0] - fNow) > Math.abs(texF[1] - fNow) ? 0 : 1;
            if (texF[0] === n) target = 0;
            else if (texF[1] === n) target = 1;
            texF[target] = n;
          }
          newestTex = target;
          curTex = target;
          gl.bindTexture(gl.TEXTURE_2D, vidTexs[target]);
          gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, video);
          // Loops: blend over the real time between frames (~42 ms at 24 fps)
          const gap = now - frameAt;
          if (gap > 4 && gap < 120) measuredGap += (gap - measuredGap) * 0.3;
          frameGap = clamp(measuredGap, 30, 60);
        }
        frameAt = now;
        vidTex = vidTexs[curTex];
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        fresh.set(video, false);
        uploadedFrom = video;
        uploadedIndex = frameIndex;
        newFrame = true;
        dbg.uploads++;
        if (!hasFrame) {
          hasFrame = true;
          firstFrameAt = t;
          stage.dataset.ready = "true";
        }
      }
      if (!hasFrame) return;

      // Rendered on every display refresh, so motion is evenly paced on any monitor
      // (60/75/90/120/144/165 Hz). Weaker GPUs are protected by the automatic resolution.
      if (calm) holdTarget = 0;
      if (holdTarget > 0 && holdMix < 0.002) {
        holdPhase = 0;
        holdDir = coastDir;
      }
      holdMix += (holdTarget - holdMix) * (1 - Math.exp(-dt * (holdTarget > holdMix ? HOVER_FADE_IN : 5)));
      if (holdMix > 0.001) holdPhase += dt * ((Math.PI * 2) / HOVER_PERIOD);
      dbg.renders++;

      const aspect = texW / (texH * 0.5); // aspect of the colour part (top half)

      // ---- Scroll choreography ----
      // Intro: starts as a flat picture that inflates into 3D while the camera settles
      const intro = 1 - smooth(0, 2.4, t - firstFrameAt);
      const introE = intro * intro;
      const sep = (eS * 0.18 + holdMix * 0.03 * (0.5 + 0.5 * Math.sin(t * 0.5))) * (1 - introE);
      const depthAmt = (DEPTH + Math.abs(velFx) * 0.035 + kick * 0.04) * (1 - introE);

      // ---- Camera ----
      const driftX = (Math.sin(t * 0.13) * 0.6 + Math.sin(t * 0.071 + 1.3) * 0.4) * motionK;
      const driftY = (Math.sin(t * 0.097 + 0.4) * 0.6 + Math.sin(t * 0.053) * 0.4) * motionK;
      const arc = smooth(0, 1, prog);
      const push = smooth(0.15, 0.85, prog);
      const lean = velFx;
      const sa = sceneW / sceneH;
      let dist = (0.5 / Math.tan(fov / 2)) * Math.min(1, aspect / sa) * 1.14;
      dist *= (1 - push * 0.05) * (1 - introE * 0.05) * (1 - kick * 0.012);
      const yaw = -0.06 + arc * 0.22 + msX * 0.13 + driftX * 0.025 + holdMix * 0.04 * Math.sin(t * 0.22);
      const pitch =
        0.03 - smooth(0.1, 0.9, prog) * 0.09 + msY * 0.085 + driftY * 0.018 + lean * 0.015 + holdMix * 0.018 * Math.sin(t * 0.29);
      const roll = -arc * 0.035 + msX * 0.012 + lean * 0.008;
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

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, vidTex);

      // Pass 1: bake the mesh geometry (only when the video frame changed)
      if (newFrame) {
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
      gl.uniform1f(bgProg.u("uProg"), prog);
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
      // Frame blending. Scrubbing: blend the two frames around the exact position, by position.
      // Loops: blend from the previous frame into the newest over the 24 fps frame time.
      let blendFrom = 1 - newestTex;
      let blendTo = newestTex;
      let blendMix = clamp((now - frameAt) / frameGap, 0, 1);
      if (shown === "T" && texF[0] >= 0 && texF[1] >= 0) {
        blendFrom = texF[0] <= texF[1] ? 0 : 1;
        blendTo = 1 - blendFrom;
        const span = texF[blendTo] - texF[blendFrom];
        if (span > 0 && span <= 2) {
          blendMix = clamp((fNow - texF[blendFrom]) / span, 0, 1);
        } else {
          // Frames far apart (the video is catching up after a flick): never mix them by
          // position, that gives a double image. Show the frame nearest the scroll position
          // (faded in quickly if it just arrived).
          const closer = Math.abs(texF[0] - fNow) <= Math.abs(texF[1] - fNow) ? 0 : 1;
          blendTo = span === 0 ? newestTex : closer;
          blendFrom = 1 - blendTo;
          blendMix = span === 0 || blendTo !== newestTex ? 1 : clamp((now - frameAt) / 40, 0, 1);
        }
      }
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
        // video area per screen pixel for a flat, camera-facing surface at the image plane
        const imgPx = sceneH / (2 * dist * Math.tan(fov / 2));
        gl.uniform1f(meshProg.u("uUvArea"), 1 / (aspect * imgPx * imgPx));
      }
      gl.uniform1f(meshProg.u("uProg"), prog);
      gl.bindVertexArray(meshVao);
      gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);

      // Pass 3: to the screen
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
      // Sharpen more when the video is magnified (720p clips on big screens) or rendered below screen size
      const magnify = clamp(outH / Math.max(texH * 0.5, 1) - 1, 0, 1); // colour part is the top half; 0 = 1:1, 1 = 2x+
      gl.uniform1f(postProg.u("uSharp"), clamp(0.35 + magnify * 0.4 + Math.max(0, 1 - scale) * 0.5, 0, 1));
      {
        // Band layout, in CSS pixels
        const fontPx = clamp(cssW * SCALE.share, SCALE.min, SCALE.max);
        const gutter = clamp(cssW * 0.04, 20, 56);
        const tA = clamp(1 - prog * 1.8, 0, 1) * smooth(0.1, 1.2, t - firstFrameAt);
        {
          // band: low across the screen, sized by the logo's font size, drifting up as you
          // scroll and moving a little with the mouse (its own depth)
          const kk = outW / cssW;
          const fsz = fontPx * (1 - prog * 0.12);
          const base = cssH - gutter * 1.15 - prog * 0.18 * cssH - fsz * BAND.lift + msY * 14 * BAND.parallax;
          const yTop = base - fsz * BAND.top;
          const yBot = base - fsz * BAND.bottom;
          gl.uniform4f(postProg.u("uBand"), (cssH - yBot) * kk, (cssH - yTop) * kk, -roll * 0.9, BAND.opacity * tA);
          gl.uniform1f(postProg.u("uBandX"), cssW * 0.5 * kk);
          const ls = BAND.labelSize / LABEL_PX;
          const lx0 = cssW * BAND.labelX;
          // only where it fits on screen (narrow phones skip it)
          const lFits = lx0 + labelW * ls < cssW - 12;
          gl.uniform3f(postProg.u("uLabelBox"), lx0 * kk, (lx0 + (lFits ? labelW * ls : 0)) * kk, labelH * ls * kk);
          gl.activeTexture(gl.TEXTURE4);
          gl.bindTexture(gl.TEXTURE_2D, labelTex);
          gl.uniform1i(postProg.u("uLabel"), 4);
          gl.activeTexture(gl.TEXTURE3);
          gl.bindTexture(gl.TEXTURE_2D, covTex);
          gl.uniform1i(postProg.u("uCov"), 3);
          gl.activeTexture(gl.TEXTURE2);
        }
        gl.uniform1f(postProg.u("uTAlpha"), tA);
        gl.uniform3f(postProg.u("uInk"), 0.047, 0.047, 0.051);
      }
      {
        // Exit: the backdrop's bottom edge rises; sides and top stay off-screen
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

      // Feed the same values to CSS so the text moves with the scene (only when changed)
      const p3 = prog.toFixed(3);
      const x3 = msX.toFixed(3);
      const y3 = msY.toFixed(3);
      if (p3 !== cssP) stage.style.setProperty("--p", (cssP = p3));
      if (x3 !== cssX) stage.style.setProperty("--mx", (cssX = x3));
      if (y3 !== cssY) stage.style.setProperty("--my", (cssY = y3));
      // The mid-scroll caption blends with the scene (mix-blend-mode), which costs a full
      // extra compositing pass every frame: switch it on only while it can be seen
      const capOn = prog > 0.4 && prog < 0.99;
      if (capOn !== captionOn) {
        captionOn = capOn;
        if (capOn) stage.dataset.caption = "";
        else delete stage.dataset.caption;
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      dbgEl?.remove();
      abort.abort();
      stream?.close();
      window.clearTimeout(restTimer);
      window.removeEventListener("resize", measure);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("wheel", onWheel);
      document.removeEventListener("visibilitychange", onVisibility);
      vA.removeEventListener("playing", loadRest);
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
        {/* Shown instantly while the clips load; the 3D canvas fades in over it */}
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
            {/* Texture sources for the 3D canvas (hidden; sources are set in code) */}
            <video ref={loopARef} className={styles.videoPacked} muted loop playsInline preload="none" aria-hidden="true" />
            <video ref={breakRef} className={styles.videoPacked} muted playsInline preload="none" aria-hidden="true" />
            <video ref={loopBRef} className={styles.videoPacked} muted loop playsInline preload="none" aria-hidden="true" />
          </>
        ) : (
          <video ref={fallbackRef} className={styles.video} src={src}
            muted loop playsInline autoPlay preload="auto" aria-hidden="true" />
        )}
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />

        <div className={styles.overlay}>
          <div className={styles.topRow}>
            <span className={styles.pill}>Trace · Check · Explain</span>
          </div>

          {/* Under the band: a line, a few words on the system, and a rule marked with the
              stages on a tyre's passport; its marker moves through them as you scroll */}
          <div className={styles.sub}>
            <p className={styles.lead}>
              <span className={styles.line}>
                <span>One passport.</span>
              </span>
              <span className={styles.line}>
                <span>Every solid tyre.</span>
              </span>
            </p>
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

          {/* Fades in mid-scroll, top-left */}
          <h1 className={styles.caption}>
            Every tyre traced.
            <br />
            Every fault explained.
          </h1>

        </div>

      </div>
    </section>
  );
}
