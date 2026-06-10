/* =========================================
   FOOD PALACE — script.js (Catera Edition)
   ========================================= */
(function () {
  'use strict';

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => (c || document).querySelectorAll(s);
  const isMobile = () => window.innerWidth < 768;

  /* ──────────────────────────────
     1. NAVBAR — Two-row with announce strip
  ────────────────────────────── */
  const navbar = $('#navbar');
  const bottomNav = $('#bottomNavbar');
  let lastScrollY = window.scrollY;
  let scrollUpDistance = 0;

  // Scroll-hide top navbar & toggle scrolled class & toggle bottom nav visibility
  function updateNavScroll() {
    const currentScrollY = window.scrollY;
    const diff = currentScrollY - lastScrollY;
    
    if (diff > 0) {
      // Scrolling down
      scrollUpDistance = 0;
      if (currentScrollY > 100) {
        navbar.classList.add('nav-hidden');
      }
    } else if (diff < 0) {
      // Scrolling up
      scrollUpDistance += Math.abs(diff);
      if (scrollUpDistance > 120 || currentScrollY <= 40) {
        navbar.classList.remove('nav-hidden');
      }
    }
    
    navbar.classList.toggle('scrolled', currentScrollY > 20);
    
    // Show bottom navigation bar only when scrolled past the hero section / reaching #about
    const aboutSection = $('#about');
    if (aboutSection && bottomNav) {
      const aboutTop = aboutSection.getBoundingClientRect().top + currentScrollY;
      // Show slightly before reaching the about section (e.g. aboutTop - 150px)
      if (currentScrollY >= aboutTop - 150) {
        bottomNav.classList.add('bottom-nav-visible');
      } else {
        bottomNav.classList.remove('bottom-nav-visible');
      }
    }
    
    lastScrollY = currentScrollY;
  }
  window.addEventListener('scroll', updateNavScroll, { passive: true });
  updateNavScroll();


  /* ──────────────────────────────
     2. HERO — Native Video Playlist Background
  ────────────────────────────── */
  const heroVideo = $('#heroVideo');
  if (heroVideo) {
    let videoIdx = 0;
    const VIDEO_URLS = [
      'https://assets.mixkit.co/videos/preview/mixkit-wedding-rings-on-a-table-32205-large.mp4',
      'https://assets.mixkit.co/videos/preview/mixkit-couple-walking-in-a-wedding-ceremony-33527-large.mp4',
      'https://assets.mixkit.co/videos/preview/mixkit-a-wedding-couple-dancing-in-a-beautiful-garden-33513-large.mp4'
    ];
    
    // Explicit trigger function with user gesture fallbacks
    const forcePlay = () => {
      heroVideo.play().catch(e => {
        console.warn('Autoplay blocked by browser. Activating touch/click backup listener.', e);
        const playOnInteraction = () => {
          heroVideo.play().catch(err => console.log('Play on gesture failed:', err));
          document.removeEventListener('click', playOnInteraction);
          document.removeEventListener('touchstart', playOnInteraction);
        };
        document.addEventListener('click', playOnInteraction);
        document.addEventListener('touchstart', playOnInteraction);
      });
    };

    // Try to trigger immediately or when ready
    if (heroVideo.readyState >= 2) {
      forcePlay();
    } else {
      heroVideo.addEventListener('canplay', forcePlay, { once: true });
    }

    // Smooth transition between videos
    heroVideo.addEventListener('ended', () => {
      videoIdx = (videoIdx + 1) % VIDEO_URLS.length;
      
      // Fade out
      heroVideo.style.opacity = 0;
      
      setTimeout(() => {
        heroVideo.src = VIDEO_URLS[videoIdx];
        heroVideo.load();
        heroVideo.play().then(() => {
          // Fade in
          heroVideo.style.opacity = 0.45;
        }).catch(e => console.log('Autoplay interrupted', e));
      }, 800); // Allow fade-out time
    });
  }

  /* ──────────────────────────────
     3. HERO PARALLAX (Disabled for 100% width/height background lock)
  ────────────────────────────── */
  // Parallax translation disabled to keep background at exact 100% height without offset gaps.

  /* ──────────────────────────────
     4. COUNTER ANIMATION
  ────────────────────────────── */
  function animateCount(el) {
    const target = parseInt(el.dataset.count, 10);
    const dur = 1800, step = 16;
    const inc = target / (dur / step);
    let cur = 0;
    const t = setInterval(() => {
      cur += inc;
      if (cur >= target) { cur = target; clearInterval(t); }
      el.textContent = Math.floor(cur);
    }, step);
  }
  const statsBar = $('.hero-stats');
  if (statsBar && 'IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        $$('.hstat-n[data-count]').forEach(animateCount);
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    obs.observe(statsBar);
  }

  /* ──────────────────────────────
     5. SCROLL REVEAL
  ────────────────────────────── */
  if ('IntersectionObserver' in window) {
    const rev = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const delay = parseInt(e.target.dataset.delay || '0', 10);
          setTimeout(() => e.target.classList.add('revealed'), delay);
          rev.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    $$('[data-reveal]').forEach(el => rev.observe(el));
  } else {
    $$('[data-reveal]').forEach(el => el.classList.add('revealed'));
  }

  /* ──────────────────────────────
     6. MENU TABS
  ────────────────────────────── */
  $$('.mtab').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.mtab').forEach(b => b.classList.remove('active'));
      $$('.mpanel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = $('#mp-' + btn.dataset.tab);
      if (panel) panel.classList.add('active');
    });
  });

  /* ──────────────────────────────
     7. 3D CURVED GALLERY CAROUSEL (Infinite Loop & Hover Slow-down)
  ────────────────────────────── */
  const cgContainer = $('#curvedGallery');
  const cgTrack = $('#cgTrack');
  
  if (cgContainer && cgTrack) {
    // Duplicate HTML twice to make three sets (ensures seamless loop on all screen sizes)
    const originalHTML = cgTrack.innerHTML;
    cgTrack.innerHTML = originalHTML + originalHTML + originalHTML;

    const cgItems = $$('.cg-item', cgTrack);
    let isDown = false;
    let isHovered = false;
    let startX;
    let scrollLeft;
    let velX = 0;
    let momentumID;

    // Autoplay configuration
    const autoScrollSpeed = 1.0; // speed moving right to left
    let currentSpeed = autoScrollSpeed;

    // 3D Curved Perspective Math Update
    function updateCurved3DEffect() {
      const containerRect = cgContainer.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;
      const containerWidth = containerRect.width;

      cgItems.forEach(item => {
        const itemRect = item.getBoundingClientRect();
        const itemCenter = itemRect.left + itemRect.width / 2;
        const distance = itemCenter - containerCenter;
        
        // Normalized distance relative to half the container's width
        let ratio = distance / (containerWidth / 2);
        ratio = Math.max(-2, Math.min(2, ratio));
        
        // Concave curve mathematics
        const rotateY = ratio * -28;
        const scale = 0.9 + Math.min(1.5, Math.abs(ratio)) * 0.15;
        const translateZ = Math.min(1.5, Math.abs(ratio)) * 60;
        const translateX = ratio * -12;

        item.style.transform = `rotateY(${rotateY}deg) scale(${scale}) translateZ(${translateZ}px) translateX(${translateX}px)`;

        // Cinematic Depth of Field: blur items at the extremes
        const blurValue = Math.max(0, (Math.abs(ratio) - 0.7) * 4.5);
        const card = item.querySelector('.cg-card');
        if (card) {
          card.style.filter = blurValue > 0.15 ? `blur(${blurValue}px)` : 'none';
        }
      });
    }

    cgContainer.addEventListener('mousedown', (e) => {
      isDown = true;
      cgContainer.classList.add('active');
      startX = e.pageX - cgContainer.offsetLeft;
      scrollLeft = cgContainer.scrollLeft;
      velX = 0;
      e.preventDefault();
    });

    cgContainer.addEventListener('mouseleave', () => {
      isDown = false;
      isHovered = false;
      cgContainer.classList.remove('active');
    });

    cgContainer.addEventListener('mouseup', () => {
      isDown = false;
      cgContainer.classList.remove('active');
    });

    cgContainer.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - cgContainer.offsetLeft;
      const walk = (x - startX) * 1.5;
      const prevScroll = cgContainer.scrollLeft;
      cgContainer.scrollLeft = scrollLeft - walk;
      velX = cgContainer.scrollLeft - prevScroll;
    });

    // Hover detection to adjust speed
    cgContainer.addEventListener('mouseenter', () => {
      isHovered = true;
    });

    cgContainer.addEventListener('mouseleave', () => {
      isHovered = false;
    });

    cgContainer.addEventListener('touchstart', (e) => {
      isDown = true;
      startX = e.touches[0].pageX - cgContainer.offsetLeft;
      scrollLeft = cgContainer.scrollLeft;
      velX = 0;
    }, { passive: true });

    cgContainer.addEventListener('touchend', () => {
      isDown = false;
    });

    cgContainer.addEventListener('touchmove', (e) => {
      if (!isDown) return;
      const x = e.touches[0].pageX - cgContainer.offsetLeft;
      const walk = (x - startX) * 1.5;
      const prevScroll = cgContainer.scrollLeft;
      cgContainer.scrollLeft = scrollLeft - walk;
      velX = cgContainer.scrollLeft - prevScroll;
    }, { passive: true });

    // Infinite Autoplay Loop with Momentum & Hover Slow-down
    function animationLoop() {
      if (!cgContainer || !cgTrack) return;

      const setWidth = cgTrack.scrollWidth / 3;

      // Handle infinite loop boundaries
      if (cgContainer.scrollLeft >= setWidth * 2) {
        cgContainer.scrollLeft -= setWidth;
        scrollLeft = cgContainer.scrollLeft; // reset start anchor if dragging
      } else if (cgContainer.scrollLeft <= setWidth * 0.5) {
        cgContainer.scrollLeft += setWidth;
        scrollLeft = cgContainer.scrollLeft; // reset start anchor if dragging
      }

      if (!isDown) {
        // Autoplay speed adjustment (slower on hover, paused when lightbox is active)
        const isLightboxOpen = !!$('div[role="dialog"]');
        const targetSpeed = isLightboxOpen ? 0 : (isHovered ? 0.45 : autoScrollSpeed);
        currentSpeed += (targetSpeed - currentSpeed) * 0.08; // smooth easing

        if (Math.abs(velX) > 0.15) {
          // Momentum glide
          cgContainer.scrollLeft += velX;
          velX *= 0.94;
        } else {
          // Continuous scroll
          cgContainer.scrollLeft += currentSpeed;
          velX = 0;
        }
      }

      updateCurved3DEffect();
      momentumID = requestAnimationFrame(animationLoop);
    }

    // Initial load setup & start loop
    setTimeout(() => {
      const setWidth = cgTrack.scrollWidth / 3;
      cgContainer.scrollLeft = setWidth;
      updateCurved3DEffect();
      animationLoop();
    }, 300);

    window.addEventListener('resize', () => {
      const setWidth = cgTrack.scrollWidth / 3;
      cgContainer.scrollLeft = setWidth;
      updateCurved3DEffect();
    });

    // Expose velX for Lightbox click handling
    Object.defineProperty(cgContainer, 'currentVelocity', {
      get: () => (isDown ? 1.5 : velX)
    });
  }

  /* ──────────────────────────────
     8. GALLERY LIGHTBOX
  ────────────────────────────── */
  $$('.cg-card').forEach(card => {
    card.addEventListener('click', () => {
      // Prevent opening lightbox if user was dragging
      const velocity = cgContainer ? cgContainer.currentVelocity : 0;
      if (Math.abs(velocity) > 1.2) return;

      const img = card.querySelector('img');
      if (!img) return;
      
      const ov = document.createElement('div');
      ov.setAttribute('role', 'dialog');
      ov.style.cssText = [
        'position:fixed;inset:0;background:rgba(0,0,0,0.96);z-index:10000;',
        'display:flex;align-items:center;justify-content:center;cursor:zoom-out;',
        'padding:20px;animation:fadeIn .3s ease;'
      ].join('');
      const i = document.createElement('img');
      i.src = img.src; i.alt = img.alt;
      i.style.cssText = 'max-width:92vw;max-height:88vh;object-fit:contain;box-shadow:0 24px 80px rgba(0,0,0,0.9);';
      const cls = document.createElement('button');
      cls.innerHTML = '✕';
      cls.style.cssText = [
        'position:absolute;top:20px;right:24px;',
        'background:rgba(200,169,110,0.15);color:var(--cream);border:1px solid rgba(200,169,110,0.3);',
        'width:44px;height:44px;font-size:1.125rem;cursor:pointer;',
        'display:flex;align-items:center;justify-content:center;transition:background .2s;'
      ].join('');
      ov.appendChild(i); ov.appendChild(cls);
      document.body.appendChild(ov);
      document.body.style.overflow = 'hidden';
      const dismiss = () => { document.body.removeChild(ov); document.body.style.overflow = ''; };
      ov.addEventListener('click', e => { if (e.target === ov) dismiss(); });
      cls.addEventListener('click', dismiss);
      document.addEventListener('keydown', function esc(e) {
        if (e.key === 'Escape') { dismiss(); document.removeEventListener('keydown', esc); }
      });
    });
  });

  /* ──────────────────────────────
     9. REVIEWS SLIDER
  ────────────────────────────── */
  const revTrack = $('#revTrack');
  const revPrev  = $('#revPrev');
  const revNext  = $('#revNext');
  const revDots  = $('#revDots');

  if (revTrack && revPrev) {
    const cards = $$('.rev-card', revTrack);
    let cur = 0, autoT;

    function getVis() {
      if (window.innerWidth >= 960) return 3;
      if (window.innerWidth >= 768) return 2;
      return 1;
    }
    function pages() { return Math.ceil(cards.length / getVis()); }

    function buildDots() {
      revDots.innerHTML = '';
      for (let i = 0; i < pages(); i++) {
        const d = document.createElement('button');
        d.className = 'rdot' + (i === 0 ? ' active' : '');
        d.setAttribute('aria-label', 'Slide ' + (i + 1));
        d.addEventListener('click', () => goTo(i));
        revDots.appendChild(d);
      }
    }
    function goTo(idx) {
      const vis = getVis();
      cur = ((idx % pages()) + pages()) % pages();
      const cardW = cards[0].offsetWidth + 20;
      revTrack.style.transform = `translateX(-${cur * vis * cardW}px)`;
      $$('.rdot', revDots).forEach((d, i) => d.classList.toggle('active', i === cur));
    }
    function startAuto() { autoT = setInterval(() => goTo(cur + 1), 5000); }
    function stopAuto()  { clearInterval(autoT); }

    revNext.addEventListener('click', () => { stopAuto(); goTo(cur + 1); startAuto(); });
    revPrev.addEventListener('click', () => { stopAuto(); goTo(cur - 1); startAuto(); });

    // Touch
    let tx = 0;
    revTrack.addEventListener('touchstart', e => { tx = e.changedTouches[0].screenX; }, { passive: true });
    revTrack.addEventListener('touchend', e => {
      const dx = tx - e.changedTouches[0].screenX;
      if (Math.abs(dx) > 40) { stopAuto(); dx > 0 ? goTo(cur + 1) : goTo(cur - 1); startAuto(); }
    }, { passive: true });

    window.addEventListener('resize', () => { buildDots(); goTo(0); });
    buildDots();
    startAuto();
  }

  /* ──────────────────────────────
     10. CONTACT FORM → WHATSAPP
  ────────────────────────────── */
  const form = $('#contactForm');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const name  = ($('#cf-name').value  || '').trim();
      const phone = ($('#cf-phone').value || '').trim();
      if (!name || !phone) { alert('Please enter your name and phone number.'); return; }
      const date   = $('#cf-date').value   || '';
      const type   = $('#cf-type').value   || '';
      const guests = $('#cf-guests').value || '';
      const msg    = ($('#cf-msg').value   || '').trim();
      let text = `Hi Food Palace! 🍽️\n\n👤 ${name}\n📞 ${phone}`;
      if (date)   text += `\n📅 Date: ${date}`;
      if (type)   text += `\n🎉 Event: ${type}`;
      if (guests) text += `\n👥 Guests: ${guests}`;
      if (msg)    text += `\n💬 ${msg}`;
      window.open('https://wa.me/916238xxxxxx?text=' + encodeURIComponent(text), '_blank');
    });
  }

  /* ──────────────────────────────
     11. PREMIUM INERTIAL SMOOTH SCROLL
  ────────────────────────────── */
  function scrollToTarget(targetElement, offset = 24, duration = 850) {
    const start = window.pageYOffset || document.documentElement.scrollTop;
    const target = targetElement.getBoundingClientRect().top + start - offset;
    const distance = target - start;
    let startTime = null;

    // Quintic ease-out curve for that premium React-style inertial deceleration
    function easeOutQuint(t) {
      return 1 - Math.pow(1 - t, 5);
    }

    function scrollStep(currentTime) {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const ease = easeOutQuint(progress);
      
      window.scrollTo(0, start + distance * ease);

      if (timeElapsed < duration) {
        requestAnimationFrame(scrollStep);
      }
    }

    requestAnimationFrame(scrollStep);
  }

  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        
        // Snappy active state and bubble update on click
        if (a.classList.contains('bottom-nav-item')) {
          $$('.bottom-nav-item').forEach(el => el.classList.remove('active-link'));
          a.classList.add('active-link');
          updateBottomNavBubble();
        }
        
        // Custom smooth scroll with inertia
        const offset = 24;
        scrollToTarget(target, offset, 900);
      }
    });
  });

  /* ──────────────────────────────
     12. ACTIVE NAV HIGHLIGHT & SLIDING BUBBLE
  ────────────────────────────── */
  const bottomNavInner = $('.bottom-nav-inner');
  let bubbleEl = null;

  if (bottomNavInner) {
    bubbleEl = document.createElement('div');
    bubbleEl.className = 'bottom-nav-bubble';
    bottomNavInner.appendChild(bubbleEl);
  }

  function updateBottomNavBubble() {
    if (!bubbleEl) return;
    const activeItem = $('.bottom-nav-item.active-link');
    if (activeItem) {
      bubbleEl.style.width = `${activeItem.offsetWidth}px`;
      bubbleEl.style.left = `${activeItem.offsetLeft}px`;
      bubbleEl.style.opacity = '1';
    } else {
      bubbleEl.style.opacity = '0';
    }
  }

  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => {
      let changed = false;
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          $$('.nav-link').forEach(l => {
            const isMatch = l.getAttribute('href') === '#' + entry.target.id;
            if (l.classList.contains('active-link') !== isMatch) {
              l.classList.toggle('active-link', isMatch);
              changed = true;
            }
          });
        }
      });
      if (changed) {
        updateBottomNavBubble();
      }
    }, { rootMargin: '-35% 0px -55% 0px' });
    $$('section[id]').forEach(s => obs.observe(s));
  }

  window.addEventListener('resize', updateBottomNavBubble);
  // Initial layout delay to ensure offsets are loaded
  setTimeout(updateBottomNavBubble, 300);

  console.log('%c🍽 Food Palace · Premium Catering', 'color:#c8a96e;font-weight:600;font-size:13px');
})();
