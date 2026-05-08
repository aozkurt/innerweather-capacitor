import { dayData, DateHelper } from '../store.js';

function _isRealTime(day) {
  if (!day.recordedAt) return false;
  const entryDay    = DateHelper.parseFormattedDate(day.date);
  const recordedDay = new Date(day.recordedAt);
  entryDay.setHours(0, 0, 0, 0);
  recordedDay.setHours(0, 0, 0, 0);
  const diffDays = (recordedDay - entryDay) / 86_400_000;
  return diffDays >= 0 && diffDays <= 1;
}

export function computeCurrentStreak() {
  const allDays = getAllRealDays().filter(_isRealTime);
  if (!allDays.length) return 0;
  const dateSet = new Set(allDays.map((d) => {
    const dt = DateHelper.parseFormattedDate(d.date);
    dt.setHours(0, 0, 0, 0);
    return dt.toDateString();
  }));
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  // Streak is still alive if today OR yesterday has an entry.
  // It only resets to 0 when a full calendar day passes with no entry.
  const start = dateSet.has(today.toDateString()) ? today : yesterday;
  if (!dateSet.has(start.toDateString())) return 0;
  let check = new Date(start); let streak = 0;
  while (dateSet.has(check.toDateString())) { streak++; check.setDate(check.getDate() - 1); }
  return streak;
}

// Returns a JSON string containing only the days that fall within the last `n` days.
export function getLastNDaysJson(n) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - n);
  cutoff.setHours(0, 0, 0, 0);

  const days = [
    ...dayData.getDaysForSeason('Spring'),
    ...dayData.getDaysForSeason('Summer'),
    ...dayData.getDaysForSeason('Fall'),
    ...dayData.getDaysForSeason('Winter'),
  ]
    .filter((day) => {
      try {
        return DateHelper.parseFormattedDate(day.date) >= cutoff;
      } catch {
        return false;
      }
    })
    .sort((a, b) => DateHelper.parseFormattedDate(a.date) - DateHelper.parseFormattedDate(b.date));

  return JSON.stringify(days);
}

export function getAllRealDays() {
  return [
    ...dayData.getDaysForSeason('Spring'),
    ...dayData.getDaysForSeason('Summer'),
    ...dayData.getDaysForSeason('Fall'),
    ...dayData.getDaysForSeason('Winter'),
  ].filter((d) => !d.isAutoCreated && d.mood != null);
}

export function computeInsightStreak() {
  const realDays = getAllRealDays();
  if (!realDays.length) return { current: 0, longest: 0 };

  const dates = realDays
    .map((d) => {
      const dt = DateHelper.parseFormattedDate(d.date);
      dt.setHours(0, 0, 0, 0);
      return dt;
    })
    .sort((a, b) => a - b);

  const dateSet = new Set(dates.map((d) => d.toDateString()));

  // Current streak — allow today to not yet be logged
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let check = new Date(today);
  if (!dateSet.has(check.toDateString())) {
    check.setDate(check.getDate() - 1);
  }
  let current = 0;
  while (dateSet.has(check.toDateString())) {
    current++;
    check.setDate(check.getDate() - 1);
  }

  // Longest streak
  let longest = current;
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const diff = Math.round((dates[i] - dates[i - 1]) / 86400000);
    if (diff === 1) {
      streak++;
      if (streak > longest) longest = streak;
    } else {
      streak = 1;
    }
  }
  if (dates.length > 0 && longest === 0) longest = 1;

  return { current, longest };
}
