// ===== js/sport.js: 修复版页面切换 =====
function loadSportData() {
  try {
    const stored = localStorage.getItem('utopia_sport_v1');
    if (stored) sportData = JSON.parse(stored);
  } catch(e) {}
}

function switchPage(page) {
  console.log("切换至页面:", page);
  
  // 1. 处理所有页面视图的显示与隐藏
  const pages = ['main', 'sport', 'history', 'analysis'];
  pages.forEach(p => {
    const el = document.getElementById(`page-${p}`);
    if (!el) return;

    if (p === 'main') {
      // 特殊处理主页：只隐藏内部的 dashboard 和列表，保留 header 和 nav
      const container = el.querySelector('.app-container');
      const footer = document.querySelector('.footer-check');
      if (page === 'main') {
        if (container) container.style.display = 'block';
        if (footer) footer.style.display = 'flex';
      } else {
        if (container) container.style.display = 'none';
        if (footer) footer.style.display = 'none';
      }
    } else {
      // 其他页面正常切换 hidden 类
      el.classList.toggle('hidden', p !== page);
    }
  });

  // 2. 更新导航按钮状态
  document.querySelectorAll('.tab-nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === page);
  });

  // 3. 触发特定页面的渲染
  if (page === 'history' && typeof renderHistory === 'function') renderHistory();
  if (page === 'analysis' && typeof renderAnalysis === 'function') renderAnalysis();
}
