// 确定唯一的终极键名
const DB_KEY = 'utopia_v10';

function loadState() {
    // 1. 尝试读取新盒子
    let saved = localStorage.getItem(DB_KEY);
    
    // 2. 如果新盒子是空的，去翻旧盒子 (兼容迁移逻辑)
    if (!saved) {
        console.log("检测到旧版数据，正在启动自动迁移...");
        saved = localStorage.getItem('utopia_state_v2') || localStorage.getItem('utopia_state');
        if (saved) {
            // 搬家：把旧数据存入新盒子
            localStorage.setItem(DB_KEY, saved);
            console.log("数据迁移成功！");
        }
    }

    if (saved) {
        const parsed = JSON.parse(saved);
        // 将读取到的数据注入全局变量 S
        Object.assign(S, parsed);
        if (!S.goal) S.goal = 500; // 容错处理
    }
}

function saveState() {
    localStorage.setItem(DB_KEY, JSON.stringify(S));
}
