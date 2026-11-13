// Shared by every page of the website: demo links and fade-in cards.
// The home page's scroll story (main.js) imports this too.

// Where "Try our demo" goes. Change this once the demo app is published.
export const DEMO_URL = 'http://localhost:8081';

document.documentElement.classList.add('js');

document.querySelectorAll('[data-demo]').forEach((a) => {
  a.href = DEMO_URL;
  a.target = '_blank';
  a.rel = 'noopener';
});

// cards fade up gently as they scroll into view
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }
  }),
  { threshold: 0.15 },
);
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 70}ms`;
  io.observe(el);
});
