import { dayData, DateHelper } from '../store.js';
import { router } from '../router.js';
import { el } from '../utils/dom.js';
import { buildDayCard } from '../components/day-card.js';

export async function renderSeasonScreen(root, { season }) {
  const hasReal = dayData.getAllDaysInSeasonByDate(season).some((day) => !day.isAutoCreated);
  if (hasReal) {
    await dayData.fillMissingDaysWithDefaults(season);
  }

  const days = dayData.getDaysForSeason(season);
  const isCurrentSeason = dayData.getSeasonFromDate(new Date()) === season;
  const wrap = el('div', 'screen-scroll');
  wrap.appendChild(el('p', 'section-kicker', `${season} Journal`));

  if (!days.length) {
    const msg = isCurrentSeason
      ? 'This season is waiting for your first entry.'
      : "You haven't recorded anything for this season yet.";
    wrap.appendChild(el('div', 'empty-state', msg));
  } else {
    let loaded = 20;
    const list = el('div', 'days-list');
    const renderBatch = () => {
      list.innerHTML = '';
      days.slice(0, loaded).forEach((day) => {
        const isEditable = DateHelper.isToday(day.date) || day.isAutoCreated;
        list.appendChild(buildDayCard(day, {
          isEditable,
          onTap: () => {
            if (isEditable) router.push('day-editor', { day });
            else router.push('day-view', { day });
          },
        }));
      });
      if (loaded < days.length) {
        const more = el('button', 'load-more-btn', 'Load more');
        more.onclick = () => {
          loaded += 20;
          renderBatch();
        };
        list.appendChild(more);
      }
    };
    renderBatch();
    wrap.appendChild(list);
  }

  root.appendChild(wrap);
}
