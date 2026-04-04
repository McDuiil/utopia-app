// js/main.js
async function init() {
    console.log("🚀 Utopia 系统点火...");

    try {
        // 1. 加载数据（state.js 和 sport.js 提供的函数）
        if (typeof loadState === 'function') loadState();
        if (typeof loadSportData === 'function') loadSportData();

        // 2. ⚡️ 核心修复：映射变量
        window.state = window.S;
        window.data = window.S;

        // 3. ⚡️ 核心修复：定义页面切换函数 (解决 navigation.js 报错)
        window.switchPage = (pageId) => {
            console.log("切换至页面:", pageId);
            // 隐藏所有页面
            document.querySelectorAll('.page-view').forEach(p => p.classList.add('hidden'));
            // 显示目标页面
            const target = document.getElementById(`page-${pageId}`);
            if (target) target.classList.remove('hidden');

            // 更新导航栏状态
            if (window.UtopiaNav) window.UtopiaNav.setActive(pageId);

            // 针对不同页面的初始化
            if (pageId === 'history' && window.UtopiaHistory) {
                window.UtopiaHistory.init('history-page-content');
            }
            if (pageId === 'analysis' && window.UtopiaAnalysis) {
                window.UtopiaAnalysis.init('analysis-page-content');
            }
            if (pageId === 'main') {
                if (typeof renderAll === 'function') renderAll();
            }
        };

        // 4. 执行首次渲染
        if (typeof renderAll === 'function') {
            renderAll();
            console.log("✅ 初始渲染完成");
        }

    } catch (e) {
        console.error("❌ 系统初始化失败:", e);
    }
}

// 确保在页面加载完后执行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
