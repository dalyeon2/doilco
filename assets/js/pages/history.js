/**
 * History Page
 */
(function () {
    'use strict';

    function splitChars(target) {
        const text = target.textContent || '';
        target.textContent = '';

        const chars = [];
        const chunks = text.split(/(\s+)/);

        chunks.forEach((chunk) => {
            if (!chunk) return;

            if (/^\s+$/.test(chunk)) {
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

    function initHistoryTitleColor() {
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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHistoryTitleColor);
    } else {
        initHistoryTitleColor();
    }
})();
