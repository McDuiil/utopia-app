// ... 保留原来的变量定义 (SPORT_KEY, sportData 等) ...

// 核心：重构后的 switchPage 函数
function switchPage(page) {
    // 1. 隐藏所有页面
    document.querySelectorAll('.page-view').forEach(p => p.classList.add('hidden'));
    
    // 2. 显示目标页面
    const target = document.getElementById(`page-${page}`);
    if (target) target.classList.remove('hidden');

    // 3. 高亮导航栏
    if (window.UtopiaNav) window.UtopiaNav.setActive(page);

    // 4. 指令分发（关键点！）
    if (page === 'history') {
        window.UtopiaHistory.init('history-page-content');
    } else if (page === 'analysis') {
        window.UtopiaAnalysis.init('analysis-page-content');
    } else if (page === 'sport') {
        renderSportPage();
    }
    
    // 5. 处理主页底部按钮
    const footer = document.querySelector('.footer-check');
    if(footer) footer.style.display = (page === 'main') ? '' : 'none';
}

// ... 后面保留具体的训练逻辑 (startWorkout, finishSession 等) ...
