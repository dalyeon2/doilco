/**
 * Common
 * - Loads header/footer/subtop/cta components
 * - Smooth wheel scroll helper
 * - Header show/hide on scroll
 * - Scroll-to-top button
 */

// Keep page restoration consistent
window.scrollTo(0, 0);
window.addEventListener('pageshow', (e) => {
    if (e.persisted) requestAnimationFrame(() => window.scrollTo(0, 0));
});

/* ===== Global config ===== */
window.__snapOff = window.__snapOff || false;
window.__snapSetOff = window.__snapSetOff || function (v) { window.__snapOff = !!v; };
window.headerHideEnabled = true;
window.SancSmoothScrollConfig = window.SancSmoothScrollConfig || {};
if (typeof window.SancSmoothScrollConfig.lerp !== 'number') {
    window.SancSmoothScrollConfig.lerp = 0.03;
}
if (typeof window.SancSmoothScrollConfig.wheelMultiplier !== 'number') {
    window.SancSmoothScrollConfig.wheelMultiplier = 0.06;
}
if (typeof window.SancSmoothScrollConfig.mode !== 'string') {
    window.SancSmoothScrollConfig.mode = 'inertia';
}
if (typeof window.SancSmoothScrollConfig.friction !== 'number') {
    window.SancSmoothScrollConfig.friction = 0.94;
}
if (typeof window.SancSmoothScrollConfig.maxVelocity !== 'number') {
    window.SancSmoothScrollConfig.maxVelocity = 80;
}
if (typeof window.SancSmoothScrollConfig.respectReducedMotion !== 'boolean') {
    window.SancSmoothScrollConfig.respectReducedMotion = false;
}
if (!window.SancSmoothScrollConfig.scroller) {
    window.SancSmoothScrollConfig.scroller = '#main';
}

/* ===== Script loader ===== */
const COMMON_SCRIPT_URL = (function () {
    const script = document.currentScript || document.querySelector('script[src*="assets/js/common.js"]');
    return script && script.src ? script.src : '';
})();

function resolveCommonAssetPath(relativePath) {
    if (!COMMON_SCRIPT_URL) return relativePath;
    try {
        return new URL(relativePath, COMMON_SCRIPT_URL).href;
    } catch (e) {
        return relativePath;
    }
}

const __commonScriptCache = new Map();
function loadCommonScriptOnce(src) {
    if (!src) return Promise.resolve();
    if (__commonScriptCache.has(src)) return __commonScriptCache.get(src);
    const promise = new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => resolve();
        document.head.appendChild(script);
    });
    __commonScriptCache.set(src, promise);
    return promise;
}

const __commonStyleCache = new Set();
function loadCommonStyleOnce(href) {
    if (!href) return;
    if (__commonStyleCache.has(href)) return;
    if (document.querySelector(`link[href="${href}"]`)) {
        __commonStyleCache.add(href);
        return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
    __commonStyleCache.add(href);
}

function ensureFontAwesome() {
    loadCommonStyleOnce('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css');
}

async function ensureGsapCssPlugin() {
    if (!window.gsap) return;
    if (window.gsap.plugins && window.gsap.plugins.css) return;
    await loadCommonScriptOnce('https://unpkg.com/gsap@3.12.2/dist/gsap.min.js');
    if (window.ScrollTrigger) window.gsap.registerPlugin(window.ScrollTrigger);
}

/* ===== Components loader ===== */
function getComponentBasePath() {
    const pagePath = window.location.pathname.replace(/\/index\.html?$/, '/');

    if (pagePath.includes('/en/pages/')) return '../components';
    if (pagePath.includes('/kr/pages/')) return '../../components';
    if (pagePath.includes('/en/')) return 'components';
    if (pagePath.includes('/kr/')) return '../components';

    return 'components';
}

function getSiteRootPath() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const repoIndex = parts.lastIndexOf('doilco');
    if (repoIndex >= 0) {
        return '/' + parts.slice(0, repoIndex + 1).join('/');
    }
    return '';
}

function buildRelativePath(fromPath, toPath) {
    const fromParts = fromPath.split('/').filter(Boolean);
    const toParts = toPath.split('/').filter(Boolean);

    let index = 0;
    while (index < fromParts.length && index < toParts.length && fromParts[index] === toParts[index]) {
        index += 1;
    }

    const up = '../'.repeat(Math.max(0, fromParts.length - index - 1));
    const down = toParts.slice(index).join('/');
    const relative = `${up}${down}`.replace(/\/+/g, '/');
    return relative || './';
}

function normalizeSitePathValue(value) {
    if (!value || typeof value !== 'string') return value;
    const trimmed = value.trim().replace(/\\/g, '/');
    if (!trimmed || /^(https?:|mailto:|tel:|#|javascript:|data:)/i.test(trimmed)) return trimmed;

    const currentPath = (window.location.pathname || '').replace(/\\/g, '/');
    const siteRoot = getSiteRootPath();
    const normalizeToSitePath = (raw) => {
        const cleaned = raw.replace(/^(?:\.\/)+/, '').replace(/^(?:\.\.\/)+/, '');
        const withoutLeadingSlash = cleaned.replace(/^\/+/, '');
        return `${siteRoot || ''}/${withoutLeadingSlash}`;
    };

    if (trimmed.startsWith('/')) {
        const targetPath = `${siteRoot || ''}${trimmed}`;
        return buildRelativePath(currentPath, targetPath);
    }

    if ((trimmed.includes('/kr/') || trimmed.includes('/en/')) && /^(?:\.\.?\/)+/.test(trimmed)) {
        const targetPath = normalizeToSitePath(trimmed);
        return buildRelativePath(currentPath, targetPath);
    }

    if (trimmed.includes('/kr/') || trimmed.includes('/en/')) {
        const targetPath = normalizeToSitePath(trimmed);
        return buildRelativePath(currentPath, targetPath);
    }

    return trimmed;
}

function normalizeInjectedSiteUrls($container) {
    $container.find('a[href], img[src], source[src]').each(function () {
        const $el = $(this);
        const attr = this.tagName === 'IMG' || this.tagName === 'SOURCE' ? 'src' : 'href';
        const value = $el.attr(attr);
        if (!value) return;

        const normalized = normalizeSitePathValue(value);
        if (normalized !== value) $el.attr(attr, normalized);
    });
}

function normalizeDocumentLinks() {
    $('a[href], img[src], source[src]').each(function () {
        const $el = $(this);
        const attr = this.tagName === 'IMG' || this.tagName === 'SOURCE' ? 'src' : 'href';
        const value = $el.attr(attr);
        if (!value) return;

        const normalized = normalizeSitePathValue(value);
        if (normalized !== value) $el.attr(attr, normalized);
    });
}

function normalizeLogoPaths() {
    const currentPath = (window.location.pathname || '').replace(/\\/g, '/');
    const isMainPage = /\/(kr|en)\/?$/i.test(currentPath) || /\/(kr|en)\/index\.html?$/i.test(currentPath);
    const logoPath = isMainPage ? '../assets/img/common/logo.png' : '../../assets/img/common/logo.png';
    const footerLogoPath = isMainPage ? '../assets/img/common/logo-white.png' : '../../assets/img/common/logo-white.png';

    $('#header-container .logo img').attr('src', logoPath);
    $('#footer-container .logo img').attr('src', footerLogoPath);

    const langMatch = currentPath.match(/\/(en|kr)(?=\/|$)/i);
    const lang = (langMatch && langMatch[1].toLowerCase()) || 'kr';
    const siteRoot = getSiteRootPath();
    const homeTarget = `${siteRoot || ''}/${lang}/index.html`;
    const homeHref = buildRelativePath(currentPath, homeTarget);
    $('#header-container .logo, #footer-container .logo').attr('href', homeHref);
}

function resolvePageHref(pageKey) {
    const currentPath = (window.location.pathname || '').replace(/\\/g, '/');
    const pageKeyNormalized = (pageKey || '').trim();
    if (!pageKeyNormalized) return '#';

    const langMatch = currentPath.match(/\/(en|kr)(?=\/|$)/i);
    const lang = (langMatch && langMatch[1].toLowerCase()) || 'kr';
    const siteRoot = getSiteRootPath();
    const cleanKey = pageKeyNormalized.replace(/^\.\/?/, '').replace(/^\/+/, '');
    const safeKey = cleanKey.toLowerCase().endsWith('.html') ? cleanKey : `${cleanKey}.html`;

    const target = /index\.html?$/i.test(safeKey)
        ? `${siteRoot || ''}/${lang}/index.html`
        : `${siteRoot || ''}/${lang}/pages/${safeKey}`;

    return buildRelativePath(currentPath, target);
}

function applyRuntimePageLinks() {
    const $targets = $('header.header [data-page], footer [data-page], .subtop [data-page]');
    $targets.each(function () {
        const $link = $(this);
        const pageKey = $link.attr('data-page');
        if (!pageKey) return;
        $link.attr('href', resolvePageHref(pageKey));
    });
}

async function loadComponents() {
    try {
        const compBase = getComponentBasePath();

        const hasSubtop = !!$('#subtop-container').length;
        const hasCta = !!$('#cta-container').length;

        const [headerRes, footerRes, subtopRes, ctaRes] = await Promise.all([
            fetch(`${compBase}/header.html`),
            fetch(`${compBase}/footer.html`),
            hasSubtop ? fetch(`${compBase}/sub-top.html`) : Promise.resolve({ text: async () => '' }),
            hasCta ? fetch(`${compBase}/cta.html`) : Promise.resolve({ text: async () => '' })
        ]);

        const $header = $('#header-container');
        const $footer = $('#footer-container');
        $header.html(await headerRes.text());
        $footer.html(await footerRes.text());

        normalizeInjectedSiteUrls($header);
        normalizeInjectedSiteUrls($footer);

        if (hasSubtop) {
            const $subtop = $('#subtop-container');
            $subtop.html(await subtopRes.text());
            normalizeInjectedSiteUrls($subtop);
        }
        if (hasCta) {
            const $cta = $('#cta-container');
            $cta.html(await ctaRes.text());
            normalizeInjectedSiteUrls($cta);
        }

        applyRuntimePageLinks();
        normalizeLogoPaths();
        setHeaderActive();

        $(document).trigger('components:ready');
    } catch (err) {
        console.error(err);
    }
}

/* ===== Scroll engine setup ===== */
const initSmoothScroll = (function () {
    const COMMON_SCRIPT_SRC = (function () {
        const script = document.currentScript || document.querySelector('script[src*="assets/js/common.js"]');
        return script && script.src ? script.src : '';
    })();

    function resolveCommonAssetPath(relativePath) {
        if (!COMMON_SCRIPT_SRC) return relativePath;
        try {
            return new URL(relativePath, COMMON_SCRIPT_SRC).href;
        } catch (e) {
            return relativePath;
        }
    }

    const loadScriptOnce = (function () {
        const cache = new Map();
        return function loadScriptOnce(src) {
            if (!src) return Promise.resolve();
            if (cache.has(src)) return cache.get(src);

            const promise = new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = src;
                script.async = true;
                script.onload = () => resolve();
                script.onerror = () => resolve();
                document.head.appendChild(script);
            });

            cache.set(src, promise);
            return promise;
        };
    })();

    function createFallbackScrollInstance() {
        const listeners = new Set();
        const getY = () => window.scrollY || document.documentElement.scrollTop || 0;

        function emit() {
            const y = getY();
            fallback.scroll.instance.scroll.y = y;
            listeners.forEach((fn) => fn({ scroll: { y } }));
        }

        const fallback = {
            __isSmooth: false,
            scroll: { instance: { scroll: { y: getY() } } },
            on(event, fn) {
                if (event !== 'scroll' || typeof fn !== 'function') return;
                listeners.add(fn);
            },
            off(event, fn) {
                if (event !== 'scroll' || typeof fn !== 'function') return;
                listeners.delete(fn);
            },
            scrollTo(y, opts = {}) {
                const target = typeof y === 'number' ? y : 0;
                const duration = typeof opts.duration === 'number' ? Math.max(0, opts.duration) : 0.6;
                window.scrollTo({ top: target, behavior: duration === 0 ? 'auto' : 'smooth' });
                emit();
            },
            update: emit,
            stop() {
            },
            start() {
            }
        };

        window.addEventListener('scroll', emit, { passive: true });
        return fallback;
    }

    return async function initSmoothScroll() {
        const src = resolveCommonAssetPath('animation/smooth-scroll.js');
        await loadScriptOnce(src);

        if (window.SancSmoothScroll && typeof window.SancSmoothScroll.init === 'function') {
            return window.SancSmoothScroll.init();
        }

        const fallback = createFallbackScrollInstance();
        window.scrollInstance = fallback;
        return fallback;
    };
})();

/* ===== Header show/hide ===== */
function initHeader(scrollBus) {
    const $header = $('header.header').first();
    if (!$header.length) return;

    const moveScroll = 0.5;

    function getScrollRoot() {
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
            if (!scrollable) {
                root = fallback;
            }
        }

        return root || fallback;
    }

    function getScrollY() {
        const root = getScrollRoot();
        if (root) return Number(root.scrollTop || 0);
        return Number(window.scrollY || 0);
    }

    // Show header now
    function showHeader() {
        if (!$header.hasClass('hide')) return;
        $header.removeClass('hide');
    }

    // Hide header now
    function hideHeader() {
        if ($header.hasClass('hide')) return;
        $header.addClass('hide');
    }

    // Scroll direction logic
    function handleScroll(y) {
        y = Number(y || 0);
        if (!Number.isFinite(y)) y = 0;
        if ($header.hasClass('is-mobile-open')) {
            showHeader();
            lastY = y;
            return;
        }
        if (!window.headerHideEnabled) {
            showHeader();
            lastY = y;
            return;
        }

        if (y <= 5) {
            showHeader();
            lastY = y;
            return;
        }

        const delta = y - lastY;
        if (delta > moveScroll) {
            hideHeader();
        } else if (delta < -moveScroll) {
            showHeader();
        }

        lastY = y;
    }

    let lastY = getScrollY();
    handleScroll(lastY);

    if (scrollBus && typeof scrollBus.on === 'function') {
        scrollBus.on('scroll', ({ scroll }) => {
            const y = Number(scroll?.y);
            if (!Number.isFinite(y)) {
                handleScroll(getScrollY());
                return;
            }
            handleScroll(y);
        });
    }

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            ticking = false;
            handleScroll(getScrollY());
        });
    }, { passive: true });

    window.addEventListener('resize', () => {
        handleScroll(getScrollY());
    }, { passive: true });
    window.addEventListener('load', () => {
        handleScroll(getScrollY());
    }, { once: true });

    const watchScroll = () => {
        const y = getScrollY();
        if (y !== lastY) {
            handleScroll(y);
        }
        requestAnimationFrame(watchScroll);
    };
    requestAnimationFrame(watchScroll);
}

/* ===== Header Mobile Menu ===== */
function initHeaderMobileMenu() {
    const $header = $('header.header').first();
    if (!$header.length) return;

    const $toggle = $header.find('.menu-toggle').first();
    const $nav = $header.find('.nav').first();
    if (!$toggle.length || !$nav.length) return;

    const mobileMq = window.matchMedia('(max-width: 1024px)');

    const closeMenu = () => {
        $header.removeClass('is-mobile-open');
        $toggle.attr('aria-expanded', 'false');
        $('body').removeClass('mobile-nav-open');
        window.headerHideEnabled = true;
    };

    const openMenu = () => {
        $header.addClass('is-mobile-open').removeClass('hide');
        $toggle.attr('aria-expanded', 'true');
        $('body').addClass('mobile-nav-open');
        window.headerHideEnabled = false;
    };

    const toggleMenu = () => {
        if ($header.hasClass('is-mobile-open')) {
            closeMenu();
        } else {
            openMenu();
        }
    };

    const syncByViewport = () => {
        if (!mobileMq.matches) {
            closeMenu();
            $toggle.attr('aria-hidden', 'true').attr('tabindex', '-1');
            return;
        }
        $toggle.removeAttr('aria-hidden').removeAttr('tabindex');
    };

    $toggle.off('.mnav').on('click.mnav', function (e) {
        e.preventDefault();
        toggleMenu();
    });

    $nav.find('.menu, .lnb .link').off('.mnavclose').on('click.mnavclose', function () {
        if (!mobileMq.matches) return;
        closeMenu();
    });

    $(document).off('keydown.mnav').on('keydown.mnav', function (e) {
        if (e.key === 'Escape') {
            closeMenu();
        }
    });

    $(document).off('click.mnavoutside').on('click.mnavoutside', function (e) {
        if (!mobileMq.matches) return;
        if (!$header.hasClass('is-mobile-open')) return;

        const target = e.target;
        const clickedToggle = !!$(target).closest('.menu-toggle').length;
        const clickedNav = !!$(target).closest('.nav').length;

        if (!clickedToggle && !clickedNav) {
            closeMenu();
        }
    });

    $(window).off('resize.mnav').on('resize.mnav', function () {
        syncByViewport();
    });

    syncByViewport();
}

/* ===== Header Active ===== */
function setHeaderActive() {
    const rawCat = document.body.dataset.category || '';
    if (!rawCat) return;

    const want = rawCat.trim().toUpperCase();
    const $hdr = $('header.header').first();
    if (!$hdr.length) return;

    const $items = $hdr.find('.mainnav .menu, .nav .menu');
    $items.removeClass('active').removeAttr('aria-current');
    $items.find('a').removeAttr('aria-current');

    $items.each(function () {
        const $item = $(this);
        const $a = $item.is('a') ? $item : $item.find('a').first();
        if (!$a.length) return;
        const label = ($a.text() || '').trim().toUpperCase();
        const menuKey = (($item.data('menu') || $a.data('menu') || '')
            .toString()
            .trim()
            .toUpperCase());

        if ((menuKey && menuKey === want) || label === want) {
            $item.addClass('active');
            $a.attr('aria-current', 'page');
        }
    });
}

/* ===== Sub Top ===== */
function initSubTop() {
    const $subtop = $('.subtop').first();
    if (!$subtop.length) return;

    const dataset = document.body.dataset || {};
    const group = (dataset.subtopGroup || '').trim();
    const eyebrow = (dataset.subtopEyebrow || '').trim();
    const title = (dataset.subtopTitle || '').trim();
    const desc = (dataset.subtopDesc || '').trim();

    const $eyebrow = $subtop.find('[data-subtop-eyebrow]').first();
    const $title = $subtop.find('[data-subtop-title]').first();
    const $desc = $subtop.find('[data-subtop-desc]').first();
    const $tabs = $subtop.find('[data-subtop-tabs]').first();

    if ($eyebrow.length) $eyebrow.text(eyebrow);
    if ($title.length) $title.text(title);
    if ($desc.length) $desc.text(desc);

    if ($tabs.length && group) {
        const safeGroup = window.CSS && typeof window.CSS.escape === 'function'
            ? window.CSS.escape(group)
            : group.replace(/[^a-zA-Z0-9_-]/g, '');
        const template = document.querySelector(`template[data-subtop-group="${safeGroup}"]`);
        if (template) {
            $tabs.html(template.innerHTML);
        }
    }

    if (!$tabs.length) return;

    const currentPath = (window.location.pathname || '').replace(/\/+$/, '').toLowerCase();
    $tabs.find('.tab').each(function () {
        const $tab = $(this);
        const href = $tab.attr('href');
        if (!href) return;
        let tabPath = href;
        try {
            tabPath = new URL(href, window.location.origin).pathname;
        } catch (e) {
            tabPath = href;
        }
        tabPath = (tabPath || '').replace(/\/+$/, '').toLowerCase();
        if (tabPath === currentPath) {
            $tab.addClass('is-active').attr('aria-current', 'page');
        }
    });
}

/* ===== Header LNB ===== */
function initHeaderLnb() {
    const $nav = $('header.header .nav').first();
    if (!$nav.length) return;

    const $items = $nav.find('.group');
    if (!$items.length) return;

    let closeTimer = null;

    const clearCloseTimer = () => {
        if (!closeTimer) return;
        clearTimeout(closeTimer);
        closeTimer = null;
    };

    const closeAll = () => {
        $items.removeClass('is-open');
        $items.each(function () {
            const $item = $(this);
            $item.children('.menu').attr('aria-expanded', 'false');
            $item.children('.lnb').attr('aria-hidden', 'true');
        });
    };

    const openItem = ($target) => {
        if (!$target || !$target.length) return;
        clearCloseTimer();

        $items.not($target).removeClass('is-open').each(function () {
            const $item = $(this);
            $item.children('.menu').attr('aria-expanded', 'false');
            $item.children('.lnb').attr('aria-hidden', 'true');
        });

        $target.addClass('is-open');
        $target.children('.menu').attr('aria-expanded', 'true');
        $target.children('.lnb').attr('aria-hidden', 'false');
    };

    const scheduleClose = () => {
        clearCloseTimer();
        closeTimer = setTimeout(() => {
            closeAll();
        }, 140);
    };

    $items.each(function () {
        const $item = $(this);
        const $menu = $item.children('.menu').first();
        const $lnb = $item.children('.lnb').first();

        $menu.attr('aria-haspopup', 'true').attr('aria-expanded', 'false');
        $lnb.attr('aria-hidden', 'true');
    });

    $items.off('.lnb')
        .on('mouseenter.lnb', function () {
            openItem($(this));
        })
        .on('mouseleave.lnb', function () {
            scheduleClose();
        })
        .on('focusin.lnb', function () {
            openItem($(this));
        })
        .on('focusout.lnb', function () {
            const item = this;
            requestAnimationFrame(() => {
                if (!item.contains(document.activeElement)) {
                    scheduleClose();
                }
            });
        });

    $nav.off('mouseenter.lnb').on('mouseenter.lnb', function () {
        clearCloseTimer();
    });
    $nav.off('mouseleave.lnb').on('mouseleave.lnb', function () {
        scheduleClose();
    });

    $items.find('.lnb .link').off('mouseenter.lnb').on('mouseenter.lnb', function () {
        const $group = $(this).closest('.group');
        $group.find('.lnb .link').removeClass('active');
        $(this).addClass('active');
    });

    $(document).off('keydown.lnb').on('keydown.lnb', function (e) {
        if (e.key === 'Escape') closeAll();
    });
}

/* ===== Language switch ===== */
function initLanguageSwitchLinks() {
    const currentPath = (window.location.pathname || '').replace(/\\/g, '/');
    const langMatch = currentPath.match(/(?:^|\/)(en|kr)(?=\/|$)/i);
    if (!langMatch) return;

    const sourceLang = (langMatch[1] || 'kr').toLowerCase();
    const targetLang = sourceLang === 'kr' ? 'en' : 'kr';

    const getLanguagePageUrl = (lang, pagePath = currentPath) => {
        const segments = pagePath.split('/').filter(Boolean);
        const langIndex = segments.findIndex((segment) => /^(en|kr)$/i.test(segment));
        const nextSegments = [...segments];

        if (langIndex >= 0) {
            nextSegments[langIndex] = lang;
        } else {
            nextSegments.unshift(lang);
        }

        return new URL('/' + nextSegments.join('/'), window.location.href).href;
    };

    const $links = $('header.header .lang a.item');
    if (!$links.length) return;

    const $activeLink = sourceLang === 'kr'
        ? $links.filter(function () {
            return ($(this).text() || '').trim().toUpperCase() === 'KOR';
        })
        : $links.filter(function () {
            return ($(this).text() || '').trim().toUpperCase() === 'ENG';
        });

    $links.removeClass('active').removeAttr('aria-current');
    $activeLink.addClass('active').attr('aria-current', 'page');

    $links.each(function () {
        const $link = $(this);
        const text = ($link.text() || '').trim().toUpperCase();
        const targetUrl = getLanguagePageUrl(targetLang);

        if (text === 'KOR') {
            $link.attr('href', targetLang === 'kr' ? targetUrl : getLanguagePageUrl('kr'));
        }
        if (text === 'ENG') {
            $link.attr('href', targetLang === 'en' ? targetUrl : getLanguagePageUrl('en'));
        }
    });
}

/* ===== Scroll-to-top button ===== */
function initScrollTop(scrollBus) {
    const $btn = $("#scrollTopBtn");
    if (!$btn.length) return;

    const scrollTopDuration = 1.0;
    const scrollTopEase = (t) => (
        t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2
    );
    const durationToMs = (duration) => {
        if (typeof duration !== 'number' || !isFinite(duration) || duration <= 0) return 0;
        return duration < 10 ? duration * 1000 : duration;
    };

    // Button dock settings
    const btnEl = $btn.get(0);
    const dockGap = 24;
    const dockDisableMql = window.matchMedia ? window.matchMedia('(max-width: 768px)') : null;
    let scrollRootOverride = null;

    const parsePx = (value) => {
        const num = parseFloat(value);
        return Number.isFinite(num) ? num : 0;
    };

    const getBaseInset = () => {
        const style = window.getComputedStyle(btnEl);
        const inset = style.getPropertyValue('inset-block-end') || style.insetBlockEnd || '';
        const bottom = style.getPropertyValue('bottom') || style.bottom || '';
        return parsePx(inset) || parsePx(bottom);
    };

    // Footer overlap docking
    const updateDock = () => {
        const footerEl = document.querySelector('.footer, .sitefooter');
        if (dockDisableMql && dockDisableMql.matches) {
            btnEl?.style.setProperty('--scroll-top-dock', '0px');
            return;
        }
        if (!footerEl || !btnEl) {
            btnEl?.style.setProperty('--scroll-top-dock', '0px');
            return;
        }
        if (!$btn.hasClass('show')) {
            btnEl.style.setProperty('--scroll-top-dock', '0px');
            return;
        }
        const baseInset = getBaseInset();
        const footerRect = footerEl.getBoundingClientRect();
        const viewportH = window.innerHeight || document.documentElement.clientHeight || 0;
        const overlap = Math.max(0, viewportH - baseInset - footerRect.top + dockGap);
        btnEl.style.setProperty('--scroll-top-dock', `${overlap}px`);
    };

    // Active scroll position
    const getScrollY = () => {
        const root = scrollRootOverride
            || document.scrollingElement
            || document.documentElement
            || document.body;
        const nativeY = Math.max(root.scrollTop || 0, window.scrollY || 0);
        const smoothY = (scrollBus && scrollBus.scroll?.instance?.scroll)
            ? (scrollBus.scroll.instance.scroll.y || 0)
            : 0;
        return Math.abs(smoothY) > Math.abs(nativeY) ? smoothY : nativeY;
    };

    // Main scroll element
    const isMainScrollTarget = (el) => {
        if (!el || el === document || el === window) return false;
        const h = el.clientHeight || 0;
        const scrollable = (el.scrollHeight || 0) > h + 1;
        if (!scrollable) return false;
        return h >= window.innerHeight * 0.6;
    };

    // Scroll root lookup
    const findMainScrollRoot = (start) => {
        let node = start;
        while (node && node !== document.body && node !== document.documentElement) {
            if (isMainScrollTarget(node)) return node;
            node = node.parentElement;
        }
        if (isMainScrollTarget(document.scrollingElement)) return document.scrollingElement;
        if (isMainScrollTarget(document.documentElement)) return document.documentElement;
        if (isMainScrollTarget(document.body)) return document.body;
        return null;
    };

    // Toggle button visibility
    const toggle = (y) => {
        $btn.toggleClass("show", y >= 50);
        updateDock();
    };
    toggle(getScrollY());

    if (scrollBus && typeof scrollBus.on === 'function') {
        scrollBus.on('scroll', ({ scroll }) => toggle(scroll?.y || 0));
    }
    window.addEventListener('scroll', () => toggle(getScrollY()), { passive: true });
    window.addEventListener('wheel', () => {
        requestAnimationFrame(() => toggle(getScrollY()));
    }, { passive: true });
    document.addEventListener('scroll', (e) => {
        const root = findMainScrollRoot(e.target);
        if (!root) return;
        if (scrollRootOverride !== root) scrollRootOverride = root;
        toggle(root.scrollTop || 0);
    }, true);
    window.addEventListener('resize', updateDock, { passive: true });
    window.addEventListener('load', updateDock, { once: true });

    $btn.on("click", function (e) {
        e.preventDefault();
        window.__snapSetOff(true);
        const duration = scrollTopDuration;
        const snapReleaseMs = durationToMs(duration) + 50;
        if (scrollBus && typeof scrollBus.scrollTo === 'function') {
            scrollBus.scrollTo(0, { duration, ease: scrollTopEase });
            setTimeout(() => window.__snapSetOff(false), snapReleaseMs);
        } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
            setTimeout(() => window.__snapSetOff(false), snapReleaseMs || 300);
        }
    });
}

/* ===== Boot ===== */
$(async function () {
    ensureFontAwesome();
    await loadComponents();
    initSubTop();
    await loadCommonScriptOnce(resolveCommonAssetPath('animation/reveal.js'));
    await loadCommonScriptOnce(resolveCommonAssetPath('animation/effects.js'));

    const scroller = await initSmoothScroll();
    if (scroller) {
        window.scrollInstance = scroller;
    }
    if (!window.__scrollEngineReady) {
        window.__scrollEngineReady = true;
        const engine = scroller?.__isSmooth ? 'smooth' : 'native';
        $(document).trigger('scrollengine:ready', { engine });
    }
    normalizeDocumentLinks();
    initHeader(scroller);
    initHeaderLnb();
    initHeaderMobileMenu();
    initLanguageSwitchLinks();
    initScrollTop(scroller);
    if (document.querySelector('.subtop')) {
        await loadCommonScriptOnce(resolveCommonAssetPath('sub.js'));
    }
    if (document.querySelector('.photo01, .photo02, .photo03, .photo04')) {
        await loadCommonScriptOnce(resolveCommonAssetPath('pages/sub04.js'));
    }
    if (window.location.pathname.toLowerCase().includes('sub0502')) {
        await loadCommonScriptOnce(resolveCommonAssetPath('pages/sub0502.js'));
    }
    await ensureGsapCssPlugin();
    window.Reveal?.init?.();
    window.MotionEffects?.init?.();

    if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
    }

});
