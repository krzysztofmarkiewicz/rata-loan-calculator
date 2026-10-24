// Theme Management (Light / Dark mode) with localStorage & prefers-color-scheme
(function () {
    const STORAGE_KEY = 'toolbox_theme';
    const html = document.documentElement;

    function getPreferredTheme() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'dark' || saved === 'light') {
            return saved;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function applyTheme(theme) {
        html.setAttribute('data-theme', theme);
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.setAttribute('aria-label', theme === 'dark' ? 'Przełącz na jasny motyw' : 'Przełącz na ciemny motyw');
            toggleBtn.setAttribute('title', theme === 'dark' ? 'Przełącz na jasny motyw' : 'Przełącz na ciemny motyw');
        }
    }

    // Initialize immediately
    const initialTheme = getPreferredTheme();
    applyTheme(initialTheme);

    window.addEventListener('DOMContentLoaded', () => {
        applyTheme(getPreferredTheme());

        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const current = html.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
                const next = current === 'dark' ? 'light' : 'dark';
                localStorage.setItem(STORAGE_KEY, next);
                applyTheme(next);
            });
        }

        // Listen for OS changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!localStorage.getItem(STORAGE_KEY)) {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    });
})();
