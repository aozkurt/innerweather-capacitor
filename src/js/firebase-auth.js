import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';

// ── Firebase web config ───────────────────────────────────────────────────────
// Firebase Console → Project Settings → Your apps → Web app → SDK setup
// These values are safe in client code — security comes from server-side
// token verification, not from hiding this config.
const firebaseConfig = {
  apiKey: "AIzaSyApWQBtCcPd95LNtY3KXNgq3PRDAEdWZng",
  authDomain: "innerweather.firebaseapp.com",
  projectId: "innerweather",
  storageBucket: "innerweather.firebasestorage.app",
  messagingSenderId: "625650462614",
  appId: "1:625650462614:web:9970670d1dce6f1305f7b7",
  measurementId: "G-XMRL87PRRN"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Promise that resolves to the signed-in user.
// Stored at module level so initAuth() and getAuthToken() share the same promise
// and there is no race condition if getAuthToken() is called before sign-in finishes.
let _authReady = null;

/**
 * Kicks off anonymous sign-in as early as possible (call from main.js on startup).
 * Subsequent calls are ignored — sign-in only happens once per session.
 */
export function initAuth() {
  if (_authReady) return;
  _authReady = signInAnonymously(auth)
    .then((credential) => credential.user)
    .catch((e) => {
      console.error('Firebase anonymous sign-in failed:', e);
      _authReady = null; // allow retry on next getAuthToken() call
      return null;
    });
}

/**
 * Returns a valid Firebase ID token string, or null if authentication failed.
 * Firebase refreshes the token automatically when it is near expiry (tokens last 1 hour).
 */
export async function getAuthToken() {
  // If initAuth() was never called, or failed, try signing in now.
  if (!_authReady) initAuth();

  const user = await _authReady;
  if (!user) return null;

  try {
    return await user.getIdToken(); // returns cached token, refreshes if near expiry
  } catch (e) {
    console.error('Failed to get Firebase ID token:', e);
    return null;
  }
}
