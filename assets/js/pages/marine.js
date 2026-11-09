/**
 * Marine Products Page
 */
(function () {
    'use strict';

    if (typeof window.__marineDebug === 'undefined') {
        window.__marineDebug = true;
    }
    console.log('[marine-snap] marine.js loaded', window.location.pathname);

    let marineInteractionsInitialized = false;
    let marineFlowSnapRetryTimer = null;
    var __snapWheelLocked = false;
    document.addEventListener('wheel', function marineSnapWheelGuard(e) {
        if (__snapWheelLocked) {
            e.preventDefault();
        }
    }, { passive: false, capture: true });

    function marineDebugLog() {
        if (window.__marineDebug === false) return;
        console.log.apply(console, ['[marine-snap]'].concat(Array.from(arguments)));
    }

    function registerGsapPlugins() {
        if (typeof gsap === 'undefined') return;

        if (typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
        }

        if (typeof ScrollToPlugin !== 'undefined') {
            gsap.registerPlugin(ScrollToPlugin);
        }
    }

    function smoothScrollToElement(target, duration) {
        if (!target) return;

        function easeInOutSine(t) {
            return 0.5 - 0.5 * Math.cos(Math.PI * t);
        }

        if (window.scrollInstance && typeof window.scrollInstance.scrollTo === 'function') {
            window.scrollInstance.scrollTo(target, {
                duration: duration,
                ease: easeInOutSine
            });
            return;
        }

        if (typeof gsap !== 'undefined' && typeof ScrollToPlugin !== 'undefined') {
            gsap.to(window, {
                duration: duration,
                scrollTo: { y: target, offsetY: 0, autoKill: true },
                ease: 'power2.out',
                overwrite: 'auto'
            });
            return;
        }

        const top = target.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({ top: top, behavior: 'smooth' });
    }

    function smoothScrollToY(y, duration) {
        const targetY = Math.max(0, y || 0);

        function easeInOutSine(t) {
            return 0.5 - 0.5 * Math.cos(Math.PI * t);
        }

        if (window.scrollInstance && typeof window.scrollInstance.scrollTo === 'function') {
            window.scrollInstance.scrollTo(targetY, {
                duration: duration,
                ease: easeInOutSine
            });
            return;
        }

        if (typeof gsap !== 'undefined' && typeof ScrollToPlugin !== 'undefined') {
            gsap.to(window, {
                duration: duration,
                scrollTo: { y: targetY, autoKill: true },
                ease: 'power2.out',
                overwrite: 'auto'
            });
            return;
        }

        window.scrollTo({ top: targetY, behavior: 'smooth' });
    }

    function getMarineScrollRoot() {
        const cfg = window.SancSmoothScrollConfig || {};
        const scroller = cfg.scroller;
        const doc = document.documentElement;
        const body = document.body;
        const fallback = document.scrollingElement || doc || body;
        let root = null;

        if (typeof scroller === 'string') {
            root = document.querySelector(scroller);
        } else if (scroller && scroller.nodeType === 1) {
            root = scroller;
        }

        if (!root) {
            if (doc && body) {
                const docScroll = (doc.scrollHeight || 0) - (doc.clientHeight || 0);
                const bodyScroll = (body.scrollHeight || 0) - (body.clientHeight || 0);
                root = bodyScroll > docScroll ? body : doc;
            } else {
                root = fallback;
            }
        }

        if (root && root !== fallback) {
            const scrollable = (root.scrollHeight || 0) > (root.clientHeight || 0) + 1;
            if (!scrollable) root = fallback;
        }

        return root || fallback;
    }

    function getPageScrollY() {
        const root = getMarineScrollRoot();
        if (root) return Number(root.scrollTop || 0);
        return Number(window.pageYOffset || window.scrollY || document.documentElement.scrollTop || 0);
    }

    function getSectionBottomSnapY(section) {
        const viewportH = window.innerHeight || document.documentElement.clientHeight || 0;
        const sectionTop = section.getBoundingClientRect().top + getPageScrollY();
        const sectionBottom = sectionTop + section.offsetHeight;
        return Math.max(0, sectionBottom - viewportH);
    }

    function getSectionTopSnapY(section) {
        const sectionTop = section.getBoundingClientRect().top + getPageScrollY();
        return Math.max(0, sectionTop);
    }

    function getVisibleViewportRatio(section, viewportH) {
        const rect = section.getBoundingClientRect();
        const visiblePx = Math.max(0, Math.min(rect.bottom, viewportH) - Math.max(rect.top, 0));
        return visiblePx / Math.max(1, viewportH);
    }

    function initMarineSectionFlowSnap() {
        var BREAKPOINT = 768;

        var DOWN_ENTER_CONT2 = 0.30;  
        var DOWN_ENTER_CONT3 = 0.10;  
        var UP_ENTER_CONT3   = 0.40;  
        var UP_ENTER_CONT2   = 0.20;  
        var EXIT_RATIO = 0.70;

        var SNAP_DURATION    = 1.4;
        var SNAP_COOLDOWN_MS = Math.round(SNAP_DURATION * 1000) + 300;

        if (window.__marineFlowSnapCleanup) {
            window.__marineFlowSnapCleanup();
            window.__marineFlowSnapCleanup = null;
        }

        __snapWheelLocked = false;

        if (window.innerWidth < BREAKPOINT) {
            marineDebugLog('skip flow snap on mobile width', window.innerWidth);
            return;
        }

        var cont2 = document.querySelector('.cont2');
        var cont3 = document.querySelector('.cont3');
        if (!cont2 || !cont3) {
            marineDebugLog('cont2/cont3 not found');
            return;
        }

        var scrollBus = window.scrollInstance;
        if (!scrollBus || typeof scrollBus.scrollTo !== 'function') {
            marineDebugLog('scroll bus not ready for flow snap');
            return;
        }

        var panels        = [cont2, cont3];
        var snapping      = false;
        var cooldownUntil = 0;
        var settlingUntil = 0;
        var snapIdx       = -1;  
        var rafId         = null;
        var lastY         = 0;
        var scrollDir     = 0;   

        function currentScrollY() {
            return getPageScrollY();
        }

        function getViewRatio(panel) {
            var rect = panel.getBoundingClientRect();
            var vh   = window.innerHeight || document.documentElement.clientHeight || 1;
            var vis  = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));
            return vis / vh;
        }

        function snapTo(idx) {
            marineDebugLog('snap panel[' + idx + ']');
            snapping          = true;
            snapIdx           = idx;
            cooldownUntil     = Date.now() + SNAP_COOLDOWN_MS;
            settlingUntil     = cooldownUntil + 500;
            __snapWheelLocked = true; 
            scrollBus.scrollTo(panels[idx], { duration: SNAP_DURATION });
            setTimeout(function () {
                __snapWheelLocked = false;
                snapping = false;
                cooldownUntil = Math.max(cooldownUntil, Date.now() + 500);
                if (typeof ScrollTrigger !== 'undefined') {
                    ScrollTrigger.update();
                }
                marineDebugLog('snap done panel[' + idx + ']');
            }, Math.round(SNAP_DURATION * 1000) + 100);
        }

        function checkSnap() {
            var y  = currentScrollY();
            var dy = y - lastY;
            if (Math.abs(dy) > 0.3) scrollDir = dy > 0 ? 1 : -1;
            lastY = y;

            if (snapping) return;
            if (Date.now() < settlingUntil) return;

            var r2     = getViewRatio(cont2);
            var r3     = getViewRatio(cont3);
            var t2     = cont2.getBoundingClientRect().top; 
            var t3     = cont3.getBoundingClientRect().top;

            if (snapIdx >= 0) {
                var curRatio = snapIdx === 0 ? r2 : r3;
                if (curRatio < EXIT_RATIO) {
                    marineDebugLog('snap exit idx=' + snapIdx + ' ratio=' + curRatio.toFixed(2));
                    snapIdx = -1;
                } else {
                    return; 
                }
            }

            if (Date.now() < cooldownUntil) return;
            if (scrollDir === 0) return;

            if (scrollDir > 0) {
                if (r2 >= DOWN_ENTER_CONT2 && t2 > 1) { snapTo(0); return; }
                if (r3 >= DOWN_ENTER_CONT3 && t3 > 1) { snapTo(1); return; }
            } else {
                if (r3 >= UP_ENTER_CONT3 && t3 < -1) { snapTo(1); return; }
                if (r2 >= UP_ENTER_CONT2 && t2 < -1) { snapTo(0); return; }
            }
        }

        function onWheel() {
            if (snapping) return;
        }

        function onResize() {
            if (window.innerWidth < BREAKPOINT && window.__marineFlowSnapCleanup) {
                window.__marineFlowSnapCleanup();
                window.__marineFlowSnapCleanup = null;
            }
        }

        lastY = currentScrollY();

        (function loop() {
            rafId = requestAnimationFrame(loop);
            checkSnap();
        }());

        window.addEventListener('wheel', onWheel, { passive: true });
        window.addEventListener('resize', onResize, { passive: true });

        window.__marineFlowSnapCleanup = function () {
            __snapWheelLocked = false;
            if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
            window.removeEventListener('wheel', onWheel);
            window.removeEventListener('resize', onResize);
        };

        marineDebugLog('flow snap initialized (viewRatio RAF + wheel guard)');
    }

    function splitChars(target) {
        const text = target.textContent || '';
        target.textContent = '';

        const chars = [];
        const chunks = text.split(/(\s+)/);

        chunks.forEach((chunk) => {
            if (!chunk) return;

            if (/^\s+$/.test(chunk)) {
                if (/[\r\n]/.test(chunk)) {
                    target.appendChild(document.createElement('br'));
                    return;
                }
                target.appendChild(document.createTextNode(chunk));
                return;
            }

            const word = document.createElement('span');
            word.className = 'word';

            Array.from(chunk).forEach((ch) => {
                const span = document.createElement('span');
                span.className = 'char';
                span.textContent = ch;
                word.appendChild(span);
                chars.push(span);
            });

            target.appendChild(word);
        });

        return chars;
    }

    function initMarineTitleColor() {
        const section = document.querySelector('.cont1');
        if (!section) return;

        const gray = section.querySelector('[datachars]');
        if (!gray) return;

        const chars = splitChars(gray);
        if (!chars.length) return;
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

        gsap.set(chars, { color: 'var(--black-300)' });

        gsap.to(chars, {
            color: 'var(--black)',
            duration: 1,
            stagger: {
                each: 0.06,
                from: 'start'
            },
            ease: 'none',
            scrollTrigger: {
                trigger: section,
                start: 'top 82%',
                end: 'top 22%',
                scrub: 0.6
            }
        });
    }

    function initMarineProductCardsInteraction() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

        const sections = ['.cont2', '.cont3'];

        sections.forEach((selector) => {
            const section = document.querySelector(selector);
            if (!section) return;

            const copy = section.querySelector('.copy');
            const side = section.querySelector('.side');

            if (copy && side) {
                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: section,
                        start: 'top 75%',
                        toggleActions: 'play none none reverse'
                    }
                });

                tl.fromTo(copy,
                    { y: 64, autoAlpha: 0 },
                    { y: 0, autoAlpha: 1, duration: 0.8, ease: 'power3.out' }
                ).fromTo(side,
                    { y: 64, autoAlpha: 0 },
                    { y: 0, autoAlpha: 1, duration: 0.75, ease: 'power3.out' },
                    '>-0.1'
                );
            }

            gsap.fromTo(section,
                { '--bg-offset': '-90px' },
                {
                    '--bg-offset': '90px',
                    ease: 'none',
                    scrollTrigger: {
                        trigger: section,
                        start: 'top bottom',
                        end: 'bottom top',
                        scrub: 1
                    }
                }
            );
        });

        ScrollTrigger.refresh();
    }

    function initMarineInteractions() {
        if (marineInteractionsInitialized) return;
        marineInteractionsInitialized = true;

        registerGsapPlugins();
        initMarineTitleColor();
        initMarineProductCardsInteraction();
        initMarineSectionFlowSnap();
    }

    function scheduleMarineFlowSnapInitRetry() {
        if (marineFlowSnapRetryTimer) return;

        let retryCount = 0;
        marineFlowSnapRetryTimer = setInterval(function () {
            retryCount += 1;
            const ready = !!(window.scrollInstance && typeof window.scrollInstance.on === 'function' && typeof window.scrollInstance.scrollTo === 'function');

            if (ready) {
                marineDebugLog('retry success: scroll bus ready', { retryCount: retryCount });
                clearInterval(marineFlowSnapRetryTimer);
                marineFlowSnapRetryTimer = null;
                initMarineSectionFlowSnap();
                return;
            }

            if (retryCount === 1 || retryCount % 5 === 0) {
                marineDebugLog('retry waiting: scroll bus not ready', { retryCount: retryCount });
            }

            if (retryCount >= 30) {
                marineDebugLog('retry timeout: giving up flow snap init');
                clearInterval(marineFlowSnapRetryTimer);
                marineFlowSnapRetryTimer = null;
            }
        }, 120);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            try {
                marineDebugLog('DOMContentLoaded -> initMarineInteractions');
                initMarineInteractions();
            } catch (error) {
                console.error('[marine-snap] init error on DOMContentLoaded', error);
            }
        });
    } else {
        try {
            marineDebugLog('immediate -> initMarineInteractions');
            initMarineInteractions();
        } catch (error) {
            console.error('[marine-snap] init error on immediate run', error);
        }
    }

    document.addEventListener('scrollengine:ready', function () {
        setTimeout(function () {
            try {
                marineDebugLog('scrollengine:ready received');
                initMarineInteractions();
                initMarineSectionFlowSnap();
                scheduleMarineFlowSnapInitRetry();
                if (typeof ScrollTrigger !== 'undefined') {
                    ScrollTrigger.refresh();
                }
            } catch (error) {
                console.error('[marine-snap] init error on scrollengine:ready', error);
            }
        }, 0);
    });

    if (typeof window.jQuery !== 'undefined') {
        window.jQuery(document).on('scrollengine:ready', function (_event, payload) {
            setTimeout(function () {
                try {
                    marineDebugLog('jquery scrollengine:ready received', payload || {});
                    initMarineInteractions();
                    initMarineSectionFlowSnap();
                    scheduleMarineFlowSnapInitRetry();
                    if (typeof ScrollTrigger !== 'undefined') {
                        ScrollTrigger.refresh();
                    }
                } catch (error) {
                    console.error('[marine-snap] init error on jquery scrollengine:ready', error);
                }
            }, 0);
        });
    }

    scheduleMarineFlowSnapInitRetry();
})();
