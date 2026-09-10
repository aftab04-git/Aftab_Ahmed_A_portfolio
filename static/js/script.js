console.log("=== script.js loaded ===");

// ============================================================
// 0. AUDIO – TYPEWRITER CLACK + MUTE
// ============================================================
let audioCtx = null;
let muted = false;

function initAudio() {
    if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Audio not supported', e);
        }
    }
}

function playClack() {
    if (muted || !audioCtx) return;
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

// ============================================================
// 1. MOBILE MENU
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    const muteBtn = document.getElementById('muteToggle');

    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', function() {
            mobileMenu.classList.toggle('open');
        });
    }
    window.closeMobile = function() {
        if (mobileMenu) mobileMenu.classList.remove('open');
    };
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && mobileMenu) mobileMenu.classList.remove('open');
    });

    if (muteBtn) {
        muteBtn.addEventListener('click', function() {
            muted = !muted;
            muteBtn.textContent = muted ? '🔇' : '🔊';
        });
    }
});

// ============================================================
// 2. SKILLS: STAGGERED REVEAL + 3D TILT
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const grid = document.getElementById('skillsGrid');
    if (!grid) return;

    const skillCards = grid.querySelectorAll('.skill-card');
    const skillBars = grid.querySelectorAll('.skill-bar-fill');
    if (skillCards.length === 0) return;

    function animateSkills() {
        skillCards.forEach((card, index) => {
            setTimeout(() => card.classList.add('visible'), index * 80);
        });
        setTimeout(() => {
            skillBars.forEach(bar => {
                const width = bar.getAttribute('data-width');
                if (width) bar.style.width = (width * 100) + '%';
            });
        }, skillCards.length * 80 + 300);
    }

    const rect = grid.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

    if (isVisible) {
        animateSkills();
    } else {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateSkills();
                    observer.unobserve(grid);
                }
            });
        }, { threshold: 0.15 });
        observer.observe(grid);
    }

    grid.addEventListener('mousemove', function(e) {
        const rect = grid.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const x = (e.clientX - centerX) / (rect.width / 2);
        const y = (e.clientY - centerY) / (rect.height / 2);
        skillCards.forEach(card => {
            if (!card.classList.contains('visible')) return;
            const cardRect = card.getBoundingClientRect();
            const dx = (e.clientX - (cardRect.left + cardRect.width / 2)) / 30;
            const dy = (e.clientY - (cardRect.top + cardRect.height / 2)) / 30;
            card.style.transform = `perspective(800px) translateY(-2px) rotateY(${dx}deg) rotateX(${-dy}deg) scale(1.02)`;
        });
    });

    grid.addEventListener('mouseleave', function() {
        skillCards.forEach(card => {
            if (card.classList.contains('visible')) card.style.transform = '';
        });
    });
});

// ============================================================
// 3. CONTACT FORM
// ============================================================
async function handleSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const data = new FormData(form);
    try {
        const response = await fetch('/send-message', { method: 'POST', body: data });
        const result = await response.json();
        if (response.ok) {
            alert('✅ Message sent! I\'ll get back to you soon.');
            form.reset();
        } else {
            alert('❌ Error: ' + (result.error || 'Something went wrong.'));
        }
    } catch (err) {
        alert('❌ Network error. Please try again.');
        console.error(err);
    }
}

// ============================================================
// 4. 3D FOOTBALL (Three.js)
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('football-canvas');
    if (!container) return;

    const w = container.clientWidth || 360;
    const h = container.clientHeight || 400;

    const scene = new THREE.Scene();
    scene.background = null;
    const camera = new THREE.PerspectiveCamera(30, w / h, 0.1, 1000);
    camera.position.set(0, 0, 5.5);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x222244, 0.4));
    const key = new THREE.DirectionalLight(0x4fc3f7, 1.0);
    key.position.set(2, 4, 3); scene.add(key);
    const fill = new THREE.DirectionalLight(0x8888ff, 0.4);
    fill.position.set(-2, 1, -2); scene.add(fill);
    const rim = new THREE.DirectionalLight(0x4fc3f7, 0.5);
    rim.position.set(0, -1, -3); scene.add(rim);

    const geo = new THREE.IcosahedronGeometry(1.2, 1);
    const colors = [];
    const pos = geo.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i);
        const angle = Math.atan2(y, x);
        const isWhite = Math.floor((angle / Math.PI + 1) * 3) % 2 === 0;
        colors.push(
            isWhite ? 0.85 : 0.08,
            isWhite ? 0.90 : 0.08,
            isWhite ? 1.0 : 0.12
        );
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const mat = new THREE.MeshStandardMaterial({
        vertexColors: true, roughness: 0.4, metalness: 0.1,
        flatShading: true, emissive: new THREE.Color(0x4fc3f7),
        emissiveIntensity: 0.04, transparent: true, opacity: 0.95,
    });
    const ball = new THREE.Mesh(geo, mat);
    scene.add(ball);

    const ringGeo = new THREE.RingGeometry(1.4, 1.6, 32);
    const ringMat = new THREE.MeshBasicMaterial({
        color: 0x4fc3f7, transparent: true, opacity: 0.06, side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI * 0.3;
    ring.position.z = -0.1;
    scene.add(ring);

    let time = 0;
    function animate() {
        requestAnimationFrame(animate);
        time += 0.01;
        ball.rotation.x += 0.006;
        ball.rotation.y += 0.015;
        ball.rotation.z += 0.003;
        ball.position.y = Math.sin(time * 0.8) * 0.05;
        ring.scale.setScalar(1 + Math.sin(time * 0.6) * 0.02);
        ring.material.opacity = 0.04 + Math.sin(time * 0.8) * 0.02;
        renderer.render(scene, camera);
    }
    animate();

    function resizeCanvas() {
        const newW = container.clientWidth || 360;
        const newH = container.clientHeight || 400;
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
    }
    window.addEventListener('resize', resizeCanvas);
    if (window.ResizeObserver) {
        new ResizeObserver(resizeCanvas).observe(container);
    }
});

// ============================================================
// 5. STARFIELD GENERATOR
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const starfield = document.getElementById('starfield');
    if (!starfield) return;
    for (let i = 0; i < 180; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        const size = Math.random() * 2.5 + 1;
        star.style.cssText = `
            width: ${size}px; height: ${size}px;
            left: ${Math.random() * 100}%; top: ${Math.random() * 100}%;
            --duration: ${Math.random() * 3 + 2}s;
            animation-delay: ${Math.random() * 5}s;
        `;
        starfield.appendChild(star);
    }
});

// ============================================================
// 6. LOADER → TYPING NAME → PORTFOLIO
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const loader = document.getElementById('loaderOverlay');
    const overlay = document.getElementById('heroOverlay');
    const nameEl = document.getElementById('heroName');
    const subEl = document.getElementById('heroSub');
    const portfolioContent = document.getElementById('portfolioContent');
    const sweep = document.querySelector('.spotlight-sweep');

    if (!loader || !overlay || !nameEl) return;

    // Stagger loader dialogue lines
    document.querySelectorAll('.dialogue-line').forEach(line => {
        const delay = parseInt(line.dataset.delay || 0);
        setTimeout(() => { line.style.animationDelay = '0s'; }, delay);
    });

    // After loader (2.5s) → fade loader, show hero overlay
    setTimeout(function() {
        loader.classList.add('fade-out');
        overlay.classList.remove('hidden');
        initAudio();
        setTimeout(startTyping, 400);
    }, 2500);

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
        setTimeout(function() {
            overlay.classList.add('fade-out');
            portfolioContent.classList.add('visible');
        }, 700);
    }
});

// ============================================================
// 7. CIRCLE REVEAL
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('revealContainer');
    const frontImg = document.getElementById('frontImg');
    if (!container || !frontImg) return;

    const RADIUS = 140;
    function updateReveal(e) {
        const rect = container.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;
        x = Math.min(Math.max(x, 0), rect.width);
        y = Math.min(Math.max(y, 0), rect.height);
        frontImg.style.clipPath = `circle(${RADIUS}px at ${x}px ${y}px)`;
    }
    function resetReveal() {
        frontImg.style.clipPath = `circle(100% at 50% 50%)`;
    }
    container.addEventListener('mousemove', updateReveal);
    container.addEventListener('mouseleave', resetReveal);
    container.addEventListener('touchmove', function(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = container.getBoundingClientRect();
        let x = touch.clientX - rect.left;
        let y = touch.clientY - rect.top;
        x = Math.min(Math.max(x, 0), rect.width);
        y = Math.min(Math.max(y, 0), rect.height);
        frontImg.style.clipPath = `circle(${RADIUS}px at ${x}px ${y}px)`;
    }, { passive: false });
    container.addEventListener('touchend', resetReveal);
});

// ============================================================
// 8. ENSURE BACK IMAGE RENDERED
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const back = document.querySelector('.back-img');
    if (back) {
        back.style.opacity = '1';
        back.style.visibility = 'visible';
        back.style.display = 'block';
    }
    setTimeout(function() {
        const front = document.getElementById('frontImg');
        if (front) front.style.clipPath = 'circle(100% at 50% 50%)';
    }, 200);
});

// ============================================================
// 9. JOURNEY – FIFO SCROLL REVEAL
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const items = document.querySelectorAll('.tl-item');
    if (items.length === 0) return;

    items.forEach((item, index) => {
        item.style.setProperty('--delay', `${index * 0.08}s`);
    });

    function updateVisibility() {
        const threshold = window.innerHeight * 0.75;
        items.forEach((item, index) => {
            const rect = item.getBoundingClientRect();
            const isVisible = rect.top < threshold && rect.bottom > 0;
            if (isVisible) {
                setTimeout(() => item.classList.add('visible'), index * 50);
            } else {
                item.classList.remove('visible');
            }
        });
    }
    updateVisibility();
    window.addEventListener('scroll', updateVisibility);
    window.addEventListener('resize', updateVisibility);
});

// ============================================================
// 10. EDUCATION SCROLL REVEAL
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const eduCards = document.querySelectorAll('.edu-card');
    if (eduCards.length === 0) return;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const index = Array.from(eduCards).indexOf(entry.target);
                setTimeout(() => entry.target.classList.add('visible'), index * 120);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    eduCards.forEach(card => observer.observe(card));
});

// ============================================================
// 11. PROJECTS SCROLL REVEAL
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const projectCards = document.querySelectorAll('.project-card');
    if (projectCards.length === 0) return;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const index = Array.from(projectCards).indexOf(entry.target);
                setTimeout(() => entry.target.classList.add('visible'), index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    projectCards.forEach(card => observer.observe(card));
});