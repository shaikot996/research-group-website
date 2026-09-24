(() => {
  const BASE = "/research-group-website";
  const root = document.documentElement;
  const saved = localStorage.getItem("theme");
  const dark = saved ? saved === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  root.classList.toggle("dark", dark);

  function syncThemeButtons() {
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.textContent = root.classList.contains("dark") ? "Light" : "Dark";
    });
  }
  syncThemeButtons();
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-theme-toggle]");
    if (!button) return;
    const next = !root.classList.contains("dark");
    root.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    syncThemeButtons();
  });

  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-copy-value]");
    if (!button) return;
    const value = button.getAttribute("data-copy-value") || "";
    try {
      await navigator.clipboard.writeText(value);
      const old = button.textContent;
      button.textContent = "Copied";
      setTimeout(() => { button.textContent = old || "Copy BibTeX"; }, 1500);
    } catch {}
  });

  const form = document.querySelector('form[data-static-search]') ||
    (location.pathname.includes('/search') ? document.querySelector('form') : null);
  if (form) {
    const input = form.querySelector('input[name="q"]');
    let host = document.querySelector('[data-static-search-results]');
    if (!host) {
      host = document.createElement('div');
      host.setAttribute('data-static-search-results', '');
      host.className = 'mt-10';
      form.insertAdjacentElement('afterend', host);
    }
    const render = async (query) => {
      const q = (query || '').trim().toLowerCase();
      if (!q) { host.innerHTML = ''; return; }
      const response = await fetch(BASE + "/search-index.json");
      const rows = await response.json();
      const terms = q.split(/\s+/).filter(Boolean);
      const matches = rows.filter((row) => terms.every((term) => (row.title + " " + row.text).toLowerCase().includes(term))).slice(0, 40);
      const safeQ = q.replace(/[<>&"]/g, '');
      const items = matches.map((row) => '<article class="py-5"><div class="text-xs font-bold uppercase tracking-[.14em] text-accent">' + row.type + '</div><a class="mt-1 block font-serif text-2xl" href="' + row.route + '">' + row.title + '</a></article>').join('');
      host.innerHTML = '<div class="mb-4 text-sm text-muted">' + matches.length + ' result' + (matches.length === 1 ? '' : 's') + ' for “' + safeQ + '”</div><div class="divide-y academic-rule border-y academic-rule">' + items + '</div>';
    };
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const q = input?.value || '';
      const url = new URL(location.href);
      if (q) url.searchParams.set('q', q); else url.searchParams.delete('q');
      history.replaceState(null, '', url);
      render(q);
    });
    const initial = new URLSearchParams(location.search).get('q') || '';
    if (input && initial) input.value = initial;
    if (initial) render(initial);
  }
})();