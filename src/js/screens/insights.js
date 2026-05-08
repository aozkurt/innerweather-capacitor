import { dayData, DateHelper, IconUtils } from '../store.js';
import { router } from '../router.js';
import { icon } from '../icons.js';
import { renderWeekdaysBarChart } from '../charts.js';
import { el, iconBadge } from '../utils/dom.js';
import { getAllRealDays, computeCurrentStreak } from '../utils/data.js';
import { onCleanup } from '../router.js';

export function renderInsightsScreen(root) {
  const wrap = el('div', 'screen-scroll');
  const header = el('section', 'screen-header');
  header.innerHTML = `
    <span class="eyebrow">Insights</span>
    <h2 class="screen-title">Patterns worth noticing</h2>
    <p class="screen-subtitle">Your mood trends, strongest days, and how weather may be influencing them.</p>
  `;
  wrap.appendChild(header);

  // 1 — Summary stats
  wrap.appendChild(buildSummaryStats());

  // 2 — Recent momentum
  wrap.appendChild(buildMomentum());

  // 3 — Weekday chart (below momentum)
  wrap.appendChild(el('p', 'graph-title', 'Average Mood by Weekday'));
  const weekdaysCard = el('div', 'wrapper-card chart-card');
  const weekdaysCanvas = document.createElement('canvas');
  weekdaysCanvas.height = 220;
  weekdaysCard.appendChild(weekdaysCanvas);
  wrap.appendChild(weekdaysCard);

  // 4 — Mood distribution
  wrap.appendChild(buildMoodDistribution());

  // 5 — Season averages
  wrap.appendChild(buildSeasonAverages());

  // 6 — Weather card
  wrap.appendChild(buildWeatherCard());

  // 7 — Best / worst highlight pair
  const highlightPair = buildHighlightPair();
  if (highlightPair) wrap.appendChild(highlightPair);

  root.appendChild(wrap);
  let _weekdaysChart = null;
  requestAnimationFrame(() => { _weekdaysChart = renderWeekdaysBarChart(weekdaysCanvas); });
  onCleanup(() => { if (_weekdaysChart) { _weekdaysChart.destroy(); _weekdaysChart = null; } });
}

function buildSummaryStats() {
  const realDays = getAllRealDays();
  const total = realDays.length;
  const avg = total > 0 ? realDays.reduce((s, d) => s + d.mood, 0) / total : null;
  const streak = computeCurrentStreak();

  const grid = el('div', 'stat-chips');
  [
    { label: 'Total Entries', value: total > 0 ? total.toString() : '—', ic: 'trends' },
    { label: 'All-Time Avg', value: avg !== null ? avg.toFixed(1) : '—', ic: 'brain' },
    { label: 'Day Streak', value: streak > 0 ? streak.toString() : '—', ic: 'sunny' },
  ].forEach(({ label, value, ic }) => {
    const chip = el('div', 'stat-chip');
    chip.innerHTML = `
      <div class="stat-chip-icon">${icon(ic)}</div>
      <div class="stat-chip-value">${value}</div>
      <div class="stat-chip-label">${label}</div>
    `;
    grid.appendChild(chip);
  });
  return grid;
}

function buildMoodDistribution() {
  const realDays = getAllRealDays();
  const total = realDays.length;
  const bands = [
    { label: 'Great', min: 80, max: 100, color: '#3AB54A' },
    { label: 'Good',  min: 60, max: 79,  color: '#91CA5F' },
    { label: 'Okay',  min: 40, max: 59,  color: '#FAB140' },
    { label: 'Low',   min: 20, max: 39,  color: '#F25A29' },
    { label: 'Hard',  min: 0,  max: 19,  color: '#E12025' },
  ];

  const card = el('div', 'wrapper-card mood-dist-card');
  card.innerHTML = `<div class="insight-card-title">Mood Distribution</div>`;
  const list = el('div', 'mood-dist-list');

  bands.forEach(({ label, min, max, color }) => {
    const count = total > 0 ? realDays.filter((d) => d.mood >= min && d.mood <= max).length : 0;
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    const row = el('div', 'mood-dist-row');
    row.innerHTML = `
      <span class="mood-dist-label">${label}</span>
      <div class="mood-dist-track">
        <div class="mood-dist-fill" style="width:${pct}%;background:${color}"></div>
      </div>
      <span class="mood-dist-pct">${pct}%</span>
    `;
    list.appendChild(row);
  });

  card.appendChild(list);
  return card;
}

function buildMomentum() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const cutoff7  = new Date(now); cutoff7.setDate(now.getDate() - 7);
  const cutoff14 = new Date(now); cutoff14.setDate(now.getDate() - 14);

  const allDays = [
    ...dayData.getDaysForSeason('Spring'),
    ...dayData.getDaysForSeason('Summer'),
    ...dayData.getDaysForSeason('Fall'),
    ...dayData.getDaysForSeason('Winter'),
  ].filter((d) => d.mood != null);

  const avg = (arr) => arr.length > 0 ? arr.reduce((s, d) => s + d.mood, 0) / arr.length : null;

  const recentAvg = avg(allDays.filter((d) => {
    const dt = DateHelper.parseFormattedDate(d.date); dt.setHours(0,0,0,0);
    return dt >= cutoff7 && dt < now;
  }));
  const prevAvg = avg(allDays.filter((d) => {
    const dt = DateHelper.parseFormattedDate(d.date); dt.setHours(0,0,0,0);
    return dt >= cutoff14 && dt < cutoff7;
  }));

  const card = el('div', 'wrapper-card momentum-card');

  if (recentAvg === null) {
    card.innerHTML = `
      <div class="insight-card-title">Recent Momentum</div>
      <p class="momentum-empty">Log entries this week to see your trend.</p>
    `;
    return card;
  }

  let arrowClass = 'momentum-flat';
  let arrowChar = '→';
  let trendLabel = 'Stable';
  if (prevAvg !== null) {
    const diff = recentAvg - prevAvg;
    if (diff >= 3)  { arrowClass = 'momentum-up';   arrowChar = '↑'; trendLabel = 'Trending up'; }
    if (diff <= -3) { arrowClass = 'momentum-down'; arrowChar = '↓'; trendLabel = 'Trending down'; }
  }

  card.innerHTML = `
    <div class="insight-card-title">Recent Momentum</div>
    <div class="momentum-body">
      <div class="momentum-col">
        <div class="momentum-num">${recentAvg.toFixed(1)}</div>
        <div class="momentum-sub">Last 7 days</div>
      </div>
      <div class="momentum-arrow ${arrowClass}">${arrowChar}</div>
      <div class="momentum-col">
        <div class="momentum-num">${prevAvg !== null ? prevAvg.toFixed(1) : '—'}</div>
        <div class="momentum-sub">Prev 7 days</div>
      </div>
    </div>
    <div class="momentum-trend ${arrowClass}">${trendLabel}</div>
  `;
  return card;
}

function buildSeasonAverages() {
  const seasons = [
    { name: 'Spring', color: '#9BD58A', iconName: 'spring' },
    { name: 'Summer', color: '#F6C768', iconName: 'summer' },
    { name: 'Fall',   color: '#CF8751', iconName: 'fall' },
    { name: 'Winter', color: '#A9D2F3', iconName: 'winter' },
  ];

  const card = el('div', 'wrapper-card season-avg-card');
  card.innerHTML = `<div class="insight-card-title">Average by Season</div>`;
  const list = el('div', 'season-avg-list');

  seasons.forEach(({ name, color, iconName: ic }) => {
    const days = dayData.getDaysForSeason(name).filter((d) => !d.isAutoCreated && d.mood != null);
    const avg = days.length > 0 ? (days.reduce((s, d) => s + d.mood, 0) / days.length) : null;
    const row = el('div', 'season-avg-row');
    row.innerHTML = `
      <span class="season-avg-icon">${icon(ic)}</span>
      <span class="season-avg-name">${name}</span>
      <div class="season-avg-track">
        <div class="season-avg-fill" style="width:${avg ?? 0}%;background:${color}"></div>
      </div>
      <span class="season-avg-val">${avg !== null ? avg.toFixed(1) : '—'}</span>
    `;
    list.appendChild(row);
  });

  card.appendChild(list);
  return card;
}

function buildWeatherCard() {
  const avgMoods = dayData.averageMoodByWeather;
  const frequencies = dayData.weatherFrequency;

  const card = el('div', 'wrapper-card weather-insight-card');
  card.innerHTML = `<div class="insight-card-title">Average Mood by Weather</div>`;
  const list = el('div', 'weather-insight-list');

  for (const [weather, iconName] of Object.entries(IconUtils.weatherIcons)) {
    const frequency = frequencies[weather] ?? 0;
    const mood = frequency > 0 ? (avgMoods[weather] ?? 50) : null;
    const moodColor = mood !== null ? IconUtils.getMoodColor(mood) : '#ccc';
    const row = el('div', 'weather-insight-row');
    row.innerHTML = `
      <span class="weather-insight-icon">${icon(iconName)}</span>
      <span class="weather-insight-name">${weather}</span>
      <div class="weather-insight-track">
        <div class="weather-insight-fill" style="width:${mood ?? 0}%;background:${moodColor}"></div>
      </div>
      <div class="weather-insight-right">
        <span class="weather-insight-val">${mood !== null ? mood.toFixed(1) : '—'}</span>
        <span class="weather-insight-freq">${frequency}d</span>
      </div>
    `;
    list.appendChild(row);
  }

  card.appendChild(list);
  return card;
}

function buildHighlightPair() {
  const best  = dayData.oneOfBestDays;
  const worst = dayData.oneOfWorstDays;
  if (!best && !worst) return null;

  const card = el('div', 'wrapper-card highlight-pair-card');
  card.innerHTML = `<div class="insight-card-title">Memorable Days</div>`;
  const pair = el('div', 'highlight-pair');

  const buildSide = (day, isPositive) => {
    const side = el('div', `highlight-side ${isPositive ? 'highlight-best' : 'highlight-worst'}`);
    if (!day) { side.innerHTML = `<div class="highlight-empty">No data yet</div>`; return side; }
    const mood = day.mood ?? 50;
    const color = IconUtils.getMoodColor(mood);
    const wxIcon = IconUtils.weatherIcons[day.weather] ?? 'cloudy';
    side.innerHTML = `
      <div class="highlight-tag">${isPositive ? 'Best Day' : 'Hardest Day'}</div>
      <div class="highlight-score" style="color:${color}">${mood}</div>
      <div class="highlight-score-sub">/ 100</div>
      <div class="highlight-wx">${icon(wxIcon, 'highlight-wx-icon')}${day.weather}</div>
      <div class="highlight-date">${day.date}</div>
    `;
    side.onclick = () => router.push('day-view', { day });
    return side;
  };

  pair.appendChild(buildSide(best, true));
  pair.appendChild(el('div', 'highlight-divider'));
  pair.appendChild(buildSide(worst, false));
  card.appendChild(pair);
  return card;
}
