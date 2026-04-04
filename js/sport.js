const SPORT_KEY = 'utopia_v10_sport'; // 统一运动键名

function loadSportData() {
    let data = localStorage.getItem(SPORT_KEY);
    
    // 兼容逻辑：如果没有新运动键，去尝试读旧的
    if (!data) {
        data = localStorage.getItem('utopia_sport_v1') || localStorage.getItem('utopia_sport');
        if (data) localStorage.setItem(SPORT_KEY, data);
    }

    sportData = data ? JSON.parse(data) : { categories: [], templates: [], sessions: [] };
    
    // 确保基础分类存在，防止页面白屏
    if (sportData.categories.length === 0) {
        sportData.categories = ["胸部", "背部", "肩部", "腿部", "手臂", "核心", "有氧"];
    }
}

function saveSportData() {
    localStorage.setItem(SPORT_KEY, JSON.stringify(sportData));
}

// ... 下面保留你原本的 workout 逻辑 ...
