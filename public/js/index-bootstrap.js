const fragmentTargets = [
    { id: 'emoji-picker-fragment', url: '/fragments/emoji-picker.html' },
    { id: 'auth-modals-fragment', url: '/fragments/auth-modals.html' }
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
