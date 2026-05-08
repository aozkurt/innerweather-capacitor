import { registerPlugin, Capacitor } from '@capacitor/core';

// Lazy-registered handle to the native AppCheckPlugin.
// registerPlugin() is side-effect free — it doesn't call the native side yet.
const _AppCheckHelper = registerPlugin('AppCheckHelper');

/**
 * Returns a Firebase App Check token string (from Play Integrity on Android),
 * or null when running in a browser / dev server where native is unavailable.
 *
 * The token should be sent as the `X-Firebase-AppCheck` header on every
 * request to the Cloud Function so the server can verify its origin.
 */
export async function getAppCheckToken() {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const { token } = await _AppCheckHelper.getToken();
    return token ?? null;
  } catch {
    return null;
  }
}
