// js/state.js
function loadState() {
    let saved = localStorage.getItem(window.DB_KEY);
    if (!saved) {
        saved = localStorage.getItem('utopia_state_v2') || localStorage.getItem('utopia_state');
        if (saved) localStorage.setItem(window.DB_KEY, saved);
    }

    if (saved) {
        const parsed = JSON.parse(saved);
        window.S = Object.assign(window.S || {}, parsed);
    }
}

function saveState() {
    localStorage.setItem(window.DB_KEY, JSON.stringify(window.S));
}
