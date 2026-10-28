const THEMES = ['red', 'blue', 'purple', 'teal', 'orange', 'gold'];

const THEME_COLORS = {
    blue: { hue: 227, saturation: 0.65, brightness: 1.15 },
    purple: { hue: 325, saturation: 0.65, brightness: 0.9 },
    teal: { hue: 176, saturation: 0.71, brightness: 0.79 },
    orange: { hue: 24, saturation: 0.9, brightness: 1.01 },
    gold: { hue: 45, saturation: 0.85, brightness: 1.01 },
};

const SITE_ROOT = new URL('../', document.currentScript.src).href;

const FAVICON_IMAGE = `${SITE_ROOT}images/favicon/favicon.png`;
const FULLSCREEN_CURSOR_IMAGE = `${SITE_ROOT}images/cursor/fullscreen-cursor.png`;

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function loadSetting(key) {
    try { return localStorage.getItem(key); } catch { return null; }
}

function saveSetting(key, value) {
    try { localStorage.setItem(key, value); } catch { }
}

const recoloredImages = {};

function currentTheme() {
    return document.body.dataset.theme || 'red';
}

function baseAsset(name) {
    return `${SITE_ROOT}images/Red${name}.webp`;
}

function themeAsset(name, theme = currentTheme()) {
    return recoloredImages[`${theme}|png|${baseAsset(name)}`]?.url || baseAsset(name);
}

function recolorPixels(pixels, { hue, saturation, brightness }) {
    const clamp = (value) => Math.min(Math.max(value, 0), 1);
    const sector = Math.floor(hue / 60) % 6;
    const fraction = 1 - Math.abs(((hue / 60) % 2) - 1);

    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i] / 255, g = pixels[i + 1] / 255, b = pixels[i + 2] / 255;
        const max = Math.max(r, g, b), delta = max - Math.min(r, g, b);
        if (delta < 1e-6) continue;

        let pixelHue;
        if (max === r) pixelHue = 60 * (((g - b) / delta) % 6);
        else if (max === g) pixelHue = 60 * ((b - r) / delta + 2);
        else pixelHue = 60 * ((r - g) / delta + 4);
        if (pixelHue < 0) pixelHue += 360;

        const pixelSaturation = delta / max;
        const distanceFromRed = Math.min(pixelHue, 360 - pixelHue);
        const weight = clamp(1 - (distanceFromRed - 25) / 20) * clamp(pixelSaturation / 0.25);
        if (weight === 0) continue;

        const v = clamp(max * brightness);
        const c = v * clamp(pixelSaturation * saturation);
        const x = c * fraction;
        const m = v - c;
        const [nr, ng, nb] = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][sector];

        pixels[i] = Math.round((r * (1 - weight) + (nr + m) * weight) * 255);
        pixels[i + 1] = Math.round((g * (1 - weight) + (ng + m) * weight) * 255);
        pixels[i + 2] = Math.round((b * (1 - weight) + (nb + m) * weight) * 255);
    }
}

const RECOLOR_CACHE_NAME = 'theme-images';

function canvasFromBitmap(bitmap, theme) {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    recolorPixels(data.data, THEME_COLORS[theme]);
    ctx.putImageData(data, 0, 0);
    return canvas;
}

function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

async function recolorToBlob(src, theme) {
    const response = await fetch(src);
    if (!response.ok) throw new Error(response.status);
    const version = response.headers.get('etag') || response.headers.get('last-modified') || 'v1';
    const { hue, saturation, brightness } = THEME_COLORS[theme];
    const folder = `${location.origin}/theme-cache/${theme}-${hue}-${saturation}-${brightness}/`;
    const key = `${folder}${encodeURIComponent(version)}/${src}`;

    const cache = 'caches' in window ? await caches.open(RECOLOR_CACHE_NAME).catch(() => null) : null;
    const stored = cache && await cache.match(key);
    if (stored) return stored.blob();

    const bitmap = await createImageBitmap(await response.blob());
    const canvas = canvasFromBitmap(bitmap, theme);
    const blob = await new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject()), 'image/png'));

    if (cache) {
        const old = (await cache.keys()).filter((request) => request.url.startsWith(folder) && request.url.endsWith(`/${src}`));
        await Promise.all(old.map((request) => cache.delete(request)));
        await cache.put(key, new Response(blob, { headers: { 'Content-Type': 'image/png' } }));
    }
    return blob;
}

function recolorImage(src, theme, asDataUrl = false) {
    if (!THEME_COLORS[theme]) return Promise.resolve(src);

    const key = `${theme}|${asDataUrl ? 'data' : 'png'}|${src}`;
    if (recoloredImages[key]) return recoloredImages[key].promise;

    const entry = { url: null };
    entry.promise = recolorToBlob(src, theme)
        .then((blob) => (asDataUrl ? blobToDataUrl(blob) : URL.createObjectURL(blob)))
        .catch(() => src)
        .then((url) => {
            entry.url = url;
            return url;
        });
    recoloredImages[key] = entry;
    return entry.promise;
}

function trapFocus(container, event) {
    if (event.key !== 'Tab') return;
    const items = [...container.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')]
        .filter((el) => !el.disabled && el.getClientRects().length);
    if (!items.length) return;

    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}

function addSharedParts() {
    const star = baseAsset('Star');

    document.body.insertAdjacentHTML('afterbegin', `
<div id="custom-cursor" aria-hidden="true">
    <img src="${baseAsset('Cursor')}" data-theme-asset="Cursor" alt="" class="cursor-base">
    <img src="${star}" data-theme-asset="Star" alt="" class="cursor-star">
</div>`);

    const themeOptions = THEMES.map((theme) => `
                    <label class="theme-option"><input type="radio" name="site-theme" value="${theme}"><span>${theme.toUpperCase()}</span></label>`).join('');

    const settings = `
<button type="button" id="settings-toggle-btn" title="Site Settings" aria-label="Site settings" aria-controls="settings-modal" aria-expanded="false">
    <img src="${star}" data-theme-asset="Star" alt="">
</button>

<div id="settings-modal" class="settings-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="settings-title">
    <div class="settings-modal-card">
        <div class="settings-header">
            <h2 id="settings-title">SYSTEM SETTINGS</h2>
            <button type="button" id="close-settings-btn" class="close-modal-btn" aria-label="Close settings">&times;</button>
        </div>
        <p class="settings-desc">Toggle performance options if you experience frame drops:</p>

        <div class="settings-options-list">
            <label class="setting-item">
                <span>ENABLE MOUSE TRAIL</span>
                <input type="checkbox" id="toggle-mouse-trail" checked>
                <span class="custom-checkbox"></span>
            </label>

            <label class="setting-item">
                <span>ENABLE BACKGROUND STARS</span>
                <input type="checkbox" id="toggle-starfield" checked>
                <span class="custom-checkbox"></span>
            </label>

            <label class="setting-item">
                <span>ENABLE CRT SHADERS</span>
                <input type="checkbox" id="toggle-crt-shaders" checked>
                <span class="custom-checkbox"></span>
            </label>

            <label class="setting-item">
                <span>ENABLE CUSTOM CURSOR</span>
                <input type="checkbox" id="toggle-custom-cursor" checked>
                <span class="custom-checkbox"></span>
            </label>

            <label class="setting-item">
                <span>ENABLE SOUND EFFECTS</span>
                <input type="checkbox" id="toggle-sound">
                <span class="custom-checkbox"></span>
            </label>

            <div class="setting-item theme-setting">
                <span>WEBSITE THEME</span>
                <div class="theme-options" role="radiogroup" aria-label="Choose website theme">${themeOptions}
                </div>
            </div>
        </div>
    </div>
</div>`;

    const footer = document.querySelector('.site-footer');
    if (footer) footer.insertAdjacentHTML('beforebegin', settings);
    else document.body.insertAdjacentHTML('beforeend', settings);
}

addSharedParts();

(() => {
    const themeRadios = document.querySelectorAll('input[name="site-theme"]');

    function setTheme(theme, firstLoad = false) {
        if (!THEMES.includes(theme)) theme = 'red';

        document.body.dataset.theme = theme;
        document.documentElement.dataset.theme = theme;

        themeRadios.forEach((radio) => {
            radio.checked = radio.value === theme;
            radio.closest('.theme-option')?.classList.toggle('active', radio.checked);
        });

        const showImages = () => document.body.classList.remove('theme-loading');
        if (firstLoad && theme !== 'red') {
            document.body.classList.add('theme-loading');
            setTimeout(showImages, 2000);
        }

        const names = [...new Set([...document.querySelectorAll('[data-theme-asset]')].map((img) => img.dataset.themeAsset))];
        Promise.all(names.map((name) => recolorImage(baseAsset(name), theme))).then((urls) => {
            if (currentTheme() === theme) {
                names.forEach((name, index) => {
                    document.querySelectorAll(`[data-theme-asset="${name}"]`).forEach((img) => {
                        if (img.getAttribute('src') !== urls[index]) img.src = urls[index];
                    });
                });
            }
            showImages();
        });

        const favicon = document.getElementById('site-favicon');
        if (favicon) {
            recolorImage(FAVICON_IMAGE, theme, true).then((url) => {
                if (currentTheme() === theme) favicon.href = url;
            });
        }

        recolorImage(FULLSCREEN_CURSOR_IMAGE, theme, true).then((url) => {
            if (currentTheme() === theme) document.body.style.setProperty('--fullscreen-cursor', `url("${url}") 5 1`);
        });
    }

    setTheme(loadSetting('siteTheme'), true);

    themeRadios.forEach((radio) => {
        radio.addEventListener('change', () => {
            setTheme(radio.value);
            saveSetting('siteTheme', radio.value);
        });
    });

    const TOGGLES = [
        { checkbox: 'toggle-mouse-trail', key: 'enableTrail',     bodyClass: 'mouse-trail', moving: true },
        { checkbox: 'toggle-starfield',   key: 'enableStarfield', bodyClass: 'starfield',   moving: true },
        { checkbox: 'toggle-crt-shaders', key: 'enableCrt',       bodyClass: 'crt-shaders' },
        { checkbox: 'toggle-custom-cursor', key: 'enableCustomCursor', bodyClass: 'custom-cursor' },
        { checkbox: 'toggle-sound',       key: 'enableSound',     bodyClass: 'sound-effects', offByDefault: true },
    ];

    TOGGLES.forEach(({ checkbox, key, bodyClass, moving, offByDefault }) => {
        const saved = loadSetting(key);
        const enabled = saved === null ? !offByDefault && !(moving && REDUCED_MOTION) : saved !== 'false';
        const input = document.getElementById(checkbox);

        document.body.classList.toggle(bodyClass, enabled);
        if (!input) return;

        input.checked = enabled;
        input.addEventListener('change', () => {
            document.body.classList.toggle(bodyClass, input.checked);
            saveSetting(key, input.checked);
        });
    });

    const modal = document.getElementById('settings-modal');
    const openBtn = document.getElementById('settings-toggle-btn');
    const closeBtn = document.getElementById('close-settings-btn');

    if (modal && openBtn) {
        const isOpen = () => modal.classList.contains('active');

        const open = () => {
            modal.classList.add('active');
            playSound('open');
            openBtn.setAttribute('aria-expanded', 'true');
            closeBtn?.focus();
        };

        const close = () => {
            if (!isOpen()) return;
            modal.classList.remove('active');
            playSound('close');
            openBtn.setAttribute('aria-expanded', 'false');
            openBtn.focus();
        };

        openBtn.addEventListener('click', open);
        closeBtn?.addEventListener('click', close);
        modal.addEventListener('click', (event) => {
            if (event.target === modal) close();
        });
        document.addEventListener('keydown', (event) => {
            if (!isOpen()) return;
            if (event.key === 'Escape') close();
            else trapFocus(modal, event);
        });

        document.addEventListener('focusin', (event) => {
            if (isOpen() && !modal.contains(event.target)) closeBtn?.focus();
        });
    }
})();
