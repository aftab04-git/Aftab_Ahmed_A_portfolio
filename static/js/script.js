// ============================================================
// Audio – key press sounds
// ============================================================
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) { /* audio not supported */ }
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

// Short typewriter clack – used for the name typing
function playClack() {
    if (!audioCtx || audioCtx.state === 'suspended') return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = 700 + Math.random() * 500;
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.035);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.04);
}

// Sci-fi beep – used for loader terminal lines
function playSciFi() {
    if (!audioCtx || audioCtx.state === 'suspended') return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1100, now);
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.09);
    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
}

// ============================================================
// Theme toggle (light / dark)
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    function setTheme(isLight) {
        document.body.classList.toggle('light', isLight);
        themeToggle.setAttribute('aria-checked', isLight ? 'true' : 'false');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    }

    setTheme(localStorage.getItem('theme') === 'light');

    function toggle() {
        setTheme(!document.body.classList.contains('light'));
    }

    themeToggle.addEventListener('click', toggle);
    themeToggle.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
        }
    });
});

// ============================================================
// Mobile menu
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
    }
    window.closeMobile = () => { if (mobileMenu) mobileMenu.classList.remove('open'); };
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && mobileMenu) mobileMenu.classList.remove('open');
    });
});

// ============================================================
// Skills – staggered reveal + 3D tilt
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const grid = document.getElementById('skillsGrid');
    if (!grid) return;
    const skillCards = grid.querySelectorAll('.skill-card');
    const skillBars = grid.querySelectorAll('.skill-bar-fill');
    if (!skillCards.length) return;

    function animateSkills() {
        skillCards.forEach((card, i) => setTimeout(() => card.classList.add('visible'), i * 80));
        setTimeout(() => {
            skillBars.forEach(bar => {
                const w = bar.getAttribute('data-width');
                if (w) bar.style.width = (w * 100) + '%';
            });
        }, skillCards.length * 80 + 300);
    }

    const r = grid.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) {
        animateSkills();
    } else {
        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) { animateSkills(); obs.unobserve(grid); }
            });
        }, { threshold: 0.15 });
        obs.observe(grid);
    }

    // Mouse tilt
    grid.addEventListener('mousemove', e => {
        skillCards.forEach(card => {
            if (!card.classList.contains('visible')) return;
            const rect = card.getBoundingClientRect();
            const dx = (e.clientX - (rect.left + rect.width / 2)) / 30;
            const dy = (e.clientY - (rect.top + rect.height / 2)) / 30;
            card.style.transform = `perspective(800px) translateY(-2px) rotateY(${dx}deg) rotateX(${-dy}deg) scale(1.02)`;
        });
    });
    grid.addEventListener('mouseleave', () => {
        skillCards.forEach(card => {
            if (card.classList.contains('visible')) card.style.transform = '';
        });
    });
});

// ============================================================
// Contact form + custom toast notification
// ============================================================
function showToast(message, type) {
    const old = document.querySelector('.custom-toast');
    if (old) old.remove();

    const toast = document.createElement('div');
    toast.className = 'custom-toast ' + (type || 'success');
    toast.innerHTML = `
        <span class="toast-icon">${type === 'success' ? '✅' : '❌'}</span>
        <span class="toast-msg">${message}</span>
    `;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

async function handleSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = form.querySelector('.form-submit');
    const originalText = submitBtn.textContent;

    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    try {
        const res = await fetch('/send-message', { method: 'POST', body: new FormData(form) });
        const result = await res.json();
        if (res.ok) {
            showToast('Message sent! I\'ll get back to you soon.', 'success');
            form.reset();
        } else {
            showToast(result.error || 'Something went wrong.', 'error');
        }
    } catch (err) {
        showToast('Network error. Please try again.', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// ============================================================
// Starfield generator
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const sf = document.getElementById('starfield');
    if (!sf) return;
    for (let i = 0; i < 180; i++) {
        const s = document.createElement('div');
        s.classList.add('star');
        const size = Math.random() * 2.5 + 1;
        s.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            --duration: ${Math.random() * 3 + 2}s;
            animation-delay: ${Math.random() * 5}s;
        `;
        sf.appendChild(s);
    }
});

// ============================================================
// Splash → Loader → Name typing → Portfolio reveal
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const splash = document.getElementById('enterOverlay');
    const loader = document.getElementById('loaderOverlay');
    const overlay = document.getElementById('heroOverlay');
    const nameEl = document.getElementById('heroName');
    const subEl = document.getElementById('heroSub');
    const portfolioContent = document.getElementById('portfolioContent');
    const sweep = document.querySelector('.spotlight-sweep');
    const bgMusic = document.getElementById('bgMusic');
    const musicToggle = document.getElementById('musicToggle');
    const heroVideo = document.getElementById('hero-video');

    if (!splash || !loader || !overlay || !nameEl) return;

    // ---- Music setup ----
    if (bgMusic) {
        bgMusic.volume = 0.35;
        bgMusic.loop = true;
    }

    if (musicToggle && bgMusic) {
        musicToggle.addEventListener('click', function() {
            if (bgMusic.paused) {
                bgMusic.play()
                    .then(() => { musicToggle.textContent = '🔊'; })
                    .catch(() => showToast('Music not found or blocked', 'error'));
            } else {
                bgMusic.pause();
                musicToggle.textContent = '🔇';
            }
        });
    }

    // ---- Loader dialogue ----
    const loaderLines = [
        { el: document.getElementById('line1'), text: '> Loading portfolio...' },
        { el: document.getElementById('line2'), text: '> Initializing the main character to this world.' },
        { el: document.getElementById('line3'), text: '> Are you ready..... █' }
    ];

    // ---- Splash click starts everything ----
    splash.addEventListener('click', function() {
        initAudio();
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

        splash.classList.add('fade-out');
        setTimeout(() => splash.style.display = 'none', 700);
        setTimeout(runLoader, 400);
    }, { once: true });

    // ---- Loader: type each line, play sci-fi beeps ----
    function runLoader() {
        let li = 0;

        function typeLine() {
            if (li >= loaderLines.length) {
                setTimeout(() => {
                    loader.classList.add('fade-out');
                    overlay.classList.remove('hidden');
                    setTimeout(startTyping, 500);
                }, 500);
                return;
            }
            const line = loaderLines[li];
            let ci = 0;

            function typeChar() {
                if (ci < line.text.length) {
                    line.el.textContent += line.text.charAt(ci);
                    playSciFi();
                    ci++;
                    setTimeout(typeChar, 45);
                } else {
                    li++;
                    setTimeout(typeLine, 350);
                }
            }
            typeChar();
        }
        typeLine();
    }

    // ---- Name typing ----
    const fullName = "Aftab Ahmed A";
    let index = 0;
    nameEl.textContent = '';
    nameEl.style.width = '0';

    function startTyping() { typeLetter(); }

    function typeLetter() {
        if (index < fullName.length) {
            nameEl.textContent += fullName.charAt(index);
            nameEl.style.width = (index + 1) * 1.2 + 'ch';
            playClack();
            index++;
            setTimeout(typeLetter, 110);
        } else {
            nameEl.classList.add('done-typing');
            subEl.classList.add('visible');
            setTimeout(triggerSweep, 900);
        }
    }

    // ---- Spotlight sweep + reveal portfolio ----
    function triggerSweep() {
        if (sweep) sweep.classList.add('sweep');
        setTimeout(() => {
            overlay.classList.add('fade-out');
            portfolioContent.classList.add('visible');

            if (bgMusic) {
                bgMusic.play()
                    .then(() => { if (musicToggle) musicToggle.textContent = '🔊'; })
                    .catch(() => {});
            }
            if (heroVideo) {
                heroVideo.currentTime = 0;
                heroVideo.play().catch(() => {});
            }
        }, 700);
    }
});

// ============================================================
// About image – circle reveal on hover / touch
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('revealContainer');
    const frontImg = document.getElementById('frontImg');
    if (!container || !frontImg) return;

    const R = 140;

    function update(e) {
        const r = container.getBoundingClientRect();
        const x = Math.min(Math.max(e.clientX - r.left, 0), r.width);
        const y = Math.min(Math.max(e.clientY - r.top, 0), r.height);
        frontImg.style.clipPath = `circle(${R}px at ${x}px ${y}px)`;
    }
    function reset() {
        frontImg.style.clipPath = 'circle(100% at 50% 50%)';
    }

    container.addEventListener('mousemove', update);
    container.addEventListener('mouseleave', reset);

    container.addEventListener('touchmove', e => {
        e.preventDefault();
        const t = e.touches[0];
        const r = container.getBoundingClientRect();
        const x = Math.min(Math.max(t.clientX - r.left, 0), r.width);
        const y = Math.min(Math.max(t.clientY - r.top, 0), r.height);
        frontImg.style.clipPath = `circle(${R}px at ${x}px ${y}px)`;
    }, { passive: false });
    container.addEventListener('touchend', reset);
});

// ============================================================
// Journey timeline – FIFO scroll reveal
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const items = document.querySelectorAll('.tl-item');
    if (!items.length) return;

    items.forEach((item, i) => item.style.setProperty('--delay', `${i * 0.08}s`));

    function update() {
        const threshold = window.innerHeight * 0.75;
        items.forEach((item, i) => {
            const r = item.getBoundingClientRect();
            if (r.top < threshold && r.bottom > 0) {
                setTimeout(() => item.classList.add('visible'), i * 50);
            } else {
                item.classList.remove('visible');
            }
        });
    }

    update();
    window.addEventListener('scroll', update);
    window.addEventListener('resize', update);
});

// ============================================================
// Education cards – scroll reveal
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.edu-card');
    if (!cards.length) return;
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                const i = Array.from(cards).indexOf(e.target);
                setTimeout(() => e.target.classList.add('visible'), i * 120);
                obs.unobserve(e.target);
            }
        });
    }, { threshold: 0.15 });
    cards.forEach(c => obs.observe(c));
});

// ============================================================
// Project cards – scroll reveal
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.project-card');
    if (!cards.length) return;
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                const i = Array.from(cards).indexOf(e.target);
                setTimeout(() => e.target.classList.add('visible'), i * 100);
                obs.unobserve(e.target);
            }
        });
    }, { threshold: 0.1 });
    cards.forEach(c => obs.observe(c));
});