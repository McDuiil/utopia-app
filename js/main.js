// ===== js/main.js: 按钮绑定修复 =====
async function init() {
  console.log("Utopia 启动中...");
  
  // 1. 加载数据
  if (typeof loadSportData === 'function') loadSportData();
  await loadState();
  activeK = getK(new Date());

  // 2. 绑定导航栏（主页、运动、历史、分析）
  document.querySelectorAll('.tab-nav-btn').forEach(btn => {
    btn.onclick = (e) => {
      const page = btn.dataset.page;
      if (typeof switchPage === 'function') switchPage(page);
    };
  });

  // 3. 绑定顶部四个功能按钮 (🌓 👤 ☁️ ⚙️)
  const bind = (id, fnName) => {
    const el = document.getElementById(id);
    if (el) {
      el.onclick = () => {
        if (typeof window[fnName] === 'function') window[fnName]();
        else console.warn("函数未定义:", fnName);
      };
    }
  };

  bind('theme-btn', 'toggleTheme');
  bind('profile-btn', 'openProfile');
  bind('sync-btn', 'openSyncSettings');
  bind('plan-btn', 'openPlan');

  // 4. 渲染界面 (数据如果回来了，这里就会显示)
  if (typeof renderAll === 'function') {
    renderAll();
  }
}

// 确保页面加载完后运行
window.onload = init;
