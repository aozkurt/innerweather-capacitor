import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { getAuthToken } from './firebase-auth.js';
import { getAppCheckToken } from './utils/app-check.js';

const ENDPOINT = 'https://analyze-mood-k2xkwpl4rq-uc.a.run.app';

export const AiService = {
  /**
   * @param {string} moodJson      - JSON string of mood entries to analyse.
   * @param {'weekly'|'monthly'} analysisType - Tells the server which prompt to use.
   */
  async analyzeMood(moodJson, analysisType = 'monthly') {
    // Fetch both tokens in parallel — neither depends on the other.
    const [token, appCheckToken] = await Promise.all([getAuthToken(), getAppCheckToken()]);
    if (!token) throw new Error('Authentication failed. Please restart the app and try again.');

    const body    = { mood_json: moodJson, analysis_type: analysisType };
    const headers = {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    };

    // Attach the App Check attestation when available (native platform only).
    // The server rejects requests without this header in production.
    if (appCheckToken) headers['X-Firebase-AppCheck'] = appCheckToken;

    // On Android/iOS use CapacitorHttp (native layer) to bypass WebView CORS.
    // On web (dev browser) fall back to fetch.
    if (Capacitor.isNativePlatform()) {
      let response;
      try {
        response = await CapacitorHttp.post({ url: ENDPOINT, headers, data: body });
      } catch (e) {
        throw new Error(`Native HTTP error: ${e?.message ?? e}`);
      }

      if (response.status !== 200) {
        throw new Error(`Server returned ${response.status}\n${JSON.stringify(response.data)}`);
      }

      const data = response.data;
      if (!data?.commentary) throw new Error(`Unexpected response shape:\n${JSON.stringify(data)}`);
      return data.commentary;
    }

    // Web / dev-server fallback
    let response;
    try {
      response = await fetch(ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30_000),
      });
    } catch (networkErr) {
      throw new Error(`Network error: ${networkErr.message}`);
    }

    if (!response.ok) {
      const errBody = await response.text().catch(() => '(no body)');
      throw new Error(`Server returned ${response.status}\n${errBody}`);
    }

    const data = await response.json();
    if (!data?.commentary) throw new Error(`Unexpected response shape:\n${JSON.stringify(data)}`);
    return data.commentary;
  },
};
