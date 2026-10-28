(() => {
    let alreadyBooted = false;
    try {
        alreadyBooted = sessionStorage.getItem('booted') === 'yes';
        sessionStorage.setItem('booted', 'yes');
    } catch { }
    if (alreadyBooted || !document.querySelector('.game-gallery')) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const LINES = [
        ['BOOTING COSMICSHIN OS', 'v2.6'],
        ['MOUNTING ARCHIVES', 'OK'],
        [`LOADING ${document.querySelectorAll('.dropdown-content a').length} QUESTS`, 'OK'],
        ['CALIBRATING STARFIELD', 'OK'],
        ['SYNCING ACHIEVEMENTS', 'OK'],
    ];
    const STEP = reduced ? 0 : 500;
    const HOLD = reduced ? 700 : 1000;

    const boot = document.createElement('div');
    boot.className = 'boot-screen';
    boot.setAttribute('aria-hidden', 'true');
    boot.innerHTML = `
        <div class="boot-inner">
            <img class="boot-logo" src="images/RedLogo.webp" data-theme-asset="Logo" alt="">
            <div class="boot-log"></div>
            <p class="boot-title">LOADING ARCHIVES<span class="boot-dots"></span></p>
            <div class="boot-bar"><span></span></div>
            <p class="boot-hint">CLICK OR PRESS ANY KEY TO SKIP</p>
        </div>`;
    document.body.classList.add('booting');
    document.body.prepend(boot);

    const log = boot.querySelector('.boot-log');
    const fill = boot.querySelector('.boot-bar span');
    const timers = [];

    LINES.forEach(([text, status], index) => {
        timers.push(setTimeout(() => {
            const line = document.createElement('div');
            line.className = 'boot-line';
            line.innerHTML = `<span class="boot-prompt">&gt;</span><span>${text}</span><span class="boot-leader"></span><span class="boot-ok">${status}</span>`;
            log.append(line);
            fill.style.width = `${((index + 1) / LINES.length) * 100}%`;
        }, 200 + index * STEP));
    });

    let finished = false;
    function finish() {
        if (finished) return;
        finished = true;
        timers.forEach(clearTimeout);
        window.removeEventListener('keydown', finish);
        fill.style.width = '100%';
        boot.classList.add('boot-done');
        document.body.classList.remove('booting');
        document.dispatchEvent(new CustomEvent('site:boot-done'));
        setTimeout(() => boot.remove(), 600);
    }

    timers.push(setTimeout(finish, 200 + LINES.length * STEP + HOLD));
    window.addEventListener('keydown', finish);
    boot.addEventListener('click', finish);
})();
