const fragmentTargets = [
    { id: 'top-header-fragment', url: '/fragments/top-header.html' },
    { id: 'file-stats-card-fragment', url: '/fragments/file-stats-card.html' },
    { id: 'community-sidebars-fragment', url: '/fragments/community-sidebars.html' },
    { id: 'footer-fragment', url: '/fragments/footer.html' },
    { id: 'scroll-buttons-fragment', url: '/fragments/scroll-buttons.html' },
    // { id: 'mobile-scroll-shortcuts-fragment', url: '/fragments/mobile-scroll-shortcuts.html' },
    { id: 'emoji-picker-fragment', url: '/fragments/emoji-picker.html' },
    { id: 'auth-modals-fragment', url: '/fragments/auth-modals.html' },
    { id: 'forum-overlays-fragment', url: '/fragments/forum-overlays.html' },
    { id: 'main-modals-fragment', url: '/fragments/main-modals.html' }
];

async function loadFragments() {
    await Promise.all(fragmentTargets.map(async ({ id, url }) => {
        const container = document.getElementById(id);
        if (!container) {
            return;
        }
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load fragment: ${url}`);
        }
        container.innerHTML = await response.text();
    }));
}

async function bootstrap() {
    try {
        await loadFragments();
    } catch (error) {
        console.error(error);
    } finally {
        await import('/js/app.js');
    }
}

bootstrap();
