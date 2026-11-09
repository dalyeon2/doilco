/**
 * Import Products Page
 */
(function () {
    'use strict';

    function initCont3TopLineDraw() {
        var section = document.querySelector('.cont3');
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
        document.addEventListener('DOMContentLoaded', initCont3TopLineDraw);
    } else {
        initCont3TopLineDraw();
    }
})();
