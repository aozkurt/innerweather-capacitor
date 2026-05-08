import { Filesystem, Directory } from '@capacitor/filesystem';

let _recorder = null;
let _chunks  = [];
let _mime    = '';

function _bestMime() {
  for (const t of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return '';
}

export const isRecording = () => _recorder?.state === 'recording';

export async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  _mime   = _bestMime();
  _chunks = [];
  _recorder = new MediaRecorder(stream, _mime ? { mimeType: _mime } : undefined);
  _recorder.ondataavailable = (e) => { if (e.data.size > 0) _chunks.push(e.data); };
  _recorder.start(250);
}

export function stopRecording() {
  return new Promise((resolve) => {
    _recorder.onstop = () => resolve(new Blob(_chunks, { type: _mime || 'audio/webm' }));
    _recorder.stop();
    _recorder.stream.getTracks().forEach((t) => t.stop());
  });
}

export function cancelRecording() {
  if (!_recorder) return;
  _recorder.ondataavailable = null;
  _recorder.onstop = null;
  _recorder.stop();
  _recorder.stream.getTracks().forEach((t) => t.stop());
  _chunks = [];
  _recorder = null;
}

export async function saveAudio(blob, dateKey) {
  const ext      = _mime.includes('mp4') ? 'm4a' : 'webm';
  const fileName = `voice_${dateKey}.${ext}`;
  const data     = await _toBase64(blob);
  await Filesystem.writeFile({ path: fileName, data, directory: Directory.Data });
  return fileName;
}

export async function loadAudioUrl(fileName) {
  try {
    const { data } = await Filesystem.readFile({ path: fileName, directory: Directory.Data });
    const mime     = fileName.endsWith('.m4a') ? 'audio/mp4' : 'audio/webm';
    return `data:${mime};base64,${data}`;
  } catch { return null; }
}

export async function deleteAudio(fileName) {
  try { await Filesystem.deleteFile({ path: fileName, directory: Directory.Data }); } catch { /* gone */ }
}

function _toBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = () => resolve(r.result.split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}
