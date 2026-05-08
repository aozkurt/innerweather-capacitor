// router.js
// Replaces Flutter's Navigator.push / Navigator.pop with a simple stack-based router

const _stack = []; // screen history stack

// Register: call router.register('home', () => renderHome()); for each screen
const _renderers = {};

// Cleanup registry — screens register teardown callbacks here (cancel rAF, destroy charts, etc.)
const _cleanupCallbacks = [];
export function onCleanup(fn) { _cleanupCallbacks.push(fn); }

export const router = {
  register(name, renderFn) {
    _renderers[name] = renderFn;
  },

  // Push a new screen onto the stack (replaces Navigator.push)
  push(name, params = {}) {
    // Save the current scroll position so we can restore it when popping back.
    const scrollEl = document.querySelector('#screen-root .screen-scroll');
    if (_stack.length > 0 && scrollEl) {
      _stack[_stack.length - 1].scrollTop = scrollEl.scrollTop;
    }
    _stack.push({ name, params });
    _render(name, params); // fire-and-forget — new screens always start at top
    _updateBackBtn();
  },

  // Pop the current screen (replaces Navigator.pop)
  async pop() {
    if (_stack.length <= 1) return;
    _stack.pop();
    const { name, params, scrollTop } = _stack[_stack.length - 1];
    // Await the render so async screens (e.g. renderSeasonScreen) are fully
    // painted before we try to set scrollTop.
    await _render(name, params);
    if (scrollTop) {
      const scrollEl = document.querySelector('#screen-root .screen-scroll');
      if (scrollEl) scrollEl.scrollTop = scrollTop;
    }
    _updateBackBtn();
  },

  // Replace root without history (tab switching)
  replace(name, params = {}) {
    _stack.length = 0;
    _stack.push({ name, params });
    _render(name, params);
    _updateBackBtn();
  },

  canPop() {
    return _stack.length > 1;
  },

  currentParams() {
    return _stack.length ? _stack[_stack.length - 1].params : {};
  },
};

async function _render(name, params) {
  // Flush all screen teardown callbacks before wiping the DOM
  while (_cleanupCallbacks.length) _cleanupCallbacks.pop()();
  const fn = _renderers[name];
  if (!fn) { console.error('Unknown screen:', name); return; }
  const root = document.getElementById('screen-root');
  root.innerHTML = '';
  await fn(root, params); // await handles both sync and async screen functions
}

function _updateBackBtn() {
  const btn = document.getElementById('back-btn');
  if (btn) btn.style.display = router.canPop() ? 'flex' : 'none';
}
