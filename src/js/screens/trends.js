import { icon } from '../icons.js';
import { renderWeeklyChart, renderMonthlyChart, renderSeasonalChart } from '../charts.js';
import { el, iconBadge } from '../utils/dom.js';
import { getLastNDaysJson } from '../utils/data.js';
import { buildAiInsightButton } from '../components/ai-insight-button.js';
import { onCleanup } from '../router.js';

const AI_INSIGHT_KEY_WEEKLY  = 'innerweather_ai_insight_weekly';
const AI_INSIGHT_KEY_MONTHLY = 'innerweather_ai_insight_monthly';

export function renderTrendsScreen(root) {
  let expandedSeason = null;
  const wrap = el('div', 'screen-scroll');
  const header = el('section', 'screen-header');
  header.innerHTML = `
    <span class="eyebrow">Trends</span>
    <h2 class="screen-title">A more professional read on your data</h2>
    <p class="screen-subtitle">Clean trend lines make it easier to spot momentum, seasonality, and consistency.</p>
  `;
  wrap.appendChild(header);

  wrap.appendChild(el('p', 'graph-title', 'Weekly Trend'));
  wrap.appendChild(buildExpandableChart((canvas) => renderWeeklyChart(canvas)));
  wrap.appendChild(buildAiInsightButton({
    label: 'Weekly AI Insight',
    storageKey: AI_INSIGHT_KEY_WEEKLY,
    getDataJson: () => getLastNDaysJson(7),
    analysisType: 'weekly',
  }));

  wrap.appendChild(el('p', 'graph-title', 'Seasonal Breakdown'));
  const seasonsGrid = el('div', 'seasons-grid');
  const seasonColors = {
    Spring: '#b8e1a3',
    Summer: '#f8d57b',
    Fall: '#d99a68',
    Winter: '#bddcf7',
  };

  let _seasonalCharts = [];
  const renderSeasonsGrid = (animate = false) => {
    const doRender = () => {
      _seasonalCharts.forEach(c => c.destroy());
      _seasonalCharts = [];
      seasonsGrid.innerHTML = '';
      if (expandedSeason) {
        seasonsGrid.className = 'seasons-expanded';
        seasonsGrid.appendChild(buildSeasonChartCard(expandedSeason, seasonColors[expandedSeason], true, () => {
          expandedSeason = null;
          renderSeasonsGrid(true);
        }));
      } else {
        seasonsGrid.className = 'seasons-grid';
        Object.entries(seasonColors).forEach(([name, color]) => {
          seasonsGrid.appendChild(buildSeasonChartCard(name, color, false, () => {
            expandedSeason = name;
            renderSeasonsGrid(true);
          }));
        });
      }

      requestAnimationFrame(() => {
        seasonsGrid.querySelectorAll('canvas[data-season]').forEach((canvas) => {
          const chart = renderSeasonalChart(canvas, canvas.dataset.season, { interactive: expandedSeason !== null });
          _seasonalCharts.push(chart);
        });
        if (animate) {
          seasonsGrid.style.opacity = '1';
          seasonsGrid.style.transform = 'scale(1)';
        }
      });
    };

    if (animate) {
      seasonsGrid.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
      seasonsGrid.style.opacity = '0';
      seasonsGrid.style.transform = 'scale(0.97)';
      setTimeout(doRender, 150);
    } else {
      doRender();
    }
  };

  renderSeasonsGrid();
  onCleanup(() => { _seasonalCharts.forEach(c => c.destroy()); _seasonalCharts = []; });
  wrap.appendChild(seasonsGrid);

  wrap.appendChild(el('p', 'graph-title', 'Monthly Trend'));
  wrap.appendChild(buildExpandableChart((canvas) => renderMonthlyChart(canvas)));
  wrap.appendChild(buildAiInsightButton({
    label: 'Monthly AI Insight',
    storageKey: AI_INSIGHT_KEY_MONTHLY,
    getDataJson: () => getLastNDaysJson(30),
    analysisType: 'monthly',
  }));

  root.appendChild(wrap);
}

function buildExpandableChart(renderFn) {
  let expanded = false;
  let chartInst = null;

  const card = el('div', 'wrapper-card chart-card expandable-card');
  const topRow = el('div', 'expand-row');
  const expandBtn = el('button', 'icon-btn expand-btn', icon('expand'));
  expandBtn.title = 'Expand chart';
  topRow.appendChild(expandBtn);
  card.appendChild(topRow);

  const canvasWrap = el('div', 'chart-wrap');
  const canvas = document.createElement('canvas');
  canvasWrap.appendChild(canvas);
  card.appendChild(canvasWrap);

  expandBtn.onclick = () => {
    expanded = !expanded;
    canvasWrap.classList.toggle('chart-expanded', expanded);
    expandBtn.innerHTML = icon(expanded ? 'collapse' : 'expand');
    if (chartInst) {
      chartInst.destroy();
    }
    requestAnimationFrame(() => {
      chartInst = renderFn(canvas);
    });
  };

  requestAnimationFrame(() => {
    chartInst = renderFn(canvas);
  });
  onCleanup(() => { if (chartInst) { chartInst.destroy(); chartInst = null; } });
  return card;
}

function buildSeasonChartCard(season, color, isExpanded, onToggle) {
  const seasonIcon = {
    Spring: 'spring',
    Summer: 'summer',
    Fall: 'fall',
    Winter: 'winter',
  }[season];

  const card = el('div', 'wrapper-card season-chart-card');
  card.style.background = `linear-gradient(180deg, ${color}, rgba(255,255,255,0.76))`;
  card.innerHTML = `
    <div class="season-chart-header">
      <span class="season-chart-title">${iconBadge(seasonIcon)}${season}</span>
      <button class="icon-btn expand-btn season-expand-btn" aria-label="Toggle season chart">${icon(isExpanded ? 'collapse' : 'expand')}</button>
    </div>
  `;

  const canvas = document.createElement('canvas');
  canvas.dataset.season = season;
  card.appendChild(canvas);
  card.querySelector('.season-expand-btn').onclick = onToggle;
  return card;
}
