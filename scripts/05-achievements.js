(() => {
    const QUEST_COUNT = document.querySelectorAll('.dropdown-content a').length;
    const ACHIEVEMENTS = [
        { id: 'first-steps', name: 'First Steps', description: 'Entered the Archives', icon: 'door' },
        { id: 'explorer', name: 'Explorer', description: `Viewed all ${QUEST_COUNT} quests`, icon: 'compass' },
        { id: 'curator', name: 'Curator', description: 'Opened every item in the inventory', icon: 'gem' },
        { id: 'shutterbug', name: 'Shutterbug', description: 'Flipped through every screenshot of a game', icon: 'camera' },
        { id: 'lost-signal', name: 'Lost Signal', description: 'Found the 404 page', icon: 'signal' },
        { id: 'ready-player', name: 'Ready Player', description: 'Played Shitty Shift in the browser', icon: 'gamepad' },
        { id: 'loot-collector', name: 'Loot Collector', description: 'Clicked a DOWNLOAD GAME button', icon: 'chest' },
        { id: 'message-sent', name: 'Message Sent', description: 'Sent a message through the contact form', icon: 'envelope' },
        { id: 'chromatic', name: 'Chromatic', description: 'Tried all 6 themes', icon: 'palette' },
        { id: 'stargazer', name: 'Stargazer', description: 'Made 100 star bursts', icon: 'star' },
        { id: 'night-owl', name: 'Night Owl', description: 'Visited between midnight and 4 AM', icon: 'moon' },
        { id: 'retro-gamer', name: 'Retro Gamer', description: 'Entered the Konami code', icon: 'joystick', hidden: true },
        { id: 'ghost-mode', name: 'Ghost Mode', description: 'Turned off every visual effect', icon: 'ghost', hidden: true },
        { id: 'completionist', name: 'Completionist', description: 'Unlocked every other achievement', icon: 'trophy' },
    ];

    const ICONS = {
        door: '<path d="M7 27V5h16v22"/><path d="M7 5l10 3v21l-10-2z"/><circle cx="14" cy="17" r="0.8"/><path d="M4 27h24"/>',
        compass: '<circle cx="16" cy="16" r="12"/><path d="M20.5 11.5l-3 6.5-6.5 3 3-6.5z"/><circle cx="16" cy="16" r="1"/>',
        gem: '<path d="M9 6h14l5 7-12 14L4 13z"/><path d="M4 13h24M12 6l-3 7 7 14 7-14-3-7"/>',
        camera: '<rect x="4" y="10" width="24" height="16" rx="3"/><path d="M11 10l2-4h6l2 4"/><circle cx="16" cy="18" r="5"/>',
        signal: '<path d="M16 15v12M12 27h8"/><path d="M10.5 9a7.5 7.5 0 0 0 0 11M21.5 9a7.5 7.5 0 0 1 0 11"/><circle cx="16" cy="14.5" r="2"/><path d="M23 3.5l4.5 4.5M27.5 3.5L23 8"/>',
        gamepad: '<rect x="5" y="11" width="22" height="13" rx="6"/><path d="M11 15v5M8.5 17.5h5"/><circle cx="21" cy="16" r="1"/><circle cx="23" cy="19" r="1"/>',
        chest: '<path d="M6 14h20v11H6z"/><path d="M6 14l2-6h16l2 6"/><path d="M14 18h4v3h-4z"/>',
        envelope: '<rect x="4" y="8" width="24" height="16" rx="2"/><path d="M4 10l12 9 12-9"/>',
        palette: '<path d="M16 4a12 12 0 1 0 0 24c2 0 2.5-1.5 1.5-3s0-3.5 2-3.5H24a4 4 0 0 0 4-4C28 10 22.6 4 16 4z"/><circle cx="10" cy="14" r="1.5"/><circle cx="14" cy="9" r="1.5"/><circle cx="20" cy="9" r="1.5"/>',
        star: '<path d="M16 5l3 7 7 .6-5.3 4.7 1.6 7.2L16 20.8 9.7 24.5l1.6-7.2L6 12.6l7-.6z"/>',
        moon: '<path d="M23 18a8 8 0 1 1-9-11 6.5 6.5 0 0 0 9 11z"/>',
        joystick: '<path d="M8 22h16v5H8z"/><path d="M16 22v-9"/><circle cx="16" cy="9" r="4"/><path d="M20 19.5h2"/>',
        ghost: '<path d="M8 27V14a8 8 0 0 1 16 0v13l-2.7-2.3-2.6 2.3-2.7-2.3-2.7 2.3-2.6-2.3z"/><circle cx="13" cy="15" r="1.3"/><circle cx="19" cy="15" r="1.3"/>',
        trophy: '<path d="M10 6h12v5a6 6 0 0 1-12 0z"/><path d="M10 8H7a3 3 0 0 0 3 5M22 8h3a3 3 0 0 1-3 5M16 17v4M12 25h8M13 21h6v4h-6z"/>',
        lock: '<rect x="9" y="14" width="14" height="11" rx="2"/><path d="M12 14v-3a4 4 0 0 1 8 0v3"/>',
    };

    const byId = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));
    const readJson = (key) => {
        try { return JSON.parse(loadSetting(key)) || {}; } catch { return {}; }
    };
    let unlocked = readJson('achievements');
    const stats = readJson('achievementStats');
    const saveStats = () => saveSetting('achievementStats', JSON.stringify(stats));
    const addToList = (key, value) => {
        stats[key] = stats[key] || [];
        if (!stats[key].includes(value)) {
            stats[key].push(value);
            saveStats();
        }
        return stats[key];
    };

    const badge = (achievement, isUnlocked) => {
        const icon = isUnlocked || !achievement.hidden ? ICONS[achievement.icon] : ICONS.lock;
        return `<span class="achievement-badge${isUnlocked ? '' : ' locked'}" aria-hidden="true"><svg viewBox="0 0 32 32">${icon}</svg></span>`;
    };

    const toastArea = document.createElement('div');
    toastArea.className = 'achievement-toasts';
    toastArea.setAttribute('role', 'status');
    toastArea.setAttribute('aria-live', 'polite');
    document.body.append(toastArea);

    const toastQueue = [];
    let showingToast = false;

    function showNextToast() {
        const achievement = toastQueue.shift();
        if (!achievement) {
            showingToast = false;
            return;
        }
        showingToast = true;

        const toast = document.createElement('a');
        toast.href = 'achievements.html';
        toast.className = 'achievement-toast';
        toast.innerHTML = `${badge(achievement, true)}
            <span class="achievement-toast-text">
                <span class="achievement-toast-label">ACHIEVEMENT UNLOCKED</span>
                <span class="achievement-toast-name">${achievement.name}</span>
                <span class="achievement-toast-desc">${achievement.description}</span>
            </span>`;
        toastArea.append(toast);
        playSound('achievement');
        requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
                showNextToast();
            }, 400);
        }, 4500);
    }

    function unlock(id) {
        if (unlocked[id] || !byId[id]) return;
        unlocked[id] = new Date().toISOString();
        saveSetting('achievements', JSON.stringify(unlocked));

        toastQueue.push(byId[id]);
        if (!showingToast) {
            showingToast = true;
            if (document.body.classList.contains('booting')) document.addEventListener('site:boot-done', showNextToast, { once: true });
            else showNextToast();
        }
        renderPage();

        const othersDone = ACHIEVEMENTS.every((a) => a.id === 'completionist' || unlocked[a.id]);
        if (othersDone) unlock('completionist');
    }

    const list = document.getElementById('achievement-list');
    const progressText = document.getElementById('achievement-progress-text');
    const progressFill = document.getElementById('achievement-progress-fill');

    function renderPage() {
        if (!list) return;
        const count = ACHIEVEMENTS.filter((a) => unlocked[a.id]).length;
        if (progressText) progressText.textContent = `${count} / ${ACHIEVEMENTS.length} UNLOCKED`;
        if (progressFill) progressFill.style.width = `${(count / ACHIEVEMENTS.length) * 100}%`;

        const sorted = [
            ...ACHIEVEMENTS.filter((a) => unlocked[a.id]).sort((a, b) => unlocked[a.id].localeCompare(unlocked[b.id])),
            ...ACHIEVEMENTS.filter((a) => !unlocked[a.id]),
        ];
        list.innerHTML = sorted.map((a) => {
            const date = unlocked[a.id];
            const visible = date || !a.hidden;
            const when = date && new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
            return `<li class="achievement-tile${date ? '' : ' locked'}">
                ${badge(a, Boolean(date))}
                <span class="achievement-text">
                    <span class="achievement-name">${visible ? a.name : '???'}</span>
                    <span class="achievement-desc">${visible ? a.description : 'Hidden achievement. Keep exploring.'}</span>
                    ${date ? `<span class="achievement-date">UNLOCKED ${when.toUpperCase()}</span>` : ''}
                </span>
            </li>`;
        }).join('');
    }

    const resetButton = document.getElementById('achievement-reset');
    resetButton?.addEventListener('click', () => {
        if (!resetButton.dataset.confirm) {
            resetButton.dataset.confirm = 'yes';
            resetButton.textContent = 'CLICK AGAIN TO RESET';
            setTimeout(() => {
                delete resetButton.dataset.confirm;
                resetButton.textContent = 'RESET PROGRESS';
            }, 4000);
            return;
        }
        unlocked = {};
        Object.keys(stats).forEach((key) => delete stats[key]);
        saveSetting('achievements', '{}');
        saveStats();
        delete resetButton.dataset.confirm;
        resetButton.textContent = 'RESET PROGRESS';
        renderPage();
    });

    renderPage();

    unlock('first-steps');

    if (new Date().getHours() < 4) unlock('night-owl');

    if (document.querySelector('.not-found')) unlock('lost-signal');

    const gameMatch = location.pathname.match(/game(\d+)(?:\.html)?\/?$/);
    if (gameMatch && addToList('games', gameMatch[1]).length >= QUEST_COUNT) unlock('explorer');

    const recordTheme = () => {
        const theme = document.body.dataset.theme;
        if (!theme) return;
        const tried = addToList('themes', theme);
        if (THEMES.every((t) => tried.includes(t))) unlock('chromatic');
    };
    recordTheme();
    new MutationObserver(recordTheme).observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

    const effectToggles = ['toggle-mouse-trail', 'toggle-starfield', 'toggle-crt-shaders']
        .map((id) => document.getElementById(id))
        .filter(Boolean);
    const checkGhostMode = () => {
        if (effectToggles.length === 3 && effectToggles.every((toggle) => !toggle.checked)) unlock('ghost-mode');
    };
    effectToggles.forEach((toggle) => toggle.addEventListener('change', checkGhostMode));
    checkGhostMode();

    const starContainer = document.getElementById('starfield-container');
    if (starContainer) {
        new MutationObserver((records) => {
            const bursts = records.filter((r) => [...r.addedNodes].some((n) => n.classList?.contains('star-burst-particle'))).length;
            if (!bursts) return;
            stats.bursts = (stats.bursts || 0) + bursts;
            saveStats();
            if (stats.bursts >= 100) unlock('stargazer');
        }).observe(starContainer, { childList: true });
    }

    document.getElementById('unity-play-button')?.addEventListener('click', () => unlock('ready-player'));

    document.querySelectorAll('[data-goatcounter-click^="download-"]').forEach((link) => {
        link.addEventListener('click', () => unlock('loot-collector'));
        link.addEventListener('auxclick', () => unlock('loot-collector'));
    });

    const formStatus = document.querySelector('.form-status');
    if (formStatus) {
        new MutationObserver(() => {
            if (formStatus.textContent.startsWith('Message sent')) unlock('message-sent');
        }).observe(formStatus, { childList: true, characterData: true, subtree: true });
    }

    const lightboxImg = document.getElementById('lightbox-img');
    const fileName = (src) => decodeURIComponent(src.split('/').pop().split('?')[0]);
    if (lightboxImg) {
        new MutationObserver(() => {
            const src = lightboxImg.getAttribute('src');
            if (!src) return;
            const seen = addToList('seen', fileName(src));
            const inventory = [...document.querySelectorAll('.inventory-media img')].map((img) => fileName(img.src));
            if (inventory.length && inventory.every((name) => seen.includes(name))) unlock('curator');
            const screenshots = [...document.querySelectorAll('.screenshots-grid img')].map((img) => fileName(img.src));
            if (screenshots.length > 1 && screenshots.every((name) => seen.includes(name))) unlock('shutterbug');
        }).observe(lightboxImg, { attributes: true, attributeFilter: ['src'] });
    }

    function konamiSupernova() {
        if (REDUCED_MOTION) return;

        const flash = document.createElement('div');
        flash.className = 'konami-flash';
        document.body.append(flash);
        setTimeout(() => flash.remove(), 900);

        const centerX = innerWidth / 2;
        const centerY = innerHeight / 2;
        const reach = Math.max(innerWidth, innerHeight) * 0.6;
        const waves = [{ count: 28, delay: 0 }, { count: 24, delay: 150 }, { count: 20, delay: 300 }];

        waves.forEach(({ count, delay }, wave) => {
            setTimeout(() => {
                const stars = document.createDocumentFragment();
                for (let i = 0; i < count; i++) {
                    const size = 20 + Math.random() * 36;
                    const angle = (Math.PI * 2 / count) * i + Math.random() * 0.3 + wave * 0.4;
                    const distance = reach * (0.45 + Math.random() * 0.55);
                    const star = document.createElement('img');
                    star.src = themeAsset('Star');
                    star.alt = '';
                    star.className = 'star-burst-particle konami-star';
                    star.style.width = `${size}px`;
                    star.style.height = `${size}px`;
                    star.style.left = `${centerX - size / 2}px`;
                    star.style.top = `${centerY - size / 2}px`;
                    star.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
                    star.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
                    star.style.setProperty('--rot', `${360 + Math.random() * 720}deg`);
                    stars.append(star);
                    setTimeout(() => star.remove(), 1700);
                }
                document.body.append(stars);
            }, delay);
        });
    }

    const KONAMI = 'ArrowUp ArrowUp ArrowDown ArrowDown ArrowLeft ArrowRight ArrowLeft ArrowRight b a';
    let recentKeys = [];
    document.addEventListener('keydown', (event) => {
        if (event.target.closest?.('input, textarea, select')) return;
        recentKeys = [...recentKeys, event.key.length === 1 ? event.key.toLowerCase() : event.key].slice(-10);
        if (recentKeys.join(' ') === KONAMI) {
            recentKeys = [];
            konamiSupernova();
            unlock('retro-gamer');
        }
    });
})();
