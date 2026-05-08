// notifications.js
// Direct translation of notification_helper.dart
// Uses @capacitor/local-notifications instead of flutter_local_notifications

import { LocalNotifications } from '@capacitor/local-notifications';
import { Preferences } from '@capacitor/preferences';

const NOTIF_ID = 9001;
const PREFS_KEY = 'notifications_enabled';

export const NotificationHelper = {
  async init() {
    // Capacitor handles init automatically — no manual setup needed
  },

  async requestPermissions() {
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  },

  // Mirrors scheduleDailyAround9PM()
  async scheduleDailyAround9PM() {
    const now = new Date();
    let first = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 21, 0, 0);
    if (first <= now) {
      first.setDate(first.getDate() + 1);
    }

    await LocalNotifications.schedule({
      notifications: [{
        id: NOTIF_ID,
        title: 'How was your day?',
        body: 'Log your mood in 1 tap.',
        schedule: {
          at: first,
          repeats: true,
          allowWhileIdle: true,
        },
      }],
    });
  },

  async cancelAll() {
    await LocalNotifications.cancel({ notifications: [{ id: NOTIF_ID }] });
  },

  async loadState() {
    const { value } = await Preferences.get({ key: PREFS_KEY });
    return value === 'true';
  },

  async saveState(enabled) {
    await Preferences.set({ key: PREFS_KEY, value: String(enabled) });
  },

  // Called on app start — re-schedules if was previously enabled
  async restoreIfEnabled() {
    const enabled = await this.loadState();
    if (enabled) {
      await this.init();
      await this.scheduleDailyAround9PM();
    }
  },
};
