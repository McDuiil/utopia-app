async function init() {
    try {
        // 第一步：先搬家，把数据读进内存
        loadState();
        loadSportData();
        
        // 第二步：渲染页面
        renderAll(); 
        
        // 第三步：初始化导航和其他模块
        if (window.UtopiaNav) window.UtopiaNav.init();
        
        console.log("Utopia 系统启动成功，数据已加载。");
    } catch (e) {
        console.error("启动失败:", e);
    }
}

// 确保页面加载完就点火
window.addEventListener('DOMContentLoaded', init);
