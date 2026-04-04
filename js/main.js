// ===== js/main.js: 强制修复版 =====

async function init() {
  console.log("Utopia: 正在启动核心引擎...");
  
  try {
    // 1. 初始化基础数据
    if (typeof loadSportData === 'function') loadSportData();
    await loadState();
    activeK = getK(new Date());

    // 2. 绑定日夜切换 (你现在唯一能动的按钮)
    const themeBtn = document.getElementById('theme-btn');
    if (themeBtn) {
      themeBtn.onclick = () => {
        const html = document.documentElement;
        const next = (html.getAttribute('data-theme') === 'dark') ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        localStorage.setItem('utopia_theme', next);
      };
    }

    // 3. 绑定剩下的三个按钮 (核心修复点)
    // 使用 try-catch 包裹，防止其中一个报错导致全部瘫痪
    const bindSafe = (id, fnName) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.onclick = () => {
          if (typeof window[fnName] === 'function') {
            window[fnName]();
          } else {
            console.warn(`未找到函数: ${fnName}，执行默认弹窗`);
            alert(`${id} 功能模块正在加载中...`);
          }
        };
      }
    };

    bindSafe('profile-btn', 'openProfile');
    bindSafe('sync-btn', 'openSyncSettings');
    bindSafe('plan-btn', 'openPlan');

    // 4. 绑定导航栏
    document.querySelectorAll('.tab-nav-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.tab-nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (typeof switchPage === 'function') switchPage(btn.dataset.page);
      };
    });

    // 5. 执行渲染
    if (typeof renderAll === 'function') renderAll();
    
    console.log("Utopia: 所有按钮绑定完毕！");

  } catch (e) {
    console.error("启动逻辑发生严重崩溃:", e);
  }
}

// 确保在页面加载完后执行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
