import { dayData } from './store.js';
import { computeCurrentStreak } from './utils/data.js';
import { router } from './router.js';
import { NotificationHelper } from './notifications.js';
import { icon } from './icons.js';
import { initAuth } from './firebase-auth.js';
import { Preferences } from '@capacitor/preferences';
import { renderHomeScreen }      from './screens/home.js';
import { renderSeasonScreen }    from './screens/season.js';
import { renderDayEditorScreen } from './screens/day-editor.js';
import { renderDayViewScreen }   from './screens/day-view.js';
import { renderInsightsScreen }  from './screens/insights.js';
import { renderTrendsScreen }    from './screens/trends.js';
import { showSettingsPanel }     from './screens/settings.js';
import { shouldShowOnboarding, showOnboarding } from './components/onboarding.js';

router.register('home', (root) => renderHomeScreen(root));
router.register('season', (root, params) => renderSeasonScreen(root, params));
router.register('day-editor', (root, params) => renderDayEditorScreen(root, params));
router.register('day-view', (root, params) => renderDayViewScreen(root, params));
router.register('insights', (root) => renderInsightsScreen(root));
router.register('trends', (root) => renderTrendsScreen(root));

function buildShell() {
  document.body.innerHTML = `
    <div id="app">
      <header id="appbar">
        <button id="back-btn" class="icon-btn header-btn" style="display:none" aria-label="Back">${icon('back')}</button>
        <div id="appbar-center">
          <span id="glowing-dot"></span>
          <span id="days-count">0</span>
          <span id="days-label">Day Streak</span>
        </div>
        <div id="appbar-right">
          <button id="theme-btn" class="icon-btn header-btn" aria-label="Toggle theme">${icon('sunny')}</button>
          <button id="settings-btn" class="icon-btn header-btn" aria-label="Settings">${icon('settings')}</button>
        </div>
      </header>

      <main id="screen-root"></main>

      <nav id="bottom-nav">
        <button class="nav-btn active" data-tab="home">
          <span class="nav-icon-wrap">${icon('home', 'nav-icon')}</span>
          <span class="nav-label">Home</span>
        </button>
        <button class="nav-btn" data-tab="insights">
          <span class="nav-icon-wrap">${icon('insights', 'nav-icon')}</span>
          <span class="nav-label">Insights</span>
        </button>
        <button class="nav-btn" data-tab="trends">
          <span class="nav-icon-wrap">${icon('trends', 'nav-icon')}</span>
          <span class="nav-label">Trends</span>
        </button>
      </nav>
    </div>

    <div id="toast"></div>
  `;

  document.getElementById('back-btn').onclick = () => router.pop();
  document.getElementById('settings-btn').onclick = () => showSettingsPanel();
  document.getElementById('theme-btn').onclick = () => toggleTheme();

  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll('.nav-btn').forEach((navBtn) => navBtn.classList.remove('active'));
      btn.classList.add('active');
      router.replace(btn.dataset.tab);
    };
  });
}

// ── Theme ─────────────────────────────────────────────────────────────────────

function _updateThemeBtn(theme) {
  const btn = document.getElementById('theme-btn');
  if (!btn) return;
  btn.innerHTML = theme === 'dark' ? icon('moon') : icon('sunny');
  btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
}

function toggleTheme() {
  const root = document.documentElement;
  const current = root.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';

  const applySwitch = () => {
    root.setAttribute('data-theme', next);
    _updateThemeBtn(next);
    Preferences.set({ key: 'theme', value: next }).catch(() => {});
  };

  // View Transition API — smooth crossfade where supported (Capacitor webview always has it)
  if (document.startViewTransition) {
    const t = document.startViewTransition(applySwitch);
    // Re-render current screen after transition so charts pick up new palette
    t.finished.then(() => {
      const activeTab = document.querySelector('.nav-btn.active')?.dataset.tab;
      if (activeTab && !router.canPop()) router.replace(activeTab);
    }).catch(() => {});
  } else {
    // Fallback: gentle fade for older webviews
    const app = document.getElementById('app');
    app.style.transition = 'opacity 0.22s ease';
    app.style.opacity = '0.12';
    setTimeout(() => {
      applySwitch();
      app.style.opacity = '1';
      setTimeout(() => {
        app.style.transition = '';
        const activeTab = document.querySelector('.nav-btn.active')?.dataset.tab;
        if (activeTab && !router.canPop()) router.replace(activeTab);
      }, 260);
    }, 220);
  }
}

function updateStreak() {
  const countEl = document.getElementById('days-count');
  const labelEl = document.getElementById('days-label');
  if (!countEl) return;
  const streak = computeCurrentStreak();
  countEl.textContent = streak;
  if (labelEl) labelEl.textContent = streak === 1 ? 'Day Streak' : 'Day Streak';
}

async function init() {
  // Load saved theme before shell renders to prevent flash of wrong theme
  try {
    const { value } = await Preferences.get({ key: 'theme' });
    if (value === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  } catch (_) { /* default to light */ }

  initAuth(); // start anonymous sign-in immediately — token will be ready before any AI call
  buildShell();

  // Sync theme button icon with loaded preference
  _updateThemeBtn(document.documentElement.getAttribute('data-theme') || 'light');
  document.getElementById('screen-root').innerHTML = '<div class="loading-spinner"></div>';

  dayData.addEventListener('change', () => {
    updateStreak();
    const activeTab = document.querySelector('.nav-btn.active')?.dataset.tab;
    if (activeTab && !router.canPop()) {
      router.replace(activeTab);
    }
  });

  await new Promise((resolve) => {
    if (!dayData.isLoading) {
      resolve();
      return;
    }
    dayData.addEventListener('change', resolve, { once: true });
  });

  await NotificationHelper.restoreIfEnabled().catch(() => {});

  // Show onboarding on first launch — data is already loaded so home appears
  // instantly once the user finishes or skips.
  if (await shouldShowOnboarding()) await showOnboarding();

  router.replace('home');
  updateStreak();
}

init();
