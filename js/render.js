// js/render.js
function renderAll() {
  const d = window.getDay(window.activeK);
  const plan = window.getPlan(d.p, d.m);

  // 1. 基础信息
  const displayDate = document.getElementById('display-date');
  if (displayDate) displayDate.innerText = window.activeK;
  
  const weightDisplay = document.getElementById('weight-display');
  if (weightDisplay) weightDisplay.innerText = d.w ? `${d.w} kg` : "点击录入体重";

  // 2. 调用核心渲染模块
  renderDashboard(d, plan);
  renderMeals(d, plan);
  renderTrain(d);
  renderTimeline();
  updateFooter(d, plan);
}

function renderDashboard(d, plan) {
  let cur = {k:0, c:0, p:0, f:0};
  d.checked.forEach(idx => {
    const m = window.getMeal(plan, idx, d.customMeals);
    cur.k += (m.k || 0); cur.c += (m.c || 0); cur.p += (m.p || 0); cur.f += (m.f || 0);
  });

  document.getElementById('kcal-in').innerText = Math.round(cur.k);
  document.getElementById('kcal-target').innerText = plan.total.k;
  
  const percent = Math.min(cur.k / plan.total.k, 1);
  const ringFill = document.getElementById('ring-fill');
  if (ringFill) ringFill.style.strokeDashoffset = 326.7 * (1 - percent);

  // 宏量元素进度条
  const map = {carb:['c',plan.total.c], protein:['p',plan.total.p], fat:['f',plan.total.f]};
  for(let key in map) {
    const el = document.querySelector(`[data-type="${key}"]`);
    if (!el) continue;
    el.querySelector('.mc-val').innerText = Math.round(cur[map[key][0]]) + 'g';
    el.querySelector('.mc-target').innerText = `/ ${map[key][1]}g`;
    el.querySelector('.mc-fill').style.width = (Math.min(cur[map[key][0]] / map[key][1], 1) * 100) + '%';
  }
}

function renderMeals(d, plan) {
  const meals = plan.meals;
  let html = '';
  meals.forEach((m, idx) => {
    const isChecked = d.checked.includes(idx);
    html += `
      <div class="card ${isChecked ? 'checked' : ''}" onclick="toggleMeal(${idx})">
        <div class="card-top">
          <div class="cb-circle"></div>
          <div class="card-info">
            <h3>${m.i} ${m.n}</h3>
            <p>${m.ings.map(ig => `<span class="ing-tag">${ig.n} ${ig.a}</span>`).join('')}</p>
          </div>
          <div class="kcal-num">${Math.round(m.k)}<span>kcal</span></div>
        </div>
      </div>
    `;
  });
  document.getElementById('meal-list').innerHTML = html;
}

function renderTrain(d) {
  const strengthActive = window.isStrengthValid(d);
  const cardioActive = window.isCardioValid(d);
  const trainHtml = `
    <div class="card ${strengthActive ? 'checked' : ''}" onclick="openTrainInput('s')">
      <div class="card-info">
        <h3>力量训练</h3>
        <p>${d.ps || '点击录入部位'}</p>
      </div>
      <div class="kcal-num">${d.s} kcal</div>
    </div>
    <div class="card ${cardioActive ? 'checked' : ''}" onclick="openTrainInput('c')">
      <div class="card-info">
        <h3>有氧运动</h3>
        <p>${d.pc || '点击录入类型'}</p>
      </div>
      <div class="kcal-num">${d.c} kcal</div>
    </div>
  `;
  document.getElementById('train-list').innerHTML = trainHtml;
}

function renderTimeline() {
  const box = document.getElementById('timeline');
  if (!box) return;
  box.innerHTML = '';
  const today = new Date();
  for(let i=6; i>=0; i--){
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const k = window.getK(date);
    const btn = document.createElement('div');
    btn.className = `time-btn ${k===window.activeK?'active':''}`;
    btn.innerHTML = `<div class="t-day">${date.toLocaleDateString('en-US',{weekday:'short'})}</div><div class="t-date">${date.getDate()}</div>`;
    btn.onclick = () => { window.activeK=k; renderAll(); };
    box.appendChild(btn);
  }
}

function updateFooter(d, plan) {
  const btn = document.getElementById('final-btn');
  if (!btn) return;
  if(d.done){ btn.innerText="今日达成✓"; btn.className="confirm-btn ready"; return; }
  btn.innerText = `还差 ${plan.meals.length-d.checked.length} 餐`;
}

// 补全 UI 弹窗函数
function showBasePanel(html) {
  const panel = document.getElementById('base-panel-content');
  const overlay = document.getElementById('base-overlay');
  if (panel && overlay) {
    panel.innerHTML = html + `<button onclick="closeBase()" style="width:100%; color:var(--text3); border:none; background:none; margin-top:20px;">关闭</button>`;
    overlay.classList.remove('hidden');
  }
}

function closeBase() {
  const overlay = document.getElementById('base-overlay');
  if (overlay) overlay.classList.add('hidden');
}

function toggleMeal(idx) {
  const d = window.getDay(window.activeK);
  if (d.checked.includes(idx)) d.checked = d.checked.filter(x => x !== idx);
  else d.checked.push(idx);
  window.save();
  renderAll();
}