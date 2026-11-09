/**
 * Inquiry Page 
 */

(function () {
    const section = document.querySelector('.cont1');
    if (!section || !window.gsap || !window.ScrollTrigger) return;

    window.gsap.registerPlugin(window.ScrollTrigger);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cards = Array.from(section.querySelectorAll('.cards .card'));
    const callCard = section.querySelector('.call');

    if (!cards.length && !callCard) return;

    const targets = [...cards, callCard].filter(Boolean);

    if (prefersReducedMotion) {
        window.gsap.set(targets, { autoAlpha: 1, clearProps: 'transform' });
        return;
    }

    const baseSet = { autoAlpha: 0, willChange: 'transform, opacity' };
    const states = [
        { x: -26, y: 16 },
        { y: 28 },
        { x: 22, y: 12 },
        { y: 34, scale: 0.985 },
        { x: 30, y: 20, scale: 0.985 }
    ];

    targets.forEach((target, index) => {
        window.gsap.set(target, { ...baseSet, ...(states[index] || states[states.length - 1]) });
    });

    const tl = window.gsap.timeline({
        scrollTrigger: {
            trigger: section,
            start: 'top 82%',
            once: true
        }
    });

    targets.forEach((target, index) => {
        const duration = index === targets.length - 1 ? 0.82 : 0.72;
        tl.to(target, {
            autoAlpha: 1,
            x: 0,
            y: 0,
            scale: 1,
            duration,
            ease: 'power2.out',
            clearProps: 'willChange'
        }, index === 0 ? 0 : '-=0.48');
    });
})();
