// ===== render.js: 完整修正版内容 =====

function renderAll() {
  const d = getDay(activeK);
  document.getElementById('display-date').innerText = activeK;
  document.getElementById('weight-display').innerText = d.w ? `${d.w} kg` : "点击录入体重";
  document.getElementById('sec-title').innerHTML = `计划执行 (阶段 ${d.p} · ${d.m==='train'?'训练日':'休息日'})`;

  const plan = getPlan(d.p, d.m);
  renderMeals(d, plan);
  renderTrain(d);
  renderDashboard(d, plan); // 修改位置 ③ 在这里被调用
  renderTimeline();
  updateFooter(d, plan);    // 修改位置 ④ 在这里被调用
}

function renderMeals(d, plan) {
  if (!d.customMeals._mealList) {
    d.customMeals._mealList = plan.meals.map((m, idx) => ({ ...m, _originalIdx: idx }));
    save();
  }
  let meals = d.customMeals._mealList;
  let mealHtml = '';
  for (let idx = 0; idx < meals.length; idx++) {
    const m = meals[idx];
    const isChecked = d.checked.includes(idx);
    const c = Math.round(m.c ?? 0);
    const p = Math.round(m.p ?? 0);
    const f = Math.round(m.f ?? 0);
    mealHtml += `
      <div class="card ${isChecked ? 'checked' : ''}" data-meal-idx="${idx}">
        <div class="card-top">
          <div class="cb-circle" data-meal-idx="${idx}"></div>
          <div class="card-info">
            <h3>${m.i} ${m.n} <span style="font-size:10px; color:var(--text3)">${m.t||''}</span></h3>
            <p>${m.ings.map(ig => `<span class="ing-tag">${ig.n} ${ig.a}</span>`).join('')}</p>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="font-family:var(--mono); font-size:13px; color:var(--text2);">${Math.round(m.k)}<span style="font-size:9px; color:var(--text3)">kcal</span></div>
            <button class="delete-meal-btn icon-btn" data-idx="${idx}" style="background:var(--ios-red); color:white; padding:4px 8px;">🗑️</button>
          </div>
        </div>
        <div class="card-macro">
          <span class="macro-tag carb">碳 ${c}g</span>
          <span class="macro-tag prot">蛋 ${p}g</span>
          <span class="macro-tag fat">脂 ${f}g</span>
        </div>
      </div>
    `;
  }
  mealHtml += `<button id="add-meal-btn" class="primary-btn secondary-btn" style="margin-top:12px;">+ 添加一餐</button>`;
  document.getElementById('meal-list').innerHTML = mealHtml;

  document.querySelectorAll('.delete-meal-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.idx);
      if (confirm('删除这一餐？后续餐食会自动前移。')) {
        d.customMeals._mealList.splice(idx, 1);
        let newChecked = d.checked.filter(i => i !== idx).map(i => i > idx ? i-1 : i);
        d.checked = newChecked;
        updateStatsForDate(activeK);
        save();
        renderAll();
      }
    });
  });

  const addBtn = document.getElementById('add-meal-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const name = prompt('餐名（如：加餐）', '自定义餐');
      if (!name) return;
      const kcal = parseFloat(prompt('热量 (kcal)', '300'));
      if (isNaN(kcal)) return;
      const carb = parseFloat(prompt('碳水 (g)', '30')) || 0;
      const prot = parseFloat(prompt('蛋白 (g)', '20')) || 0;
      const fat = parseFloat(prompt('脂肪 (g)', '10')) || 0;
      const newMeal = { n: name, t: '', i: '🍽️', k: kcal, c: carb, p: prot, f: fat, ings: [{ n: '自定义', a: '' }] };
      d.customMeals._mealList.push(newMeal);
      updateStatsForDate(activeK);
      save();
      renderAll();
    });
  }

  document.querySelectorAll('.cb-circle').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(el.dataset.mealIdx);
      toggleMeal(idx);
    });
  });
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('cb-circle') || e.target.classList.contains('delete-meal-btn')) return;
      const idx = parseInt(card.dataset.mealIdx);
      toggleMeal(idx);
    });
  });
}

function renderTrain(d) {
  const strengthActive = isStrengthValid(d);
  const cardioActive = isCardioValid(d);
  const strengthTags = d.ps ? d.ps.split(',').filter(t => t.trim()) : [];
  const cardioTags = d.pc ? d.pc.split(',').filter(t => t.trim()) : [];
  const trainHtml = `
    <div class="card ${strengthActive ? 'checked' : ''}" data-train-type="s">
      <div class="cb-circle" style="cursor:default;"></div>
      <div class="card-info">
        <h3>力量训练</h3>
        <p>${d.ps ? '部位: '+d.ps : '点击录入消耗与部位'}</p>
        ${strengthTags.length ? `<div class="train-tags">${strengthTags.map(t => `<span class="train-tag">${t}</span>`).join('')}</div>` : ''}
      </div>
      <div style="font-family:var(--mono); color:var(--ios-blue);"><span>${d.s}</span> kcal</div>
    </div>
    <div class="card ${cardioActive ? 'checked' : ''}" data-train-type="c">
      <div class="cb-circle" style="cursor:default;"></div>
      <div class="card-info">
        <h3>有氧运动</h3>
        <p>${d.pc ? '类型: '+d.pc : '点击录入消耗与类型'}</p>
        ${cardioTags.length ? `<div class="train-tags">${cardioTags.map(t => `<span class="train-tag">${t}</span>`).join('')}</div>` : ''}
      </div>
      <div style="font-family:var(--mono); color:var(--ios-blue);"><span>${d.c}</span> kcal</div>
    </div>
  `;
  document.getElementById('train-list').innerHTML = trainHtml;
  document.querySelectorAll('[data-train-type]').forEach(card => {
    card.addEventListener('click', () => openTrainInput(card.dataset.trainType));
  });
}

// 修改 ③：修正后的仪表盘计算逻辑
function renderDashboard(d, plan) {
  let cur = {k:0, c:0, p:0, f:0};
  const meals = d.customMeals._mealList || plan.meals;
  d.checked.forEach(idx => {
    const m = meals[idx];
    if (m) {
      cur.k += m.k || 0;
      cur.c += m.c || 0;
      cur.p += m.p || 0;
      cur.f += m.f || 0;
    }
  });
  document.getElementById('kcal-in').innerText = Math.round(cur.k);
  document.getElementById('kcal-target').innerText = plan.total.k;
  const percent = Math.min(cur.k / plan.total.k, 1);
  const ringFill = document.getElementById('ring-fill');
  if (ringFill) ringFill.style.strokeDashoffset = 326.7 * (1 - percent);

  const map = {carb:['c',plan.total.c], protein:['p',plan.total.p], fat:['f',plan.total.f]};
  for(let key in map) {
    const el = document.querySelector(`[data-type="${key}"]`);
    if (!el) continue;
    el.querySelector('.mc-val').innerText = Math.round(cur[map[key][0]]) + 'g';
    el.querySelector('.mc-target').innerText = `/ ${map[key][1]}g`;
    el.querySelector('.mc-fill').style.width = (Math.min(cur[map[key][0]] / map[key][1], 1) * 100) + '%';
  }
}

function renderTimeline() {
  const box = document.getElementById('timeline');
  box.innerHTML = '';
  const today = new Date();
  for(let i=6; i>=0; i--){
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const k = getK(date);
    const dayData = S.days[k];
    const modeText = dayData ? (dayData.m === 'train' ? '训' : '休') : '';
    const btn = document.createElement('div');
    btn.className = `time-btn ${k===activeK?'active':''}`;
    btn.innerHTML = `<div class="t-day">${date.toLocaleDateString('en-US',{weekday:'short'})}</div><div class="t-date">${date.getDate()}</div>${modeText ? `<div class="t-mode">${modeText}</div>` : ''}`;
    btn.onclick = () => { activeK=k; renderAll(); };
    box.appendChild(btn);
  }
}

// 修改 ④：修正后的底部状态逻辑
function updateFooter(d, plan) {
  const btn = document.getElementById('final-btn');
  if(d.done){ btn.innerText="今日达成✓"; btn.className="confirm-btn ready"; return; }
  if(isDayComplete(d, plan)) {
    btn.innerText="确认完成今日计划";
    btn.classList.add('ready');
  } else {
    const totalMeals = d.customMeals._mealList ? d.customMeals._mealList.length : plan.meals.length;
    const remaining = totalMeals - d.checked.length;
    btn.innerText = `还差 ${remaining} 餐或未记录运动`;
    btn.classList.remove('ready');
  }
}

// --- 以下交互函数 ---
function toggleMeal(idx) {
  const d = getDay(activeK);
  if (d.checked.includes(idx)) {
    d.checked = d.checked.filter(x => x !== idx);
  } else {
    d.checked = [...d.checked, idx];
  }
  updateStatsForDate(activeK);
  save();
  renderAll();
}

function openTrainInput(type) {
  currentTrainType = type;
  const d = getDay(activeK);
  const config = { 
    s: { title: "力量训练复盘", desc: "选择训练部位(多选)", tags: ["胸部","背部","腿部","肩部","手臂","核心","全身"] },
    c: { title: "有氧运动复盘", desc: "选择运动形式(多选)", tags: ["爬楼","跑步","单车","游泳","椭圆机","快走"] }
  }[type];
  document.getElementById('train-modal-title').innerText = config.title;
  document.getElementById('train-modal-desc').innerText = config.desc;
  document.getElementById('train-modal-input').value = d[type] || '';
  const activeTags = (type==='s' ? d.ps : d.pc).split(',').filter(x=>x);
  document.getElementById('tag-box').innerHTML = config.tags.map(t => `
    <div class="tag-chip ${activeTags.includes(t)?'active':''}" data-tag="${t}">${t}</div>
  `).join('');
  document.getElementById('train-overlay').classList.remove('hidden');
}

function saveTrainInput() {
  const d = getDay(activeK);
  d[currentTrainType] = +document.getElementById('train-modal-input').value || 0;
  const selected = Array.from(document.querySelectorAll('.tag-chip.active')).map(el => el.innerText);
  if(currentTrainType==='s') d.ps = selected.join(',');
  else d.pc = selected.join(',');
  updateStatsForDate(activeK);
  save();
  closeTrainModal();
  renderAll();
}

function closeTrainModal() {
  document.getElementById('train-overlay').classList.add('hidden');
  currentTrainType = null;
}

function adjustTrain(delta) {
  const ipt = document.getElementById('train-modal-input');
  let val = parseFloat(ipt.value) || 0;
  val = Math.max(0, val + delta);
  ipt.value = val;
}
