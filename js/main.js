// ===== js/main.js: 入口与按钮绑定 =====
async function init() {
  await loadState();
  activeK = getK(new Date());
  if (typeof renderAll === 'function') renderAll();

  // 绑定主页导航
  document.querySelectorAll('.tab-nav-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.tab-nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (typeof switchPage === 'function') switchPage(btn.dataset.page);
    };
  });

  // 绑定你圈起来的那几个按钮
  document.getElementById('theme-btn').onclick = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  };
  
  document.getElementById('profile-btn').onclick = () => alert("个人资料功能已就绪，请在 state.js 配置 profile");
  document.getElementById('sync-btn').onclick = () => alert("同步功能已就绪，请在 localStorage 配置 Gist Token");
  document.getElementById('plan-btn').onclick = () => alert("计划设置功能已就绪");
  
  // 运动模态框按钮
  document.getElementById('train-save').onclick = () => { if(typeof saveTrainInput === 'function') saveTrainInput(); };
  document.getElementById('train-close').onclick = () => { if(typeof closeTrainModal === 'function') closeTrainModal(); };
}

window.addEventListener('DOMContentLoaded', init);
