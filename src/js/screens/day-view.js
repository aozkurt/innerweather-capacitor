import { IconUtils } from '../store.js';
import { icon } from '../icons.js';
import { el } from '../utils/dom.js';
import { loadAudioUrl } from '../utils/voice-recorder.js';

const _fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function _buildDayAudioPlayer(audioFile) {
  const wrap = el('div', 'day-audio-player');
  const audio = el('audio', '');
  loadAudioUrl(audioFile).then((src) => { if (src) audio.src = src; });

  const playBtn = el('button', 'day-audio-play-btn');
  playBtn.innerHTML = icon('play', 'day-audio-icon', 1.8);
  const fill = el('div', 'day-audio-progress-fill');
  const bar  = el('div', 'day-audio-progress');
  bar.appendChild(fill);
  const timeLabel = el('span', 'day-audio-time', '0:00');
  const info = el('div', 'day-audio-info');
  info.append(bar, timeLabel);

  audio.ontimeupdate = () => {
    fill.style.width = `${audio.duration ? (audio.currentTime / audio.duration) * 100 : 0}%`;
    timeLabel.textContent = _fmtTime(audio.currentTime);
  };
  audio.onended = () => { playBtn.innerHTML = icon('play', 'day-audio-icon', 1.8); };
  playBtn.onclick = () => {
    if (audio.paused) { audio.play();  playBtn.innerHTML = icon('pause', 'day-audio-icon', 1.8); }
    else              { audio.pause(); playBtn.innerHTML = icon('play',  'day-audio-icon', 1.8); }
  };

  wrap.append(audio, playBtn, info);
  return wrap;
}

export function renderDayViewScreen(root, { day }) {
  const weatherIconName = IconUtils.weatherIcons[day.weather] ?? 'cloudy';

  const wrap = el('div', 'screen-scroll day-view');

  const topSection = el('div', 'day-view-top');
  topSection.innerHTML = `
    <div class="day-weather-icon">${icon(weatherIconName, 'day-weather-svg', 1.5)}</div>
    <div class="day-stats">
      <div class="stat-pill">
        <span class="stat-label">Mood</span>
        <span class="stat-value">${day.mood ?? '-'}</span>
      </div>
      <div class="stat-pill">
        <span class="stat-label">Weather</span>
        <span class="stat-value">${day.weather}</span>
      </div>
    </div>
  `;
  wrap.appendChild(topSection);

  if (day.audioFile) {
    wrap.appendChild(el('p', 'section-kicker day-view-kicker', 'Voice Note'));
    wrap.appendChild(_buildDayAudioPlayer(day.audioFile));
  }

  wrap.appendChild(el('p', 'section-kicker day-view-kicker', 'Reflection'));
  wrap.appendChild(el('div', 'day-view-note-box', day.note || 'No notes for this day.'));
  root.appendChild(wrap);
}
