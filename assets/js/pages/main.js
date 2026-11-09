/**
 * Main Page
 */

/* section1 */
$(function () {
    const $section = $('.cont1').first();
    const $container = $section.find('.container').first();
    const $bg = $section.find('.bg').first();
    if (!$section.length || !$container.length || !$bg.length || typeof window.Swiper !== 'function') return;

    const resolveAssetUrl = (assetPath) => new URL(assetPath, window.location.href).toString();
    const defaultSlides = [
        { bg: resolveAssetUrl('../../assets/img/main/bg01.jpg'), lines: ['Import & Export 전문기업', '도일상사주식회사'], product: resolveAssetUrl('../../assets/img/main/product01.png') },
        { bg: resolveAssetUrl('../../assets/img/main/bg02.jpg'), lines: ['니시시바 전기· 테라사키 전기', '한국 공식 대리점'], product: resolveAssetUrl('../../assets/img/main/product02.png') },
        { bg: resolveAssetUrl('../../assets/img/main/bg03.jpg'), lines: ['해양 무역산업의 미래를 잇는', '도일상사주식회사'], product: resolveAssetUrl('../../assets/img/main/product03.png') }
    ];
    const data = Array.isArray(window.MAIN_HERO_SLIDES) && window.MAIN_HERO_SLIDES.length
        ? window.MAIN_HERO_SLIDES
        : defaultSlides;

    const $swiperEl = $bg;
    const $titleLines = $container.find('.title .line .txt');
    const $product = $container.find('.product');
    const $buttons = $container.find('.nav .nav-btn');
    const $dotsWrap = $container.find('.dots');
    const $prev = $buttons.eq(0);
    const $next = $buttons.eq(1);
    const hasGsap = typeof window.gsap !== 'undefined' && !!window.gsap;
    let currentIndex = -1;
    let titleTimeline = null;
    let revealTimer = null;
    let swapTimer = null;
    $container.addClass('isanim');
    if (hasGsap) $container.addClass('charanim');
    $bg.addClass('swiper');

    (function preloadAssets() {
        const sources = [];
        data.forEach(function (item) {
            sources.push(item.bg, item.product);
        });
        sources.forEach(function (src) {
            const image = new Image();
            image.src = src;
        });
    })();

    (function buildSlides() {
        if (!$swiperEl.length) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'swiper-wrapper';

        data.forEach(function (item) {
            const slide = document.createElement('div');
            slide.className = 'swiper-slide';
            slide.style.backgroundImage = `url('${item.bg}')`;
            wrapper.appendChild(slide);
        });

        $swiperEl.empty().append(wrapper);
    })();

    function updateCopy(index) {
        const item = data[index] || data[0];
        $titleLines.each(function (lineIndex) {
            $(this).text(item.lines[lineIndex] || '');
        });
    }

    function splitTitleToChars() {
        $titleLines.each(function () {
            const $line = $(this);
            const text = $line.text();
            const fragment = document.createDocumentFragment();

            Array.from(text).forEach(function (character) {
                const span = document.createElement('span');
                span.className = 'char';
                span.textContent = character === ' ' ? '\u00A0' : character;
                fragment.appendChild(span);
            });

            $line.empty().append(fragment);
        });
    }

    function animateTitleChars() {
        if (!hasGsap) return;

        const charNodes = $titleLines.find('.char').toArray();
        if (!charNodes.length) return;

        if (titleTimeline) {
            titleTimeline.kill();
            titleTimeline = null;
        }

        window.gsap.killTweensOf(charNodes);
        window.gsap.set(charNodes, {
            yPercent: 145,
            opacity: 0,
            skewY: function (index) {
                return index % 2 === 0 ? 12 : -12;
            },
            transformOrigin: '50% 100%'
        });

        titleTimeline = window.gsap.timeline();
        titleTimeline
            .to(charNodes, {
                yPercent: 0,
                opacity: 1,
                skewY: 0,
                duration: 0.78,
                stagger: 0.02,
                ease: 'power4.out'
            }, '>-0.02');
    }

    function reveal(index) {
        if (index === currentIndex) return;
        currentIndex = index;
        const item = data[index] || data[0];

        if (swapTimer) {
            clearTimeout(swapTimer);
            swapTimer = null;
        }
        if (revealTimer) {
            clearTimeout(revealTimer);
            revealTimer = null;
        }

        $container.removeClass('ready').addClass('switching');
        updateCopy(index);
        splitTitleToChars();

        swapTimer = setTimeout(function () {
            $product.attr('src', item.product);
            swapTimer = null;
        }, 240);

        revealTimer = setTimeout(function () {
            $container.removeClass('switching').addClass('ready');
            animateTitleChars();
            revealTimer = null;
        }, 360);
    }

    let swiper = null;

    try {
        swiper = new window.Swiper($swiperEl.get(0), {
        loop: true,
        effect: 'fade',
        speed: 1400,
        fadeEffect: { crossFade: true },
        autoplay: {
            delay: 5200,
            disableOnInteraction: false
        },
        allowTouchMove: true,
        navigation: {
            prevEl: $prev.get(0),
            nextEl: $next.get(0)
        },
        pagination: {
            el: $dotsWrap.get(0),
            clickable: true,
            bulletClass: 'dot',
            bulletActiveClass: 'on',
            renderBullet: function (index, className) {
                return `<button class="${className}" type="button" role="tab" aria-label="Slide ${index + 1}"><i></i></button>`;
            }
        },
        on: {
            init: function () {
                currentIndex = -1;
                reveal(this.realIndex || 0);
            },
            slideChangeTransitionStart: function () {
                currentIndex = -1;
                reveal(this.realIndex || 0);
            }
        }
        });
    } catch (error) {
        console.error(error);
        reveal(0);
    }

    $container.on('mouseenter', function () {
        if (swiper && swiper.autoplay) swiper.autoplay.stop();
    });

    $container.on('mouseleave', function () {
        if (swiper && swiper.autoplay) swiper.autoplay.start();
    });

    const drag = {
        active: false,
        startX: 0,
        currentX: 0,
        threshold: 40
    };

    $section.on('pointerdown', function (event) {
        if (!swiper) return;
        if ($(event.target).closest('.nav').length) return;
        drag.active = true;
        drag.startX = event.clientX;
        drag.currentX = event.clientX;
    });

    $section.on('pointermove', function (event) {
        if (!drag.active) return;
        drag.currentX = event.clientX;
    });

    const finishDrag = function () {
        if (!drag.active || !swiper) return;
        drag.active = false;
        const deltaX = drag.currentX - drag.startX;
        if (Math.abs(deltaX) < drag.threshold) return;
        if (deltaX < 0) swiper.slideNext();
        else swiper.slidePrev();
    };

    $section.on('pointerup', finishDrag);
    $section.on('pointercancel', finishDrag);
    $section.on('pointerleave', finishDrag);
});

$(function () {
    const $section = $('.cont2');
    if (!$section.length) return;

    const $cube = $section.find('.cube');
    const $menuItems = $section.find('.menu .item');
    const $faces = $section.find('.face');
    if (!$cube.length || !$menuItems.length || !$faces.length) return;

    const faceOrder = ['front', 'right', 'back', 'left', 'top', 'bottom'];
    const menuFaceGroups = [
        ['front', 'back'],
        ['right', 'left'],
        ['top', 'bottom']
    ];
    const faceAngles = {
        front: { x: 0, y: 0 },
        right: { x: 0, y: -90 },
        left: { x: 0, y: 90 },
        back: { x: 0, y: 180 },
        top: { x: -90, y: 0 },
        bottom: { x: 90, y: 0 }
    };
    let baseX = 0;
    let baseY = 0;

    const tiltX = 0;
    const tiltY = 0;
    const applyRotation = (x, y) => {
        $cube.css('--cube-rot-x', `${x + tiltX}deg`);
        $cube.css('--cube-rot-y', `${y + tiltY}deg`);
    };

    const getMenuIndexByFace = (face) => menuFaceGroups.findIndex((group) => group.indexOf(face) !== -1);
    const pickRandomFace = (faces, exceptFace) => {
        if (!faces || !faces.length) return 'front';
        const candidates = faces.filter((face) => face !== exceptFace);
        const pool = candidates.length ? candidates : faces;
        return pool[Math.floor(Math.random() * pool.length)];
    };

    let currentFace = 'front';
    const setActiveFace = (face) => {
        if (!face) return;
        currentFace = face;
        const menuIndex = getMenuIndexByFace(face);
        $menuItems.each(function (index) {
            $(this).toggleClass('active', index === menuIndex);
        });

        const angles = faceAngles[face] || faceAngles.front;
        baseX = angles.x;
        baseY = angles.y;
        applyRotation(baseX, baseY);
        $faces.removeClass('is-current');
        $faces.filter(`.${face}`).first().addClass('is-current');
    };

    const dragState = {
        active: false,
        moved: false,
        justDragged: false,
        startX: 0,
        startY: 0,
        dx: 0,
        dy: 0,
        pointerId: null
    };
    const dragSensitivity = 0.28;
    const dragThreshold = 40;
    const $cubeWrap = $cube;
    const autoRotateDelay = 8000;
    let autoRotateTimer = null;
    let isPointerOverSection = false;
    let isFocusInsideSection = false;
    let isIntroTransition = false;
    const musicState = {
        context: null,
        gain: null,
        oscillators: [],
        mode: 0,
        playing: false
    };

    const getEvent = (event) => event.originalEvent || event;
    const isAutoRotateBlocked = () => dragState.active || isPointerOverSection || isFocusInsideSection || isIntroTransition;
    const stopAutoRotate = () => {
        if (autoRotateTimer) {
            clearInterval(autoRotateTimer);
            autoRotateTimer = null;
        }
    };
    const runAutoRotate = () => {
        if (isAutoRotateBlocked()) return;
        const currentMenuIndex = getMenuIndexByFace(currentFace);
        const nextMenuIndex = currentMenuIndex >= 0
            ? (currentMenuIndex + 1) % menuFaceGroups.length
            : 0;
        const nextFace = pickRandomFace(menuFaceGroups[nextMenuIndex], currentFace);
        setActiveFace(nextFace);
    };
    const resetAutoRotate = () => {
        stopAutoRotate();
        if (isAutoRotateBlocked()) return;
        autoRotateTimer = setInterval(runAutoRotate, autoRotateDelay);
    };
    const maybeResumeAutoRotate = () => {
        if (isAutoRotateBlocked()) return;
        resetAutoRotate();
    };

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const runIntroView = () => {
        if (prefersReducedMotion) {
            setActiveFace(currentFace);
            resetAutoRotate();
            return;
        }

        const introX = -24;
        const introY = 30;
        isIntroTransition = true;
        stopAutoRotate();
        $cube.addClass('intro-static');
        applyRotation(introX, introY);
        const el = $cube.get(0);
        if (el) {
            // Force reflow so intro start angle is applied before transition.
            void el.offsetWidth;
        }
        $cube.removeClass('intro-static').addClass('intro-view');
        setTimeout(() => {
            setActiveFace(currentFace);
        }, 50);
        setTimeout(() => {
            isIntroTransition = false;
            $cube.removeClass('intro-view');
            resetAutoRotate();
        }, 1300);
    };

    let hasStartedCubeIntro = false;
    const startCubeIntro = () => {
        if (hasStartedCubeIntro) return;
        hasStartedCubeIntro = true;
        runIntroView();
    };

    if ($('body').hasClass('introoff')) {
        startCubeIntro();
    } else {
        document.addEventListener('ubique:introoff', startCubeIntro, { once: true });
        // Fallback in case intro event is unavailable.
        setTimeout(startCubeIntro, 6200);
    }

    $section.on('mouseenter', function () {
        isPointerOverSection = true;
        stopAutoRotate();
    });
    $section.on('mouseleave', function () {
        isPointerOverSection = false;
        maybeResumeAutoRotate();
    });
    $section.on('focusin', function () {
        isFocusInsideSection = true;
        stopAutoRotate();
    });
    $section.on('focusout', function (event) {
        const e = getEvent(event);
        const nextTarget = e.relatedTarget;
        if (nextTarget && this.contains(nextTarget)) return;
        isFocusInsideSection = false;
        maybeResumeAutoRotate();
    });

    $menuItems.on('mouseenter focus click', function () {
        if (isIntroTransition) return;
        const index = $menuItems.index(this);
        const faces = menuFaceGroups[index] || menuFaceGroups[0];
        const face = pickRandomFace(faces, currentFace);
        setActiveFace(face);
        resetAutoRotate();
    });

    $cube.on('click', function (event) {
        if (isIntroTransition) return;
        if (dragState.justDragged) {
            dragState.justDragged = false;
            return;
        }
        if ($(event.target).closest('button, a, input, textarea, select, label, video').length) return;
        const index = faceOrder.indexOf(currentFace);
        const next = faceOrder[(index + 1) % faceOrder.length];
        setActiveFace(next);
        resetAutoRotate();
    });

    const onPointerDown = (event) => {
        if (isIntroTransition) return;
        const e = getEvent(event);
        if (typeof e.button === 'number' && e.button !== 0) return;
        if ($(event.target).closest('button, a, input, textarea, select, label').length) return;
        stopAutoRotate();
        dragState.active = true;
        dragState.moved = false;
        dragState.justDragged = false;
        dragState.startX = e.clientX;
        dragState.startY = e.clientY;
        dragState.dx = 0;
        dragState.dy = 0;
        dragState.pointerId = e.pointerId;
        $cube.addClass('drag');
        const el = $cubeWrap.get(0);
        if (el && typeof el.setPointerCapture === 'function') {
            el.setPointerCapture(e.pointerId);
        }
    };

    const onPointerMove = (event) => {
        if (!dragState.active) return;
        const e = getEvent(event);
        dragState.dx = e.clientX - dragState.startX;
        dragState.dy = e.clientY - dragState.startY;
        if (Math.abs(dragState.dx) + Math.abs(dragState.dy) > 4) {
            dragState.moved = true;
        }
        const rotX = baseX + dragState.dy * dragSensitivity;
        const rotY = baseY - dragState.dx * dragSensitivity;
        applyRotation(rotX, rotY);
    };

    const endDrag = (event) => {
        if (!dragState.active) return;
        dragState.active = false;
        $cube.removeClass('drag');
        const el = $cubeWrap.get(0);
        if (el && typeof el.releasePointerCapture === 'function' && dragState.pointerId !== null) {
            try {
                el.releasePointerCapture(dragState.pointerId);
            } catch (err) {}
        }
        const dx = dragState.dx;
        const dy = dragState.dy;
        dragState.justDragged = dragState.moved;
        dragState.moved = false;
        dragState.dx = 0;
        dragState.dy = 0;
        dragState.pointerId = null;

        if (Math.abs(dx) < dragThreshold && Math.abs(dy) < dragThreshold) {
            applyRotation(baseX, baseY);
            resetAutoRotate();
            return;
        }
        if (Math.abs(dx) >= Math.abs(dy)) {
            setActiveFace(dx > 0 ? 'right' : 'left');
        } else {
            setActiveFace(dy > 0 ? 'bottom' : 'top');
        }
        resetAutoRotate();
    };

    $cubeWrap.on('pointerdown', onPointerDown);
    $cubeWrap.on('pointermove', onPointerMove);
    $cubeWrap.on('pointerup pointercancel pointerleave', endDrag);
    $section.on('pointerdown', 'button, a, input, textarea, select, label', function (event) {
        event.stopPropagation();
    });

    $section.find('.portfolio-face').each(function () {
        const $face = $(this);
        const $shots = $face.find('.gallery-shot');
        const $dots = $face.find('.gallery-dot');
        if (!$shots.length) return;

        let currentIndex = $shots.index($shots.filter('.active').first());
        if (currentIndex < 0) {
            currentIndex = 0;
        }

        const setActiveShot = (index) => {
            const safeIndex = ((index % $shots.length) + $shots.length) % $shots.length;
            currentIndex = safeIndex;
            $shots.removeClass('active');
            $shots.eq(safeIndex).addClass('active');
            if ($dots.length) {
                $dots.removeClass('active').attr('aria-current', 'false');
                $dots.eq(safeIndex).addClass('active').attr('aria-current', 'true');
            }
        };

        setActiveShot(currentIndex);

        $face.find('.port-cycle').on('click', function () {
            setActiveShot(currentIndex + 1);
        });
        $dots.on('click', function () {
            const dotIndex = Number.parseInt($(this).attr('data-index'), 10);
            if (Number.isFinite(dotIndex)) {
                setActiveShot(dotIndex);
            } else {
                setActiveShot($dots.index(this));
            }
        });
    });

    $section.find('.port-shuffle').on('click', function () {
        const $cards = $(this).closest('.portfolio-face').find('.wall-card');
        if (!$cards.length) return;
        const currentIndex = $cards.index($cards.filter('.featured').first());
        let nextIndex = Math.floor(Math.random() * $cards.length);
        if ($cards.length > 1 && nextIndex === currentIndex) {
            nextIndex = (nextIndex + 1) % $cards.length;
        }
        $cards.removeClass('featured');
        $cards.eq(nextIndex).addClass('featured');
    });

    $section.find('.port-tone').on('click', function () {
        const nextHue = Math.floor(Math.random() * 361);
        $cube.css('--cube-accent-hue', nextHue);
        $section.find('.hueslider').val(nextHue);
    });

    const modeFreqs = [
        [196, 293.66],
        [220, 329.63],
        [246.94, 369.99]
    ];
    const ensureAudioContext = () => {
        if (musicState.context) return musicState.context;
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        const context = new Ctx();
        const gain = context.createGain();
        gain.gain.value = 0.04;
        gain.connect(context.destination);
        musicState.context = context;
        musicState.gain = gain;
        return context;
    };
    const applyMusicMode = () => {
        if (!musicState.oscillators.length) return;
        const pair = modeFreqs[musicState.mode % modeFreqs.length];
        musicState.oscillators[0].frequency.setTargetAtTime(pair[0], musicState.context.currentTime, 0.08);
        musicState.oscillators[1].frequency.setTargetAtTime(pair[1], musicState.context.currentTime, 0.08);
    };
    const applyMusicVolume = (volume) => {
        if (!musicState.gain || !musicState.context) return;
        const value = Math.max(0, Math.min(100, Number(volume)));
        const amp = 0.01 + (value / 100) * 0.08;
        musicState.gain.gain.setTargetAtTime(amp, musicState.context.currentTime, 0.06);
    };
    const startMusic = () => {
        const context = ensureAudioContext();
        if (!context || musicState.playing) return;
        if (context.state === 'suspended' && typeof context.resume === 'function') {
            context.resume();
        }
        const oscA = context.createOscillator();
        const oscB = context.createOscillator();
        oscA.type = 'triangle';
        oscB.type = 'sawtooth';
        oscA.connect(musicState.gain);
        oscB.connect(musicState.gain);
        musicState.oscillators = [oscA, oscB];
        applyMusicMode();
        const vol = $section.find('.music-volume').first().val();
        applyMusicVolume(vol);
        oscA.start();
        oscB.start();
        musicState.playing = true;
        $section.find('.sound-lab').addClass('playing');
        $section.find('.music-toggle').text('Music Stop');
    };
    const stopMusic = () => {
        if (!musicState.oscillators.length) return;
        musicState.oscillators.forEach((osc) => {
            try {
                osc.stop();
            } catch (err) {}
            try {
                osc.disconnect();
            } catch (err) {}
        });
        musicState.oscillators = [];
        musicState.playing = false;
        $section.find('.sound-lab').removeClass('playing');
        $section.find('.music-toggle').text('Music Play');
    };
    $section.find('.music-toggle').on('click', function () {
        if (musicState.playing) {
            stopMusic();
        } else {
            startMusic();
        }
    });
    $section.find('.music-mode').on('click', function () {
        musicState.mode = (musicState.mode + 1) % modeFreqs.length;
        applyMusicMode();
        if (!musicState.playing) {
            setFormState('Sound mode updated.', 'ok');
        }
    });
    $section.find('.music-volume').on('input', function () {
        applyMusicVolume($(this).val());
    });

    $section.find('.about-switch').on('click', function () {
        const $btn = $(this);
        const target = ($btn.data('about') || '').toString();
        const $face = $btn.closest('.face');
        if (!target || !$face.length) return;

        $face.find('.about-switch').removeClass('active');
        $btn.addClass('active');
        $face.find('.about-panel').removeClass('active');
        $face.find(`.about-panel[data-panel="${target}"]`).addClass('active');
    });

    const copyEmail = 'hello@ubique.co.kr';
    $section.find('.copybtn').each(function () {
        const $btn = $(this);
        const email = copyEmail;

        const resetState = () => {
            $btn.removeClass('done');
        };

        $btn.on('click', function () {
            const applyDone = () => {
                $btn.addClass('done');
                setTimeout(resetState, 2000);
            };

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(email)
                    .then(applyDone)
                    .catch(() => {
                        $btn.addClass('done');
                        setTimeout(resetState, 2400);
                    });
            } else {
                $btn.addClass('done');
                setTimeout(resetState, 2400);
            }
        });
    });

    const syncHue = (value) => {
        $cube.css('--cube-accent-hue', value);
        $section.find('.hueslider').val(value);
    };
    $section.find('.hueslider').on('input', function () {
        syncHue($(this).val());
    });
    syncHue($section.find('.hueslider').first().val() || 215);

    const setFormState = (message, type) => {
        const $state = $section.find('.form-state').first();
        if (!$state.length) return;
        $state.removeClass('ok error');
        if (type) {
            $state.addClass(type);
        }
        $state.text(message || '');
    };

    $section.find('.quick-chip').on('click', function () {
        const msg = ($(this).data('message') || '').toString().trim();
        if (!msg) return;
        const $textarea = $section.find('.inquiry-form textarea[name="message"]').first();
        if (!$textarea.length) return;
        const prev = ($textarea.val() || '').toString().trim();
        $textarea.val(prev ? `${prev}\n${msg}` : msg);
        setFormState('Draft message inserted.', 'ok');
    });

    $section.find('.inquiry-form').on('submit', function (event) {
        event.preventDefault();
        const $form = $(this);
        const name = ($form.find('input[name="name"]').val() || '').toString().trim();
        const email = ($form.find('input[name="email"]').val() || '').toString().trim();
        const message = ($form.find('textarea[name="message"]').val() || '').toString().trim();
        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        if (!name || !email || !message) {
            setFormState('Please fill in all required fields.', 'error');
            return;
        }
        if (!emailValid) {
            setFormState('Please check the email format.', 'error');
            return;
        }

        setFormState(`${name}, your inquiry draft is ready. We will contact you soon.`, 'ok');
    });

    $section.find('.pulsebtn').each(function () {
        const $btn = $(this);
        const $face = $btn.closest('.face');
        if (!$face.length) return;

        $btn.on('click', function () {
            const isOn = $face.toggleClass('pulse').hasClass('pulse');
            setFormState(isOn ? 'Consult mode enabled.' : '', isOn ? 'ok' : '');
        });
    });
});

$(function () {
    const $section = $('.cont2');
    if (!$section.length) return;

    const $container = $section.find('.container').first();
    const $line = $section.find('.line').first();
    const $headline = $section.find('.headline').first();
    const $ship = $section.find('.scroll').first();
    if (!$container.length || !$headline.length || !$ship.length || !$line.length) return;

    const rawText = ($headline.text() || '').toString();
    const lines = rawText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

    const viewportWidthForCopy = window.innerWidth || 0;
    const isNarrowMobileCopy = viewportWidthForCopy <= 480;
    const splitLineForNarrowMobile = (lineText) => {
        if (!isNarrowMobileCopy) return [lineText];
        if (/^Import\s*&\s*Export$/i.test(lineText)) return ['Import &', 'Export'];
        if (/^Specialized\s+Company$/i.test(lineText)) return ['Specialized', 'Company'];

        const words = lineText.split(/\s+/).filter(Boolean);
        if (words.length >= 4) {
            const pivot = Math.ceil(words.length / 2);
            return [words.slice(0, pivot).join(' '), words.slice(pivot).join(' ')];
        }
        return [lineText];
    };
    const displayLines = lines.flatMap(splitLineForNarrowMobile);

    if (!displayLines.length) return;

    const charNodes = [];
    const fragment = document.createDocumentFragment();
    displayLines.forEach((lineText, lineIndex) => {
        const lineWrap = document.createElement('span');
        lineWrap.className = 'linechunk';

        Array.from(lineText).forEach((ch) => {
            if (ch === ' ') {
                lineWrap.appendChild(document.createTextNode(' '));
                return;
            }
            const charNode = document.createElement('span');
            charNode.className = 'char';
            charNode.textContent = ch;
            lineWrap.appendChild(charNode);
            charNodes.push(charNode);
        });

        fragment.appendChild(lineWrap);
        if (lineIndex < displayLines.length - 1) {
            fragment.appendChild(document.createTextNode('\n'));
        }
    });

    $headline.empty().append(fragment);

    if (!charNodes.length) return;

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const getProgressDistance = () => {
        const viewportHeight = window.innerHeight || 0;
        const viewportWidth = window.innerWidth || 0;
        const ratio = viewportWidth <= 480 ? 0.72 : viewportWidth <= 768 ? 0.78 : viewportWidth <= 1024 ? 0.86 : 0.94;
        return clamp(viewportHeight * ratio, 420, 980);
    };
    let targetProgress = 0;
    let smoothProgress = 0;
    let rafId = 0;
    let watchId = 0;

    const renderProgress = (progress) => {
        const shipNode = $ship.get(0);
        const viewportWidth = window.innerWidth || 0;
        const isResponsive = viewportWidth <= 1024;
        const isMobile = viewportWidth <= 768;
        let shipY = progress * 100;
        let shipOpacity = 1;

        if (isResponsive) {
            if (progress < 0.2) {
                const t = progress / 0.2;
                shipY = -18 + (38 * t);
                shipOpacity = 0.35 + (0.65 * t);
            } else if (progress < 0.94) {
                const t = (progress - 0.2) / 0.74;
                shipY = 20 + (34 * t);
                shipOpacity = 1;
            } else {
                const t = (progress - 0.94) / 0.2;
                shipY = 54 + (46 * t);
                shipOpacity = 1 - Math.pow(clamp(t, 0, 1), 2.2);
            }
        }

        const revealProgress = clamp((progress - (isMobile ? 0.1 : 0.15)) * (isMobile ? 1.55 : 1.43), 0, 1);
        const activeCount = Math.ceil(revealProgress * charNodes.length);
        $container.get(0).style.setProperty('--ship-y', shipY.toFixed(4));
        if (shipNode) {
            shipNode.style.opacity = shipOpacity.toFixed(3);
        }
        charNodes.forEach((node, index) => {
            node.classList.toggle('active', index < activeCount);
        });
    };

    const tick = () => {
        smoothProgress += (targetProgress - smoothProgress) * 0.14;
        if (Math.abs(targetProgress - smoothProgress) < 0.0001) {
            smoothProgress = targetProgress;
        }
        renderProgress(smoothProgress);
        if (smoothProgress !== targetProgress) {
            rafId = window.requestAnimationFrame(tick);
        } else {
            rafId = 0;
        }
    };

    const setProgress = (rawProgress) => {
        targetProgress = clamp(rawProgress, 0, 1);
        if (!rafId) {
            rafId = window.requestAnimationFrame(tick);
        }
    };

    const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
    if (hasGsap) {
        window.gsap.registerPlugin(window.ScrollTrigger);
        window.ScrollTrigger.create({
            trigger: $section.get(0),
            start: 'top 80%',
            end: function () {
                return `+=${Math.round(getProgressDistance())}`;
            },
            scrub: true,
            onUpdate: function (self) {
                setProgress(self.progress);
            }
        });
        setProgress(0);
        return;
    }

    const onScroll = () => {
        const section = $section.get(0);
        if (!section) return;
        const startY = window.innerHeight * 0.8;
        const distance = Math.max(1, getProgressDistance());
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
        const sectionTop = section.getBoundingClientRect().top + scrollTop;
        const startScroll = sectionTop - startY;
        const progress = clamp((scrollTop - startScroll) / distance, 0, 1);
        setProgress(progress);
    };

    onScroll();
    $(window).on('scroll resize', onScroll);
    $ship.find('img').on('load', function () {
        renderProgress(smoothProgress);
    });
});

$(function () {
    const $section = $('.cont3');
    if (!$section.length) return;

    const $cards = $section.find('.card');
    const $deck = $section.find('.deck');
    const $follow = $section.find('.follow');
    if (!$cards.length || !$deck.length || !$follow.length) return;

    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const updateTilt = (card, x, y) => {
        const rx = (0.5 - y) * 14;
        const ry = (x - 0.5) * 18;
        const dx = (x - 0.5) * 2;
        const dy = (y - 0.5) * 2;
        const push = 24;
        const px = -dx * push;
        const py = -dy * push;
        card.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
        card.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
        card.style.setProperty('--px', `${px.toFixed(1)}`);
        card.style.setProperty('--py', `${py.toFixed(1)}`);
        card.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
        card.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
    };

    if (!prefersReduced) {
        $cards.on('pointerenter', function (event) {
            const rect = this.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
            const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
            this.style.setProperty('--lift', '1.3');
            updateTilt(this, x, y);
        });

        $cards.on('pointermove', function (event) {
            const rect = this.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
            const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
            this.style.setProperty('--lift', '1.3');
            updateTilt(this, x, y);
        });

        $cards.on('pointerleave', function () {
            this.style.setProperty('--rx', '0deg');
            this.style.setProperty('--ry', '0deg');
            this.style.setProperty('--mx', '50%');
            this.style.setProperty('--my', '50%');
            this.style.setProperty('--px', '0');
            this.style.setProperty('--py', '0');
            this.style.setProperty('--lift', '0');
        });
    }

    $cards.on('pointerenter', function () {
        $follow.addClass('on');
    });

    $cards.on('pointerleave', function () {
        $follow.removeClass('on');
    });

    $deck.on('pointermove', function (event) {
        const rect = this.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        $follow.css({ left: `${x}px`, top: `${y}px` });
        if (!prefersReduced) {
            const nx = Math.min(1, Math.max(0, x / rect.width));
            const ny = Math.min(1, Math.max(0, y / rect.height));
            const dx = (nx - 0.5) * 2;
            const dy = (ny - 0.5) * 2;
            const groupPush = 18;
            const gx = -dx * groupPush;
            const gy = -dy * (groupPush * 0.6);
            this.style.setProperty('--gx', gx.toFixed(1));
            this.style.setProperty('--gy', gy.toFixed(1));
        }
    });

    $deck.on('pointerleave', function () {
        $follow.removeClass('on');
        this.style.setProperty('--gx', '0');
        this.style.setProperty('--gy', '0');
    });

    if (prefersReduced || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);
    const cards = $cards.toArray();
    const $head = $section.find('.head');

    if ($head.length) {
        gsap.set($head, { autoAlpha: 0, y: 20 });
    }
    gsap.set(cards, { autoAlpha: 0, y: 0 });
    cards.forEach((card) => {
        const side = card.getAttribute('data-side');
        gsap.set(card, {
            x: side === 'right' ? 240 : -240,
            y: side === 'right' ? -10 : 10,
            skewX: side === 'right' ? -8 : 8,
            rotationZ: side === 'right' ? 4 : -4
        });
    });

    const first = cards.slice(0, 2);
    const second = cards.slice(2, 4);

    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: $section.get(0),
            start: 'top 70%',
            toggleActions: 'play none none reverse'
        }
    });

    if ($head.length) {
        tl.to($head, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, 0);
    }
    if (first.length) {
        tl.to(first, {
            autoAlpha: 1,
            x: 0,
            y: 0,
            skewX: 0,
            rotationZ: 0,
            duration: 1.6,
            ease: 'power3.out',
            stagger: 0.18
        }, 0.12);
    }
    if (second.length) {
        tl.to(second, {
            autoAlpha: 1,
            x: 0,
            y: 0,
            skewX: 0,
            rotationZ: 0,
            duration: 1.6,
            ease: 'power3.out',
            stagger: 0.18
        }, 0.55);
    }
});

$(function () {
    const $section = $('.cont4');
    if (!$section.length) return;

    const $items = $section.find('.menu .item');
    const $shots = $section.find('.shot');
    const $name = $section.find('.name');
    if (!$items.length || !$shots.length) return;

    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const autoDelay = 2600;
    const hoverDelay = 300;
    let autoTimer = null;
    let hoverTimer = null;
    let shotHoverTimer = null;
    let currentGroup = null;

    const getGroupShots = (key) => $shots.filter(function () {
        const $shot = $(this);
        const group = $shot.data('group');
        const fallback = $shot.data('key');
        return group === key || fallback === key;
    });

    const updateName = ($shot) => {
        const title = $shot.data('name');
        if (title && $name.length) {
            $name.text(title);
        }
    };

    const stopAuto = () => {
        if (!autoTimer) return;
        clearInterval(autoTimer);
        autoTimer = null;
    };

    const startAuto = () => {
        if (prefersReduced) return;
        stopAuto();
        autoTimer = setInterval(() => {
            if (!currentGroup) return;
            const $groupShots = getGroupShots(currentGroup);
            if (!$groupShots.length) return;
            const $current = $groupShots.filter('.on');
            let index = $groupShots.index($current);
            if (index < 0) {
                index = 0;
            } else {
                index = (index + 1) % $groupShots.length;
            }
            const $next = $groupShots.eq(index);
            $groupShots.removeClass('on');
            $next.addClass('on');
            updateName($next);
        }, autoDelay);
    };

    const setGroup = (key) => {
        if (!key) return;
        const $item = $items.filter(`[data-key="${key}"]`).first();
        const $groupShots = getGroupShots(key);
        if (!$item.length || !$groupShots.length) return;

        currentGroup = key;
        $items.removeClass('on');
        $item.addClass('on');

        $shots.removeClass('show on');
        $groupShots.addClass('show');

        const $main = $groupShots.filter('[data-main="1"]').first();
        const $target = $main.length ? $main : $groupShots.first();
        $target.addClass('on');
        updateName($target);
        startAuto();
    };

    const clearHover = () => {
        if (hoverTimer) {
            clearTimeout(hoverTimer);
            hoverTimer = null;
        }
    };

    const clearShotHover = () => {
        if (shotHoverTimer) {
            clearTimeout(shotHoverTimer);
            shotHoverTimer = null;
        }
    };

    const scheduleGroup = (key) => {
        clearHover();
        hoverTimer = setTimeout(() => {
            setGroup(key);
        }, hoverDelay);
    };

    const initialKey = $items.filter('.on').data('key') || $items.first().data('key');
    setGroup(initialKey);

    $items.on('mouseenter', function () {
        scheduleGroup($(this).data('key'));
    });

    $items.on('mouseleave', function () {
        clearHover();
    });

    $items.on('focus click', function () {
        clearHover();
        setGroup($(this).data('key'));
    });

    $shots.on('mouseenter', function () {
        const $shot = $(this);
        if (!$shot.hasClass('show')) return;
        clearShotHover();
        shotHoverTimer = setTimeout(() => {
            const $shotTarget = $shot;
            currentGroup = $shotTarget.data('group') || $shotTarget.data('key');
            $shots.filter('.show').removeClass('on');
            $shotTarget.addClass('on');
            updateName($shotTarget);
            startAuto();
        }, hoverDelay);
    });

    $shots.on('mouseleave', function () {
        clearShotHover();
    });

    $shots.on('click', function () {
        const $shot = $(this);
        if (!$shot.hasClass('show')) return;
        clearShotHover();
        currentGroup = $shot.data('group') || $shot.data('key');
        $shots.filter('.show').removeClass('on');
        $shot.addClass('on');
        updateName($shot);
        startAuto();
    });
});

$(function () {
    const $section = $('.cont5');
    if (!$section.length) return;

    const $media = $section.find('.media');
    const $canvas = $section.find('.fx');
    if (!$media.length || !$canvas.length) return;

    const canvas = $canvas.get(0);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = {
        w: 0,
        h: 0,
        t: 0,
        tx: 0,
        ty: 0,
        cx: 0,
        cy: 0,
        raf: null
    };

    const resize = () => {
        const rect = $media.get(0).getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        state.w = Math.max(1, rect.width);
        state.h = Math.max(1, rect.height);
        canvas.width = Math.floor(state.w * dpr);
        canvas.height = Math.floor(state.h * dpr);
        canvas.style.width = `${state.w}px`;
        canvas.style.height = `${state.h}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawLine = (y0, amp, speed, hue) => {
        const w = state.w;
        ctx.beginPath();
        const step = 18;
        for (let x = 0; x <= w + step; x += step) {
            const n1 = Math.sin(x * 0.008 + state.t * speed + y0 * 0.02);
            const n2 = Math.sin(x * 0.018 - state.t * (speed * 1.2) + y0 * 0.03);
            const drift = state.cx * 40;
            const lift = state.cy * 30;
            const y = y0 + (n1 * amp) + (n2 * amp * 0.45) + drift + lift;
            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        const grad = ctx.createLinearGradient(0, y0 - 20, w, y0 + 20);
        grad.addColorStop(0, `hsla(${hue}, 90%, 70%, 0.15)`);
        grad.addColorStop(0.5, `hsla(${hue + 20}, 90%, 70%, 0.5)`);
        grad.addColorStop(1, `hsla(${hue + 40}, 90%, 70%, 0.15)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.stroke();
    };

    const drawMesh = () => {
        const w = state.w;
        const h = state.h;
        const drift = (state.t * 24) % 180;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        for (let i = -2; i < 7; i += 1) {
            const x0 = -h + i * 180 + drift;
            ctx.beginPath();
            ctx.moveTo(x0, h);
            ctx.lineTo(x0 + h * 0.9, 0);
            ctx.stroke();
        }
    };

    const drawDots = () => {
        const w = state.w;
        const h = state.h;
        const count = 18;
        for (let i = 0; i < count; i += 1) {
            const seed = i * 0.9;
            const t = state.t * 0.6 + seed;
            const radius = (0.18 + (i % 6) * 0.05) * Math.min(w, h);
            const x = w * 0.5 + Math.cos(t * 0.9 + seed) * radius * 0.45 + Math.sin(state.t * 0.4 + seed) * w * 0.05;
            const y = h * 0.5 + Math.sin(t * 0.8 + seed * 1.3) * radius * 0.32;
            const size = 1.5 + (i % 4) * 0.6;
            ctx.fillStyle = `rgba(180, 210, 255, ${0.12 + (i % 3) * 0.05})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    };

    const render = () => {
        ctx.clearRect(0, 0, state.w, state.h);
        ctx.fillStyle = '#0c0f12';
        ctx.fillRect(0, 0, state.w, state.h);

        state.cx += (state.tx - state.cx) * 0.06;
        state.cy += (state.ty - state.cy) * 0.06;

        drawMesh();

        const lines = 9;
        const gap = state.h / (lines + 1);
        for (let i = 0; i < lines; i += 1) {
            const y0 = gap * (i + 1);
            const amp = state.h * (0.035 + (i / lines) * 0.04);
            const speed = 0.7 + i * 0.08;
            const hue = 190 + i * 10;
            drawLine(y0, amp, speed, hue);
        }

        drawDots();

        const glow = ctx.createRadialGradient(state.w * 0.2, state.h * 0.2, 0, state.w * 0.2, state.h * 0.2, state.w * 0.8);
        glow.addColorStop(0, 'rgba(120, 170, 255, 0.18)');
        glow.addColorStop(1, 'rgba(12, 15, 18, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, state.w, state.h);

        state.t += 0.012;
        state.raf = requestAnimationFrame(render);
    };

    const stop = () => {
        if (state.raf) {
            cancelAnimationFrame(state.raf);
            state.raf = null;
        }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe($media.get(0));

    if (prefersReduced) {
        render();
        stop();
    } else {
        render();
    }

    $media.on('pointermove', function (event) {
        const rect = this.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        state.tx = (event.clientX - rect.left) / rect.width - 0.5;
        state.ty = (event.clientY - rect.top) / rect.height - 0.5;
    });

    $media.on('pointerleave', function () {
        state.tx = 0;
        state.ty = 0;
    });
});

/* section6 */
$(function () {
    const $section = $('.cont6').first();
    if (!$section.length) return;

    const $left = $section.find('.left').first();
    const $overlay = $left.get(0);
    const $items = $section.find('.right .item');
    if (!$left.length || !$overlay || !$items.length) return;

    const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
    const isReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!hasGsap || isReduce) {
        $left.css('--overlayY', '0%');
        $items.css({ opacity: 1, transform: 'none' });
        return;
    }

    const playedKey = 'cont6Played';
    const played = !!$section.data(playedKey);

    if (!played) {
        window.gsap.set($left.get(0), { '--overlayY': '102%' });
        window.gsap.set($items.get(), {
            y: 42,
            scale: 0.95,
            autoAlpha: 0,
            transformOrigin: '50% 100%'
        });
    }

    window.ScrollTrigger.create({
        trigger: $section.get(0),
        start: 'top 72%',
        once: true,
        onEnter: function () {
            if ($section.data(playedKey)) return;
            $section.data(playedKey, 1);

            const tl = window.gsap.timeline();

            tl.to($left.get(0), {
                duration: 0.95,
                '--overlayY': '0%',
                ease: 'power3.out'
            }, 0);

            tl.to($items.get(), {
                y: 0,
                scale: 1,
                autoAlpha: 1,
                duration: 0.82,
                ease: 'back.out(1.7)',
                stagger: 0.14
            }, '>-0.02');
        }
    });
});
