// 8-bit sound effects, synthesised with Web Audio so there are no sound files to load.
// Each note is [start frequency, length in seconds, optional end frequency for a slide].
const SOUNDS = {
    hover: [[1320, 0.025]],
    click: [[660, 0.04], [990, 0.06]],
    open: [[440, 0.04], [660, 0.04], [880, 0.07]],
    close: [[880, 0.04], [520, 0.07]],
    achievement: [[523, 0.07], [659, 0.07], [784, 0.07], [1047, 0.18]],
    powerOff: [[900, 0.28, 60]],
};
let audioContext = null;

function playSound(name) {
    if (!document.body.classList.contains('sound-effects') || !SOUNDS[name]) return;
    try {
        audioContext ??= new AudioContext();
        if (audioContext.state === 'suspended') audioContext.resume();

        let time = audioContext.currentTime;
        const volume = name === 'hover' ? 0.015 : 0.04;
        for (const [frequency, length, slideTo] of SOUNDS[name]) {
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(frequency, time);
            if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, time + length);
            gain.gain.setValueAtTime(volume, time);
            gain.gain.exponentialRampToValueAtTime(0.0001, time + length);
            oscillator.connect(gain).connect(audioContext.destination);
            oscillator.start(time);
            oscillator.stop(time + length);
            time += length;
        }
    } catch { }
}

// Runs fn once the first-visit loading screen has gone, so entrance effects aren't hidden behind it.
function afterBoot(fn) {
    if (document.body.classList.contains('booting')) document.addEventListener('site:boot-done', fn, { once: true });
    else fn();
}

(() => {
    const random = (min, max) => min + Math.random() * (max - min);
    const randomItem = (list) => list[Math.floor(Math.random() * list.length)];
    const px = (value) => `${value}px`;

    function createStar(className, size, lifetime) {
        const star = document.createElement('img');
        star.src = themeAsset('Star');
        star.alt = '';
        star.className = className;
        star.style.width = px(size);
        star.style.height = px(size);
        if (lifetime) setTimeout(() => star.remove(), lifetime);
        return star;
    }

    const starContainer = document.getElementById('starfield-container');

    if (starContainer) {
        const stars = document.createDocumentFragment();

        for (let i = 0; i < 45; i++) {
            const star = createStar('star-particle star-floating', randomItem([14, 22, 32]));
            const delay = random(0, 10);

            star.dataset.themeAsset = 'Star';
            star.style.left = `${random(0, 100)}%`;
            star.style.top = `${random(0, 100)}%`;
            star.style.animationDuration = `${random(14, 30)}s, ${random(3, 6)}s`;
            star.style.animationDelay = `-${delay}s, -${delay}s`;
            stars.append(star);
        }

        for (let i = 0; i < 65; i++) {
            const star = document.createElement('div');
            const size = randomItem([1, 2, 3]);

            star.className = Math.random() < 0.15 ? 'pixel-star accent' : 'pixel-star';
            star.style.width = px(size);
            star.style.height = px(size);
            star.style.left = `${random(0, 100)}vw`;
            star.style.top = `${random(0, 100)}vh`;
            star.style.setProperty('--move-x', px(random(-60, 60)));
            star.style.setProperty('--move-y', px(random(-60, 60)));
            star.style.animationDuration = `${random(12, 30)}s`;
            star.style.animationDelay = `-${random(0, 20)}s`;
            stars.append(star);
        }

        starContainer.append(stars);

        const NO_BURST_ON = 'a, button, input, textarea, select, .game-card, .social-icon, .dropdown, '
            + '.promo-media-wrapper, #unity-container, #settings-toggle-btn, #settings-modal, #lightbox';
        const BURST_COUNT = 12;

        window.addEventListener('click', (event) => {
            if (REDUCED_MOTION || event.target.closest(NO_BURST_ON)) return;

            const burst = document.createDocumentFragment();

            for (let i = 0; i < BURST_COUNT; i++) {
                const size = Math.floor(random(12, 28));
                const angle = (Math.PI * 2 / BURST_COUNT) * i + random(-0.2, 0.2);
                const distance = random(50, 110);
                const star = createStar('star-burst-particle', size, 900);

                star.style.left = px(event.clientX - size / 2);
                star.style.top = px(event.clientY - size / 2);
                star.style.setProperty('--tx', px(Math.cos(angle) * distance));
                star.style.setProperty('--ty', px(Math.sin(angle) * distance - 20));
                star.style.setProperty('--rot', `${random(360, 720)}deg`);
                burst.append(star);
            }

            starContainer.append(burst);
        });
    }

    const cursor = document.getElementById('custom-cursor');

    if (cursor) {
        // Touch screens fire a fake mousemove on every tap, so only mice get the custom cursor.
        const finePointer = window.matchMedia('(pointer: fine)');
        let lastTrailTime = 0;

        window.addEventListener('mousemove', (event) => {
            const { clientX: x, clientY: y } = event;

            const useCustomCursor = finePointer.matches && document.body.classList.contains('custom-cursor');
            cursor.style.display = useCustomCursor ? 'block' : 'none';
            cursor.style.left = px(x);
            cursor.style.top = px(y);

            if (document.body.classList.contains('mouse-trail') && event.timeStamp - lastTrailTime > 55) {
                lastTrailTime = event.timeStamp;

                const star = createStar('cursor-trail-star', Math.floor(random(20, 33)), 800);
                star.style.left = px(x + Math.floor(random(15, 30)));
                star.style.top = px(y + Math.floor(random(20, 35)));
                document.body.append(star);
            }
        });

        document.addEventListener('mouseleave', () => {
            cursor.style.display = 'none';
        });
    }
})();

(() => {
    // Sounds: a soft tick when hovering things you can click, a blip when clicking them.
    const HOVER_SOUND_ON = '.game-card, .nav-link, .dropdown-content a, .dropdown-content button, .banner-btn, '
        + '.support-btn, .quest-nav-link, .social-icon, .footer-link, .link-row, [role="button"]';
    let lastHover = 0;
    document.addEventListener('mouseover', (event) => {
        const target = event.target.closest(HOVER_SOUND_ON);
        if (!target || target.contains(event.relatedTarget) || event.timeStamp - lastHover < 60) return;
        lastHover = event.timeStamp;
        playSound('hover');
    });
    document.addEventListener('click', (event) => {
        if (event.target.closest('a, button, [role="button"], .game-card, label')) playSound('click');
    });
    document.getElementById('toggle-sound')?.addEventListener('change', (event) => {
        if (event.target.checked) playSound('achievement');
    });

    if (REDUCED_MOTION) return;

    // Skill bars fill up like XP bars, and their numbers count up, when the profile scrolls into view.
    const skillsList = document.querySelector('.skills-list');
    if (skillsList) {
        const skills = [...skillsList.querySelectorAll('.skill-item')].map((item) => {
            const fill = item.querySelector('.skill-bar-fill');
            const label = item.querySelector('.skill-label-group span:last-child');
            const target = { width: fill.style.width, value: Number.parseInt(label.textContent, 10) };
            fill.style.width = '0';
            label.textContent = '0/100';
            return { fill, label, target };
        });

        const countUp = (label, value) => {
            const start = performance.now();
            const step = (now) => {
                const progress = Math.min((now - start) / 1000, 1);
                const eased = 1 - (1 - progress) ** 3;
                label.textContent = `${Math.round(value * eased)}/100`;
                if (progress < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        };

        const observer = new IntersectionObserver((entries) => {
            if (!entries.some((entry) => entry.isIntersecting)) return;
            observer.disconnect();
            afterBoot(() => skills.forEach(({ fill, label, target }, index) => {
                setTimeout(() => {
                    fill.style.width = target.width;
                    fill.classList.add('filling');
                    countUp(label, target.value);
                }, 200 + index * 110);
            }));
        }, { threshold: 0.3 });
        observer.observe(skillsList);
    }

    // Sections slide in as they scroll into view. Cards that arrive together come in one after another.
    const revealTargets = document.querySelectorAll('.profile-card, .promo-card, .section-title-wrapper, .game-card, '
        + '.screenshots-section, .inventory-item, .quest-nav-link, .link-row');
    if (revealTargets.length) {
        revealTargets.forEach((el) => el.classList.add('reveal'));
        const observer = new IntersectionObserver((entries) => {
            entries.filter((entry) => entry.isIntersecting).forEach((entry, index) => {
                entry.target.style.animationDelay = `${index * 90}ms`;
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.12 });
        afterBoot(() => revealTargets.forEach((el) => observer.observe(el)));
    }

    // Banner titles type themselves out. The untyped part stays in place (invisible) so nothing jumps around.
    const title = document.querySelector('.banner-content h1');
    if (title) {
        const text = title.textContent.trim();
        const typed = document.createElement('span');
        const caret = document.createElement('span');
        const rest = document.createElement('span');
        typed.setAttribute('aria-hidden', 'true');
        rest.setAttribute('aria-hidden', 'true');
        caret.className = 'type-caret';
        rest.className = 'type-rest';
        rest.textContent = text;
        title.setAttribute('aria-label', text);
        title.replaceChildren(typed, caret, rest);

        afterBoot(() => {
            let count = 0;
            const timer = setInterval(() => {
                count += 1;
                typed.textContent = text.slice(0, count);
                rest.textContent = text.slice(count);
                if (count >= text.length) {
                    clearInterval(timer);
                    setTimeout(() => caret.remove(), 2400);
                }
            }, 45);
        });
    }

    // Quest cards tilt slightly toward the mouse.
    if (window.matchMedia('(pointer: fine)').matches) {
        document.querySelectorAll('.game-card').forEach((card) => {
            card.addEventListener('mousemove', (event) => {
                const box = card.getBoundingClientRect();
                const x = (event.clientX - box.left) / box.width - 0.5;
                const y = (event.clientY - box.top) / box.height - 0.5;
                card.style.setProperty('--tilt-x', `${(-y * 8).toFixed(2)}deg`);
                card.style.setProperty('--tilt-y', `${(x * 8).toFixed(2)}deg`);
            });
            card.addEventListener('mouseleave', () => {
                card.style.removeProperty('--tilt-x');
                card.style.removeProperty('--tilt-y');
            });
        });
    }
})();
