async function init() {
  loadSportData();
  await loadState();
  if (localStorage.getItem('theme') === 'light') document.documentElement.setAttribute('data-theme', 'light');
  renderAll();
  
  // 基础按钮绑定
  document.getElementById('theme-btn').onclick = toggleTheme;
  document.getElementById('profile-btn').onclick = openProfile;
  document.getElementById('sync-btn').onclick = openSyncSettings;
  document.getElementById('plan-btn').onclick = openPlan;
  document.getElementById('weight-display').onclick = openWeight;
  document.getElementById('final-btn').onclick = confirmDay;

  // 运动页内部 Tab 切换
  document.querySelectorAll('.sport-tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.sport-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.stab-content').forEach(c => c.classList.add('hidden'));
      document.getElementById(`stab-${tab.dataset.stab}`).classList.remove('hidden');
      renderSportPage();
    };
  });

  // 运动逻辑按钮
  document.getElementById('add-category-btn').onclick = () => {
    const name = prompt('分类名称:');
    if(name) { sportData.categories.push({name, exercises:[]}); saveSportData(); renderSportPage(); }
  };
  document.getElementById('start-blank-btn').onclick = () => startWorkout(null);
  document.getElementById('finish-session-btn').onclick = finishSession;
}
init().catch(console.error);