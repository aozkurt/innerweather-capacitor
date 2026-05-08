const PATHS = {
  back: '<path d="M15 18l-6-6 6-6" />',
  settings: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />',
  home: '<path d="M4 10.5 12 4l8 6.5V20h-5.5v-5.5h-5V20H4Z" />',
  insights: '<path d="M9 21h6M12 3a7 7 0 0 0-4 12.75c.63.44 1 1.16 1 1.93V18h6v-.32c0-.77.37-1.49 1-1.93A7 7 0 0 0 12 3Z" />',
  trends: '<path d="M4 18h16M7 15l3-3 3 2 4-5" /><path d="M16 9h3v3" />',
  expand: '<path d="M9 4H4v5M15 4h5v5M20 15v5h-5M4 15v5h5" />',
  collapse: '<path d="M4 14h6v6M10 14l-6 6M20 10h-6V4M14 10l6-6" />',
  info: '<circle cx="12" cy="12" r="9" /><path d="M12 10v6M12 7.5h.01" />',
  edit: '<path d="M4 20h4l9.5-9.5-4-4L4 16v4Z" /><path d="M12.5 6.5l4 4" />',
  bell: '<path d="M6.5 16h11l-1.2-1.7a4.4 4.4 0 0 1-.8-2.5V10a3.5 3.5 0 1 0-7 0v1.8c0 .9-.28 1.78-.8 2.5L6.5 16Z" /><path d="M10 18a2 2 0 0 0 4 0" />',
  brain: '<path d="M9 5.5A3.5 3.5 0 0 0 5.5 9v1A3 3 0 0 0 7 15.6V18a2 2 0 0 0 2 2h1V5.5H9Zm6 0A3.5 3.5 0 0 1 18.5 9v1a3 3 0 0 1-1.5 5.6V18a2 2 0 0 1-2 2h-1V5.5h1ZM10 6.5a2.5 2.5 0 0 1 4 0M10 12H8M16 12h-2M10 16H8.5M15.5 16H14" />',
  sunny: '<circle cx="12" cy="12" r="4" /><path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9 5.3 5.3" />',
  cloudy: '<path d="M7.5 18h8.2a3.3 3.3 0 1 0-.5-6.56A4.8 4.8 0 0 0 6.1 9.8 3.4 3.4 0 0 0 7.5 18Z" />',
  rainy: '<path d="M7.3 14.8h8.4a3.1 3.1 0 0 0-.6-6.14A4.7 4.7 0 0 0 6.3 8.9a3.2 3.2 0 0 0 1 5.9Z" /><path d="M9 17.5l-1 2M13 17.5l-1 2M17 17.5l-1 2" />',
  snowy: '<path d="M7.3 13.9h8.4a3.1 3.1 0 0 0-.6-6.14A4.7 4.7 0 0 0 6.3 8a3.2 3.2 0 0 0 1 5.9Z" /><path d="M9 17.5h.01M12 19h.01M15 17.5h.01M10.5 21h.01M13.5 21h.01" />',
  stormy: '<path d="M7 14h8.6a3.2 3.2 0 0 0-.6-6.3A4.8 4.8 0 0 0 6 8a3.2 3.2 0 0 0 1 6Z" /><path d="m12 14-2 4h2l-1 4 5-6h-2l2-4" />',
  spring: '<path d="M12 20c5-3.2 7-7.2 7-10a3 3 0 0 0-5.2-2A3.8 3.8 0 0 0 12 5.6 3.8 3.8 0 0 0 10.2 8 3 3 0 0 0 5 10c0 2.8 2 6.8 7 10Z" />',
  summer: '<circle cx="12" cy="12" r="4.5" /><path d="M12 2v3M12 19v3M22 12h-3M5 12H2M19 5l-2.2 2.2M7.2 16.8 5 19M19 19l-2.2-2.2M7.2 7.2 5 5" />',
  fall: '<path d="M16.5 6.5c-5 .6-8.6 4.2-9.2 9.2-.1.6.4 1.1 1 1 5-.6 8.6-4.2 9.2-9.2.1-.6-.4-1.1-1-1Z" /><path d="M9 15c1.5-2.8 3.7-5 6.5-6.5" />',
  winter: '<path d="M12 3v18M6 6l12 12M18 6 6 18M3 12h18" />',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />',
  mic: '<path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8" />',
  stop: '<rect x="4" y="4" width="16" height="16" rx="3" />',
  play: '<polygon points="5,3 19,12 5,21" />',
  pause: '<rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" />',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" />',
  'mood-great': '<circle cx="12" cy="12" r="8.5" /><path d="M8.5 14.2c1 1.3 2.2 2 3.5 2s2.5-.7 3.5-2" /><path d="M9 10h.01M15 10h.01" />',
  'mood-good': '<circle cx="12" cy="12" r="8.5" /><path d="M8.7 14.4c.9.9 2 1.4 3.3 1.4s2.4-.5 3.3-1.4" /><path d="M9 10h.01M15 10h.01" />',
  'mood-neutral': '<circle cx="12" cy="12" r="8.5" /><path d="M8.8 14h6.4" /><path d="M9 10h.01M15 10h.01" />',
  'mood-low': '<circle cx="12" cy="12" r="8.5" /><path d="M8.8 15.2c.8-.9 1.9-1.4 3.2-1.4s2.4.5 3.2 1.4" /><path d="M9 10h.01M15 10h.01" />',
  'mood-bad': '<circle cx="12" cy="12" r="8.5" /><path d="M8.4 15.8c1-1.3 2.2-2 3.6-2s2.6.7 3.6 2" /><path d="M9 10h.01M15 10h.01" />',
};

export function icon(name, className = '', strokeWidth = 1.8) {
  const path = PATHS[name] ?? PATHS.info;
  const cls = className ? ` ${className}` : '';
  return `<svg viewBox="0 0 24 24" class="app-icon${cls}" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}
