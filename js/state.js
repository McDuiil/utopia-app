function loadState() {
    // 使用 data.js 中定义的 window.DB_KEY
    let saved = localStorage.getItem(window.DB_KEY);
    
    if (!saved) {
        // 尝试从你之前的旧盒子里找数据
        saved = localStorage.getItem('utopia_state_v2') || localStorage.getItem('utopia_state');
        if (saved) {
            localStorage.setItem(window.DB_KEY, saved);
        }
    }

    if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(window.S, parsed);
    }
}

function saveState() {
    localStorage.setItem(window.DB_KEY, JSON.stringify(window.S));
}
