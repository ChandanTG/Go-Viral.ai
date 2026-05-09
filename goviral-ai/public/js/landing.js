// public/js/landing.js – Landing page specific animations

(function () {
  if (typeof gsap === 'undefined') return;

  // ─── Hero Parallax ────────────────────────────────────────
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const heroContent = document.querySelector('.hero-content');
    const heroVisual  = document.querySelector('.hero-visual');
    if (heroContent) heroContent.style.transform = `translateY(${scrollY * 0.15}px)`;
    if (heroVisual)  heroVisual.style.transform  = `translateY(${scrollY * 0.08}px)`;
  });

  // ─── Score Card Entrance ──────────────────────────────────
  const scoreCard = document.querySelector('.score-card');
  if (scoreCard) {
    gsap.to(scoreCard, {
      y: -12,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
  }

  // ─── Metric fills animate on load ─────────────────────────
  setTimeout(() => {
    document.querySelectorAll('.metric-fill').forEach(el => {
      const w = el.style.width;
      el.style.width = '0';
      el.style.transition = 'width 1.5s cubic-bezier(0.4,0,0.2,1)';
      setTimeout(() => { el.style.width = w; }, 100);
    });
  }, 500);

  // ─── CTA Glow Pulse ───────────────────────────────────────
  const ctaGlow = document.querySelector('.cta-glow');
  if (ctaGlow) {
    gsap.to(ctaGlow, {
      scale: 1.3,
      opacity: 0.5,
      duration: 2.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
  }

  // ─── Feature Icon Hover Animations ───────────────────────
  document.querySelectorAll('.feature-card').forEach(card => {
    const icon = card.querySelector('.feature-icon');
    card.addEventListener('mouseenter', () => {
      if (icon) gsap.to(icon, { scale: 1.15, rotation: 5, duration: 0.3, ease: 'back.out(2)' });
    });
    card.addEventListener('mouseleave', () => {
      if (icon) gsap.to(icon, { scale: 1, rotation: 0, duration: 0.3 });
    });
  });

  // ─── Platform Pills Hover ─────────────────────────────────
  document.querySelectorAll('.platform-pill').forEach(pill => {
    pill.addEventListener('mouseenter', () => {
      gsap.to(pill, { y: -5, scale: 1.05, duration: 0.25, ease: 'power2.out' });
    });
    pill.addEventListener('mouseleave', () => {
      gsap.to(pill, { y: 0, scale: 1, duration: 0.25 });
    });
  });

  // ─── Floating badges independent animation ────────────────
  document.querySelectorAll('.float-badge').forEach((badge, i) => {
    gsap.to(badge, {
      y: -12,
      duration: 2.5 + i * 0.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: i * 1.2,
    });
  });

  // ─── Scroll indicator for hero ────────────────────────────
  const heroSection = document.querySelector('.hero');
  if (heroSection) {
    gsap.to('.hero-badge', {
      scale: 1.03,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
  }

})();
