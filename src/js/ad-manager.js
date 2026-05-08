import { registerPlugin, Capacitor } from '@capacitor/core';

// Register our custom inline native plugin.
// On web/dev-server this is a no-op stub so nothing breaks.
const AdPlugin = registerPlugin('AdPlugin', {
  web: {
    showInterstitial: () => Promise.resolve(),
  },
});

/**
 * Shows a pre-loaded interstitial ad, then calls onComplete.
 * On web (dev server) or if no ad is ready, onComplete is called immediately.
 */
export async function showInterstitial(onComplete) {
  if (!Capacitor.isNativePlatform()) {
    onComplete();
    return;
  }
  try {
    await AdPlugin.showInterstitial();
  } catch (e) {
    console.error('AdPlugin.showInterstitial error:', e);
  }
  onComplete();
}
