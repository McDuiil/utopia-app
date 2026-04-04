const SPORT_KEY = 'utopia_sport_v1';
let sportData = { categories:[], templates: [], sessions:[] };
let currentSession = null;
let sessionTimerInterval = null;
let sessionStartTime = null;

function loadSportData() {
  const s = localStorage.getItem(SPORT_KEY);
  if(s) sportData = JSON.parse(s);
}
function saveSportData() {
  localStorage.setItem(SPORT_KEY, JSON.stringify(sportData));
}

// 核心：页面切换路由
function switchPage(page) {
  // 1. 切换页面显隐
  ['main', 'sport', 'history', 'analysis'].forEach(p => {
    const el = document.getElementById(`page-${p}`);
    if(el) el.classList.toggle('hidden', p !== page);
  });
  // 2. 高亮导航栏
  if(window.UtopiaNav) window.UtopiaNav.setActive(page);
  // 3. 处理主页底部按钮
  const f = document.querySelector('.footer-check');
  if(f) f.style.display = (page === 'main') ? '' : 'none';
  // 4. 按需加载数据
  if(page === 'sport') renderSportPage();
}

function startWorkout(templateIdx) {
  const t = templateIdx !== null ? sportData.templates[templateIdx] : { name: '空白训练', exercises:[] };
  currentSession = {
    name: t.name,
    date: new Date().toLocaleDateString(),
    exercises: t.exercises.map(e => ({ name: e.name, sets: [{ weight: '', reps: '', done: false }] }))
  };
  renderSessionView();
}

function renderSessionView() {
  const container = document.getElementById('session-exercises');
  document.getElementById('workout-home').classList.add('hidden');
  document.getElementById('workout-session').classList.remove('hidden');
  
  container.innerHTML = currentSession.exercises.map((ex, ei) => `
    <div class="exercise-block" style="background:var(--card-bg); padding:15px; border-radius:12px; margin-bottom:10px;">
      <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
        <strong>${ex.name}</strong>
        <button onclick="removeExFromSession(${ei})" style="color:var(--ios-red); border:none; background:none;">删除</button>
      </div>
      ${ex.sets.map((set, si) => `
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr 40px; gap:10px; margin-bottom:5px;">
          <span style="font-size:12px; color:var(--text3);">组 ${si+1}</span>
          <input type="number" value="${set.weight}" onchange="updateSet(${ei},${si},'weight',this.value)" placeholder="kg" style="width:100%; border-radius:4px; border:1px solid var(--border-light); text-align:center;">
          <input type="number" value="${set.reps}" onchange="updateSet(${ei},${si},'reps',this.value)" placeholder="次" style="width:100%; border-radius:4px; border:1px solid var(--border-light); text-align:center;">
          <button onclick="toggleSetDone(${ei},${si})" style="background:none; border:1px solid var(--border-light); border-radius:4px; color:${set.done?'green':'#ccc'}">${set.done?'✓':'○'}</button>
        </div>
      `).join('')}
      <button onclick="addSetToEx(${ei})" style="width:100%; font-size:11px; margin-top:5px; color:var(--ios-blue); border:none; background:none;">+ 加组</button>
    </div>
  `).join('');
}

// 辅助函数
function updateSet(ei, si, key, val) { currentSession.exercises[ei].sets[si][key] = val; }
function toggleSetDone(ei, si) { currentSession.exercises[ei].sets[si].done = !currentSession.exercises[ei].sets[si].done; renderSessionView(); }
function addSetToEx(ei) { currentSession.exercises[ei].sets.push({weight:'', reps:'', done:false}); renderSessionView(); }
function removeExFromSession(ei) { currentSession.exercises.splice(ei, 1); renderSessionView(); }

function finishSession() {
  if(!confirm('保存训练？')) return;
  sportData.sessions.push(currentSession);
  saveSportData();
  currentSession = null;
  document.getElementById('workout-session').classList.add('hidden');
  document.getElementById('workout-home').classList.remove('hidden');
  renderSportPage();
}

function renderSportPage() {
  // 这里可以添加渲染动作库和历史记录的逻辑，目前保持基础结构
}