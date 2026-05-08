import { dayData, Day, Constants, DateHelper } from '../store.js';
import { router } from '../router.js';
import { icon } from '../icons.js';
import { el } from '../utils/dom.js';
import { buildDayCard } from '../components/day-card.js';
import { buildSeasonCard } from '../components/season-card.js';

export function renderHomeScreen(root) {
  const now = new Date();
  const today = DateHelper.formatDate(now);
  const currentSeason = dayData.getSeasonFromDate(now);
  const seasonDays = dayData.getDaysForSeason(currentSeason);
  const todayDay = seasonDays.find((day) => day.date === today)
    ?? new Day({ mood: Constants.defaultMood, weather: Constants.defaultWeather });

  const wrap = el('div', 'screen-scroll');
  const hero = el('section', 'hero-card');
  hero.innerHTML = `
    <div class="hero-copy">
      <span class="eyebrow">Today</span>
      <h1 class="hero-title">Track the forecast inside.</h1>
      <p class="hero-text">Log how the day felt, then review patterns that build over time.</p>
    </div>
    <div class="hero-art">${icon('cloudy', 'hero-icon', 1.6)}</div>
  `;
  wrap.appendChild(hero);

  wrap.appendChild(el('p', 'section-kicker', 'Daily Entry'));
  wrap.appendChild(buildDayCard(todayDay, {
    isEditable: true,
    featured: true,
    onTap: () => router.push('day-editor', { day: todayDay }),
  }));

  wrap.appendChild(el('p', 'section-kicker', 'Seasons'));
  const seasons = [
    { name: Constants.seasonSpring, color: '#9BD58A', iconName: 'spring' },
    { name: Constants.seasonSummer, color: '#F6C768', iconName: 'summer' },
    { name: Constants.seasonFall, color: '#CF8751', iconName: 'fall' },
    { name: Constants.seasonWinter, color: '#A9D2F3', iconName: 'winter' },
  ];
  const seasonCards = seasons.map((season) => buildSeasonCard(season));
  seasonCards.forEach((card) => wrap.appendChild(card));
  root.appendChild(wrap);
  seasonCards.forEach((card) => card._initRive());
}
