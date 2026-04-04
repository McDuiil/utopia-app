// main.js
/**
 * Utopia Main - 系统点火开关（全量修复版）
 */

async function init() {
    console.log("🚀 Utopia 系统启动中...");

    // 0. 预初始化：防止后面代码因为找不到变量而崩溃
    window.S = window.S || {};
    window.sportData = window.sportData || { categories: [] };

    try {
        // 1. 加载数据
        if (typeof loadState === 'function') {
            loadState();
        } else {
            console.error("❌ 找不到 loadState 函数，请检查 state.js 是否加载成功");
        }

        if (typeof loadSportData === 'function') {
            loadSportData();
        }

        // 2. ⚡️ 核心修复：接通“断掉的电路”
        // 强制映射，让旧的 render.js 逻辑能够通过 state 访问到 S 里的数据
        window.state = window.S;
        window.data = window.S; 

        console.log("🔗 数据映射完成: window.state -> window.S");

        // 3. 执行渲染
        if (typeof renderAll === 'function') {
            renderAll();
            console.log("✅ 页面渲染已触发");
        } else {
            console.warn("⚠️ 找不到 renderAll 函数，页面可能无法自动更新");
        }

        // 4. 初始化导航
        if (window.UtopiaNav && typeof window.UtopiaNav.init === 'function') {
            window.UtopiaNav.init();
        }

    } catch (e) {
        console.error("❌ 系统启动发生致命错误:", e);
    }
}

// 确保在页面加载完后执行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
