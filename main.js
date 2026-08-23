// Nav scrollspy + email assembly. ponytail: both native, no dependencies.

const links = [...document.querySelectorAll('.topbar a[href^="#"]:not(.wordmark)')];
const sections = links.map(a => document.getElementById(a.hash.slice(1))).filter(Boolean);
const visible = new Set();

// #contact is nested inside #about, so when both are in the band we want the
// later one in document order to win — hence filter().pop() rather than find().
const spy = new IntersectionObserver(entries => {
  for (const e of entries) e.isIntersecting ? visible.add(e.target.id) : visible.delete(e.target.id);
  const active = sections.map(s => s.id).filter(id => visible.has(id)).pop();
  for (const a of links) {
    if (a.hash.slice(1) === active) a.setAttribute('aria-current', 'true');
    else a.removeAttribute('aria-current');
  }
}, { rootMargin: '-20% 0px -70% 0px' });

sections.forEach(s => spy.observe(s));

// Kept out of the markup so the plain scrapers don't get it. Not a real
// defence — just the cheap 90%.
const mail = document.getElementById('mail');
if (mail) {
  const addr = ['chankangle.kevin', 'gmail.com'].join('@');
  mail.href = 'mailto:' + addr;
  mail.textContent = addr;
}
