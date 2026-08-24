// Scrollspy, bidirectional scroll reveals, word-split headline, spotlight
// cards, hero parallax, scroll progress, number tickers, email assembly.
//
// ponytail: IntersectionObserver + rAF + CSS custom properties. No GSAP,
// no ScrollTrigger, no animation library. One scroll handler for everything
// that is scroll-linked, rAF-throttled.

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
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

/* ── bidirectional scroll reveal ───────────────────────────────
   Enter the band, fade up; leave it, fade back out. Unlike a
   one-shot reveal we never unobserve, so scrolling back up
   replays it.
   ──────────────────────────────────────────────────────────── */
const reveals = [...document.querySelectorAll('.reveal')];
let observerFired = false;

if (reduced) {
  reveals.forEach(el => el.classList.add('in'));
} else {
  const io = new IntersectionObserver(entries => {
    observerFired = true;
    for (const e of entries) e.target.classList.toggle('in', e.isIntersecting);
  }, { rootMargin: '-10% 0px -10% 0px', threshold: 0 });
  reveals.forEach(el => io.observe(el));

  // Content starts at opacity 0, so if the observer never runs at all the
  // page would stay blank. IntersectionObserver does not fire in a hidden
  // document. Only force-show when nothing has fired — otherwise this would
  // fight the toggle above. Snap rather than transition, since transitions
  // are suspended in a hidden document too.
  setTimeout(() => {
    if (!observerFired) reveals.forEach(el => el.classList.add('shown'));
  }, 3000);
}

/* ── split the headline into words for a staggered entrance ──── */
function splitWords(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const texts = [];
  while (walker.nextNode()) texts.push(walker.currentNode);

  let i = 0;
  for (const node of texts) {
    if (!node.textContent.trim()) continue;
    const frag = document.createDocumentFragment();
    // keep the whitespace so words don't run together when they wrap
    for (const part of node.textContent.split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); continue; }
      const span = document.createElement('span');
      span.className = 'w';
      span.style.setProperty('--i', i++);
      span.textContent = part;
      frag.appendChild(span);
    }
    node.parentNode.replaceChild(frag, node);
  }
}

const headline = document.querySelector('h1');
if (headline && !reduced) {
  splitWords(headline);
  requestAnimationFrame(() => headline.classList.add('lit'));
}

/* ── spotlight cards (cursor-tracked radial highlight) ───────── */
if (!reduced && matchMedia('(hover: hover)').matches) {
  for (const card of document.querySelectorAll('.spot')) {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  }
}

/* ── scroll-linked: progress bar + hero parallax ─────────────── */
const bar = document.querySelector('.progress');
const scatter = [...document.querySelectorAll('.scatter span')];
const hero = document.querySelector('.hero');
let queued = false;

function onScroll() {
  const y = window.scrollY;

  if (bar) {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
  }

  // Ornament drifts and fades as the hero leaves — reversible, so it comes
  // back on the way up. This is the "appear and disappear" pass.
  if (hero && scatter.length && !reduced) {
    const h = hero.offsetHeight || 1;
    const p = Math.min(y / h, 1);                    // 0 at top, 1 past hero
    for (let i = 0; i < scatter.length; i++) {
      const dir = i % 2 ? 1 : -1;
      const drift = p * 130 * (0.5 + (i % 4) * 0.28);
      scatter[i].style.setProperty('--sy', `${-drift}px`);
      scatter[i].style.setProperty('--sx', `${dir * p * 46}px`);
      scatter[i].style.setProperty('--so', `${Math.max(1 - p * 1.35, 0)}`);
    }
  }
  queued = false;
}

addEventListener('scroll', () => {
  if (queued) return;
  queued = true;
  requestAnimationFrame(onScroll);
}, { passive: true });
onScroll();

/* ── number tickers ────────────────────────────────────────── */
const fmt = (n, dec) =>
  n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });

function runTicker(el) {
  const to = parseFloat(el.dataset.to);
  const dec = parseInt(el.dataset.dec || '0', 10);
  const suffix = el.dataset.suffix || '';
  const DURATION = 1400;
  const final = fmt(to, dec) + suffix;
  let start, done = false;

  function settle() { done = true; el.textContent = final; }

  function frame(now) {
    if (done) return;
    start ??= now;
    const p = Math.min((now - start) / DURATION, 1);
    if (p >= 1) return settle();
    el.textContent = fmt(to * (1 - Math.pow(1 - p, 3)), dec) + suffix;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // rAF is suspended while the document is hidden, which would freeze the
  // count partway and display a figure that is simply wrong. Timers keep
  // running, so this guarantees the true value lands regardless.
  setTimeout(settle, DURATION + 500);
}

const ticks = [...document.querySelectorAll('.tick')];
if (!reduced && ticks.length) {
  const tio = new IntersectionObserver((entries, obs) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      runTicker(e.target);
      obs.unobserve(e.target);          // count up once, don't re-run
    }
  }, { threshold: 0.5 });
  ticks.forEach(t => tio.observe(t));
}

/* ── contact ───────────────────────────────────────────────── */
const mail = document.getElementById('mail');
if (mail) {
  const addr = ['chankangle.kevin', 'gmail.com'].join('@');
  mail.href = 'mailto:' + addr;
  mail.querySelector('.c-value').textContent = addr;
}

document.getElementById('year').textContent = new Date().getFullYear();
