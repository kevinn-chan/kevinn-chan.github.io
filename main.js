// Nav scrollspy, email assembly, footer year. ponytail: all native, no deps.

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

// Assembled at runtime so the plain scrapers miss it. Not a real defence —
// just the cheap 90%. Writes into .c-value so the icon survives.
const mail = document.getElementById('mail');
if (mail) {
  const addr = ['chankangle.kevin', 'gmail.com'].join('@');
  mail.href = 'mailto:' + addr;
  mail.querySelector('.c-value').textContent = addr;
}

document.getElementById('year').textContent = new Date().getFullYear();
