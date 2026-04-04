/**
 * Utopia Main - 系统点火开关（全量修复版）
 */

async function init() {
    console.log("🚀 系统启动中...");

    try {
        // 1. 加载数据（这一步会执行搬家逻辑，把数据存入 S）
        if (typeof loadState === 'function') loadState();
        if (typeof loadSportData === 'function') loadSportData();

        // 2. ⚡️ 核心修复：在这里强行接通“断掉的电路”
        // 既然 render.js 认的是 state 和 data，我们就把 S 指给它们
        window.state = window.S;
        window.data = window.S;

        // 3. 执行渲染
        if (typeof renderAll === 'function') {
            renderAll();
            console.log("✅ 数据映射成功，渲染已触发");
        }

        // 4. 初始化导航
        if (window.UtopiaNav && typeof window.UtopiaNav.init === 'function') {
            window.UtopiaNav.init();
        }

    } catch (e) {
        console.error("❌ 启动失败，原因:", e);
    }
}

// 确保在页面加载完后执行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
