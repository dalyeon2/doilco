/**
 * Sub Page 
 * — Subtop Visual Interaction
 */
(function () {
    'use strict';

    var SCROLL_VH    = 0.52;
    var BUFFER_VH    = 0.08;
    var MAX_BASE_VH  = 1.0;
    var ENTER_EARLY_PX = 120;
    var REENTER_FROM_BELOW_PX = 60;
    var REENTER_HOLD_MS = 180;
    var TRIGGER_PX   = 1;
    var ANIM_DELAY   = 240;
    var ANIM_FWD_MS  = 1200;
    var BACK_DELAY   = 240;
    var ANIM_BACK_MS = 1200;

    function eio(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
    function phase(p, s, e) { return eio(clamp((p - s) / (e - s), 0, 1)); }

    function getScrollRoot() {
        var cfg = window.SancSmoothScrollConfig || {};
        var scroller = cfg.scroller;
        var doc  = document.documentElement;
        var body = document.body;
        var fallback = document.scrollingElement || doc || body;
        var root = null;

        if (typeof scroller === 'string') {
            root = document.querySelector(scroller);
        } else if (scroller && scroller.nodeType === 1) {
            root = scroller;
        }

        if (!root) {
            if (doc && body) {
                var docScroll  = (doc.scrollHeight  || 0) - (doc.clientHeight  || 0);
                var bodyScroll = (body.scrollHeight || 0) - (body.clientHeight || 0);
                root = bodyScroll > docScroll ? body : doc;
            } else {
                root = fallback;
            }
        }

        if (root && root !== fallback) {
            var scrollable = (root.scrollHeight || 0) > (root.clientHeight || 0) + 1;
            if (!scrollable) root = fallback;
        }

        return root || fallback;
    }

    function getScrollY() {
        return getScrollRoot().scrollTop || 0;
    }

    function initSubtopVisualExpand() {
        var subtop    = document.querySelector('.subtop');
        var visual    = subtop && subtop.querySelector('.visual');
        var container = subtop && subtop.querySelector('.container');
        var head      = subtop && subtop.querySelector('.head');

        if (!subtop || !visual || !container) {
            return;
        }

        if (!container.querySelector(':scope > .subtop-scroll')) {
            var scrollIndicator = document.createElement('div');
            scrollIndicator.className = 'scroll subtop-scroll';

            var scrollLabel = document.createElement('span');
            scrollLabel.textContent = 'Scroll';

            var scrollIcon = document.createElement('i');
            scrollIcon.className = 'icon';
            scrollIcon.setAttribute('aria-hidden', 'true');

            scrollIndicator.appendChild(scrollLabel);
            scrollIndicator.appendChild(scrollIcon);
            container.appendChild(scrollIndicator);
        }

        var wrapper     = null;
        var metrics     = null;
        var wrapperTop  = 0;
        var rafId       = null;
        var isAnimating = false;
        var overlay     = null;

        var _animProg    = 0;
        var _animTarget  = 0;
        var _triggerTime = -1;
        var _prevNow     = -1;
        var _backTriggerTime = -1;
        var _zoneStartY  = -1;
        var _autoArmed   = false;
        var _wasInZone   = false;
        var _reverseLockUntil = -1;

        var _prevSy    = -1;
        var _loopCount = 0;

        function measure() {
            var cRect = container.getBoundingClientRect();
            var vRect = visual.getBoundingClientRect();
            var vh    = window.innerHeight;
            var cH    = container.offsetHeight;
            var pinBaseH = Math.min(cH, Math.round(vh * MAX_BASE_VH));
            var visualOffsetTop = vRect.top - cRect.top;
            var baseVisualH = Math.max(1, pinBaseH - visualOffsetTop);
            return {
                containerH     : cH,
                pinBaseH       : pinBaseH,
                containerLeft  : cRect.left,
                containerWidth : cRect.width,
                visualOffsetTop: visualOffsetTop,
                naturalVisualH : Math.min(visual.offsetHeight, baseVisualH),
                baseVisualH    : baseVisualH,
                scrollDist     : Math.round(vh * SCROLL_VH),
                bufferH        : Math.round(vh * BUFFER_VH)
            };
        }

        function applyBaseVisual() {
            if (!metrics) return;
            visual.style.position = '';
            visual.style.top = '';
            visual.style.bottom = '';
            visual.style.left = '';
            visual.style.width = '';
            visual.style.height = metrics.baseVisualH + 'px';
            visual.style.zIndex = '';
        }

        function setup() {
            var m = metrics;
            wrapper = document.createElement('div');
            wrapper.className = 'subtop-pin-wrapper';
            wrapper.style.height = (m.pinBaseH + m.scrollDist + m.bufferH) + 'px';
            subtop.parentNode.insertBefore(wrapper, subtop);
            wrapper.appendChild(subtop);
            subtop.style.position = 'sticky';
            subtop.style.top      = '0';
            subtop.style.height   = m.pinBaseH + 'px';
            subtop.style.overflow = 'hidden';
            container.style.position  = 'relative';
            container.style.minHeight = m.pinBaseH + 'px';
            container.style.height    = m.pinBaseH + 'px';
            wrapperTop = wrapper.getBoundingClientRect().top + getScrollY();
            applyBaseVisual();

            overlay = document.createElement('div');
            overlay.className = 'subtop-overlay';
            visual.appendChild(overlay);
        }

        function teardown() {
            stopLoop();
            if (!wrapper) return;
            wrapper.parentNode.insertBefore(subtop, wrapper);
            wrapper.parentNode.removeChild(wrapper);
            wrapper = null;
            subtop.style.position = subtop.style.top = subtop.style.height = subtop.style.overflow = '';
            container.style.position = container.style.minHeight = container.style.height = '';
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
                overlay = null;
            }
            resetVisual();
            _animProg = 0; _animTarget = 0; _triggerTime = -1;
            _backTriggerTime = -1;
            _zoneStartY = -1; _autoArmed = false;
            _wasInZone = false;
            _reverseLockUntil = -1;
        }

        function resetVisual() {
            applyBaseVisual();
            if (overlay) overlay.style.opacity = '0';
            if (head) head.classList.remove('head-over-image');
            subtop.classList.remove('subtop-expanded');
            isAnimating = false;
        }

        function update() {
            if (!wrapper || !metrics) return;

            var now = performance.now();
            var dt  = (_prevNow > 0) ? (now - _prevNow) : 0;
            _prevNow = now;

            var m  = metrics;
            var sy = getScrollY();
            var vh = window.innerHeight;
            var vw = window.innerWidth;
            var prevSy = _prevSy;
            var isScrollingUp = (prevSy >= 0) && (sy < prevSy - 0.2);
            var isScrollingDown = (prevSy >= 0) && (sy > prevSy + 0.2);

            if (sy !== _prevSy) {
                _prevSy = sy;
            }

            var zoneStart = wrapperTop - ENTER_EARLY_PX;
            var zoneEnd = wrapperTop + m.scrollDist + m.bufferH + ENTER_EARLY_PX;
            var inZone = sy >= zoneStart && sy <= zoneEnd;
            var enteringFromBelow = !_wasInZone && inZone && isScrollingUp && (prevSy > zoneEnd + REENTER_FROM_BELOW_PX);

            if (enteringFromBelow) {
                _autoArmed = true;
                _animTarget = 1;
                _triggerTime = -1;
                _zoneStartY = sy;
                _backTriggerTime = -1;
                _reverseLockUntil = now + REENTER_HOLD_MS;
            }

            if (!inZone) {
                _triggerTime = -1;
                _backTriggerTime = -1;
                _zoneStartY = -1;
                if (sy > zoneEnd) {
                    _autoArmed = true;
                    _animTarget = 1;
                } else {
                    _autoArmed = false;
                    _animTarget = 0;
                    _reverseLockUntil = -1;
                }
            } else {
                if (_autoArmed) {
                    if (isScrollingUp) {
                        if (now >= _reverseLockUntil && _backTriggerTime < 0) _backTriggerTime = now;
                    } else if (isScrollingDown) {
                        _backTriggerTime = -1;
                    }

                    if (_backTriggerTime >= 0 && (now - _backTriggerTime >= BACK_DELAY)) {
                        _autoArmed = false;
                        _animTarget = 0;
                        _triggerTime = -1;
                        _backTriggerTime = -1;
                        _zoneStartY = -1;
                        _reverseLockUntil = -1;
                    } else {
                        _animTarget = 1;
                    }
                } else {
                    if (isScrollingUp) {
                        _zoneStartY = -1;
                        _triggerTime = -1;
                    }

                    if (isScrollingDown && _zoneStartY < 0) {
                        _zoneStartY = sy;
                        _triggerTime = -1;
                    }

                    if (_zoneStartY >= 0) {
                        var moved = sy - _zoneStartY;
                        if (moved >= TRIGGER_PX) {
                            if (_triggerTime < 0) _triggerTime = now;
                            if (now - _triggerTime >= ANIM_DELAY) {
                                _autoArmed = true;
                                _animTarget = 1;
                                _backTriggerTime = -1;
                            }
                        } else {
                            _triggerTime = -1;
                        }
                    }
                }
            }

            _wasInZone = inZone;

            if (_animProg < _animTarget) {
                _animProg = Math.min(_animProg + dt / ANIM_FWD_MS, 1);
            } else if (_animProg > _animTarget) {
                _animProg = Math.max(_animProg - dt / ANIM_BACK_MS, 0);
            }

            if (_animProg <= 0 && _animTarget === 0) {
                if (isAnimating) resetVisual();
                return;
            }

            isAnimating = true;

            var animP = phase(_animProg, 0, 1.0); // easeInOutCubic

            var top  = m.visualOffsetTop * (1 - animP);
            var h    = m.naturalVisualH + (vh - m.naturalVisualH) * animP;
            var w    = m.containerWidth + (vw - m.containerWidth) * animP;
            var left = -(m.containerLeft * animP);

            visual.style.position = 'absolute';
            visual.style.top      = top + 'px';
            visual.style.bottom   = '';
            visual.style.left     = left + 'px';
            visual.style.width    = w + 'px';
            visual.style.height   = h + 'px';
            visual.style.zIndex   = '0';

            if (head) {
                if (_animProg > 0.26) {
                    head.classList.add('head-over-image');
                } else {
                    head.classList.remove('head-over-image');
                }
            }

            if (_animProg >= 0.88) {
                subtop.classList.add('subtop-expanded');
            } else if (_animProg <= 0.75) {
                subtop.classList.remove('subtop-expanded');
            }

            if (overlay) {
                overlay.style.opacity = clamp((animP - 0.24) / 0.22, 0, 1).toFixed(3);
            }
        }

        function loop() {
            _loopCount++;
            update();
            if (rafId !== null) {
                rafId = requestAnimationFrame(loop);
            }
        }

        function startLoop() {
            if (rafId !== null) return;
            rafId = requestAnimationFrame(loop);
        }

        function stopLoop() {
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        }

        function doInit() {
            metrics = measure();
            setup();
            update();
            startLoop();

            window.addEventListener('resize', function () {
                teardown();
                requestAnimationFrame(function () {
                    metrics = measure();
                    setup();
                    startLoop();
                });
            }, { passive: true });
        }

        var img = visual.querySelector('img');
        if (img && !img.complete) {
            img.addEventListener('load',  doInit, { once: true });
            img.addEventListener('error', doInit, { once: true });
        } else {
            doInit();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSubtopVisualExpand);
    } else {
        initSubtopVisualExpand();
    }

})();
