// ===== main.js: 初始化与事件绑定 =====

// 动态创建全局导航栏（全新创建，不依赖原始结构）
function createGlobalNav() {
  if (document.getElementById('global-nav')) return;
  
  // 创建外层容器
  const navBar = document.createElement('nav');
  navBar.id = 'global-nav';
  // 设置内联样式（保证生效）
  navBar.style.cssText = `
    position: sticky;
    top: 0;
    background: var(--bg0);
    z-index: 100;
    display: flex;
    justify-content: center;
    border-bottom: 1px solid var(--border-light);
    padding: 0 20px;
  `;
  
  // 创建内部容器（限制宽度）
  const innerDiv = document.createElement('div');
  innerDiv.style.cssText = `
    max-width: 480px;
    width: 100%;
    display: flex;
    justify-content: space-between;
    background: transparent;
    padding: 0;
  `;
  
  // 创建四个按钮
  const pages = [
    { name: '🏠 主页', page: 'main' },
    { name: '💪 运动', page: 'sport' },
    { name: '📊 历史', page: 'history' },
    { name: '📈 分析', page: 'analysis' }
  ];
  
  pages.forEach(p => {
    const btn = document.createElement('button');
    btn.textContent = p.name;
    btn.className = 'tab-nav-btn';
    if (p.page === 'main') btn.classList.add('active');
    btn.dataset.page = p.page;
    btn.style.cssText = `
      flex: 1;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      padding: 10px 4px;
      font-size: 12px;
      color: var(--text3);
      cursor: pointer;
      transition: 0.2s;
      white-space: nowrap;
    `;
    btn.addEventListener('click', () => switchPage(p.page));
    innerDiv.appendChild(btn);
  });
  
  navBar.appendChild(innerDiv);
  
  // 插入到 .timeline 的上方（如果 .timeline 存在）
  const timeline = document.querySelector('.timeline');
  if (timeline) {
    timeline.parentNode.insertBefore(navBar, timeline);
  } else {
    // 如果 timeline 不存在，则插入到 body 最前面
    document.body.insertBefore(navBar, document.body.firstChild);
  }
  
  // 隐藏原始导航栏（如果存在）
  const originalNav = document.querySelector('.tab-nav');
  if (originalNav) originalNav.style.display = 'none';
}

// ------------------- 初始化与事件绑定 -------------------
async function init() {
  createGlobalNav();
  loadSportData();
  await loadState();
  if (localStorage.getItem('theme') === 'light') document.documentElement.setAttribute('data-theme', 'light');
  renderAll();
  document.getElementById('theme-btn').addEventListener('click', toggleTheme);
  document.getElementById('profile-btn').addEventListener('click', openProfile);
  document.getElementById('sync-btn').addEventListener('click', openSyncSettings);
  document.getElementById('plan-btn').addEventListener('click', openPlan);
  
  // 运动页子tab
  document.querySelectorAll('.sport-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.sport-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.stab-content').forEach(c => c.classList.add('hidden'));
      document.getElementById(`stab-${tab.dataset.stab}`).classList.remove('hidden');
      if (tab.dataset.stab === 'exercises') renderExerciseLibrary();
      if (tab.dataset.stab === 'templates') renderTemplateList();
      if (tab.dataset.stab === 'workout') { renderTemplateQuickList(); renderRecentWorkouts(); }
    });
  });
  
  // 运动页按钮
  document.getElementById('add-category-btn')?.addEventListener('click', () => {
    const name = prompt('输入大类名称（如：胸、背、腿）：');
    if (!name || !name.trim()) return;
    sportData.categories.push({ name: name.trim(), exercises: [] });
    saveSportData();
    renderExerciseLibrary();
  });
  document.getElementById('add-template-btn')?.addEventListener('click', () => {
    const name = prompt('输入模板名称（如：推A、拉B）：');
    if (!name || !name.trim()) return;
    sportData.templates.push({ name: name.trim(), exercises: [] });
    saveSportData();
    renderTemplateList();
  });
  document.getElementById('start-blank-btn')?.addEventListener('click', () => startWorkout(null));
  document.getElementById('finish-session-btn')?.addEventListener('click', finishSession);
  document.getElementById('session-back')?.addEventListener('click', () => {
    if (confirm('放弃本次训练？')) {
      if (sessionTimerInterval) clearInterval(sessionTimerInterval);
      currentSession = null;
      document.getElementById('workout-session').classList.add('hidden');
      document.getElementById('workout-home').classList.remove('hidden');
    }
  });
  document.getElementById('add-exercise-to-session')?.addEventListener('click', () => {
    const allEx = sportData.categories.flatMap(c => c.exercises.map(e => e.name));
    const name = prompt('输入动作名：' + (allEx.length ? '\n' + allEx.join('、') : ''));
    if (!name || !name.trim()) return;
    currentSession.exercises.push({ name: name.trim(), sets: [{ weight: '', reps: '', done: false }] });
    renderSessionView();
  });
  document.getElementById('weight-display').addEventListener('click', openWeight);
  document.getElementById('final-btn').addEventListener('click', confirmDay);
  document.getElementById('train-save').addEventListener('click', saveTrainInput);
  document.getElementById('train-close').addEventListener('click', closeTrainModal);
  document.getElementById('train-plus50').addEventListener('click', () => adjustTrain(50));
  document.getElementById('train-minus50').addEventListener('click', () => adjustTrain(-50));
  document.getElementById('tag-box').addEventListener('click', (e) => {
    if (e.target.classList.contains('tag-chip')) {
      e.target.classList.toggle('active');
    }
  });
  document.getElementById('sec-title').addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-meal-icon') || e.target.closest('.edit-meal-icon')) {
      openMealEditor();
    }
  });
  
  let lastDate = getK(new Date());
  function checkDateChange() {
    const today = getK(new Date());
    if (today !== lastDate) {
      lastDate = today;
      activeK = today;
      renderAll();
    }
  }
  setInterval(checkDateChange, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkDateChange(); });
  
  const today = getK(new Date());
  const dToday = getDay(today);
  if (!dToday.w) setTimeout(() => openWeight(), 500);
}

init().catch(e => { console.error("FATAL:", e); document.body.insertAdjacentHTML("afterbegin", `<div style="position:fixed;top:0;left:0;right:0;background:#FF3B30;color:white;padding:12px;z-index:9999;font-size:13px;">⚠️ 启动错误: ${e.message}</div>`); });
