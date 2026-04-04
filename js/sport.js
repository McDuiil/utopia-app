// sport.js
window.SPORT_KEY = 'utopia_v10_sport'; 

function loadSportData() {
    let data = localStorage.getItem(window.SPORT_KEY);
    
    // 兼容逻辑：如果没有新运动键，去尝试读旧的
    if (!data) {
        data = localStorage.getItem('utopia_sport_v1') || localStorage.getItem('utopia_sport');
        if (data) {
            localStorage.setItem(window.SPORT_KEY, data);
            console.log("✅ 运动数据迁移成功！");
        }
    }

    // 初始化全局变量 sportData
    window.sportData = data ? JSON.parse(data) : { categories: [], templates: [], sessions: [] };
    
    // 确保基础分类存在，防止页面白屏
    if (window.sportData.categories.length === 0) {
        window.sportData.categories = ["胸部", "背部", "肩部", "腿部", "手臂", "核心", "有氧"];
    }
}

function saveSportData() {
    localStorage.setItem(window.SPORT_KEY, JSON.stringify(window.sportData));
}
