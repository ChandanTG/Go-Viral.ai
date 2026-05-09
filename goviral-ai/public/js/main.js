// public/js/main.js – GSAP animations, tilt, navbar, global interactions

(function () {
  'use strict';

  // ─── Navbar Scroll Effect ──────────────────────────────────
  const navbar = document.getElementById('mainNav');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 30);
    });
  }

  // ─── Mobile Nav Toggle ────────────────────────────────────
  const navToggle = document.getElementById('navToggle');
  const navLinks  = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      const bars = navToggle.querySelectorAll('span');
      navLinks.classList.contains('open')
        ? bars.forEach((b, i) => {
            if (i === 0) b.style.transform = 'rotate(45deg) translate(5px, 5px)';
            if (i === 1) b.style.opacity = '0';
            if (i === 2) b.style.transform = 'rotate(-45deg) translate(5px, -5px)';
          })
        : bars.forEach(b => { b.style.transform = ''; b.style.opacity = ''; });
    });
  }

  // ─── GSAP: Page Entrance Animations ──────────────────────
  if (typeof gsap !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // Fade in elements
    gsap.utils.toArray('.gsap-fade').forEach((el, i) => {
      gsap.fromTo(el,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.7, delay: i * 0.1, ease: 'power3.out' }
      );
    });

    // Fade up on scroll
    gsap.utils.toArray('.gsap-fade-up').forEach((el) => {
      gsap.fromTo(el,
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' }
        }
      );
    });

    // Slide from right
    gsap.utils.toArray('.gsap-slide-right').forEach((el) => {
      gsap.fromTo(el,
        { opacity: 0, x: 50 },
        { opacity: 1, x: 0, duration: 0.9, delay: 0.3, ease: 'power3.out' }
      );
    });

    // Stat cards stagger
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length) {
      gsap.fromTo(statCards,
        { opacity: 0, y: 20, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: 'back.out(1.4)' }
      );
    }

    // Content cards stagger
    const contentCards = document.querySelectorAll('.content-card');
    if (contentCards.length) {
      gsap.fromTo(contentCards,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power2.out', delay: 0.2 }
      );
    }

    // Feature cards
    gsap.utils.toArray('.feature-card').forEach((card) => {
      ScrollTrigger.create({
        trigger: card,
        start: 'top 88%',
        onEnter: () => {
          gsap.fromTo(card, { opacity: 0, y: 30, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power3.out' });
        },
      });
    });

    // Platform pills
    const pills = document.querySelectorAll('.platform-pill');
    if (pills.length) {
      gsap.fromTo(pills,
        { opacity: 0, scale: 0.9 },
        {
          opacity: 1, scale: 1, stagger: 0.05, duration: 0.4, ease: 'back.out(1.5)',
          scrollTrigger: { trigger: pills[0], start: 'top 85%' }
        }
      );
    }

    // Hero badge bounce
    const badge = document.querySelector('.hero-badge');
    if (badge) {
      gsap.to(badge, { y: -4, duration: 1.5, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    }

    // Score ring on results page
    const mainArc = document.getElementById('mainArc');
    if (mainArc) {
      const circumference = 534;
      const score = parseInt(mainArc.dataset.score || 0);
      const offset = circumference - (circumference * score / 100);
      mainArc.style.strokeDashoffset = circumference;
      setTimeout(() => {
        mainArc.style.transition = 'stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)';
        mainArc.style.strokeDashoffset = offset;
      }, 400);
    }
  }

  // ─── 3D Tilt Effect on Cards ──────────────────────────────
  function initTilt() {
    document.querySelectorAll('.tilt-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 14;
        const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 14;
        card.style.transform = `perspective(800px) rotateY(${x}deg) rotateX(${-y}deg) translateZ(4px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) translateZ(0)';
        card.style.transition = 'transform 0.4s ease';
        setTimeout(() => { card.style.transition = ''; }, 400);
      });
    });
  }
  initTilt();

  // ─── Animated Counter (Landing Stats) ─────────────────────
  function animateCounters() {
    document.querySelectorAll('.stat-num[data-count]').forEach(el => {
      const target = parseInt(el.dataset.count);
      let current = 0;
      const duration = 1800;
      const step = target / (duration / 16);
      const timer = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = Math.round(current);
        if (current >= target) clearInterval(timer);
      }, 16);
    });
  }

  // Trigger counter when hero enters view
  const heroStats = document.querySelector('.hero-stats');
  if (heroStats && typeof IntersectionObserver !== 'undefined') {
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) { animateCounters(); obs.disconnect(); }
    }, { threshold: 0.5 });
    obs.observe(heroStats);
  }

  // ─── Flash Auto-dismiss ────────────────────────────────────
  const flash = document.getElementById('flashMsg');
  if (flash) {
    setTimeout(() => {
      flash.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      flash.style.opacity = '0';
      flash.style.transform = 'translateY(-8px)';
      setTimeout(() => flash.remove(), 400);
    }, 5000);
  }

  // ─── Metric Bar Animations (Results Page) ─────────────────
  function animateBars() {
    document.querySelectorAll('.sm-fill[data-w]').forEach(bar => {
      setTimeout(() => { bar.style.width = bar.dataset.w + '%'; }, 400);
    });
    document.querySelectorAll('.mini-fill').forEach(bar => {
      const w = bar.style.width;
      bar.style.width = '0';
      setTimeout(() => { bar.style.width = w; }, 300);
    });
    document.querySelectorAll('.pb-fill, .sdb-fill').forEach(bar => {
      const w = bar.style.width;
      bar.style.width = '0';
      setTimeout(() => { bar.style.width = w; }, 500);
    });
  }
  animateBars();

  // ─── Button ripple effect ─────────────────────────────────
  document.querySelectorAll('.btn-primary, .btn-ghost').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      ripple.style.cssText = `
        position:absolute;left:${e.clientX-rect.left}px;top:${e.clientY-rect.top}px;
        width:0;height:0;border-radius:50%;background:rgba(255,255,255,0.25);
        transform:translate(-50%,-50%);animation:rippleAnim 0.6s ease forwards;pointer-events:none;
      `;
      if (!document.getElementById('rippleStyle')) {
        const s = document.createElement('style');
        s.id = 'rippleStyle';
        s.textContent = '@keyframes rippleAnim{to{width:200px;height:200px;opacity:0}}';
        document.head.appendChild(s);
      }
      this.style.position = 'relative';
      this.style.overflow = 'hidden';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });

  // ─── Sidebar active link highlight ────────────────────────
  const currentPath = window.location.pathname;
  document.querySelectorAll('.sidebar-link').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });

  // ─── Score chip bar width fix ──────────────────────────────
  document.querySelectorAll('.sc-bar').forEach(bar => {
    const w = bar.style.width;
    const pct = Math.min(parseInt(w) || 0, 100);
    bar.style.width = '0';
    setTimeout(() => {
      bar.style.transition = 'width 1s ease';
      bar.style.width = pct + '%';
    }, 300);
  });

})();
