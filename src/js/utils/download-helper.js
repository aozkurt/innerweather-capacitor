import { registerPlugin, Capacitor } from '@capacitor/core';

const _DownloadHelper = registerPlugin('DownloadHelper');

export async function saveJsonToDownloads(fileName, content) {
  if (!Capacitor.isNativePlatform()) {
    // Web fallback: browser download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
    link.download = fileName;
    link.click();
    return;
  }
  await _DownloadHelper.saveToDownloads({ fileName, content });
}
