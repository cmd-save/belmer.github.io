(() => {
  'use strict';

  // Year stamp
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  const setThemeLabel = (theme) => {
    if (!themeToggle) return;
    themeToggle.setAttribute(
      'aria-label',
      theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
    );
  };
  setThemeLabel(document.documentElement.getAttribute('data-theme') || 'light');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      setThemeLabel(next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  }

  // Tabs (Skills + Projects)
  document.querySelectorAll('[data-tabs]').forEach((root) => {
    const tabs = root.querySelectorAll('.tab[data-tab]');
    const panels = root.querySelectorAll('.tab-panel');

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        tabs.forEach((t) => t.setAttribute('aria-selected', t === tab ? 'true' : 'false'));
        panels.forEach((p) => {
          if (p.id === target) p.setAttribute('data-active', '');
          else p.removeAttribute('data-active');
        });
      });
    });
  });
})();
