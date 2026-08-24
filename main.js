// Nav scrollspy, scroll reveals, number tickers, email assembly.
// ponytail: IntersectionObserver + rAF are native. No animation library.

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Opt into the hidden-then-revealed state only once JS is confirmed running,
// so no-JS visitors and crawlers get the fully visible page.
if (!reduced) document.documentElement.classList.add('js');

/* ── nav scrollspy ─────────────────────────────────────────── */
const links = [...document.querySelectorAll('.topbar a[href^="#"]:not(.wordmark)')];
const sections = links.map(a => document.getElementById(a.hash.slice(1))).filter(Boolean);
const visible = new Set();

const spy = new IntersectionObserver(entries => {
  for (const e of entries) e.isIntersecting ? visible.add(e.target.id) : visible.delete(e.target.id);
  const active = sections.map(s => s.id).filter(id => visible.has(id)).pop();
  for (const a of links) {
    if (a.hash.slice(1) === active) a.setAttribute('aria-current', 'true');
    else a.removeAttribute('aria-current');
  }
}, { rootMargin: '-15% 0px -70% 0px' });
sections.forEach(s => spy.observe(s));

/* ── scroll reveal ─────────────────────────────────────────── */
const reveals = [...document.querySelectorAll('.reveal')];
if (reduced) {
  reveals.forEach(el => el.classList.add('in'));
} else {
  const io = new IntersectionObserver((entries, obs) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('in');
      obs.unobserve(e.target);          // reveal once, then stop watching
    }
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
  reveals.forEach(el => io.observe(el));

  // Failsafe: content starts at opacity 0, so anything that stops the observer
  // firing would hide the page permanently. IntersectionObserver does not run
  // in a hidden document (background tab, prerender, some embedded viewers), so
  // this is reachable in the wild, not just in theory. Show everything after 3s
  // regardless; the observer usually wins long before this fires.
  // Snap rather than transition: if we are falling back, the document may be
  // hidden, and CSS transitions do not advance in a hidden document either.
  setTimeout(() => reveals.forEach(el => el.classList.add('shown')), 3000);
}

/* ── number tickers ────────────────────────────────────────── */
const fmt = (n, dec) =>
  n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });

function runTicker(el) {
  const to = parseFloat(el.dataset.to);
  const dec = parseInt(el.dataset.dec || '0', 10);
  const suffix = el.dataset.suffix || '';
  const DURATION = 1400;
  const final = fmt(to, dec) + suffix;
  let start;
  let done = false;

  function settle() {                            // always end on the true value
    done = true;
    el.textContent = final;
  }

  function frame(now) {
    if (done) return;
    start ??= now;
    const p = Math.min((now - start) / DURATION, 1);
    if (p >= 1) return settle();
    const eased = 1 - Math.pow(1 - p, 3);        // ease-out cubic
    el.textContent = fmt(to * eased, dec) + suffix;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // rAF is suspended while the document is hidden, which would freeze the
  // number partway and display a figure that is simply wrong. Timers still
  // run, so this guarantees the final value lands no matter what.
  setTimeout(settle, DURATION + 500);
}

const ticks = [...document.querySelectorAll('.tick')];
if (!reduced && ticks.length) {
  const tio = new IntersectionObserver((entries, obs) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      runTicker(e.target);
      obs.unobserve(e.target);
    }
  }, { threshold: 0.5 });
  ticks.forEach(t => tio.observe(t));
}

/* ── contact ───────────────────────────────────────────────── */
// Assembled at runtime so plain scrapers miss it. Not a real defence,
// just the cheap 90%. Writes into .c-value so the icon survives.
const mail = document.getElementById('mail');
if (mail) {
  const addr = ['chankangle.kevin', 'gmail.com'].join('@');
  mail.href = 'mailto:' + addr;
  mail.querySelector('.c-value').textContent = addr;
}

document.getElementById('year').textContent = new Date().getFullYear();
