// state.js
// 统一使用 window.DB_KEY，避免重复声明冲突
window.DB_KEY = 'utopia_v10'; 

function loadState() {
    // 确保全局容器 S 存在
    window.S = window.S || {};

    // 1. 尝试读取新盒子
    let saved = localStorage.getItem(window.DB_KEY);
    
    // 2. 核心抢救：如果新盒子是空的，去翻旧盒子 (兼容迁移逻辑)
    if (!saved) {
        console.log("🔍 检测到旧版数据，正在启动自动迁移...");
        // 尝试读取你提到的所有可能的老标签
        saved = localStorage.getItem('utopia_state_v2') || localStorage.getItem('utopia_state');
        
        if (saved) {
            // 搬家：把旧数据存入新盒子
            localStorage.setItem(window.DB_KEY, saved);
            console.log("✅ 数据从旧盒子成功迁移至 utopia_v10！");
        } else {
            console.log("⚠️ 未发现可迁移的旧数据。");
        }
    }

    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // 将读取到的数据注入全局变量 S
            Object.assign(window.S, parsed);
            console.log("📊 数据加载完毕:", window.S);
        } catch (e) {
            console.error("❌ 数据解析失败:", e);
        }
    }
}

function saveState() {
    if (window.S) {
        localStorage.setItem(window.DB_KEY, JSON.stringify(window.S));
    }
}
