async function init() {
    try {
        // 1. 加载数据
        if (typeof loadState === 'function') loadState();
        if (typeof loadSportData === 'function') loadSportData();

        // 2. ⚡️ 核心兼容：把 S 映射给旧版 render.js 认的变量名
        window.state = window.S;
        window.data = window.S;

        // 3. 执行渲染
        if (typeof renderAll === 'function') {
            renderAll();
        }

        // 4. 导航初始化
        if (window.UtopiaNav && typeof window.UtopiaNav.init === 'function') {
            window.UtopiaNav.init();
        }
    } catch (e) {
        console.error("系统初始化失败:", e);
    }
}

// 确保在页面加载后启动
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
