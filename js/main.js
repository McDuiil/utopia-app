// js/main.js 完整替换
async function init() {
  try {
    console.log("正在初始化...");
    
    // 1. 加载数据
    if (typeof loadSportData === 'function') loadSportData();
    await loadState();
    
    // 2. 绑定按钮（确保 ID 对应 index.html）
    const themeBtn = document.getElementById('theme-btn');
    const profileBtn = document.getElementById('profile-btn');
    const syncBtn = document.getElementById('sync-btn');
    const planBtn = document.getElementById('plan-btn');

    if (themeBtn) themeBtn.onclick = () => { /* 切换主题逻辑 */ console.log("主题切换"); };
    if (profileBtn) profileBtn.onclick = () => { alert("个人资料"); };
    if (syncBtn) syncBtn.onclick = () => { alert("同步设置"); };
    if (planBtn) planBtn.onclick = () => { alert("计划设置"); };

    // 3. 渲染页面
    activeK = getK(new Date());
    if (typeof renderAll === 'function') renderAll();
    
    console.log("初始化成功！");
  } catch (e) {
    console.error("启动时发生错误:", e);
    // 如果报错了，至少保证导航还能点
  }
}

window.addEventListener('DOMContentLoaded', init);
