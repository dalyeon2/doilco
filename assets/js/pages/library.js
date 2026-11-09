/**
 * Library Page
 */
(function () {
    const tabGroups = document.querySelectorAll('.cont1 .tabs');

    tabGroups.forEach((tabs) => {
        const tabsList = Array.from(tabs.querySelectorAll('.tab'));
        if (!tabsList.length) return;

        const getActiveTab = () => tabs.querySelector('.tab.is-active') || tabsList[0];

        const moveIndicatorTo = (target) => {
            if (!target) return;
            const groupRect = tabs.getBoundingClientRect();
            const tabRect = target.getBoundingClientRect();
            tabs.style.setProperty('--indicator-x', `${tabRect.left - groupRect.left}px`);
            tabs.style.setProperty('--indicator-w', `${tabRect.width}px`);
        };

        const clearTarget = () => {
            tabsList.forEach((button) => button.classList.remove('is-target'));
        };

        const resetToActive = () => {
            tabs.classList.remove('is-hovering');
            clearTarget();
            moveIndicatorTo(getActiveTab());
        };

        const setHoverTarget = (target) => {
            tabs.classList.add('is-hovering');
            clearTarget();
            target.classList.add('is-target');
            moveIndicatorTo(target);
        };

        moveIndicatorTo(getActiveTab());

        tabsList.forEach((button) => {
            button.addEventListener('mouseenter', () => setHoverTarget(button));
            button.addEventListener('focus', () => setHoverTarget(button));
        });

        tabs.addEventListener('mouseleave', resetToActive);

        tabs.addEventListener('focusout', (event) => {
            if (!tabs.contains(event.relatedTarget)) {
                resetToActive();
            }
        });

        window.addEventListener('resize', () => {
            const target = tabs.querySelector('.tab.is-target') || getActiveTab();
            moveIndicatorTo(target);
        });
    });

    const PAGE_SIZE = 16;
    const section = document.querySelector('.cont1');
    const rows = Array.from(document.querySelectorAll('.cont1 .table tbody tr'));
    const pager = document.querySelector('.cont1 .pager');

    if (!section || !rows.length || !pager) return;

    const prevButton = pager.querySelector('.arrow.prev');
    const nextButton = pager.querySelector('.arrow.next');
    const pageButtons = Array.from(pager.querySelectorAll('.page'));

    if (!prevButton || !nextButton || !pageButtons.length) return;

    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

    pageButtons.forEach((button, index) => {
        const page = index + 1;
        button.dataset.page = String(page);
        button.textContent = String(page);
        button.style.display = page > totalPages ? 'none' : '';
    });

    const maxInteractivePage = Math.min(totalPages, pageButtons.length);
    let currentPage = 1;

    const render = () => {
        const start = (currentPage - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;

        rows.forEach((row, index) => {
            row.style.display = index >= start && index < end ? '' : 'none';
        });

        pageButtons.forEach((button) => {
            const page = Number(button.dataset.page || '1');
            const isActive = page === currentPage;
            button.classList.toggle('is-active', isActive);

            if (isActive) {
                button.setAttribute('aria-current', 'page');
            } else {
                button.removeAttribute('aria-current');
            }
        });

        prevButton.disabled = currentPage <= 1;
        nextButton.disabled = currentPage >= maxInteractivePage;
    };

    pageButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const page = Number(button.dataset.page || '1');
            if (page < 1 || page > maxInteractivePage) return;
            currentPage = page;
            render();
        });
    });

    prevButton.addEventListener('click', () => {
        if (currentPage <= 1) return;
        currentPage -= 1;
        render();
    });

    nextButton.addEventListener('click', () => {
        if (currentPage >= maxInteractivePage) return;
        currentPage += 1;
        render();
    });

    render();
})();
