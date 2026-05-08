import { Preferences } from '@capacitor/preferences';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { icon } from '../icons.js';
import { el } from '../utils/dom.js';

const PREF_KEY = 'onboarding_v1';

const SLIDES = [
  {
    icon:     'sunny',
    color:    '#E8673C',
    glow:     'rgba(255,159,122,0.55)',
    bgFrom:   '#FFF4E6',
    bgTo:     '#FFD6A5',
    headline: 'Welcome to\nInnerWeather',
    sub:      'Your personal space to track, reflect, and understand your emotional world — one day at a time.',
  },
  {
    icon:     'edit',
    color:    '#C1502A',
    glow:     'rgba(250,177,64,0.50)',
    bgFrom:   '#FFFBF0',
    bgTo:     '#FFE8A0',
    headline: 'Log Your Day',
    sub:      'Rate your mood from 0–100, pick your inner weather, and add a quick note. Takes 30 seconds.',
  },
  {
    icon:     'brain',
    color:    '#A84020',
    glow:     'rgba(220,120,70,0.48)',
    bgFrom:   '#FFF0E0',
    bgTo:     '#FFCCA0',
    headline: 'Discover Patterns',
    sub:      'Weekly and monthly AI insights reveal the emotional trends that shape your inner weather.',
  },
  {
    icon:     'insights',
    color:    '#E8673C',
    glow:     'rgba(255,159,122,0.60)',
    bgFrom:   '#FFF4E6',
    bgTo:     '#FFBA80',
    headline: "You're All Set",
    sub:      'Your first check-in is just a tap away. Begin your journey with InnerWeather.',
  },
];

// ── Public API ────────────────────────────────────────────────────────────────

export async function shouldShowOnboarding() {
  try {
    const { value } = await Preferences.get({ key: PREF_KEY });
    return value !== 'true';
  } catch { return false; }
}

export function showOnboarding() {
  return new Promise((resolve) => {
    let current    = 0;
    let startX     = 0;
    let isDragging = false;

    // ── Shell ──────────────────────────────────────────────────────────────
    const overlay = el('div', 'ob-overlay');
    const track   = el('div', 'ob-track');
    track.style.width = `${SLIDES.length * 100}vw`;

    // ── Slides ─────────────────────────────────────────────────────────────
    const slideEls = SLIDES.map((s) => {
      const slide = el('div', 'ob-slide');
      slide.style.cssText = `
        background: linear-gradient(160deg, ${s.bgFrom} 0%, ${s.bgTo} 100%);
        --slide-color: ${s.color};
        --slide-glow:  ${s.glow};
      `;

      const hero    = el('div', 'ob-hero');
      const glow    = el('div', 'ob-glow');
      const iconBox = el('div', 'ob-icon-box');
      iconBox.innerHTML = icon(s.icon, 'ob-svg', 1.5);
      hero.append(glow, iconBox);

      const textWrap = el('div', 'ob-text');
      const title    = el('h2', 'ob-title');
      title.innerHTML = s.headline.replace('\n', '<br>');
      const sub = el('p', 'ob-sub', s.sub);
      textWrap.append(title, sub);

      slide.append(hero, textWrap);
      return slide;
    });
    slideEls.forEach((s) => track.appendChild(s));

    // ── Dots ───────────────────────────────────────────────────────────────
    const dotsRow = el('div', 'ob-dots');
    SLIDES.forEach((_, i) => dotsRow.appendChild(el('div', 'ob-dot')));

    // ── Buttons ────────────────────────────────────────────────────────────
    const skipBtn = el('button', 'ob-skip', 'Skip');
    const nextBtn = el('button', 'ob-next', 'Next');
    const actions = el('div', 'ob-actions');
    actions.append(skipBtn, dotsRow, nextBtn);

    overlay.append(track, actions);
    document.body.appendChild(overlay);

    // ── State sync ─────────────────────────────────────────────────────────
    function syncUI(instant = false) {
      if (instant) track.style.transition = 'none';
      track.style.transform = `translateX(${-current * 100}vw)`;
      if (instant) requestAnimationFrame(() => { track.style.transition = ''; });

      dotsRow.querySelectorAll('.ob-dot').forEach((d, i) => {
        d.classList.toggle('ob-dot--active', i === current);
      });

      const isLast = current === SLIDES.length - 1;
      nextBtn.textContent    = isLast ? 'Get Started' : 'Next';
      nextBtn.classList.toggle('ob-next--final', isLast);
      skipBtn.style.opacity  = isLast ? '0' : '1';
      skipBtn.style.pointerEvents = isLast ? 'none' : '';

      // Pop the icon on the current slide
      slideEls.forEach((s) => s.classList.remove('ob-slide--active'));
      requestAnimationFrame(() => slideEls[current].classList.add('ob-slide--active'));
    }

    // ── Navigation ─────────────────────────────────────────────────────────
    async function goTo(index) {
      if (index < 0 || index >= SLIDES.length || index === current) return;
      await Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      current = index;
      syncUI();
    }

    async function finish() {
      await Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
      overlay.classList.add('ob-overlay--exit');
      await Preferences.set({ key: PREF_KEY, value: 'true' }).catch(() => {});
      setTimeout(() => { overlay.remove(); resolve(); }, 480);
    }

    nextBtn.onclick = () => (current < SLIDES.length - 1 ? goTo(current + 1) : finish());
    skipBtn.onclick = finish;

    // ── Swipe ──────────────────────────────────────────────────────────────
    overlay.addEventListener('touchstart', (e) => {
      startX     = e.touches[0].clientX;
      isDragging = true;
    }, { passive: true });

    overlay.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      isDragging = false;
      const diff = startX - e.changedTouches[0].clientX;
      if (diff > 55)       goTo(current + 1);
      else if (diff < -55) goTo(current - 1);
    }, { passive: true });

    // ── Entrance ───────────────────────────────────────────────────────────
    syncUI(true); // set initial state without animation
    requestAnimationFrame(() => requestAnimationFrame(() => {
      overlay.classList.add('ob-overlay--visible');
    }));
  });
}
