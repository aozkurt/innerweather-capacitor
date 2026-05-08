import { icon } from '../icons.js';
import { el, iconBadge } from '../utils/dom.js';

function openModal(box) {
  const modal = el('div', 'modal-overlay');
  const close = () => {
    modal.classList.remove('modal-open');
    setTimeout(() => modal.remove(), 300);
  };
  modal.onclick = (e) => { if (e.target === modal) close(); };
  box.querySelector('#modal-close').onclick = close;
  modal.appendChild(box);
  document.body.appendChild(modal);
  requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('modal-open')));
}

export function showBackupInfoModal() {
  const box = el('div', 'modal-box');
  box.innerHTML = `
    <h3 class="modal-title">Backup & Restore</h3>
    <div class="info-row">${iconBadge('trends')}<div><strong>Export Backup</strong><p>Exports your saved mood data as a JSON backup you can store anywhere.</p></div></div>
    <div class="info-row">${iconBadge('home')}<div><strong>File Location</strong><p>The exported file is saved as <code>mood_backup.json</code>.</p></div></div>
    <div class="info-row">${iconBadge('expand')}<div><strong>Import Backup</strong><p>Choose a previous JSON export to restore your tracking history.</p></div></div>
    <div class="info-row warning">${iconBadge('info')}<div><strong>Important</strong><p>Importing replaces your current saved data and cannot be undone.</p></div></div>
    <button class="save-btn" id="modal-close">Got it</button>
  `;
  openModal(box);
}

export function showAiInsightModal(text, title = 'AI Mood Insight') {
  const box = el('div', 'modal-box');
  box.innerHTML = `
    <h3 class="modal-title">${icon('brain', 'brain-icon')} ${title}</h3>
    <div class="ai-insight-modal-text"></div>
    <button class="save-btn" id="modal-close">Close</button>
  `;
  box.querySelector('.ai-insight-modal-text').textContent = text;
  openModal(box);
}
