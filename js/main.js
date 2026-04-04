// ===== js/main.js: 入口启动 =====
let currentTrainType = null;

async function init() {
  console.log("Utopia Initializing...");
  
  // 1. 加载运动基础配置
  if (typeof loadSportData === 'function') loadSportData();
  
  // 2. 加载用户数据
  await loadState();
  
  // 3. 确定当前选中的日期
  activeK = getK(new Date());
  
  // 4. 恢复黑夜模式
  const savedTheme = localStorage.getItem('utopia_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  // 5. 渲染页面
  if (typeof renderAll === 'function') {
    renderAll();
  }

  // 6. 绑定全局基础按钮
  document.getElementById('theme-btn').onclick = toggleTheme;
  document.getElementById('train-save').onclick = saveTrainInput;
  document.getElementById('train-close').onclick = closeTrainModal;
  document.getElementById('train-plus50').onclick = () => adjustTrain(50);
  document.getElementById('train-minus50').onclick = () => adjustTrain(-50);

  // 7. 绑定导航切换
  document.querySelectorAll('.tab-nav-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.tab-nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (typeof switchPage === 'function') switchPage(btn.dataset.page);
    };
  });
}

window.addEventListener('DOMContentLoaded', init);
