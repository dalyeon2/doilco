/**
 * Export Products Page
 */
(function () {
    'use strict';

    function splitChars(target) {
        var text = target.textContent || '';
        target.textContent = '';

        var chars = [];
        Array.from(text).forEach(function (ch) {
            if (ch === ' ' || ch === '\n') {
                target.appendChild(document.createTextNode(ch));
                return;
            }

            var span = document.createElement('span');
            span.className = 'char';
            span.textContent = ch;
            target.appendChild(span);
            chars.push(span);
        });

        return chars;
    }

    function initTitleFillOnScroll() {
        var section = document.querySelector('.cont1');
        if (!section) return;

        var title = section.querySelector('[datachars]');
        if (!title) return;

        var chars = splitChars(title);
        if (!chars.length) return;

        if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') {
            chars.forEach(function (charNode) {
                charNode.style.color = 'var(--black)';
            });
            return;
        }

        window.gsap.set(chars, { color: 'var(--black-300)' });

        window.gsap.to(chars, {
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

    function initVisualParallax() {
        var image = document.querySelector('.cont1 .visual img');
        if (!image) return;

        var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') return;

        window.gsap.fromTo(image,
            { y: -90 },
            {
                y: 90,
                ease: 'none',
                scrollTrigger: {
                    trigger: '.cont1 .visual',
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 0.8
                }
            }
        );
    }

    function initCont2LineDraw() {
        var section = document.querySelector('.cont2');
        if (!section) return;

        if (!('IntersectionObserver' in window)) {
            section.classList.add('is-line-drawn');
            return;
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                section.classList.add('is-line-drawn');
                observer.disconnect();
            });
        }, {
            threshold: 0.25,
            rootMargin: '0px 0px -10% 0px'
        });

        observer.observe(section);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            initTitleFillOnScroll();
            initVisualParallax();
            initCont2LineDraw();
        });
    } else {
        initTitleFillOnScroll();
        initVisualParallax();
        initCont2LineDraw();
    }
})();
