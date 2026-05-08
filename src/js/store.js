import { Preferences } from '@capacitor/preferences';

export const Constants = {
  defaultMood: 50,
  defaultWeather: 'Natural',
  defaultNote: '',
  sunnyWeather: 'Sunny',
  cloudyWeather: 'Cloudy',
  rainyWeather: 'Rainy',
  snowyWeather: 'Snowy',
  stormyWeather: 'Stormy',
  seasonSpring: 'Spring',
  seasonSummer: 'Summer',
  seasonFall: 'Fall',
  seasonWinter: 'Winter',
  allWeekdays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
};

export const DateHelper = {
  formatDate(date) {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  },

  parseFormattedDate(str) {
    try {
      const parsed = new Date(str);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
      return new Date(Date.parse(str));
    } catch {
      return new Date();
    }
  },

  isToday(formattedDate) {
    const d = this.parseFormattedDate(formattedDate);
    const now = new Date();
    return d.getFullYear() === now.getFullYear()
      && d.getMonth() === now.getMonth()
      && d.getDate() === now.getDate();
  },
};

export const IconUtils = {
  weatherIcons: {
    Sunny: 'sunny',
    Cloudy: 'cloudy',
    Rainy: 'rainy',
    Snowy: 'snowy',
    Stormy: 'stormy',
  },

  getMoodEmoji(mood) {
    if (mood >= 80) return 'mood-great';
    if (mood >= 60) return 'mood-good';
    if (mood >= 40) return 'mood-neutral';
    if (mood >= 20) return 'mood-low';
    return 'mood-bad';
  },

  getMoodColor(mood) {
    if (mood >= 80) return '#3AB54A';
    if (mood >= 60) return '#91CA5F';
    if (mood >= 40) return '#FAB140';
    if (mood >= 20) return '#F25A29';
    return '#E12025';
  },
};

export const weatherConfigs = {
  Sunny: {
    gradientColors: ['#162033', '#20476A', '#4E88A6', '#E9C46A'],
    icon: 'sunny',
  },
  Snowy: {
    gradientColors: ['#0E182B', '#2A3F67', '#7A9CC1', '#DDE9F6'],
    icon: 'snowy',
  },
  Rainy: {
    gradientColors: ['#111723', '#1A2434', '#324661', '#8DA3C0'],
    icon: 'rainy',
  },
  Stormy: {
    gradientColors: ['#0F1320', '#1D2233', '#39455C', '#9AA5C4'],
    icon: 'stormy',
  },
  Cloudy: {
    gradientColors: ['#131A28', '#243141', '#5C7088', '#C1CFDB'],
    icon: 'cloudy',
  },
};

export class Day {
  constructor({
    date,
    mood = Constants.defaultMood,
    weather = Constants.defaultWeather,
    note = Constants.defaultNote,
    isAutoCreated = false,
    audioFile = null,
    recordedAt = null,   // Unix ms — set once on first real save, never on edits
  } = {}) {
    this.date = date ?? DateHelper.formatDate(new Date());
    this.mood = mood;
    this.weather = weather;
    this.note = note;
    this.isAutoCreated = isAutoCreated;
    this.audioFile = audioFile;
    this.recordedAt = recordedAt;
  }

  static fromJson(json) {
    return new Day({
      date: json.date,
      mood: json.mood,
      weather: json.weather,
      note: json.note,
      isAutoCreated: json.isAutoCreated ?? false,
      audioFile: json.audioFile ?? null,
      recordedAt: json.recordedAt ?? null,
    });
  }

  toJson() {
    return {
      date: this.date,
      weather: this.weather,
      note: this.note,
      mood: this.mood,
      isAutoCreated: this.isAutoCreated,
      audioFile: this.audioFile,
      recordedAt: this.recordedAt,
    };
  }
}

class DayData extends EventTarget {
  constructor() {
    super();
    this._seasonalDays = {
      [Constants.seasonSpring]: [],
      [Constants.seasonSummer]: [],
      [Constants.seasonFall]: [],
      [Constants.seasonWinter]: [],
    };
    this.isLoading = true;
    this._cachedBestDay = null;
    this._cachedWorstDay = null;
    this._lastCacheDate = null;
    this.loadData();
  }

  _notify() {
    this.dispatchEvent(new Event('change'));
  }

  getDaysForSeason(season) {
    return [...(this._seasonalDays[season] ?? [])].sort(
      (a, b) => DateHelper.parseFormattedDate(a.date) - DateHelper.parseFormattedDate(b.date),
    );
  }

  getSeasonFromDate(date) {
    const month = date.getMonth() + 1;
    if ([12, 1, 2].includes(month)) return Constants.seasonWinter;
    if ([3, 4, 5].includes(month)) return Constants.seasonSpring;
    if ([6, 7, 8].includes(month)) return Constants.seasonSummer;
    return Constants.seasonFall;
  }

  async addDayToSeason(season, day) {
    const exists = this._seasonalDays[season].some((existing) => existing.date === day.date);
    if (!exists) {
      this._seasonalDays[season].push(day);
      await this._saveData();
      this._notify();
    }
  }

  getAllDaysInSeasonByDate(season) {
    return Object.values(this._seasonalDays)
      .flat()
      .filter((day) => this.getSeasonFromDate(DateHelper.parseFormattedDate(day.date)) === season);
  }

  async _saveData() {
    const encoded = JSON.stringify(
      Object.fromEntries(
        Object.entries(this._seasonalDays).map(([key, value]) => [key, value.map((day) => day.toJson())]),
      ),
    );
    await Preferences.set({ key: 'seasonal_days', value: encoded });
  }

  async fillMissingDaysWithDefaults(season) {
    const relevantDays = this.getAllDaysInSeasonByDate(season);
    if (!relevantDays.length) {
      return;
    }

    const dates = relevantDays.map((day) => DateHelper.parseFormattedDate(day.date));
    const earliest = new Date(Math.min(...dates));
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const existingDates = new Set(Object.values(this._seasonalDays).flat().map((day) => day.date));

    for (let dt = new Date(earliest); dt < today; dt.setDate(dt.getDate() + 1)) {
      const formatted = DateHelper.formatDate(new Date(dt));
      if (!existingDates.has(formatted)) {
        const seasonForDate = this.getSeasonFromDate(new Date(dt));
        this._seasonalDays[seasonForDate].push(new Day({
          date: formatted,
          mood: Constants.defaultMood,
          weather: Constants.defaultWeather,
          note: Constants.defaultNote,
          isAutoCreated: true,
        }));
      }
    }

    await this._saveData();
    this._notify();
  }

  async updateDay(updatedDay) {
    for (const [, days] of Object.entries(this._seasonalDays)) {
      const index = days.findIndex((day) => day.date === updatedDay.date);
      if (index !== -1) {
        days[index] = updatedDay;
        await this._saveData();
        this._notify();
        return;
      }
    }
  }

  async loadData() {
    try {
      const { value } = await Preferences.get({ key: 'seasonal_days' });
      if (value) {
        const decoded = JSON.parse(value);
        for (const [season, list] of Object.entries(decoded)) {
          if (season in this._seasonalDays) {
            this._seasonalDays[season] = list.map((item) => Day.fromJson(item));
          }
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      this.isLoading = false;
      this._notify();
    }
  }

  async exportAsJson() {
    return JSON.stringify(
      Object.fromEntries(
        Object.entries(this._seasonalDays).map(([key, value]) => [key, value.map((day) => day.toJson())]),
      ),
      null,
      2,
    );
  }

  async importFromJson(jsonString) {
    const decoded = JSON.parse(jsonString);
    const required = [
      Constants.seasonSpring,
      Constants.seasonSummer,
      Constants.seasonFall,
      Constants.seasonWinter,
    ];

    for (const season of required) {
      if (!decoded[season]) {
        throw new Error(`Missing season key: ${season}`);
      }
    }

    for (const season of required) {
      this._seasonalDays[season] = decoded[season].map((item) => Day.fromJson(item));
    }

    await this._saveData();
    this._notify();
  }

  countUserAddedDays() {
    return Object.values(this._seasonalDays).flat().filter((day) => !day.isAutoCreated).length;
  }

  get oneOfBestDays() {
    const todayStr = DateHelper.formatDate(new Date());
    if (this._cachedBestDay && this._lastCacheDate === todayStr) {
      return this._cachedBestDay;
    }

    const valid = Object.values(this._seasonalDays).flat().filter((day) => day.mood != null);
    if (!valid.length) {
      return null;
    }

    const maxMood = Math.max(...valid.map((day) => day.mood));
    const best = valid.filter((day) => day.mood === maxMood);
    this._cachedBestDay = best[Math.floor(Math.random() * best.length)];
    this._lastCacheDate = todayStr;
    return this._cachedBestDay;
  }

  get oneOfWorstDays() {
    const todayStr = DateHelper.formatDate(new Date());
    if (this._cachedWorstDay && this._lastCacheDate === todayStr) {
      return this._cachedWorstDay;
    }

    const valid = Object.values(this._seasonalDays).flat().filter((day) => day.mood != null);
    if (!valid.length) {
      return null;
    }

    const minMood = Math.min(...valid.map((day) => day.mood));
    const worst = valid.filter((day) => day.mood === minMood);
    this._cachedWorstDay = worst[Math.floor(Math.random() * worst.length)];
    this._lastCacheDate = todayStr;
    return this._cachedWorstDay;
  }

  get averageMoodByWeekday() {
    const sums = {};
    const counts = {};

    for (const day of Object.values(this._seasonalDays).flat()) {
      if (day.mood == null) continue;
      const name = DateHelper.parseFormattedDate(day.date).toLocaleDateString('en-US', { weekday: 'long' });
      sums[name] = (sums[name] ?? 0) + day.mood;
      counts[name] = (counts[name] ?? 0) + 1;
    }

    return Object.fromEntries(
      Constants.allWeekdays.map((weekday) => [
        weekday,
        sums[weekday] != null ? sums[weekday] / counts[weekday] : 50,
      ]),
    );
  }

  get averageMoodByWeather() {
    const sums = {};
    const counts = {};

    for (const day of Object.values(this._seasonalDays).flat()) {
      if (day.mood == null || day.weather === Constants.defaultWeather) continue;
      sums[day.weather] = (sums[day.weather] ?? 0) + day.mood;
      counts[day.weather] = (counts[day.weather] ?? 0) + 1;
    }

    return Object.fromEntries(
      Object.keys(IconUtils.weatherIcons).map((weather) => [
        weather,
        sums[weather] != null ? sums[weather] / counts[weather] : 50,
      ]),
    );
  }

  get weatherFrequency() {
    const frequency = {};
    for (const day of Object.values(this._seasonalDays).flat()) {
      if (day.weather === Constants.defaultWeather) continue;
      frequency[day.weather] = (frequency[day.weather] ?? 0) + 1;
    }
    for (const weather of Object.keys(IconUtils.weatherIcons)) {
      frequency[weather] = frequency[weather] ?? 0;
    }
    return frequency;
  }
}

export const dayData = new DayData();
