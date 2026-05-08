import { icon } from '../icons.js';

export function el(tag, cls = '', html = '') {
  const element = document.createElement(tag);
  if (cls) element.className = cls;
  if (html) element.innerHTML = html;
  return element;
}

export function showToast(msg, isError = false) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = `toast show${isError ? ' toast-error' : ''}`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2800);
}

export function iconBadge(name, extraClass = '') {
  return `<span class="icon-badge ${extraClass}">${icon(name)}</span>`;
}
