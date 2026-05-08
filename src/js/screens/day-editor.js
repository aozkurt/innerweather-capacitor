import { dayData, Day, Constants, DateHelper, IconUtils } from '../store.js';
import { router } from '../router.js';
import { icon } from '../icons.js';
import { el, showToast } from '../utils/dom.js';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { startRecording, stopRecording, saveAudio, loadAudioUrl, deleteAudio } from '../utils/voice-recorder.js';

const _fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function _updateSliderColor(slider, mood) {
  slider.style.accentColor = IconUtils.getMoodColor(mood);
}

function _buildWeatherStrip(selected, onChange) {
  const strip = el('div', 'weather-strip');
  for (const [name, iconName] of Object.entries(IconUtils.weatherIcons)) {
    const chip = el('button', `weather-chip${name === selected ? ' selected' : ''}`);
    chip.dataset.weather = name;
    chip.innerHTML = `${icon(iconName, 'weather-chip-svg')}<span class="weather-chip-name">${name}</span>`;
    chip.onclick = () => {
      strip.querySelectorAll('.weather-chip').forEach((c) => c.classList.remove('selected'));
      chip.classList.add('selected');
      onChange(name);
    };
    strip.appendChild(chip);
  }
  return strip;
}

function _buildAudioPlayer(getSrc, onDelete) {
  const row  = el('div', 'voice-player-row');
  const audio = el('audio', '');
  getSrc().then((src) => { if (src) audio.src = src; });

  const playBtn = el('button', 'voice-play-btn');
  playBtn.innerHTML = icon('play', 'voice-btn-icon');
  const fill = el('div', 'voice-progress-fill');
  const bar  = el('div', 'voice-progress-bar');
  bar.appendChild(fill);
  const timeLabel = el('span', 'voice-time-label', '0:00');
  const prog = el('div', 'voice-progress-wrap');
  prog.append(bar, timeLabel);

  audio.ontimeupdate = () => {
    fill.style.width = `${audio.duration ? (audio.currentTime / audio.duration) * 100 : 0}%`;
    timeLabel.textContent = _fmtTime(audio.currentTime);
  };
  audio.onended = () => { playBtn.innerHTML = icon('play', 'voice-btn-icon'); };
  playBtn.onclick = () => {
    if (audio.paused) { audio.play();  playBtn.innerHTML = icon('pause', 'voice-btn-icon'); }
    else              { audio.pause(); playBtn.innerHTML = icon('play',  'voice-btn-icon'); }
  };

  const delBtn = el('button', 'voice-delete-btn');
  delBtn.innerHTML = icon('trash', 'voice-btn-icon');
  delBtn.onclick = onDelete;
  row.append(audio, playBtn, prog, delBtn);
  return row;
}

function _buildRecordingUI(onStop) {
  const row = el('div', 'voice-recording-row');
  row.innerHTML = `<span class="voice-rec-dot"></span><span class="voice-rec-timer" id="rec-timer">0:00</span>`;
  const stopBtn = el('button', 'voice-stop-btn');
  stopBtn.innerHTML = `${icon('stop', 'voice-btn-icon')}<span>Stop</span>`;
  stopBtn.onclick = onStop;
  row.appendChild(stopBtn);
  return row;
}

function _buildMicBtn(onTap) {
  const btn = el('button', 'voice-mic-btn');
  btn.innerHTML = `${icon('mic', 'voice-mic-icon')}<span class="voice-mic-label">Tap to record</span>`;
  btn.onclick = onTap;
  return btn;
}

export function renderDayEditorScreen(root, { day }) {
  let mood            = day?.mood ?? Constants.defaultMood;
  let selectedWeather = (day?.weather && day.weather !== Constants.defaultWeather)
    ? day.weather : Constants.sunnyWeather;
  const date   = day?.date ?? DateHelper.formatDate(new Date());
  const vState = { phase: day?.audioFile ? 'recorded' : 'idle', blob: null, file: day?.audioFile ?? null };
  let timerInterval = null;

  const wrap = el('div', 'screen-scroll editor-screen');
  wrap.innerHTML = `
    <div class="editor-header">
      <span class="eyebrow">Daily check-in</span>
      <h2 class="editor-date">${date}</h2>
    </div>
  `;

  // ── Mood ──────────────────────────────────────────────────────────────────
  const moodCard = el('div', 'wrapper-card editor-panel');
  moodCard.innerHTML = `
    <div class="editor-panel-title">Mood level</div>
    <p class="editor-mood-label"><span id="mood-val">${mood}</span>/100</p>
  `;
  const slider = el('input', 'mood-slider');
  slider.type = 'range'; slider.min = 0; slider.max = 100; slider.value = mood;
  slider.oninput = () => {
    mood = parseInt(slider.value, 10);
    moodCard.querySelector('#mood-val').textContent = mood;
    _updateSliderColor(slider, mood);
  };
  _updateSliderColor(slider, mood);
  moodCard.appendChild(slider);
  wrap.appendChild(moodCard);

  // ── Weather ───────────────────────────────────────────────────────────────
  wrap.appendChild(el('p', 'section-kicker', 'Weather'));
  wrap.appendChild(_buildWeatherStrip(selectedWeather, (name) => { selectedWeather = name; }));

  // ── Voice note ────────────────────────────────────────────────────────────
  wrap.appendChild(el('p', 'section-kicker', 'Voice Note'));
  const voiceBox = el('div', 'voice-section');

  function refreshVoice() {
    clearInterval(timerInterval);
    voiceBox.innerHTML = '';
    if (vState.phase === 'recording') {
      let secs = 0;
      voiceBox.appendChild(_buildRecordingUI(async () => {
        clearInterval(timerInterval);
        vState.blob  = await stopRecording();
        vState.phase = 'recorded';
        refreshVoice();
      }));
      timerInterval = setInterval(() => {
        secs++;
        const t = voiceBox.querySelector('#rec-timer');
        if (t) t.textContent = _fmtTime(secs);
      }, 1000);
    } else if (vState.phase === 'recorded') {
      const getSrc = () => vState.blob
        ? Promise.resolve(URL.createObjectURL(vState.blob))
        : loadAudioUrl(vState.file);
      voiceBox.appendChild(_buildAudioPlayer(getSrc, async () => {
        await Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
        if (vState.file) { await deleteAudio(vState.file); vState.file = null; }
        vState.blob  = null;
        vState.phase = 'idle';
        refreshVoice();
      }));
    } else {
      voiceBox.appendChild(_buildMicBtn(async () => {
        await Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
        try {
          await startRecording();
          vState.phase = 'recording';
          refreshVoice();
        } catch (err) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            showToast('Microphone access denied — check app permissions', true);
          } else if (err.name === 'NotFoundError') {
            showToast('No microphone found on this device', true);
          } else {
            showToast('Could not start recording', true);
          }
        }
      }));
    }
  }
  refreshVoice();
  wrap.appendChild(voiceBox);

  // ── Notes ─────────────────────────────────────────────────────────────────
  wrap.appendChild(el('p', 'section-kicker', 'Notes'));
  const noteArea = el('textarea', 'note-textarea');
  noteArea.placeholder = 'Write what shaped your day...';
  noteArea.value = (day?.note && day.note !== Constants.defaultNote) ? day.note : '';
  wrap.appendChild(noteArea);

  // ── Save ──────────────────────────────────────────────────────────────────
  const saveBtn = el('button', 'save-btn', day ? 'Save Changes' : 'Save Day');
  saveBtn.onclick = async () => {
    await Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
    if (vState.blob && !vState.file) {
      vState.file = await saveAudio(vState.blob, date.replace(/[^a-zA-Z0-9]/g, '_'));
    }
    const updatedDay = new Day({
      date, mood, weather: selectedWeather,
      note: noteArea.value.trim() || Constants.defaultNote,
      isAutoCreated: false, audioFile: vState.file,
      // Preserve the original timestamp when editing so backdating an existing
      // entry doesn't reset or falsely extend the streak.
      recordedAt: day?.recordedAt ?? Date.now(),
    });
    await dayData.updateDay(updatedDay);
    const season = dayData.getSeasonFromDate(DateHelper.parseFormattedDate(date));
    if (!dayData.getDaysForSeason(season).some((item) => item.date === date)) {
      await dayData.addDayToSeason(season, updatedDay);
    }
    showToast('Day saved');
    router.pop();
  };
  wrap.appendChild(saveBtn);
  root.appendChild(wrap);
}
