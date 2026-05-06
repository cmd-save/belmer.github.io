(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Year stamp
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Header scrolled state
  const header = document.getElementById('site-header');
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 8);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile nav toggle
  const nav = document.getElementById('primary-nav');
  const navToggle = document.getElementById('nav-toggle');
  if (nav && navToggle) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
    });

    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Reveal-on-scroll
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
  }

  // Copy email
  const copyBtn = document.getElementById('copy-email');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const email = copyBtn.dataset.email || '';
      try {
        await navigator.clipboard.writeText(email);
        const label = document.getElementById('copy-email-label');
        const original = label ? label.textContent : '';
        if (label) label.textContent = 'copied!';
        copyBtn.classList.add('copied');
        setTimeout(() => {
          if (label) label.textContent = original;
          copyBtn.classList.remove('copied');
        }, 1600);
      } catch {
        window.location.href = `mailto:${email}`;
      }
    });
  }

  // Active nav link based on which section is in view
  const navLinks = Array.from(document.querySelectorAll('[data-nav]'));
  const sections = navLinks
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    const setActive = id => {
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
      });
    };

    const navIO = new IntersectionObserver((entries) => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]) setActive(visible[0].target.id);
    }, { threshold: 0.4, rootMargin: '-80px 0px -40% 0px' });

    sections.forEach(s => navIO.observe(s));
  }
})();
