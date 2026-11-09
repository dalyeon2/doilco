/**
 * Location Page
 */
(function () {
    'use strict';

    function initMapInteraction() {
        const map = document.querySelector('.cont1 .right');
        if (!map) return;

        map.addEventListener('click', () => {
            map.classList.add('on');
        });

        map.addEventListener('mouseleave', () => {
            map.classList.remove('on');
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                map.classList.remove('on');
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMapInteraction);
    } else {
        initMapInteraction();
    }
})();
