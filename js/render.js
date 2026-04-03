// ===== render.js: 渲染函数 =====
function renderAll() {
  const d = getDay(activeK);
  document.getElementById('display-date').innerText = activeK;
  document.getElementById('weight-display').innerText = d.w ? `${d.w} kg` : "点击录入体重";
  document.getElementById('sec-title').innerHTML = `计划执行 (阶段 ${d.p} · ${d.m==='train'?'训练日':'休息日'}) <span class="edit-meal-icon" id="edit-meal-btn">✏️ 自定义餐食</span>`;

  const plan = getPlan(d.p, d.m);
  renderMeals(d, plan);
  renderTrain(d);
  renderDashboard(d, plan);
  renderTimeline();
  updateFooter(d, plan);
}

function renderMeals(d, plan) {
  const mealList = d.customMeals && d.customMeals._mealList;
  const meals = mealList || plan.meals;
  let mealHtml = '';
  for (let idx = 0; idx < meals.length; idx++) {
    const m = mealList ? meals[idx] : getMeal(plan, idx, d.customMeals);
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
          <div style="font-family:var(--mono); font-size:13px; color:var(--text2); flex-shrink:0; margin-left:8px;">${Math.round(m.k)}<span style="font-size:9px; color:var(--text3)">kcal</span></div>
        </div>
        <div class="card-macro">
          <span class="macro-tag carb">碳 ${c}g</span>
          <span class="macro-tag prot">蛋 ${p}g</span>
          <span class="macro-tag fat">脂 ${f}g</span>
        </div>
      </div>
    `;
  }
  document.getElementById('meal-list').innerHTML = mealHtml;
  document.querySelectorAll('.cb-circle').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(el.dataset.mealIdx);
      toggleMeal(idx);
    });
  });
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('cb-circle')) return;
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

function renderDashboard(d, plan) {
  let cur = {k:0, c:0, p:0, f:0};
  d.checked.forEach(idx => {
    const m = getMeal(plan, idx, d.customMeals);
    cur.k += m.k; cur.c += m.c; cur.p += m.p; cur.f += m.f;
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

  const net = getNetDeficit(d, plan);
  const netEl = document.getElementById('net-calorie-display');
  netEl.innerText = `🔥 净赤字: ${net >=0 ? '+' : ''}${Math.round(net)} kcal (BMR已计)`;
  netEl.style.color = net < 0 ? 'var(--ios-green)' : (net > 0 ? 'var(--ios-orange)' : 'var(--ios-teal)');
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

function updateFooter(d, plan) {
  const btn = document.getElementById('final-btn');
  if(d.done){ btn.innerText="今日达成✓"; btn.className="confirm-btn ready"; return; }
  if(isDayComplete(d, plan)) {
    btn.innerText="确认完成今日计划";
    btn.classList.add('ready');
  } else {
    btn.innerText = `还差 ${plan.meals.length-d.checked.length} 餐或未记录运动`;
    btn.classList.remove('ready');
  }
}

// ------------------- 交互函数（保持不变） -------------------
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

// 餐食编辑器相关（保持不变）
function openMealEditor() {
  const d = getDay(activeK);
  const plan = getPlan(d.p, d.m);
  let html = `<h2>自定义今日餐食</h2><p>修改食材列表，可点击“🔍 估算”自动计算热量宏量（基于内置食材库）</p>`;
  for (let idx = 0; idx < plan.meals.length; idx++) {
    const original = plan.meals[idx];
    const custom = d.customMeals[idx];
    const current = custom || original;
    html += `
      <div style="margin:20px 0; border-top:1px solid var(--border-light); padding-top:12px;">
        <h3>${original.i} ${original.n}</h3>
        <div id="meal-editor-${idx}">
          ${current.ings.map((ig, iidx) => `
            <div class="ingredient-item">
              <input type="text" placeholder="食材名" value="${ig.n.replace(/"/g, '&quot;')}" data-meal="${idx}" data-ing="${iidx}" data-field="name" list="foodlist">\n                <input type="text" placeholder="用量" value="${ig.a.replace(/"/g, '&quot;')}" data-meal="${idx}" data-ing="${iidx}" data-field="amount">
              <button class="remove-ingredient" data-meal="${idx}" data-ing="${iidx}">🗑️</button>
            </div>
          `).join('')}
          <button class="icon-btn add-ingredient" data-meal="${idx}">+ 添加食材</button>
          <button class="icon-btn secondary-btn reset-meal" data-meal="${idx}">重置为默认</button>
          <button class="icon-btn estimate-meal" data-meal="${idx}">🔍 估算</button>
          <div class="macro-input-group">
            <input type="number" placeholder="热量(kcal)" id="custom-kcal-${idx}" value="${current.k}">
            <input type="number" placeholder="碳水(g)" id="custom-carb-${idx}" value="${current.c}">
            <input type="number" placeholder="蛋白(g)" id="custom-protein-${idx}" value="${current.p}">
            <input type="number" placeholder="脂肪(g)" id="custom-fat-${idx}" value="${current.f}">
          </div>
        </div>
      </div>
    `;
  }
  html += `<datalist id="foodlist">${Object.keys(FOOD_DB).map(f => `<option>${f}</option>`).join('')}</datalist>`;
  html += `<button class="primary-btn" id="save-custom-meals">保存所有修改</button>`;
  showBasePanel(html);

  document.getElementById('save-custom-meals')?.addEventListener('click', saveCustomMeals);
  document.querySelectorAll('.add-ingredient').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mealIdx = parseInt(btn.dataset.meal);
      addIngredient(mealIdx);
    });
  });
  document.querySelectorAll('.reset-meal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mealIdx = parseInt(btn.dataset.meal);
      resetMeal(mealIdx);
    });
  });
  document.querySelectorAll('.estimate-meal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mealIdx = parseInt(btn.dataset.meal);
      estimateMeal(mealIdx);
    });
  });
  document.querySelectorAll('.remove-ingredient').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mealIdx = parseInt(btn.dataset.meal);
      const ingIdx = parseInt(btn.dataset.ing);
      removeIngredient(mealIdx, ingIdx);
    });
  });
}

function addIngredient(mealIdx) {
  const container = document.getElementById(`meal-editor-${mealIdx}`);
  const newIdx = container.querySelectorAll('.ingredient-item').length;
  const div = document.createElement('div');
  div.className = 'ingredient-item';
  div.innerHTML = `
    <input type="text" placeholder="食材名" data-meal="${mealIdx}" data-ing="${newIdx}" data-field="name" list="foodlist">
    <input type="text" placeholder="用量" data-meal="${mealIdx}" data-ing="${newIdx}" data-field="amount">
    <button class="remove-ingredient" data-meal="${mealIdx}" data-ing="${newIdx}">🗑️</button>
  `;
  container.appendChild(div);
  div.querySelector('.remove-ingredient')?.addEventListener('click', (e) => {
    const mIdx = parseInt(div.querySelector('.remove-ingredient').dataset.meal);
    const iIdx = parseInt(div.querySelector('.remove-ingredient').dataset.ing);
    removeIngredient(mIdx, iIdx);
  });
}

function removeIngredient(mealIdx, ingIdx) {
  const container = document.getElementById(`meal-editor-${mealIdx}`);
  const items = container.querySelectorAll('.ingredient-item');
  if (items[ingIdx]) items[ingIdx].remove();
  const remaining = container.querySelectorAll('.ingredient-item');
  remaining.forEach((item, newIdx) => {
    item.querySelectorAll('[data-ing]').forEach(el => el.dataset.ing = newIdx);
  });
}

function estimateMeal(mealIdx) {
  const container = document.getElementById(`meal-editor-${mealIdx}`);
  const items = container.querySelectorAll('.ingredient-item');
  const ings = [];
  for (let i = 0; i < items.length; i++) {
    const nameInput = items[i].querySelector('[data-field="name"]');
    const amountInput = items[i].querySelector('[data-field="amount"]');
    if (nameInput && amountInput && nameInput.value.trim() && amountInput.value.trim()) {
      ings.push({ n: nameInput.value.trim(), a: amountInput.value.trim() });
    }
  }
  const est = estimateFromIngredients(ings);
  document.getElementById(`custom-kcal-${mealIdx}`).value = Math.round(est.kcal);
  document.getElementById(`custom-carb-${mealIdx}`).value = Math.round(est.carb);
  document.getElementById(`custom-protein-${mealIdx}`).value = Math.round(est.prot);
  document.getElementById(`custom-fat-${mealIdx}`).value = Math.round(est.fat);
}

function resetMeal(mealIdx) {
  const d = getDay(activeK);
  delete d.customMeals[mealIdx];
  save();
  const plan = getPlan(d.p, d.m);
  const original = plan.meals[mealIdx];
  const container = document.getElementById(`meal-editor-${mealIdx}`);
  if (container) {
    container.innerHTML = `
      ${original.ings.map((ig, iidx) => `
        <div class="ingredient-item">
          <input type="text" placeholder="食材名" value="${ig.n.replace(/"/g, '&quot;')}" data-meal="${mealIdx}" data-ing="${iidx}" data-field="name" list="foodlist">\n            <input type="text" placeholder="用量" value="${ig.a.replace(/"/g, '&quot;')}" data-meal="${mealIdx}" data-ing="${iidx}" data-field="amount">
          <button class="remove-ingredient" data-meal="${mealIdx}" data-ing="${iidx}">🗑️</button>
        </div>
      `).join('')}
      <button class="icon-btn add-ingredient" data-meal="${mealIdx}">+ 添加食材</button>
      <button class="icon-btn secondary-btn reset-meal" data-meal="${mealIdx}">重置为默认</button>
      <button class="icon-btn estimate-meal" data-meal="${mealIdx}">🔍 估算</button>
      <div class="macro-input-group">
        <input type="number" placeholder="热量(kcal)" id="custom-kcal-${mealIdx}" value="${original.k}">
        <input type="number" placeholder="碳水(g)" id="custom-carb-${mealIdx}" value="${original.c}">
        <input type="number" placeholder="蛋白(g)" id="custom-protein-${mealIdx}" value="${original.p}">
        <input type="number" placeholder="脂肪(g)" id="custom-fat-${mealIdx}" value="${original.f}">
      </div>
    `;
    container.querySelector('.add-ingredient')?.addEventListener('click', () => addIngredient(mealIdx));
    container.querySelector('.reset-meal')?.addEventListener('click', () => resetMeal(mealIdx));
    container.querySelector('.estimate-meal')?.addEventListener('click', () => estimateMeal(mealIdx));
    container.querySelectorAll('.remove-ingredient').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mIdx = parseInt(btn.dataset.meal);
        const iIdx = parseInt(btn.dataset.ing);
        removeIngredient(mIdx, iIdx);
      });
    });
  }
}

function saveCustomMeals() {
  const d = getDay(activeK);
  const plan = getPlan(d.p, d.m);
  for (let mealIdx = 0; mealIdx < plan.meals.length; mealIdx++) {
    const container = document.getElementById(`meal-editor-${mealIdx}`);
    if (!container) continue;
    const items = container.querySelectorAll('.ingredient-item');
    const ings = [];
    for (let i = 0; i < items.length; i++) {
      const nameInput = items[i].querySelector('[data-field="name"]');
      const amountInput = items[i].querySelector('[data-field="amount"]');
      if (nameInput && amountInput && nameInput.value.trim() && amountInput.value.trim()) {
        ings.push({ n: nameInput.value.trim(), a: amountInput.value.trim() });
      }
    }
    const kcal = parseFloat(document.getElementById(`custom-kcal-${mealIdx}`).value);
    const carb = parseFloat(document.getElementById(`custom-carb-${mealIdx}`).value);
    const prot = parseFloat(document.getElementById(`custom-protein-${mealIdx}`).value);
    const fat = parseFloat(document.getElementById(`custom-fat-${mealIdx}`).value);
    if (ings.length > 0 && !isNaN(kcal) && !isNaN(carb) && !isNaN(prot) && !isNaN(fat)) {
      const original = plan.meals[mealIdx];
      d.customMeals[mealIdx] = {
        n: original.n,
        t: original.t,
        i: original.i,
        k: kcal,
        c: carb,
        p: prot,
        f: fat,
        ings: ings
      };
    } else {
      delete d.customMeals[mealIdx];
    }
  }
  updateStatsForDate(activeK);
  save();
  closeBase();
  renderAll();
}

// 档案与设置（保持不变）
function openProfile() {
  const p = S.profile;
  const html = `
    <h2>我的档案</h2>
    <div><label>性别</label><select id="gender" class="ios-input"><option value="male" ${p.gender==='male'?'selected':''}>男</option><option value="female" ${p.gender==='female'?'selected':''}>女</option></select></div>
    <div><label>年龄</label><input type="number" id="age" class="ios-input" value="${p.age}"></div>
    <div><label>身高(cm)</label><input type="number" id="height" class="ios-input" value="${p.height}"></div>
    <div><label>体重(kg)</label><input type="number" id="weight" class="ios-input" value="${p.weight}"></div>
    <div><label>体脂率(%)</label><input type="number" id="bodyFat" class="ios-input" step="0.1" value="${p.bodyFat !== null ? p.bodyFat : ''}" placeholder="可选"></div>
    <div><label class="checkbox-label"><input type="checkbox" id="useCustom" ${p.useCustom ? 'checked' : ''}> 手动设定基础代谢</label></div>
    <div id="customBmrDiv" style="${!p.useCustom ? 'display:none;' : ''}"><label>自定义BMR (kcal/天)</label><input type="number" id="customBMR" class="ios-input" value="${p.customBMR || ''}"></div>
    <hr style="margin:15px 0; border-color:var(--border-light);">
    <h3>目标设定</h3>
    <div><label>目标体重(kg)</label><input type="number" id="goalWeight" class="ios-input" value="${p.goalWeight || 70}"></div>
    <div><label>目标体脂率(%)</label><input type="number" id="goalBodyFat" class="ios-input" value="${p.goalBodyFat || 12}"></div>
    <button class="primary-btn" id="saveProfileBtn">保存档案并更新BMR</button>
    <button class="primary-btn danger-btn" id="resetDataBtn" style="background:var(--ios-red); margin-top:10px;">重置所有数据</button>
  `;
  showBasePanel(html);
  document.getElementById('useCustom').addEventListener('change', (e) => {
    document.getElementById('customBmrDiv').style.display = e.target.checked ? 'block' : 'none';
  });
  document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);
  document.getElementById('resetDataBtn').addEventListener('click', () => {
    if (confirm("⚠️ 确认重置所有数据？此操作不可恢复！")) {
      localStorage.removeItem(DB_KEY);
      location.reload();
    }
  });
}

function saveProfile() {
  const newProfile = {
    gender: document.getElementById('gender').value,
    age: +document.getElementById('age').value,
    height: +document.getElementById('height').value,
    weight: +document.getElementById('weight').value,
    bodyFat: document.getElementById('bodyFat').value ? +document.getElementById('bodyFat').value : null,
    useCustom: document.getElementById('useCustom').checked,
    customBMR: document.getElementById('useCustom').checked ? +document.getElementById('customBMR').value : null,
    goalWeight: +document.getElementById('goalWeight').value,
    goalDeficit: S.profile.goalDeficit || 500,
    goalBodyFat: +document.getElementById('goalBodyFat').value
  };
  S.profile = newProfile;
  const newBMR = calculateBMR(newProfile);
  for (let k in S.days) S.days[k].bmr = newBMR;
  for (let k in S.days) updateStatsForDate(k);
  save();
  closeBase();
  renderAll();
  alert("档案已更新，所有历史日期的BMR已同步。");
}

function openPlan() {
  const d = getDay(activeK);
  const html = `
    <h2>方案配置</h2>
    <div style="margin-bottom:15px;">
      <label class="checkbox-label"><input type="checkbox" id="inheritCheck" ${S.inheritPrevious ? 'checked' : ''}> 新日期继承前一日方案</label>
    </div>
    <div style="margin-bottom:15px;">
      <label>阶段 (1-4)</label>
      <select id="phase-sel" class="ios-input" style="font-size:18px;">
        <option value="1" ${d.p===1?'selected':''}>阶段1 (高碳)</option>
        <option value="2" ${d.p===2?'selected':''}>阶段2 (中碳)</option>
        <option value="3" ${d.p===3?'selected':''}>阶段3 (低碳)</option>
        <option value="4" ${d.p===4?'selected':''}>阶段4 (极低碳)</option>
      </select>
    </div>
    <div style="margin-bottom:25px;">
      <label>模式</label>
      <select id="mode-sel" class="ios-input">
        <option value="train" ${d.m==='train'?'selected':''}>训练日</option>
        <option value="rest" ${d.m==='rest'?'selected':''}>休息日</option>
      </select>
    </div>
    <button class="primary-btn" id="savePlanBtn">更新今日方案</button>
  `;
  showBasePanel(html);
  document.getElementById('savePlanBtn').addEventListener('click', () => {
    const d = getDay(activeK);
    d.p = parseInt(document.getElementById('phase-sel').value);
    d.m = document.getElementById('mode-sel').value;
    d.checked = [];
    S.inheritPrevious = document.getElementById('inheritCheck').checked;
    updateStatsForDate(activeK);
    save();
    closeBase();
    renderAll();
  });
}

function openWeight() {
  const d = getDay(activeK);
  showBasePanel(`
    <h2>体重录入</h2>
    <input type="number" id="w-ipt" class="ios-input" step="0.1" value="${d.w||''}" placeholder="0.0">
    <button class="primary-btn" style="margin-top:20px;" id="saveWeightBtn">确认保存</button>
  `);
  document.getElementById('saveWeightBtn').addEventListener('click', () => {
    getDay(activeK).w = +document.getElementById('w-ipt').value;
    updateStatsForDate(activeK);
    save();
    closeBase();
    renderAll();
  });
}

function openHistory() {
  const jumpHtml = `
    <div class="jump-date">
      <input type="date" id="jumpDateInput" value="${getK(new Date())}" style="flex:1; background:var(--bg3); border:1px solid var(--border-light); padding:8px; border-radius:12px; color:var(--text1);">
      <button class="icon-btn" id="jumpDateBtn">跳转</button>
    </div>
  `;
  showBasePanel(`
    <h2>历史复盘</h2>
    ${jumpHtml}
    <div style="display:flex; align-items:center; justify-content:space-between; margin:12px 0 8px;">
      <button class="icon-btn" id="cal-prev">＜</button>
      <div id="cal-title" style="font-size:15px; font-weight:500;"></div>
      <button class="icon-btn" id="cal-next">＞</button>
    </div>
    <div style="display:grid; grid-template-columns:repeat(7,1fr); gap:2px; text-align:center; margin-bottom:4px;">
      ${['一','二','三','四','五','六','日'].map(d=>`<div style="font-size:10px; color:var(--text3); padding:4px 0;">${d}</div>`).join('')}
    </div>
    <div id="cal-grid" style="display:grid; grid-template-columns:repeat(7,1fr); gap:3px;"></div>
    <div id="cal-detail" style="margin-top:16px;"></div>
    <div style="margin-top:15px;">
      <button class="icon-btn" id="exportDataBtn">📁 导出数据</button>
      <button class="icon-btn" id="importDataBtn">📂 导入数据</button>
    </div>
  `);

  let calYear = new Date().getFullYear();
  let calMonth = new Date().getMonth(); // 0-indexed

  function renderCalendar() {
    document.getElementById('cal-title').innerText = `${calYear}年${calMonth+1}月`;
    const grid = document.getElementById('cal-grid');
    grid.innerHTML = '';
    document.getElementById('cal-detail').innerHTML = '';

    // 当月第一天是星期几（周一=0）
    const firstDay = new Date(calYear, calMonth, 1);
    const startDow = (firstDay.getDay() + 6) % 7; // 0=Mon
    const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();

    // 空格子
    for (let i = 0; i < startDow; i++) {
      grid.insertAdjacentHTML('beforeend', `<div></div>`);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const k = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const d = S.days[k];
      const stats = d ? getStats(k) : null;
      const intake = stats ? Math.round(stats.intake) : 0;
      const hasData = !!d;

      // 训练文字
      let trainText = '';
      if (d) {
        const parts = [];
        if (d.s > 0 || d.ps) {
          const tag = d.ps ? d.ps.split(',')[0] : '';
          parts.push('力量' + (tag ? '·'+tag : ''));
        }
        if (d.c > 0 || d.pc) {
          const tag = d.pc ? d.pc.split(',')[0] : '';
          parts.push('有氧' + (tag ? '·'+tag : ''));
        }
        trainText = parts.join(' ');
      }

      const isToday = k === getK(new Date());
      grid.insertAdjacentHTML('beforeend', `
        <div data-cal-date="${k}" style="
          border-radius:10px;
          background:${hasData ? 'rgba(0,122,255,0.08)' : 'var(--card-bg)'};
          border:1px solid ${isToday ? 'var(--ios-blue)' : 'transparent'};
          padding:4px 3px;
          cursor:${hasData ? 'pointer' : 'default'};
          min-height:54px;
          display:flex; flex-direction:column; align-items:center; gap:2px;
        ">
          <div style="font-size:11px; color:${isToday ? 'var(--ios-blue)' : 'var(--text2)'}; font-weight:${isToday?'600':'400'};">${day}</div>
          ${hasData && intake > 0 ? `
            <div style="width:100%; background:var(--ios-blue); border-radius:4px; padding:1px 3px; text-align:center;">
              <span style="font-size:9px; color:#fff; font-family:var(--mono);">${intake}</span>
            </div>
          ` : ''}
          ${trainText ? `<div style="font-size:8px; color:var(--ios-teal); text-align:center; line-height:1.2;">${trainText}</div>` : ''}
        </div>
      `);
    }

    // 点击格子展开详情
    grid.querySelectorAll('[data-cal-date]').forEach(cell => {
      cell.addEventListener('click', () => {
        const k = cell.dataset.calDate;
        const d = S.days[k];
        if (!d) return;
        showDayDetail(k, d);
      });
    });
  }

  function showDayDetail(k, d) {
    const plan = getPlan(d.p, d.m);
    const mealList = d.customMeals._mealList || plan.meals;
    const stats = getStats(k);
    const net = stats ? Math.round(stats.deficit) : 0;
    const netColor = net < 0 ? 'var(--ios-green)' : 'var(--ios-orange)';

    // 餐食
    let mealsHtml = mealList.map((m, idx) => {
      const done = d.checked.includes(idx);
      return `<div style="display:flex; align-items:center; gap:8px; padding:6px 0; border-bottom:1px solid var(--border-light);">
        <span style="color:${done ? 'var(--ios-green)' : 'var(--text3)'}; font-size:14px;">${done ? '✓' : '○'}</span>
        <span style="font-size:13px; color:${done ? 'var(--text1)' : 'var(--text3)'};">${m.i||''} ${m.n}</span>
        <span style="margin-left:auto; font-size:11px; color:var(--text3); font-family:var(--mono);">${Math.round(m.k)}kcal</span>
      </div>`;
    }).join('');

    // 运动
    let trainHtml = '';
    if (d.s > 0 || d.ps) {
      const tags = d.ps ? d.ps.split(',').filter(Boolean) : [];
      trainHtml += `<div style="padding:6px 0; border-bottom:1px solid var(--border-light);">
        <span style="font-size:13px;">💪 力量训练</span>
        ${tags.length ? `<span style="font-size:11px; color:var(--ios-teal); margin-left:8px;">${tags.join(' · ')}</span>` : ''}
        <span style="float:right; font-family:var(--mono); font-size:12px; color:var(--ios-blue);">${d.s} kcal</span>
      </div>`;
    }
    if (d.c > 0 || d.pc) {
      const tags = d.pc ? d.pc.split(',').filter(Boolean) : [];
      trainHtml += `<div style="padding:6px 0; border-bottom:1px solid var(--border-light);">
        <span style="font-size:13px;">🏃 有氧运动</span>
        ${tags.length ? `<span style="font-size:11px; color:var(--ios-teal); margin-left:8px;">${tags.join(' · ')}</span>` : ''}
        <span style="float:right; font-family:var(--mono); font-size:12px; color:var(--ios-blue);">${d.c} kcal</span>
      </div>`;
    }

    document.getElementById('cal-detail').innerHTML = `
      <div style="background:var(--card-bg); border-radius:18px; padding:16px; border:1px solid var(--border-light);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <span style="font-size:14px; font-weight:500;">${k} · 阶段${d.p}·${d.m==='train'?'训练日':'休息日'}</span>
          <button class="history-edit-btn" data-date="${k}">📝</button>
        </div>
        <div style="margin-bottom:10px;">${mealsHtml}</div>
        ${trainHtml}
        <div style="margin-top:10px; text-align:right; font-family:var(--mono); font-size:13px; color:${netColor};">
          净赤字 ${net >= 0 ? '+' : ''}${net} kcal
        </div>
      </div>
    `;

    document.querySelector('#cal-detail .history-edit-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      editDayPlan(k);
    });
  }

  renderCalendar();

  document.getElementById('cal-prev').addEventListener('click', () => {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCalendar();
  });
  document.getElementById('cal-next').addEventListener('click', () => {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendar();
  });
  document.getElementById('jumpDateBtn')?.addEventListener('click', () => {
    const date = document.getElementById('jumpDateInput').value;
    if (date) { activeK = date; closeBase(); renderAll(); }
  });
  document.getElementById('exportDataBtn')?.addEventListener('click', exportData);
  document.getElementById('importDataBtn')?.addEventListener('click', importData);
}

  function editDayPlan(k) {
  const d = getDay(k);
  const html = `
    <h2>编辑 ${k} 的计划</h2>
    <div style="margin-bottom:15px;">
      <label>阶段 (1-4)</label>
      <select id="phaseEdit" class="ios-input" style="font-size:18px;">
        <option value="1" ${d.p===1?'selected':''}>阶段1 (高碳)</option>
        <option value="2" ${d.p===2?'selected':''}>阶段2 (中碳)</option>
        <option value="3" ${d.p===3?'selected':''}>阶段3 (低碳)</option>
        <option value="4" ${d.p===4?'selected':''}>阶段4 (极低碳)</option>
      </select>
    </div>
    <div style="margin-bottom:25px;">
      <label>模式</label>
      <select id="modeEdit" class="ios-input">
        <option value="train" ${d.m==='train'?'selected':''}>训练日</option>
        <option value="rest" ${d.m==='rest'?'selected':''}>休息日</option>
      </select>
    </div>
    <button class="primary-btn" id="saveDayPlanBtn">保存</button>
  `;
  showBasePanel(html);
  document.getElementById('saveDayPlanBtn').addEventListener('click', () => {
    const d = getDay(k);
    d.p = parseInt(document.getElementById('phaseEdit').value);
    d.m = document.getElementById('modeEdit').value;
    d.checked = [];
    updateStatsForDate(k);
    save();
    closeBase();
    if (activeK === k) renderAll();
    else openHistory();
  });
}

function openAnalysis() {
  const sorted = Object.keys(S.days).sort().reverse();
  const last30 = sorted.slice(0,30);
  const recentDays = sorted.slice(0,7);
  let totalCarb=0, totalProt=0, totalFat=0, count=0;
  for (let k of recentDays) {
    const d = S.days[k];
    const plan = getPlan(d.p, d.m);
    if (plan) {
      let cur = {c:0,p:0,f:0};
      d.checked.forEach(idx => {
        const m = getMeal(plan, idx, d.customMeals);
        cur.c += m.c; cur.p += m.p; cur.f += m.f;
      });
      totalCarb += cur.c; totalProt += cur.p; totalFat += cur.f;
      count++;
    }
  }
  const avgCarb = count ? totalCarb/count : 0;
  const avgProt = count ? totalProt/count : 0;
  const avgFat = count ? totalFat/count : 0;
  const pieCanvas = `<canvas id="macroPie" width="200" height="200" style="width:200px; height:200px; margin:0 auto; display:block;"></canvas>`;
  const weekly = getSummary('week');
  const monthly = getSummary('month');
  const heatmapHtml = `<canvas id="heatmapCanvas" width="350" height="180" style="width:100%; max-width:350px; height:auto; background:var(--card-bg); border-radius:16px; margin:20px auto;"></canvas>`;
  const latestWeight = S.days[sorted[0]]?.w || S.profile.weight;
  const weightProgress = ((S.profile.goalWeight - latestWeight) / (S.profile.goalWeight - S.profile.weight) * 100) || 0;
  const todayPlan = getPlan(getDay(activeK).p, getDay(activeK).m);
  const todayDeficit = getNetDeficit(getDay(activeK), todayPlan);
  const deficitProgress = (todayDeficit / S.profile.goalDeficit) * 100;
  let bodyFatProgress = 0;
  if (S.profile.bodyFat !== null && S.profile.goalBodyFat > 0) {
    bodyFatProgress = ((S.profile.bodyFat - S.profile.goalBodyFat) / (S.profile.bodyFat - 0)) * 100;
    bodyFatProgress = Math.min(100, Math.max(0, bodyFatProgress));
  }
  let suggestion = '';
  if (sorted.length >= 7) {
    let avgDeficit = 0;
    const last7 = sorted.slice(0,7);
    let totalDeficit = 0;
    for (let k of last7) {
      const stats = getStats(k);
      if (stats) totalDeficit += stats.deficit;
    }
    avgDeficit = totalDeficit / 7;
    const currentPhase = getDay(activeK).p;
    if (avgDeficit > -S.profile.goalDeficit*0.8 && currentPhase < 4) {
      suggestion = `
        <div class="suggestion-card">
          <strong>💡 阶段建议</strong><br>
          最近7天平均赤字仅 ${Math.round(avgDeficit)} kcal，低于目标 ${S.profile.goalDeficit} kcal 的80%。<br>
          建议尝试进入阶段 ${currentPhase+1} 以提高减脂效率。
          <button class="icon-btn" style="margin-top:8px;" id="applySuggestionBtn">应用建议</button>
        </div>
      `;
    }
  }

  const html = `
    <div class="tab-bar" id="analysisTabs">
      <button class="tab-btn active" data-tab="goals">🎯 目标</button>
      <button class="tab-btn" data-tab="charts">🥧 营养</button>
      <button class="tab-btn" data-tab="weekly">📅 周月汇总</button>
      <button class="tab-btn" data-tab="heatmap">🔥 热力图</button>
    </div>
    ${suggestion}
    <div id="tabGoals" class="tab-content">
      <div class="goal-progress"><strong>体重目标</strong> ${latestWeight}kg → ${S.profile.goalWeight}kg<div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100, Math.max(0, weightProgress))}%"></div></div></div>
      <div class="goal-progress"><strong>今日赤字目标</strong> ${Math.round(todayDeficit)} / ${S.profile.goalDeficit} kcal<div class="progress-bar"><div class="progress-fill" style="width:${Math.min(100, Math.max(0, deficitProgress))}%"></div></div></div>
      <div class="goal-progress"><strong>体脂率目标</strong> ${S.profile.bodyFat !== null ? S.profile.bodyFat + '% → ' + S.profile.goalBodyFat + '%' : '未录入 → '+S.profile.goalBodyFat+'%'}<div class="progress-bar"><div class="progress-fill" style="width:${bodyFatProgress}%"></div></div></div>
    </div>
    <div id="tabCharts" class="tab-content hidden">
      <h3>近7天平均宏量占比</h3>
      ${pieCanvas}
    </div>
    <div id="tabWeekly" class="tab-content hidden">
      <h3>本周汇总</h3>
      <p>总赤字: ${weekly.totalDeficit} kcal | 平均赤字: ${weekly.avgDeficit} kcal</p>
      <p>餐食完成率: ${weekly.mealCompletion}% | 运动天数: ${weekly.sportDays}</p>
      <h3>本月汇总</h3>
      <p>总赤字: ${monthly.totalDeficit} kcal | 平均赤字: ${monthly.avgDeficit} kcal</p>
      <p>餐食完成率: ${monthly.mealCompletion}% | 运动天数: ${monthly.sportDays}</p>
    </div>
    <div id="tabHeatmap" class="tab-content hidden">
      ${heatmapHtml}
    </div>
  `;
  showBasePanel(html);
  if (suggestion) {
    document.getElementById('applySuggestionBtn')?.addEventListener('click', () => {
      const newPhase = getDay(activeK).p + 1;
      applyPhaseSuggestion(newPhase);
    });
  }
  setTimeout(() => {
    const pieCanvas = document.getElementById('macroPie');
    if (pieCanvas) drawPieChart(pieCanvas, [avgCarb, avgProt, avgFat], ['碳水', '蛋白', '脂肪']);
    const heatCanvas = document.getElementById('heatmapCanvas');
    if (heatCanvas && last30.length) drawHeatmap(heatCanvas, last30);
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        document.getElementById(`tab${btn.dataset.tab}`).classList.remove('hidden');
      });
    });
  }, 50);
}

function applyPhaseSuggestion(newPhase) {
  const d = getDay(activeK);
  d.p = newPhase;
  d.checked = [];
  if (confirm("是否将全局默认方案也更新为阶段 "+newPhase+"？")) {
    S.phase = newPhase;
  }
  updateStatsForDate(activeK);
  save();
  closeBase();
  renderAll();
  alert(`已将今日方案切换为阶段 ${newPhase}。`);
}

function drawPieChart(canvas, values, labels) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0,0,w,h);
  const total = values.reduce((a,b)=>a+b,0);
  if (total === 0) return;
  let start = -Math.PI/2;
  const colors = ['#007AFF', '#34C759', '#FF9500'];
  for (let i=0; i<values.length; i++) {
    const angle = (values[i]/total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(w/2, h/2);
    ctx.arc(w/2, h/2, Math.min(w,h)/2, start, start+angle);
    ctx.fillStyle = colors[i];
    ctx.fill();
    start += angle;
  }
  let legendY = h-20;
  for (let i=0; i<labels.length; i++) {
    ctx.fillStyle = colors[i];
    ctx.fillRect(w-50, legendY-8, 10, 10);
    ctx.fillStyle = 'var(--text2)';
    ctx.fillText(`${labels[i]} ${Math.round(values[i])}g`, w-38, legendY);
    legendY -= 15;
  }
}

function getSummary(period) {
  const now = new Date();
  let start;
  if (period === 'week') {
    start = new Date(now);
    start.setDate(now.getDate() - 7);
  } else {
    start = new Date(now);
    start.setMonth(now.getMonth() - 1);
  }
  const startStr = getK(start);
  let totalDeficit = 0, totalMeals = 0, doneMeals = 0, sportDays = 0, dayCount = 0;
  for (let k in S.days) {
    if (k >= startStr) {
      const stats = getStats(k);
      if (stats) {
        totalDeficit += stats.deficit;
        totalMeals += stats.totalMeals;
        doneMeals += stats.mealsDone;
        if (stats.sportCompleted) sportDays++;
        dayCount++;
      }
    }
  }
  return {
    totalDeficit: Math.round(totalDeficit),
    avgDeficit: dayCount ? Math.round(totalDeficit/dayCount) : 0,
    mealCompletion: totalMeals ? Math.round((doneMeals/totalMeals)*100) : 0,
    sportDays
  };
}

function drawHeatmap(canvas, dates) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0,0,w,h);
  const cellSize = 30, margin = 20;
  const startX = margin, startY = margin;
  for (let i=0; i<dates.length && i<35; i++) {
    const k = dates[i];
    const stats = getStats(k);
    let completion = stats ? stats.mealsDone / stats.totalMeals : 0;
    const color = `rgba(52,199,89, ${0.2 + completion*0.8})`;
    const col = i % 7, row = Math.floor(i / 7);
    ctx.fillStyle = color;
    ctx.fillRect(startX + col*cellSize, startY + row*cellSize, cellSize-2, cellSize-2);
    ctx.fillStyle = 'var(--text3)';
    ctx.font = '8px monospace';
    ctx.fillText(k.slice(5), startX + col*cellSize+2, startY + row*cellSize+12);
  }
  ctx.fillStyle = 'var(--text2)';
  ctx.font = '10px monospace';
  ctx.fillText('最近30天完成率热力图 (绿色越深完成越高)', margin, h-5);
}

function drawLineChart(canvas, values, color='#34C759') {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0,0,w,h);
  if (values.length < 2) return;
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;
  const xStep = w / (values.length - 1);
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  values.forEach((v,i) => {
    const x = i * xStep;
    const y = h - 20 - ((v - minVal) / range) * (h - 40);
    if (i===0) ctx.moveTo(x,y);
    else ctx.lineTo(x,y);
  });
  ctx.stroke();
  values.forEach((v,i) => {
    const x = i * xStep;
    const y = h - 20 - ((v - minVal) / range) * (h - 40);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2*Math.PI);
    ctx.fill();
  });
  ctx.fillStyle = 'var(--text3)';
  ctx.font = '9px monospace';
  ctx.fillText(`${Math.round(minVal)}`, 5, h-10);
  ctx.fillText(`${Math.round(maxVal)}`, w-40, 15);
}

function exportData() {
  const dataStr = JSON.stringify(S, null, 2);
  const blob = new Blob([dataStr], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `utopia_backup_${getK(new Date())}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (imported && typeof imported === 'object') {
          S = imported;
          if (!S.version) S.version = 2;
          if (!S.profile.bodyFat) S.profile.bodyFat = null;
          if (!S.statsCache) S.statsCache = {};
          save();
          location.reload();
        } else alert('文件格式错误');
      } catch(e) { alert('解析失败'); }
    };
    reader.readAsText(file);
  };
  input.click();
}

function confirmDay() {
  const d = getDay(activeK);
  const plan = getPlan(d.p, d.m);
  if (isDayComplete(d, plan)) {
    d.done = true;
    updateStatsForDate(activeK);
    save();
    renderAll();
  }
}

function showBasePanel(html) {
  const panel = document.getElementById('base-panel-content');
  panel.innerHTML = html + `<button id="closeBaseBtn" style="width:100%; color:var(--text3); border:none; background:none; margin-top:20px;">关闭</button>`;
  document.getElementById('closeBaseBtn').addEventListener('click', closeBase);
  document.getElementById('base-overlay').classList.remove('hidden');
}

function closeBase() {
  document.getElementById('base-overlay').classList.add('hidden');
}

function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  if (current === 'light') {
    html.removeAttribute('data-theme');
    localStorage.setItem('theme', 'dark');
  } else {
    html.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
  }
}

// ------------------- 运动页 -------------------