// js/main.js
async function init() {
    console.log("🚀 Utopia 系统点火...");
    try {
        // 1. 加载数据
        loadState();
        loadSportData();

        // 2. 映射变量
        window.state = window.S;
        window.data = window.S;

        // 3. 定义页面切换函数 (解决 Uncaught TypeError)
        window.switchPage = (pageId) => {
            document.querySelectorAll('.page-view').forEach(p => p.classList.add('hidden'));
            const target = document.getElementById(`page-${pageId}`);
            if (target) target.classList.remove('hidden');
            
            if (window.UtopiaNav) window.UtopiaNav.setActive(pageId);
            
            // 子模块初始化
            if (pageId === 'history' && window.UtopiaHistory) window.UtopiaHistory.init('history-page-content');
            if (pageId === 'analysis' && window.UtopiaAnalysis) window.UtopiaAnalysis.init('analysis-page-content');
            
            if (pageId === 'main') renderAll();
        };

        // 4. 执行首次渲染
        renderAll();

        console.log("✅ 系统初始化成功");
    } catch (e) {
        console.error("❌ 系统初始化失败:", e);
    }
}

document.addEventListener('DOMContentLoaded', init);
