import { icon } from '../icons.js';
import { el, showToast } from '../utils/dom.js';
import { showAiInsightModal } from './modal.js';
import { AiService } from '../ai-service.js';
import { showInterstitial } from '../ad-manager.js';

export function buildAiInsightButton({ label, storageKey, getDataJson, analysisType }) {
  const section = el('div', 'ai-section');

  const row = el('div', 'ai-row');
  const btn = el('button', 'ai-btn', `${icon('brain', 'brain-icon')}<span>${label}</span>`);
  const infoBtn = el('button', 'icon-btn info-btn ai-info-btn', icon('info'));

  // Restore active state if a previous insight is stored
  if (localStorage.getItem(storageKey)) {
    infoBtn.classList.add('ai-info-btn--active');
  }

  // Info button opens the stored insight (silent no-op when nothing stored yet)
  infoBtn.onclick = () => {
    const stored = localStorage.getItem(storageKey);
    if (stored) showAiInsightModal(stored, label);
  };

  row.appendChild(btn);
  row.appendChild(infoBtn);
  section.appendChild(row);

  btn.onclick = () => {
    btn.disabled = true;
    btn.innerHTML = `${icon('brain', 'brain-icon')}<span>Analyzing...</span>`;

    showInterstitial(async () => {
      try {
        const json = getDataJson();
        const commentary = await AiService.analyzeMood(json, analysisType);
        localStorage.setItem(storageKey, commentary);
        infoBtn.classList.add('ai-info-btn--active');
      } catch (e) {
        console.error('AI insight error:', e);
        showToast(`Error: ${e?.message ?? e}`, true);
      } finally {
        btn.disabled = false;
        btn.innerHTML = `${icon('brain', 'brain-icon')}<span>${label}</span>`;
      }
    });
  };

  return section;
}
