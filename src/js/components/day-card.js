import { icon } from '../icons.js';
import { el } from '../utils/dom.js';
import { Constants, IconUtils } from '../store.js';
import { router } from '../router.js';

export function buildDayCard(day, { isEditable = false, onTap, featured = false }) {
  const mood = day.mood ?? Constants.defaultMood;
  const moodColor = IconUtils.getMoodColor(mood);
  const moodIcon = IconUtils.getMoodEmoji(mood);
  const weatherIcon = IconUtils.weatherIcons[day.weather] ?? 'cloudy';

  const card = el('div', `day-card${featured ? ' featured-card' : ''}`);
  card.innerHTML = `
    <div class="day-card-main">
      <div class="day-card-date">${day.date}</div>
      <div class="day-card-meta">${day.weather === Constants.defaultWeather ? 'No weather selected yet' : day.weather}</div>
    </div>
    <div class="day-card-right">
      ${isEditable ? `<span class="day-card-edit">${icon('edit')}</span>` : ''}
      <span class="day-card-mood" style="color:${moodColor}">${icon(moodIcon, 'mood-icon')}</span>
      <span class="day-card-weather">${icon(weatherIcon, 'weather-card-icon')}</span>
    </div>
  `;
  card.onclick = onTap;
  return card;
}
