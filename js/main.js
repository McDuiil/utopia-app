// ===== main.js: 初始化与事件绑定 =====
// 动态创建全局导航栏（让所有页面都能看到）
function createGlobalNav() {
  if (document.getElementById('global-nav')) return;
  const nav = document.querySelector('.tab-nav');
  if (!nav) return;
  const globalNav = nav.cloneNode(true);
  globalNav.id = 'global-nav';
  nav.style.display = 'none';
  document.body.insertBefore(globalNav, document.body.firstChild);
  globalNav.querySelectorAll('.tab-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchPage(btn.dataset.page));
  });
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
  // 顶部tab导航
  document.querySelectorAll('.tab-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchPage(btn.dataset.page));
  });
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
