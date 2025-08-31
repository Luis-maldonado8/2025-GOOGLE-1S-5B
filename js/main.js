// main.js — tabs robustos + sin marco en carga con hash
document.addEventListener('DOMContentLoaded', () => {
  const CONFIG = {
    defaultTab: document.body?.dataset?.defaultTab || 'user-stories',
    useHistory: true,          // deja el historial para clicks dentro de la página
    stripHashOnLoad: true,     // <- quita el hash SOLO en la 1ª carga (elimina el “marco”)
    focusOnActivate: false,    // no enfocar panel (evita contornos)
    scrollOnActivate: true,    // hace scroll al panel activo
  };

  const sections = Array.from(document.querySelectorAll('.tab-section'));
  if (!sections.length) return;

  const nav = document.querySelector('header nav');
  const navLinks = nav ? Array.from(nav.querySelectorAll('a[href^="#"], [data-target]')) : [];
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ===== Accesibilidad básica
  if (nav) nav.setAttribute('role', 'tablist');
  sections.forEach(sec => {
    sec.setAttribute('role', 'tabpanel');
    sec.setAttribute('tabindex', '-1');
    sec.setAttribute('aria-hidden', sec.classList.contains('active') ? 'false' : 'true');
  });
  navLinks.forEach(a => {
    a.setAttribute('role', 'tab');
    const targetId = a.dataset.target || (a.getAttribute('href') || '').replace(/^#/, '');
    if (targetId) a.setAttribute('aria-controls', targetId);
  });

  function activateSection(id, opts = {}) {
    const options = {
      doScroll: CONFIG.scrollOnActivate,
      doFocus: CONFIG.focusOnActivate,
      fromHashChange: false,
      ...opts,
    };
    const target = document.getElementById(id);
    if (!target) return;

    const alreadyActive = target.classList.contains('active');

    sections.forEach(sec => {
      const isActive = sec === target;
      sec.classList.toggle('active', isActive);
      sec.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });

    navLinks.forEach(a => {
      const linkId = a.dataset.target || (a.getAttribute('href') || '').replace(/^#/, '');
      const isActive = linkId === id;
      a.classList.toggle('active', isActive);
      a.setAttribute('aria-selected', isActive ? 'true' : 'false');
      if (isActive) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });

    // sin focus para evitar contornos
    if (options.doFocus && !alreadyActive && options.fromHashChange) {
      const focusTarget = target.querySelector('h2') || target;
      focusTarget?.focus?.({ preventScroll: true });
    }

    if (options.doScroll && !alreadyActive) {
      target.scrollIntoView({
        behavior: prefersReduced ? 'auto' : 'smooth',
        block: 'start',
      });
    }
  }

  function setHash(id) {
    if (!CONFIG.useHistory) return;
    if (location.hash !== `#${id}`) location.hash = `#${id}`;
    // activateSection se dispara por hashchange
  }

  // ===== Inicialización
  (function init() {
    const hashId = location.hash ? location.hash.substring(1) : null;
    if (hashId && document.getElementById(hashId)) {
      activateSection(hashId, { doScroll: false, doFocus: false });

      // <-- clave: quitamos el hash tras activar para que el navegador no pinte el “marco”
      if (CONFIG.stripHashOnLoad) {
        const cleanURL = window.location.pathname + window.location.search;
        history.replaceState(null, '', cleanURL);
      }
      return;
    }

    const preActive = document.querySelector('.tab-section.active');
    if (preActive) {
      activateSection(preActive.id, { doScroll: false, doFocus: false });
      return;
    }

    const fallback =
      (document.getElementById(CONFIG.defaultTab) && CONFIG.defaultTab) ||
      (document.getElementById('user-stories') && 'user-stories') ||
      (document.getElementById('interfaces') && 'interfaces') ||
      (sections[0] && sections[0].id);

    if (fallback) activateSection(fallback, { doScroll: false, doFocus: false });
  })();

  // ===== Clicks en tabs internos
  navLinks.forEach(link => {
    link.addEventListener('click', e => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
      const targetId = link.dataset.target || (link.getAttribute('href') || '').replace(/^#/, '');
      if (!targetId) return;
      e.preventDefault();
      if (CONFIG.useHistory) setHash(targetId);
      else activateSection(targetId, { doScroll: true, doFocus: false });
    });
  });

  // ===== Atrás/adelante
  let hashChangeTimeout = null;
  window.addEventListener('hashchange', () => {
    const id = location.hash ? location.hash.substring(1) : null;
    if (!id || !document.getElementById(id)) return;
    clearTimeout(hashChangeTimeout);
    hashChangeTimeout = setTimeout(() => {
      activateSection(id, { doScroll: true, doFocus: false, fromHashChange: true });
    }, 0);
  });
});



