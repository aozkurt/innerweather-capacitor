import Chart from 'chart.js/auto';
import { dayData, DateHelper, Constants } from './store.js';

function getColors() {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    grid:         dark ? 'rgba(255, 159, 122, 0.12)'  : 'rgba(160, 105, 78, 0.13)',
    tick:         dark ? '#C4906B'                     : '#A0694E',
    line:         dark ? '#FF9F7A'                     : '#C1502A',
    fillTop:      dark ? 'rgba(255, 159, 122, 0.28)'  : 'rgba(193, 80, 42, 0.20)',
    fillBottom:   dark ? 'rgba(255, 159, 122, 0.03)'  : 'rgba(193, 80, 42, 0.02)',
    tooltipBg:    dark ? '#2A180F'                     : '#5C3A2E',
    tooltipTitle: '#FFF4E6',
    tooltipBody:  '#FFD6A5',
    barTop:       '#FF9F7A',
    barBottom:    '#FFD6A5',
    pointBg:      dark ? '#1A0E08'                     : '#FFF4E6',
    seasonal:     dark ? '#E07040'                     : '#8B3318',
  };
}

function chartDefaults(c) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: c.tooltipBg,
        titleColor: c.tooltipTitle,
        bodyColor: c.tooltipBody,
        displayColors: false,
        padding: 12,
        cornerRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 159, 122, 0.28)',
      },
    },
  };
}

function baseScales(showXAxis, c) {
  return {
    y: {
      min: 0,
      max: 100,
      grace: 4,
      border: { display: false },
      grid: { color: c.grid, drawTicks: false },
      ticks: {
        color: c.tick,
        stepSize: 20,
        padding: 10,
        font: { size: 11, weight: '600' },
      },
    },
    x: {
      display: showXAxis,
      border: { display: false },
      grid: { display: false },
      ticks: {
        color: c.tick,
        padding: 8,
        font: { size: 11, weight: '600' },
      },
    },
  };
}

function createLineGradient(ctx, chartArea, c) {
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  gradient.addColorStop(0, c.fillTop);
  gradient.addColorStop(1, c.fillBottom);
  return gradient;
}

function buildLineChart(canvas, labels, data, tooltipLabelFormatter) {
  const c = getColors();
  const defaults = chartDefaults(c);
  const ctx = canvas.getContext('2d');
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data,
        borderColor: c.line,
        borderWidth: 2.6,
        tension: 0.42,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHitRadius: 18,
        pointBackgroundColor: c.pointBg,
        pointBorderColor: c.line,
        pointBorderWidth: 2,
        fill: true,
        backgroundColor(context) {
          const { chart } = context;
          const { chartArea } = chart;
          if (!chartArea) return c.fillTop;
          return createLineGradient(chart.ctx, chartArea, c);
        },
      }],
    },
    options: {
      ...defaults,
      scales: baseScales(true, c),
      plugins: {
        ...defaults.plugins,
        tooltip: {
          ...defaults.plugins.tooltip,
          callbacks: {
            title: (items) => labels[items[0].dataIndex],
            label: (item) => tooltipLabelFormatter(item.raw),
          },
        },
      },
    },
  });
}

export function renderWeeklyChart(canvas) {
  const today = new Date();
  const last7 = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return date;
  });

  const currentSeason = dayData.getSeasonFromDate(today);
  const seasonDays = dayData.getDaysForSeason(currentSeason);
  const moodByDate = Object.fromEntries(
    seasonDays.map((day) => [day.date, day.mood ?? Constants.defaultMood]),
  );

  const labels = last7.map((date) => date.toLocaleDateString('en-US', { weekday: 'short' }));
  const data = last7.map((date) => moodByDate[DateHelper.formatDate(date)] ?? Constants.defaultMood);
  return buildLineChart(canvas, labels, data, (value) => `Mood score ${value}`);
}

export function renderMonthlyChart(canvas) {
  const allDays = [
    ...dayData.getDaysForSeason('Spring'),
    ...dayData.getDaysForSeason('Summer'),
    ...dayData.getDaysForSeason('Fall'),
    ...dayData.getDaysForSeason('Winter'),
  ]
    .filter((day) => {
      try {
        DateHelper.parseFormattedDate(day.date);
        return true;
      } catch {
        return false;
      }
    })
    .sort((a, b) => DateHelper.parseFormattedDate(a.date) - DateHelper.parseFormattedDate(b.date));

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const last30 = allDays.filter((day) => DateHelper.parseFormattedDate(day.date) > cutoff);

  const labels = last30.map((day) => {
    const date = DateHelper.parseFormattedDate(day.date);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  });
  const data = last30.map((day) => day.mood ?? Constants.defaultMood);

  const chart = buildLineChart(canvas, labels, data, (value) => `Mood score ${value}`);
  chart.options.scales.x.display = false;
  chart.update();
  return chart;
}

export function renderSeasonalChart(canvas, season, { interactive = true } = {}) {
  const c = getColors();
  const defaults = chartDefaults(c);
  const days = dayData.getDaysForSeason(season);
  const avgMoods = [];
  const avgLabels = [];

  for (let index = 0; index < days.length; index += 2) {
    const firstDay = days[index];
    const firstMood = firstDay.mood ?? Constants.defaultMood;
    const firstDate = DateHelper.parseFormattedDate(firstDay.date);

    if (index + 1 < days.length) {
      const secondDay = days[index + 1];
      const secondMood = secondDay.mood ?? Constants.defaultMood;
      const secondDate = DateHelper.parseFormattedDate(secondDay.date);
      avgMoods.push((firstMood + secondMood) / 2);
      avgLabels.push(`${firstDate.getDate()}/${firstDate.getMonth() + 1}-${secondDate.getDate()}/${secondDate.getMonth() + 1}`);
    } else {
      avgMoods.push(firstMood);
      avgLabels.push(`${firstDate.getDate()}/${firstDate.getMonth() + 1}`);
    }
  }

  const ctx = canvas.getContext('2d');
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: avgLabels,
      datasets: [{
        data: avgMoods,
        borderColor: c.seasonal,
        borderWidth: 2.2,
        tension: 0.38,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: false,
      }],
    },
    options: {
      ...defaults,
      interaction: interactive ? defaults.interaction : { mode: 'none' },
      scales: baseScales(false, c),
      plugins: {
        ...defaults.plugins,
        tooltip: {
          ...defaults.plugins.tooltip,
          enabled: interactive,
          callbacks: {
            title: (items) => avgLabels[items[0].dataIndex],
            label: (item) => `Average mood ${item.raw.toFixed(1)}`,
          },
        },
      },
    },
  });
}

export function renderWeekdaysBarChart(canvas) {
  const c = getColors();
  const defaults = chartDefaults(c);
  const avgByDay = dayData.averageMoodByWeekday;
  const labels = Constants.allWeekdays.map((day) => day.substring(0, 3));
  const data = Constants.allWeekdays.map((weekday) => parseFloat((avgByDay[weekday] ?? 50).toFixed(1)));
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 240);
  gradient.addColorStop(0, c.barTop);
  gradient.addColorStop(1, c.barBottom);

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: gradient,
        borderRadius: 999,
        borderSkipped: false,
        barPercentage: 0.58,
        categoryPercentage: 0.72,
      }],
    },
    options: {
      ...defaults,
      scales: baseScales(true, c),
      plugins: {
        ...defaults.plugins,
        tooltip: {
          ...defaults.plugins.tooltip,
          callbacks: {
            title: (items) => Constants.allWeekdays[items[0].dataIndex],
            label: (item) => `Average mood ${item.raw}`,
          },
        },
      },
    },
  });
}
