(() => {
    const COMPANY_NAME = 'QwekByte';

    const canvas = document.getElementById('unity-canvas');
    const { buildPath, buildName, gameTitle = 'Game' } = canvas?.dataset ?? {};
    if (!buildPath || !buildName) return;

    const buildFile = (extension) => `${buildPath}/${buildName}.${extension}`;

    const playButton = document.getElementById('unity-play-button');
    const loadingBar = document.getElementById('unity-loading-bar');
    const progressBar = document.getElementById('unity-progress-bar-full');
    const warning = document.getElementById('unity-warning');
    const fullscreenButton = document.getElementById('unity-fullscreen-button');
    const volumeSlider = document.getElementById('unity-volume-control');

    canvas.style.background = `url("${encodeURI(buildFile('jpg'))}") center / cover`;

    const savedVolume = Number.parseFloat(loadSetting('gameVolume'));
    let volume = Number.isFinite(savedVolume) ? Math.min(Math.max(savedVolume, 0), 1) : 1;
    if (volumeSlider) volumeSlider.value = volume;
    let masterGain = null;
    const originalConnect = AudioNode.prototype.connect;

    AudioNode.prototype.connect = function (destination, ...args) {
        if (destination !== this.context.destination) {
            return originalConnect.call(this, destination, ...args);
        }

        if (!masterGain || masterGain.context !== this.context) {
            masterGain = this.context.createGain();
            masterGain.gain.value = volume;
            originalConnect.call(masterGain, destination);
        }

        return originalConnect.call(this, masterGain, ...args);
    };

    volumeSlider?.addEventListener('input', () => {
        volume = Number(volumeSlider.value);
        masterGain?.gain.setValueAtTime(volume, masterGain.context.currentTime);
        saveSetting('gameVolume', volume);
    });

    function showBanner(message, type) {
        if (!warning) return;

        const banner = document.createElement('div');
        banner.textContent = message;
        banner.style.padding = '10px';
        banner.style.background = type === 'error' ? 'red' : 'yellow';
        warning.append(banner);
        warning.style.display = 'block';

        if (type !== 'error') {
            setTimeout(() => {
                banner.remove();
                warning.style.display = warning.children.length ? 'block' : 'none';
            }, 5000);
        }
    }

    function startGame() {
        playButton?.remove();
        if (loadingBar) loadingBar.style.display = 'block';

        const loader = document.createElement('script');
        loader.src = buildFile('loader.js');

        loader.onload = () => {
            createUnityInstance(canvas, {
                dataUrl: buildFile('data'),
                frameworkUrl: buildFile('framework.js'),
                codeUrl: buildFile('wasm'),
                streamingAssetsUrl: 'StreamingAssets',
                companyName: COMPANY_NAME,
                productName: gameTitle,
                productVersion: '0.1',
                showBanner,
            }, (progress) => {
                if (progressBar) progressBar.style.width = `${progress * 100}%`;
            }).then((unity) => {
                if (loadingBar) loadingBar.style.display = 'none';
                if (fullscreenButton) fullscreenButton.onclick = () => unity.SetFullscreen(1);
                window.dispatchEvent(new Event('resize'));
            }).catch((message) => showBanner(String(message), 'error'));
        };

        loader.onerror = () => showBanner(`Couldn't load the game build from ${buildPath}.`, 'error');

        document.body.append(loader);
    }

    if (playButton) {
        if (loadingBar) loadingBar.style.display = 'none';
        playButton.addEventListener('click', startGame, { once: true });
    } else {
        startGame();
    }
})();
