// ===== js/main.js: 完整启动逻辑 =====
let currentTrainType = null;

async function init() {
  try {
    // 1. 加载运动基础数据
    if (typeof loadSportData === 'function') loadSportData();
    
    // 2. 加载用户状态
    await loadState();
    
    // 3. 设定当前日期
    activeK = getK(new Date());
    
    // 4. 执行渲染
    if (typeof renderAll === 'function') {
      renderAll();
    } else {
      console.error("renderAll not found! Check render.js");
    }

    // 5. 基础事件绑定
    document.getElementById('theme-btn').onclick = toggleTheme;
    document.getElementById('train-save').onclick = saveTrainInput;
    document.getElementById('train-close').onclick = closeTrainModal;

    // 6. 导航绑定
    document.querySelectorAll('.tab-nav-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.tab-nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (typeof switchPage === 'function') switchPage(btn.dataset.page);
      };
    });

    console.log("✅ Utopia Ready");
  } catch (e) {
    console.error("启动失败:", e);
  }
}

window.addEventListener('DOMContentLoaded', init);
