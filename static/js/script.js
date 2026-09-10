console.log("=== script.js loaded ===");

// ============================================================
// 0. AUDIO
// ============================================================
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) { console.warn('Audio not supported', e); }
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

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
// 1. THEME TOGGLE (SLIDE SWITCH)
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    function setTheme(isLight) {
        if (isLight) {
            document.body.classList.add('light');
            themeToggle.setAttribute('aria-checked', 'true');
        } else {
            document.body.classList.remove('light');
            themeToggle.setAttribute('aria-checked', 'false');
        }
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    }

    // Load saved
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') setTheme(true);
    else setTheme(false);

    function toggle() {
        const isLight = !document.body.classList.contains('light');
        setTheme(isLight);
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
// 2. MOBILE MENU
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
// 3. SKILLS
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const grid = document.getElementById('skillsGrid');
    if (!grid) return;
    const skillCards = grid.querySelectorAll('.skill-card');
    const skillBars = grid.querySelectorAll('.skill-bar-fill');
    if (!skillCards.length) return;

    function animateSkills() {
        skillCards.forEach((c, i) => setTimeout(() => c.classList.add('visible'), i * 80));
        setTimeout(() => {
            skillBars.forEach(b => {
                const w = b.getAttribute('data-width');
                if (w) b.style.width = (w * 100) + '%';
            });
        }, skillCards.length * 80 + 300);
    }

    const r = grid.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) animateSkills();
    else {
        const obs = new IntersectionObserver(entries => {
            entries.forEach(e => { if (e.isIntersecting) { animateSkills(); obs.unobserve(grid); } });
        }, { threshold: 0.15 });
        obs.observe(grid);
    }

    grid.addEventListener('mousemove', e => {
        skillCards.forEach(c => {
            if (!c.classList.contains('visible')) return;
            const rect = c.getBoundingClientRect();
            const dx = (e.clientX - (rect.left + rect.width / 2)) / 30;
            const dy = (e.clientY - (rect.top + rect.height / 2)) / 30;
            c.style.transform = `perspective(800px) translateY(-2px) rotateY(${dx}deg) rotateX(${-dy}deg) scale(1.02)`;
        });
    });
    grid.addEventListener('mouseleave', () => {
        skillCards.forEach(c => { if (c.classList.contains('visible')) c.style.transform = ''; });
    });
});

// ============================================================
// 4. CONTACT FORM + CUSTOM TOAST
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
        console.error(err);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// ============================================================
// 5. 3D FOOTBALL
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('football-canvas');
    if (!container) return;
    const w = container.clientWidth || 360, h = container.clientHeight || 400;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, w / h, 0.1, 1000);
    camera.position.set(0, 0, 5.5);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x222244, 0.4));
    const key = new THREE.DirectionalLight(0x4fc3f7, 1.0); key.position.set(2, 4, 3); scene.add(key);
    const fill = new THREE.DirectionalLight(0x8888ff, 0.4); fill.position.set(-2, 1, -2); scene.add(fill);
    const rim = new THREE.DirectionalLight(0x4fc3f7, 0.5); rim.position.set(0, -1, -3); scene.add(rim);

    const geo = new THREE.IcosahedronGeometry(1.2, 1);
    const colors = [];
    const pos = geo.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i);
        const a = Math.atan2(y, x);
        const isW = Math.floor((a / Math.PI + 1) * 3) % 2 === 0;
        colors.push(isW ? 0.85 : 0.08, isW ? 0.90 : 0.08, isW ? 1.0 : 0.12);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const mat = new THREE.MeshStandardMaterial({
        vertexColors: true, roughness: 0.4, metalness: 0.1, flatShading: true,
        emissive: new THREE.Color(0x4fc3f7), emissiveIntensity: 0.04,
        transparent: true, opacity: 0.95,
    });
    const ball = new THREE.Mesh(geo, mat); scene.add(ball);

    const ring = new THREE.Mesh(
        new THREE.RingGeometry(1.4, 1.6, 32),
        new THREE.MeshBasicMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.06, side: THREE.DoubleSide })
    );
    ring.rotation.x = Math.PI * 0.3; ring.position.z = -0.1; scene.add(ring);

    let t = 0;
    function animate() {
        requestAnimationFrame(animate);
        t += 0.01;
        ball.rotation.x += 0.006; ball.rotation.y += 0.015; ball.rotation.z += 0.003;
        ball.position.y = Math.sin(t * 0.8) * 0.05;
        ring.scale.setScalar(1 + Math.sin(t * 0.6) * 0.02);
        ring.material.opacity = 0.04 + Math.sin(t * 0.8) * 0.02;
        renderer.render(scene, camera);
    }
    animate();

    function resize() {
        const nw = container.clientWidth || 360, nh = container.clientHeight || 400;
        camera.aspect = nw / nh; camera.updateProjectionMatrix(); renderer.setSize(nw, nh);
    }
    window.addEventListener('resize', resize);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(container);
});

// ============================================================
// 6. STARFIELD
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const sf = document.getElementById('starfield');
    if (!sf) return;
    for (let i = 0; i < 180; i++) {
        const s = document.createElement('div');
        s.classList.add('star');
        const size = Math.random() * 2.5 + 1;
        s.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;top:${Math.random()*100}%;--duration:${Math.random()*3+2}s;animation-delay:${Math.random()*5}s;`;
        sf.appendChild(s);
    }
});

// ============================================================
// 7. SPLASH → LOADER → NAME → PORTFOLIO + MUSIC
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

    if (!splash || !loader || !overlay || !nameEl) return;

    if (bgMusic && musicToggle) {
        bgMusic.volume = 0.35;
        musicToggle.addEventListener('click', function() {
            if (bgMusic.paused) {
                bgMusic.play().catch(err => console.log('Play blocked:', err));
                musicToggle.textContent = '🔊';
            } else {
                bgMusic.pause();
                musicToggle.textContent = '🔇';
            }
        });
    }

    const loaderLines = [
        { el: document.getElementById('line1'), text: '> Loading portfolio...' },
        { el: document.getElementById('line2'), text: '> Initializing the main character to this world.' },
        { el: document.getElementById('line3'), text: '> Are you ready..... █' }
    ];

    splash.addEventListener('click', function() {
        initAudio();
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        splash.classList.add('fade-out');
        setTimeout(() => splash.style.display = 'none', 700);
        setTimeout(runLoader, 400);
    }, { once: true });

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

    function triggerSweep() {
        if (sweep) sweep.classList.add('sweep');
        setTimeout(() => {
            overlay.classList.add('fade-out');
            portfolioContent.classList.add('visible');

            if (bgMusic) {
                bgMusic.volume = 0.35;
                bgMusic.play().then(() => {
                    if (musicToggle) musicToggle.textContent = '🔊';
                }).catch(err => console.log('Music blocked:', err));
            }
        }, 700);
    }
});

// ============================================================
// 8. CIRCLE REVEAL
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('revealContainer');
    const frontImg = document.getElementById('frontImg');
    if (!container || !frontImg) return;
    const R = 140;
    function update(e) {
        const r = container.getBoundingClientRect();
        let x = Math.min(Math.max(e.clientX - r.left, 0), r.width);
        let y = Math.min(Math.max(e.clientY - r.top, 0), r.height);
        frontImg.style.clipPath = `circle(${R}px at ${x}px ${y}px)`;
    }
    function reset() { frontImg.style.clipPath = 'circle(100% at 50% 50%)'; }
    container.addEventListener('mousemove', update);
    container.addEventListener('mouseleave', reset);
    container.addEventListener('touchmove', e => {
        e.preventDefault();
        const t = e.touches[0], r = container.getBoundingClientRect();
        let x = Math.min(Math.max(t.clientX - r.left, 0), r.width);
        let y = Math.min(Math.max(t.clientY - r.top, 0), r.height);
        frontImg.style.clipPath = `circle(${R}px at ${x}px ${y}px)`;
    }, { passive: false });
    container.addEventListener('touchend', reset);
});

// ============================================================
// 9. ENSURE BACK IMAGE
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const back = document.querySelector('.back-img');
    if (back) { back.style.opacity = '1'; back.style.visibility = 'visible'; back.style.display = 'block'; }
    setTimeout(() => {
        const f = document.getElementById('frontImg');
        if (f) f.style.clipPath = 'circle(100% at 50% 50%)';
    }, 200);
});

// ============================================================
// 10. JOURNEY
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const items = document.querySelectorAll('.tl-item');
    if (!items.length) return;
    items.forEach((it, i) => it.style.setProperty('--delay', `${i * 0.08}s`));
    function update() {
        const th = window.innerHeight * 0.75;
        items.forEach((it, i) => {
            const r = it.getBoundingClientRect();
            if (r.top < th && r.bottom > 0) setTimeout(() => it.classList.add('visible'), i * 50);
            else it.classList.remove('visible');
        });
    }
    update();
    window.addEventListener('scroll', update);
    window.addEventListener('resize', update);
});

// ============================================================
// 11. EDUCATION
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
// 12. PROJECTS
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