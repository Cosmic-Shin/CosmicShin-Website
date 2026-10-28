(() => {
    const overlay = document.getElementById('page-overlay');

    if (overlay) {
        window.addEventListener('pageshow', (event) => {
            if (event.persisted) overlay.classList.remove('crt-off');
        });

        document.addEventListener('click', (event) => {
            const link = event.target.closest('a[href]');
            if (!link || event.defaultPrevented) return;

            const newTab = event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey
                || link.target === '_blank';
            const url = new URL(link.href, location.href);
            const otherSite = !['http:', 'https:', 'file:'].includes(url.protocol) || url.origin !== location.origin;
            const samePageJump = url.hash && url.pathname === location.pathname && url.search === location.search;

            if (newTab || otherSite || samePageJump) return;

            event.preventDefault();
            overlay.classList.add('crt-off');
            playSound('powerOff');
            setTimeout(() => { location.href = link.href; }, REDUCED_MOTION ? 0 : 380);
        });
    }

    const tag = document.querySelector('.system-tag[data-taglines]');

    if (tag) {
        const lines = tag.dataset.taglines.split('|');
        const prefix = `${tag.textContent.split('//')[0].trim()} // `;
        let index = 0;

        const show = () => { tag.textContent = prefix + lines[index]; };
        show();
        setInterval(() => {
            index = (index + 1) % lines.length;
            show();
        }, 2400);
    }

    const galleryImages = [...document.querySelectorAll('.screenshots-grid img, .inventory-media img, .icon-grid img, img[data-zoom]')];
    if (galleryImages.length) {
        document.body.insertAdjacentHTML('beforeend', '<div id="lightbox" class="lightbox-overlay"><img id="lightbox-img" src="" alt=""></div>');
    }
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');

    if (lightbox && lightboxImg && galleryImages.length) {
        let current = 0;
        let returnFocusTo = null;

        lightbox.setAttribute('role', 'dialog');
        lightbox.setAttribute('aria-modal', 'true');
        lightbox.setAttribute('aria-label', 'Screenshot viewer');

        const makeButton = (className, label, symbol) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = className;
            button.setAttribute('aria-label', label);
            button.textContent = symbol;
            lightbox.append(button);
            return button;
        };

        const closeButton = makeButton('lightbox-close', 'Close', '×');
        const hasMany = galleryImages.length > 1;
        const prevButton = hasMany && makeButton('lightbox-nav lightbox-prev', 'Previous image', '‹');
        const nextButton = hasMany && makeButton('lightbox-nav lightbox-next', 'Next image', '›');
        const counter = hasMany && lightbox.appendChild(document.createElement('div'));
        if (counter) counter.className = 'lightbox-counter';

        const show = (index, step = 1) => {
            for (let tries = 0; tries < galleryImages.length; tries++, index += step) {
                current = (index + galleryImages.length) % galleryImages.length;
                if (galleryImages[current].getClientRects().length) break;
            }
            const img = galleryImages[current];
            lightboxImg.src = img.currentSrc || img.src;
            lightboxImg.alt = img.alt || 'Expanded screenshot';
            if (counter) counter.textContent = `${current + 1} / ${galleryImages.length}`;
        };

        const zoom = (thumbnail, direction) => {
            const from = thumbnail.getBoundingClientRect();
            const to = lightboxImg.getBoundingClientRect();
            if (REDUCED_MOTION || !from.width || !to.width) return null;
            const thumbnailFrame = {
                transformOrigin: '0 0',
                transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`,
                opacity: 0.4,
            };
            const fullFrame = { transformOrigin: '0 0', transform: 'none', opacity: 1 };
            const frames = direction === 'in' ? [thumbnailFrame, fullFrame] : [fullFrame, thumbnailFrame];
            return lightboxImg.animate(frames, { duration: direction === 'in' ? 320 : 220, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' });
        };

        const isOpen = () => lightbox.classList.contains('active');
        const open = (index) => {
            returnFocusTo = document.activeElement;
            show(index);
            lightbox.classList.add('active');
            closeButton.focus();
            playSound('open');
            if (lightboxImg.complete) zoom(galleryImages[current], 'in');
            else lightboxImg.addEventListener('load', () => zoom(galleryImages[current], 'in'), { once: true });
        };
        const close = () => {
            if (!isOpen() || lightbox.dataset.closing) return;
            playSound('close');
            const finish = () => {
                delete lightbox.dataset.closing;
                lightbox.classList.remove('active');
                returnFocusTo?.focus?.();
            };
            const animation = zoom(galleryImages[current], 'out');
            if (!animation) return finish();
            lightbox.dataset.closing = 'yes';
            animation.onfinish = finish;
        };

        galleryImages.forEach((img, index) => {
            img.tabIndex = 0;
            img.setAttribute('role', 'button');
            img.setAttribute('aria-label', `View ${img.alt || 'image'} (${index + 1} of ${galleryImages.length})`);
            img.addEventListener('click', () => open(index));
            img.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    open(index);
                }
            });
        });

        lightbox.addEventListener('click', (event) => {
            if (event.target === prevButton) show(current - 1, -1);
            else if (event.target === nextButton) show(current + 1);
            else if (event.target !== lightboxImg) close();
        });
        closeButton.addEventListener('click', close);

        document.addEventListener('keydown', (event) => {
            if (!isOpen()) return;
            if (event.key === 'Escape') close();
            if (hasMany && event.key === 'ArrowLeft') show(current - 1, -1);
            if (hasMany && event.key === 'ArrowRight') show(current + 1);
            trapFocus(lightbox, event);
        });

        let touchStartX = null;
        lightbox.addEventListener('touchstart', (event) => {
            touchStartX = event.touches[0].clientX;
        }, { passive: true });
        lightbox.addEventListener('touchend', (event) => {
            if (touchStartX === null || !hasMany) return;
            const distance = event.changedTouches[0].clientX - touchStartX;
            if (Math.abs(distance) > 50) { const step = distance < 0 ? 1 : -1; show(current + step, step); }
            touchStartX = null;
        });
    }

    const video = document.getElementById('promo-video');
    const videoOverlay = document.getElementById('video-overlay');

    if (video && videoOverlay) {
        const syncOverlay = () => {
            videoOverlay.style.display = video.paused ? 'flex' : 'none';
        };

        videoOverlay.addEventListener('click', () => video.play());
        ['play', 'pause', 'ended'].forEach((type) => video.addEventListener(type, syncOverlay));
    }

    const messageBox = document.getElementById('message');

    messageBox?.addEventListener('input', () => {
        messageBox.style.height = 'auto';
        messageBox.style.height = `${messageBox.scrollHeight}px`;
    });

    const contactForm = document.querySelector('form[data-netlify="true"]');

    if (contactForm) {
        const status = contactForm.querySelector('.form-status');
        const submitButton = contactForm.querySelector('[type="submit"]');

        const showStatus = (message, isError) => {
            status.textContent = message;
            status.classList.toggle('error', isError);
        };

        contactForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            submitButton.disabled = true;
            showStatus('Sending...', false);

            try {
                const response = await fetch('/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams(new FormData(contactForm)).toString(),
                });
                if (!response.ok) throw new Error(response.status);

                contactForm.reset();
                if (messageBox) messageBox.style.height = '';
                showStatus("Message sent! I'll reply to the email you entered.", false);
            } catch {
                showStatus("Your message didn't send. Check your connection and try again.", true);
            } finally {
                submitButton.disabled = false;
            }
        });
    }

    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach((dropdown) => {
        dropdown.querySelector('.nav-link')?.addEventListener('click', (event) => {
            if (!window.matchMedia('(hover: none)').matches || dropdown.classList.contains('open')) return;
            event.preventDefault();
            dropdown.classList.add('open');
        });
    });
    document.addEventListener('click', (event) => {
        dropdowns.forEach((dropdown) => {
            if (!dropdown.contains(event.target)) dropdown.classList.remove('open');
        });
    });

    const filterButtons = document.querySelectorAll('.inventory-filter-btn');
    const sections = document.querySelectorAll('.inventory-section');
    filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const filter = button.dataset.filter;
            filterButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
            sections.forEach((section) => {
                section.hidden = filter !== 'all' && section.dataset.category !== filter;
            });
        });
    });

    const toTop = document.createElement('button');
    toTop.type = 'button';
    toTop.id = 'back-to-top';
    toTop.setAttribute('aria-label', 'Back to top');
    toTop.title = 'Back to top';
    toTop.textContent = '▲';
    document.body.append(toTop);

    const updateToTop = () => toTop.classList.toggle('show', window.scrollY > 600);
    updateToTop();
    window.addEventListener('scroll', updateToTop, { passive: true });
    toTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: REDUCED_MOTION ? 'auto' : 'smooth' });
        document.getElementById('main-content')?.focus({ preventScroll: true });
    });
})();
