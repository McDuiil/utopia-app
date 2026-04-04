// ===== js/main.js: 核心绑定 =====
async function init() {
  try {
    // 1. 初始化数据
    if (typeof loadSportData === 'function') loadSportData();
    await loadState();
    activeK = getK(new Date());

    // 2. 绑定导航栏（放在最前面，确保必成）
    document.querySelectorAll('.tab-nav-btn').forEach(btn => {
      btn.onclick = () => {
        const page = btn.dataset.page;
        if (page) switchPage(page);
      };
    });

    // 3. 绑定顶部功能按钮
    const bind = (id, fn) => {
      const el = document.getElementById(id);
      if (el) el.onclick = () => { 
        if (typeof window[fn] === 'function') window[fn](); 
        else if (fn === 'toggleTheme') toggleTheme();
      };
    };
    
    bind('theme-btn', 'toggleTheme');
    bind('profile-btn', 'openProfile');
    bind('sync-btn', 'openSyncSettings');
    bind('plan-btn', 'openPlan');

    // 4. 初次渲染
    renderAll();
    console.log("✅ 初始化完成");

  } catch (e) {
    console.error("❌ 启动失败:", e);
  }
}

document.addEventListener('DOMContentLoaded', init);

// 全局兜底函数，防止 render.js 调用报错
function toggleTheme() {
  const html = document.documentElement;
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('utopia_theme', next);
}
