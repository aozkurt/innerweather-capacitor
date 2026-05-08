import { dayData } from '../store.js';
import { icon } from '../icons.js';
import { NotificationHelper } from '../notifications.js';
import { el, showToast, iconBadge } from '../utils/dom.js';
import { saveJsonToDownloads } from '../utils/download-helper.js';

export function showSettingsPanel() {
  const overlay = el('div', 'settings-overlay');
  const closeSettings = () => {
    panel.classList.remove('settings-panel-open');
    setTimeout(() => overlay.remove(), 300);
  };

  overlay.onclick = (event) => {
    if (event.target === overlay) closeSettings();
  };

  const panel = el('div', 'settings-panel');
  panel.appendChild(buildNotificationToggle());

  const exportBtn = el('button', 'backup-btn', 'Export Backup');
  exportBtn.onclick = async () => {
    try {
      const json     = await dayData.exportAsJson();
      const fileName = `innerweather_backup_${new Date().toISOString().slice(0, 10)}.json`;
      await saveJsonToDownloads(fileName, json);
      showToast('Saved to Downloads');
    } catch {
      showToast('Export failed', true);
    }
  };
  panel.appendChild(exportBtn);

  const importBtn = el('button', 'backup-btn danger-btn', 'Import Backup');
  importBtn.onclick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        await dayData.importFromJson(text);
        showToast('Backup imported');
        overlay.remove();
      } catch {
        showToast('Invalid or corrupted backup file', true);
      }
    };
    input.click();
  };
  panel.appendChild(importBtn);

  overlay.appendChild(panel);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => panel.classList.add('settings-panel-open'));
}

function buildNotificationToggle() {
  const row = el('div', 'notif-row');
  row.innerHTML = `
    ${iconBadge('bell')}
    <span class="notif-label">Daily Notifications</span>
  `;

  const toggleLabel = document.createElement('label');
  toggleLabel.className = 'toggle';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  const slider = el('span', 'toggle-slider');
  toggleLabel.appendChild(checkbox);
  toggleLabel.appendChild(slider);
  row.appendChild(toggleLabel);

  NotificationHelper.loadState().then((enabled) => {
    checkbox.checked = enabled;
  });

  checkbox.onchange = async () => {
    if (checkbox.checked) {
      const granted = await NotificationHelper.requestPermissions();
      if (granted) {
        await NotificationHelper.init();
        await NotificationHelper.scheduleDailyAround9PM();
        await NotificationHelper.saveState(true);
        showToast('Daily reminder set for 9:00 PM');
      } else {
        checkbox.checked = false;
        showToast('Notification permission denied', true);
      }
    } else {
      await NotificationHelper.cancelAll();
      await NotificationHelper.saveState(false);
      showToast('Daily reminder disabled');
    }
  };

  return row;
}
