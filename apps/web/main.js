/* ==========================================================
   Embr website: the scroll story
   Four layers, back to front:
     1. background  - sky, mountains, sun (drifts and springs with the mouse)
     2. tree + hill - one painting that stays still
     3. Embr        - his poses from the model sheet, walking on the hill
     4. grass       - close to the camera (sways, springs with the mouse)
   Scrolling tells the story: nap, wake, stand up, walk down the hill.
   ========================================================== */
import { POSES, WALK, ART, RIDGE, EMBR_HEIGHT, NAP_TILT, DEPTH_GROW } from './js/sprites.js';
import { clamp, lerp, seg, smooth } from './js/util.js';
// demo links, fade-in cards (shared with the other pages); "Try our demo" address lives there
import './js/site.js';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s) => document.querySelector(s);

const story = $('.story');
const stage = $('[data-stage]');
const nav = $('[data-nav]');
const cue = $('[data-cue]');
const copies = [...document.querySelectorAll('.copy[data-show]')].map((el) => {
  const [a, b] = el.dataset.show.split(',').map(Number);
  return { el, a, b };
});

// The background and the front grass drift on their own slow, uneven rhythm
// (two slow waves mixed together, in pixels and seconds). The mouse doesn't touch them.
const MOVERS = {
  sky: { el: $('[data-layer="sky"]'), ax: [7, 3], ay: [3, 1.5], periods: [23, 37] },
  mountains: { el: $('[data-layer="mountains"]'), ax: [3, 1.5], ay: [1.2, 0.6], periods: [29, 43] },
  front: { el: $('[data-layer="front"]'), ax: [9, 4], ay: [2.5, 1], periods: [11, 17] },
};
Object.values(MOVERS).forEach((l, i) => Object.assign(l, { x: 0, y: 0, seed: i * 2.1 }));

// the words start at this fraction of the screen width (matches `left` in styles.css)
const TEXT_LEFT = 0.55;

const hillLayer = $('[data-layer="hill"]');
const skyImg = $('.sky-art');
const mtnImg = $('.mountain-art');
const hillImg = $('.hill-art');
const grassImg = $('.front-grass');
const embrEl = $('[data-embr]');
const glow = embrEl.querySelector('.embr__glow');
const zzs = [...embrEl.querySelectorAll('.zz')];
const bang = embrEl.querySelector('.bang');

const poseEls = {};
for (const name of Object.keys(POSES)) {
  const img = new Image();
  img.src = `assets/embr/${name}.webp`;
  img.alt = '';
  img.decoding = 'async';
  embrEl.insertBefore(img, zzs[0]);
  poseEls[name] = img;
}

// ---------- the path along the top of the hill ----------
const segs = RIDGE.slice(1).map((p, i) => Math.hypot(p[0] - RIDGE[i][0], p[1] - RIDGE[i][1]));
const RIDGE_LEN = segs.reduce((a, b) => a + b, 0);
function onRidge(d) {
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      const u = clamp(d / segs[i]);
      return { x: lerp(RIDGE[i][0], RIDGE[i + 1][0], u), y: lerp(RIDGE[i][1], RIDGE[i + 1][1], u) + 6 };
    }
    d -= segs[i];
  }
  return { x: RIDGE[0][0], y: RIDGE[0][1] + 6 };
}

// ---------- sizes ----------
let vw = 0, vh = 0, narrow = false;
let artW = 0, artH = 0, sceneW = 0, sc = 1, baseTx = 0, ty = 0, tx = 0;
let skyW = 0, skyH = 0, skyLeft = 0, skyTop = 0, k = 1, walkLen = RIDGE_LEN, exitLen = RIDGE_LEN;

/** Distance along the hill path to the point where it reaches image x. */
function distAtX(x) {
  let d = 0;
  for (let i = 0; i < segs.length; i++) {
    if (RIDGE[i + 1][0] >= x) return d + segs[i] * clamp((x - RIDGE[i][0]) / (RIDGE[i + 1][0] - RIDGE[i][0]));
    d += segs[i];
  }
  return RIDGE_LEN;
}

/** How far along the hill Embr is at scroll progress p: he reaches the far side of the
 *  screen, then keeps walking and leaves the frame just as the story ends. */
function walkDist(p) {
  if (p < 0.85) return walkLen * seg(p, 0.3, 0.85);
  return lerp(walkLen, exitLen, seg(p, 0.85, 1));
}

function measure() {
  vw = stage.clientWidth;
  vh = stage.clientHeight;
  narrow = vw < 760;

  // the mountains + tree/hill scene: sized so the original painting covers the screen
  const S = ART.scene;
  const R = S.base / S.h;
  artW = Math.max(vw, vh * R);
  artH = artW / R;
  sc = artW / S.base;
  sceneW = S.w * sc;
  ty = (vh - artH) * 0.35;
  // on wider screens, slide the tree left so its leaves end before the words start,
  // but never so far that Embr's napping spot leaves the screen
  const fitTx = vw * TEXT_LEFT - 24 - S.leavesRight * sc;
  const keepNap = 70 - RIDGE[0][0] * sc;
  baseTx = Math.min((vw - artW) * 0.25, Math.max(fitTx, keepNap));
  if (narrow) tx = tx || (vw - artW) * 0.25;
  else tx = baseTx;
  for (const img of [mtnImg, hillImg]) {
    Object.assign(img.style, { width: `${sceneW}px`, height: `${artH}px`, left: '0px', top: '0px' });
  }

  // the sky: always covers the screen, with its sun sitting just above the far mountains
  const skyR = ART.sky.w / ART.sky.h;
  const sunX = (narrow ? tx : baseTx) + S.sun[0] * sc;
  const sunY = ty + S.sun[1] * sc;
  skyH = Math.max(vh * 1.1, (sunY + 40) / ART.sky.sunY);
  skyW = skyH * skyR;
  if (skyW < vw * 1.25) {
    skyW = vw * 1.25;
    skyH = skyW / skyR;
  }
  skyLeft = sunX - ART.sky.sunX * skyW;
  skyTop = sunY - ART.sky.sunY * skyH;
  Object.assign(skyImg.style, { width: `${skyW}px`, height: `${skyH}px`, left: '0px', top: '0px' });

  // front grass: one wide piece, only its tips peek up along the bottom
  const gw = Math.max(vw * 1.12, vh * 1.0);
  const gh = gw * (ART.grass.h / ART.grass.w);
  Object.assign(grassImg.style, {
    width: `${gw}px`, height: `${gh}px`,
    left: `${(vw - gw) / 2}px`, top: `${vh * 0.87 - gh * ART.grass.top}px`,
  });

  // Embr's poses, all lined up on the same feet point
  k = (sc * EMBR_HEIGHT) / 240;
  for (const [name, p] of Object.entries(POSES)) {
    const s = k * p.scale;
    const ax = p.mirror ? p.w - p.ax : p.ax;
    Object.assign(poseEls[name].style, {
      width: `${p.w * s}px`, height: `${p.h * s}px`,
      left: `${-ax * s}px`, top: `${-p.ay * s}px`,
      transform: p.mirror ? 'scaleX(-1)' : '',
    });
  }
  const H = EMBR_HEIGHT * sc;
  Object.assign(glow.style, { width: `${H * 1.8}px`, height: `${H * 1.8}px` });
  zzs.forEach((z) => (z.style.fontSize = `${H * 0.13}px`));
  Object.assign(bang.style, { width: `${H * 0.26}px`, height: `${H * 0.26}px` });

  // how far he walks: down the hill to the edge of the screen, then on out of sight
  const lastTx = narrow ? vw - sceneW : baseTx;
  walkLen = distAtX((vw - H * 0.6 - lastTx) / sc);
  exitLen = distAtX((vw + H * 1.2 - lastTx) / sc);
  sparks.resize();
}

// ---------- the scene's own rhythm (no mouse) ----------
let wind = 0;
function rhythm(t) {
  if (reduceMotion) return;
  const TAU = Math.PI * 2;
  for (const l of Object.values(MOVERS)) {
    const [p1, p2] = l.periods;
    l.x = Math.sin((t / p1) * TAU + l.seed) * l.ax[0] + Math.sin((t / p2) * TAU + l.seed * 2) * l.ax[1];
    l.y = Math.cos((t / p1) * TAU * 0.8 + l.seed) * l.ay[0] + Math.sin((t / p2) * TAU + l.seed) * l.ay[1];
  }
  // a gentle breeze with the odd stronger gust now and then
  const gust = Math.pow(Math.max(0, Math.sin((t / 19) * TAU)), 3) * 2.2;
  wind = Math.sin((t / 7) * TAU) * 0.9 + Math.sin((t / 3.1) * TAU + 1) * 0.35 + gust;
}

// ---------- the mouse only moves Embr ----------
// He leans toward the cursor and shifts a little, on a springy wobble. His feet stay put.
let mx = 0, lastMx = 0;
const lean = { a: 0, va: 0, x: 0, vx: 0 };
addEventListener('pointermove', (e) => {
  if (e.pointerType === 'touch') return;
  mx = (e.clientX / innerWidth) * 2 - 1;
}, { passive: true });

function embrSpring(dt) {
  if (reduceMotion) return;
  const step = Math.min(dt * 60, 3);
  const mouseV = (mx - lastMx) / Math.max(dt, 0.001);
  lastMx = mx;
  const H = EMBR_HEIGHT * sc;
  // a quick flick of the mouse gives him a little extra wobble
  lean.va += clamp(mouseV * 0.25, -4, 4) * step;
  lean.va = (lean.va + (mx * 7 - lean.a) * 0.07 * step) * Math.pow(0.84, step);
  lean.vx = (lean.vx + (mx * H * 0.1 - lean.x) * 0.07 * step) * Math.pow(0.84, step);
  lean.a = clamp(lean.a + lean.va * step, -14, 14);
  lean.x += lean.vx * step;
}

// ---------- floating sparks from Embr's flame ----------
const sparks = (() => {
  const canvas = $('[data-sparks]');
  const ctx = canvas.getContext('2d');
  const parts = [];
  let dpr = 1;
  const src = { x: 0, y: 0, r: 20, rate: 1 };
  const dot = document.createElement('canvas');
  dot.width = dot.height = 32;
  const g = dot.getContext('2d');
  const grd = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grd.addColorStop(0, 'rgba(255,190,90,1)');
  grd.addColorStop(0.4, 'rgba(255,90,40,0.6)');
  grd.addColorStop(1, 'rgba(255,60,30,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 32, 32);
  return {
    src,
    resize() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(vw * dpr);
      canvas.height = Math.round(vh * dpr);
    },
    draw(dt) {
      if (reduceMotion) return;
      if (parts.length < 22 && Math.random() < dt * 9 * src.rate) {
        parts.push({
          x: src.x + (Math.random() - 0.5) * src.r, y: src.y + (Math.random() - 0.5) * src.r * 0.6,
          vx: (Math.random() - 0.6) * 18, vy: -(16 + Math.random() * 26), life: 0, ttl: 1.6 + Math.random() * 1.8,
          size: 2.5 + Math.random() * 4.5, sway: Math.random() * 6,
        });
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, vw, vh);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life += dt;
        if (p.life > p.ttl) { parts.splice(i, 1); continue; }
        p.sway += dt * 2;
        p.x += (p.vx + Math.sin(p.sway) * 8 + wind * 6) * dt;
        p.y += p.vy * dt;
        ctx.globalAlpha = Math.sin((Math.PI * p.life) / p.ttl) * 0.9;
        const s = p.size * (1 - (p.life / p.ttl) * 0.5);
        ctx.drawImage(dot, p.x - s, p.y - s, s * 2, s * 2);
      }
      ctx.globalAlpha = 1;
    },
  };
})();

// ---------- the story ----------
const STRIDE = 120; // painting pixels Embr covers in one full walk cycle
let lastDist = 0, moving = 0;

function render(p, t, dt) {
  // what Embr is doing
  const awake = smooth(seg(p, 0.15, 0.18));
  const startle = Math.sin(Math.PI * seg(p, 0.155, 0.2));
  const stand = smooth(seg(p, 0.22, 0.3));
  const walkIn = smooth(seg(p, 0.29, 0.33));
  const dist = walkDist(p);

  // walking only while he's actually moving; when the scroll stops he settles into standing
  const speed = Math.abs(dist - lastDist) / Math.max(dt, 0.001);
  lastDist = dist;
  const target = speed > 6 ? 1 : 0;
  moving += (target - moving) * clamp(dt * (target ? 14 : 7));
  const frame = Math.floor((dist / STRIDE) * WALK.length) % WALK.length;

  const spot = onRidge(dist);

  // on phones the painting slides along so Embr stays in view; on wider screens it stays still
  if (narrow) {
    const want = clamp(vw * 0.5 - spot.x * sc, vw - sceneW, 0);
    tx += (want - tx) * clamp(dt * 6);
  } else tx = baseTx;
  hillLayer.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0)`;

  // background: its own slow drift plus a little with the scroll, always covering the screen
  const sky = MOVERS.sky;
  const bx = clamp(skyLeft + (tx - baseTx) * 0.25 - p * vw * 0.03 + sky.x, vw - skyW, 0);
  // the sky only has to reach down behind the mountains (they and the hill cover everything below)
  const by = clamp(skyTop + sky.y, ty + 640 * sc - skyH, 0);
  sky.el.style.transform = `translate3d(${bx.toFixed(1)}px, ${by.toFixed(1)}px, 0)`;

  // mountains: sit with the hill (so the valley meets the grass), drifting very slightly
  const mt = MOVERS.mountains;
  mt.el.style.transform = `translate3d(${(tx + mt.x).toFixed(1)}px, ${(ty + mt.y).toFixed(1)}px, 0)`;

  // front grass: drifts on its own and sways in the breeze
  const fr = MOVERS.front;
  fr.el.style.transform = `translate3d(${fr.x.toFixed(1)}px, ${fr.y.toFixed(1)}px, 0)`;
  const sway = reduceMotion ? 0 : Math.sin(t * 0.9) * 0.9 + Math.sin(t * 2.3) * 0.3;
  grassImg.style.transform = `skewX(${(sway + wind).toFixed(2)}deg)`;

  // Embr: pick and blend his poses
  const op = {
    'lie-sleep': (1 - awake) * (1 - stand),
    'lie-awake': awake * (1 - stand),
    right: stand * (1 - walkIn * moving),
  };
  WALK.forEach((w, i) => (op[w] = i === frame ? stand * walkIn * moving : 0));
  for (const [name, el] of Object.entries(poseEls)) el.style.opacity = (op[name] || 0).toFixed(3);

  // breathing, a jolt when he wakes, a stretch as he stands
  const H = EMBR_HEIGHT * sc;
  const breathe = reduceMotion ? 0 : Math.sin(t * 1.8) * 0.014 * (1 - moving * walkIn);
  const stretch = Math.sin(Math.PI * stand) * 0.07;
  const hop = startle * H * 0.08 + Math.sin(Math.PI * stand) * H * 0.06;
  const ex = tx + spot.x * sc;
  const ey = ty + spot.y * sc;
  // a little bigger the further down the field he gets (closer to us)
  const depth = 1 + DEPTH_GROW * clamp((spot.y - RIDGE[0][1]) / (RIDGE[RIDGE.length - 1][1] - RIDGE[0][1]));
  // the mouse: lean toward the cursor around his feet (only once he's up)
  // lying: follow the slope of the hill; standing: lean toward the mouse
  const leanA = lean.a * stand + NAP_TILT * (1 - stand);
  embrEl.style.transform =
    `translate3d(${(ex + lean.x * stand).toFixed(1)}px, ${(ey - hop).toFixed(1)}px, 0) ` +
    `rotate(${leanA.toFixed(2)}deg) ` +
    `scale(${(depth * (1 - stretch * 0.5)).toFixed(4)}, ${(depth * (1 + stretch + breathe)).toFixed(4)})`;

  // glow, sleepy z's and the "!" when he wakes
  const headX = lerp(H * 0.3, H * 0.05, stand);
  const headY = lerp(H * 0.42, H * 0.72, stand);
  const gsz = H * 1.8;
  glow.style.left = `${headX - gsz / 2}px`;
  glow.style.top = `${-headY - gsz / 2}px`;
  glow.style.opacity = (0.75 + Math.sin(t * 3.1) * 0.12 + Math.sin(t * 7.3) * 0.05).toFixed(3);
  const sleepy = (1 - awake) * (1 - stand);
  zzs.forEach((z, i) => {
    const ph = (t * 0.4 + i / 3) % 1;
    z.style.opacity = (sleepy * Math.sin(Math.PI * ph)).toFixed(2);
    z.style.transform = `translate(${(H * (0.45 + ph * 0.25) + i * 3).toFixed(1)}px, ${(-H * (0.75 + ph * 0.4)).toFixed(1)}px) scale(${(0.7 + ph * 0.6).toFixed(2)})`;
  });
  bang.style.opacity = startle.toFixed(2);
  bang.style.transform = `translate(${(H * 0.45).toFixed(1)}px, ${(-H * 0.85).toFixed(1)}px) scale(${(0.6 + startle * 0.5).toFixed(2)})`;

  sparks.src.x = ex + headX;
  sparks.src.y = ey - hop - headY;
  sparks.src.r = H * 0.45;
  sparks.src.rate = 0.6 + 0.6 * awake;

  // words fade and drift in their windows
  for (const c of copies) {
    const fadeIn = c.a === 0 ? 1 : smooth(seg(p, c.a, c.a + 0.035));
    const fadeOut = c.b >= 1 ? 1 : 1 - smooth(seg(p, c.b - 0.035, c.b));
    const o = Math.min(fadeIn, fadeOut);
    const y = (1 - fadeIn) * 20 - (1 - fadeOut) * 20;
    c.el.style.opacity = o.toFixed(3);
    c.el.style.transform = reduceMotion ? '' : `translate3d(0, ${y.toFixed(1)}px, 0)`;
    c.el.classList.toggle('is-active', o > 0.5);
  }
  if (cue) cue.style.opacity = (1 - seg(p, 0, 0.04)).toFixed(3);
}

// ---------- scroll + animation loop ----------
let target = 0, current = 0, running = true, last = performance.now();
function readProgress() {
  const travel = story.offsetHeight - vh;
  return travel > 0 ? clamp(-story.getBoundingClientRect().top / travel) : 0;
}
function onScroll() {
  target = readProgress();
  nav.classList.toggle('is-light', story.getBoundingClientRect().bottom < 70);
}
function tick(now) {
  if (!running) return;
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  current += (target - current) * (reduceMotion ? 1 : 1 - Math.pow(0.9, dt * 60));
  if (Math.abs(target - current) < 0.00002) current = target;
  rhythm(now / 1000);
  embrSpring(dt);
  render(current, now / 1000, dt);
  sparks.draw(dt);
  requestAnimationFrame(tick);
}

measure();
onScroll();
current = target;
lastDist = walkDist(current);
requestAnimationFrame(tick);
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', () => {
  measure();
  onScroll();
});

// pause when the story is off screen (saves battery)
new IntersectionObserver(([e]) => {
  if (e.isIntersecting && !running) {
    running = true;
    last = performance.now();
    requestAnimationFrame(tick);
  } else if (!e.isIntersecting) running = false;
}).observe(stage);
