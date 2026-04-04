// ===== js/main.js: 强制初始化逻辑 =====
async function init() {
    try {
        // 1. 优先加载数据
        if (typeof loadSportData === 'function') loadSportData();
        await loadState();
        activeK = getK(new Date());

        // 2. 绑定导航栏 (最优先绑定，防止点不动)
        document.querySelectorAll('.tab-nav-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                const page = btn.dataset.page;
                document.querySelectorAll('.tab-nav-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (typeof switchPage === 'function') switchPage(page);
            };
        });

        // 3. 绑定顶部四个功能按钮
        const themeBtn = document.getElementById('theme-btn');
        if (themeBtn) themeBtn.onclick = () => {
            const html = document.documentElement;
            const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', next);
            localStorage.setItem('utopia_theme', next);
        };

        // 绑定其他按钮（如果函数没写，至少不会报错）
        const bind = (id, fn) => {
            const el = document.getElementById(id);
            if (el) el.onclick = () => { if (typeof window[fn] === 'function') window[fn](); };
        };
        bind('profile-btn', 'openProfile');
        bind('sync-btn', 'openSyncSettings');
        bind('plan-btn', 'openPlan');

        // 4. 执行渲染
        if (typeof renderAll === 'function') renderAll();
        
        console.log("✅ 导航与按钮绑定成功");
    } catch (e) {
        console.error("❌ 初始化崩溃:", e);
    }
}

document.addEventListener('DOMContentLoaded', init);
