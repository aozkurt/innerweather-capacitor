import { iconBadge } from '../utils/dom.js';
import { dayData } from '../store.js';
import { router, onCleanup } from '../router.js';
import { el } from '../utils/dom.js';

// ── Particle color palettes ─────────────────────────────────────────────────

const PALETTES = {
  // Pink cherry-blossom petals + fresh green leaves
  spring: ['#FFB7C5', '#FF8FAB', '#F5C0CC', '#FFD1DC', '#E8A0B4', '#72C462', '#5AAE4C', '#7BD46C'],
  // Deep and mid greens — contrast against the golden card bg
  summer: ['#1A6B2C', '#2A8A3C', '#157528', '#3BA050', '#0E5C22', '#28944A', '#1D7A34'],
  // Crimson, sienna, golden-brown — pop against the warm orange card bg
  fall:   ['#A81A08', '#C43A18', '#8B2010', '#D45222', '#9C3A1A', '#C89408', '#B07A08', '#7A2808'],
  // Snow — white dots
  winter: null,
};

// Leaf width ratio: controls roundness vs. elongation of leaf shape
const LEAF_WX = { spring: 0.68, summer: 0.86, fall: 0.82 };

// ── Snowfall (winter) ───────────────────────────────────────────────────────

function _makeFlake(W, H) {
  return {
    x: Math.random() * W, y: Math.random() * H,
    r: 0.7 + Math.random() * 2.6,
    vy: 0.14 + Math.random() * 0.36,
    wobble: Math.random() * Math.PI * 2,
    ws: 0.004 + Math.random() * 0.009, wa: 0.10 + Math.random() * 0.35,
    a: 0.20 + Math.random() * 0.75,
  };
}

function _tickFlake(f, W, H) {
  f.wobble += f.ws; f.x += Math.sin(f.wobble) * f.wa; f.y += f.vy;
  if (f.y > H + 4) { f.y = -4; f.x = Math.random() * W; }
  if (f.x > W + 4) f.x = 0;
  if (f.x < -4) f.x = W;
}

function _drawFlake(ctx, f) {
  if (f.r > 1.8) {
    ctx.beginPath(); ctx.arc(f.x, f.y, f.r * 2.4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${f.a * 0.12})`; ctx.fill();
  }
  ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255,255,255,${f.a})`; ctx.fill();
}

function _startSnowfall(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.offsetWidth, H = canvas.offsetHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr);
  const flakes = Array.from({ length: 60 }, () => _makeFlake(W, H));
  let rafId;
  const draw = () => {
    if (!canvas.isConnected) return;
    ctx.clearRect(0, 0, W, H);
    flakes.forEach(f => { _drawFlake(ctx, f); _tickFlake(f, W, H); });
    rafId = requestAnimationFrame(draw);
  };
  rafId = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(rafId);
}

// ── Leaf fall (spring / summer / fall) ─────────────────────────────────────

function _makeLeaf(W, H, colors, wx) {
  return {
    x: Math.random() * W, y: Math.random() * H,
    size: 4 + Math.random() * 6, rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.013,
    vy: 0.12 + Math.random() * 0.24, wobble: Math.random() * Math.PI * 2,
    ws: 0.003 + Math.random() * 0.006, wa: 0.3 + Math.random() * 0.6,
    a: 0.50 + Math.random() * 0.50,
    color: colors[Math.floor(Math.random() * colors.length)], wx,
  };
}

function _tickLeaf(f, W, H) {
  f.wobble += f.ws; f.rot += f.rotSpeed;
  f.x += Math.sin(f.wobble) * f.wa; f.y += f.vy;
  if (f.y > H + 16) { f.y = -16; f.x = Math.random() * W; }
  if (f.x > W + 16) f.x = -16;
  if (f.x < -16) f.x = W + 16;
}

function _drawLeaf(ctx, f) {
  ctx.save();
  ctx.translate(f.x, f.y); ctx.rotate(f.rot); ctx.globalAlpha = f.a;
  ctx.fillStyle = f.color; ctx.beginPath(); ctx.moveTo(0, -f.size);
  ctx.bezierCurveTo( f.size * f.wx, -f.size * 0.38,  f.size * f.wx,  f.size * 0.38, 0,  f.size);
  ctx.bezierCurveTo(-f.size * f.wx,  f.size * 0.38, -f.size * f.wx, -f.size * 0.38, 0, -f.size);
  ctx.closePath(); ctx.fill(); ctx.restore();
}

function _startLeaffall(canvas, colors, wx) {
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.offsetWidth, H = canvas.offsetHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr);
  const leaves = Array.from({ length: 20 }, () => _makeLeaf(W, H, colors, wx));
  let rafId;
  const draw = () => {
    if (!canvas.isConnected) return;
    ctx.clearRect(0, 0, W, H);
    leaves.forEach(f => { _drawLeaf(ctx, f); _tickLeaf(f, W, H); });
    rafId = requestAnimationFrame(draw);
  };
  rafId = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(rafId);
}

// ── Season card ─────────────────────────────────────────────────────────────

export function buildSeasonCard({ name, color, iconName }) {
  const count = dayData.getDaysForSeason(name).length;
  const card = el('div', 'season-card');
  card.style.setProperty('--season-fallback', `linear-gradient(180deg, ${color}, rgba(255,255,255,0.76))`);

  const canvas = document.createElement('canvas');
  canvas.className = 'season-card-bg';
  card.appendChild(canvas);

  const content = document.createElement('div');
  content.className = 'season-card-content';
  content.innerHTML = `
    <div class="season-card-top">
      ${iconBadge(iconName)}
      <span class="season-name">${name}</span>
    </div>
    <span class="season-count">${count} ${count === 1 ? 'entry' : 'entries'}</span>
  `;
  card.appendChild(content);
  card.onclick = () => router.push('season', { season: name });

  card._initRive = () => {
    if (iconName === 'winter') { onCleanup(_startSnowfall(canvas)); return; }
    const colors = PALETTES[iconName];
    const wx     = LEAF_WX[iconName] ?? 0.82;
    if (colors) { onCleanup(_startLeaffall(canvas, colors, wx)); return; }
    card.style.background = `var(--season-fallback)`;
  };

  return card;
}
