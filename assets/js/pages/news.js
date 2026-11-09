/**
 * News Page
 */
(function () {
    const PAGE_SIZE = 16;
    const rows = Array.from(document.querySelectorAll('.cont1 .table tbody tr'));
    const pager = document.querySelector('.cont1 .pager');

    if (!rows.length || !pager) return;

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
