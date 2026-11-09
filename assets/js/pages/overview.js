/**
 * Overview Page
 */
(function () {
    'use strict';

    function initOverviewVisual() {
        const section = document.querySelector('.cont1');
        if (!section) return;

        const visual = section.querySelector('.visual');
        const image = section.querySelector('.image');
        if (!visual || !image) return;

        const images = image.querySelectorAll('img');
        if (images.length < 2) return;

        const back = images[0];
        const front = images[1];

        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

        gsap.set(back, { opacity: 1, zIndex: 1 });
        gsap.set(front, {
            opacity: 1,
            zIndex: 2
        });
    }

    function initOverviewCards() {
        const section = document.querySelector('.cont2');
        if (!section) return;
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

        const cards = {
            card1: section.querySelector('.card1'),
            card2: section.querySelector('.card2'),
            card3: section.querySelector('.card3'),
            card4: section.querySelector('.card4'),
            card5: section.querySelector('.card5')
        };

        if (!cards.card1 || !cards.card2 || !cards.card3 || !cards.card4 || !cards.card5) return;

        gsap.set(cards.card1, {
            opacity: 0,
            x: -84,
            z: -160,
            skewY: 6,
            rotationY: -92,
            transformOrigin: 'left center',
            transformPerspective: 1200,
            force3D: true
        });
        gsap.set(cards.card2, {
            opacity: 0,
            y: -120,
            z: -180,
            rotationX: -88,
            transformOrigin: 'center top',
            transformPerspective: 1200,
            force3D: true
        });
        gsap.set(cards.card3, {
            opacity: 0,
            y: 105,
            z: -130,
            rotationX: 64,
            transformOrigin: 'center bottom',
            transformPerspective: 1200,
            force3D: true
        });
        gsap.set(cards.card4, {
            opacity: 0,
            x: -86,
            y: 36,
            z: -110,
            rotationY: 58,
            transformOrigin: 'left center',
            transformPerspective: 1200,
            force3D: true
        });
        gsap.set(cards.card5, {
            opacity: 0,
            x: 86,
            y: 36,
            z: -110,
            rotationY: -58,
            transformOrigin: 'right center',
            transformPerspective: 1200,
            force3D: true
        });

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: section,
                start: 'top 82%',
                toggleActions: 'play none none reverse'
            }
        });

        tl.to(cards.card1, {
            opacity: 1,
            x: 0,
            z: 0,
            skewY: 0,
            rotationY: 0,
            duration: 1.35,
            ease: 'power3.out'
        })
            .to(cards.card2, {
                opacity: 1,
                y: 0,
                z: 0,
                rotationX: 0,
                duration: 1.28,
                ease: 'power3.out'
            }, '-=1.12')
            .to(cards.card3, {
                opacity: 1,
                y: 0,
                z: 0,
                rotationX: 0,
                duration: 1.22,
                ease: 'power3.out'
            }, '-=1.08')
            .to(cards.card4, {
                opacity: 1,
                x: 0,
                y: 0,
                z: 0,
                rotationY: 0,
                duration: 1.16,
                ease: 'power3.out'
            }, '-=1.02')
            .to(cards.card5, {
                opacity: 1,
                x: 0,
                y: 0,
                z: 0,
                rotationY: 0,
                duration: 1.16,
                ease: 'power3.out'
            }, '-=1.04');

        const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        if (!canHover) return;

        const rows = section.querySelectorAll('.row');

        function baseGrow(card) {
            if (card.classList.contains('card4')) return 62;
            if (card.classList.contains('card5')) return 36;
            return 1;
        }

        function resetRow(cardsInRow) {
            cardsInRow.forEach((card) => {
                gsap.to(card, {
                    flexGrow: baseGrow(card),
                    duration: 0.7,
                    ease: 'power1.inOut'
                });
            });
        }

        rows.forEach((row) => {
            const rowCards = Array.from(row.querySelectorAll('.card'));
            if (rowCards.length < 2) return;

            rowCards.forEach((card) => {
                card.addEventListener('mouseenter', () => {
                    if (window.innerWidth <= 1280) return;
                    const isMixed = rowCards.some((item) => item.classList.contains('card4'));

                    rowCards.forEach((item) => {
                        let grow;
                        if (isMixed) {
                            if (card.classList.contains('card4')) {
                                grow = item.classList.contains('card4') ? 74 : 24;
                            } else {
                                grow = item.classList.contains('card5') ? 48 : 50;
                            }
                        } else {
                            grow = item === card ? 1.35 : 0.65;
                        }

                        gsap.to(item, {
                            flexGrow: grow,
                            duration: 0.7,
                            ease: 'power1.inOut'
                        });
                    });
                });
            });

            row.addEventListener('mouseleave', () => {
                if (window.innerWidth <= 1280) return;
                resetRow(rowCards);
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initOverviewVisual();
            initOverviewCards();
        });
    } else {
        initOverviewVisual();
        initOverviewCards();
    }
})();
