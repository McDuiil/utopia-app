// ===== sport.js: 运动模块 =====
const SPORT_KEY = 'utopia_sport_v1';
let sportData = { categories: [], templates: [], sessions: [] };
let currentSession = null;
let sessionTimerInterval = null;
let sessionStartTime = null;

function loadSportData() {
  try {
    const stored = localStorage.getItem(SPORT_KEY);
    if (stored) sportData = JSON.parse(stored);
  } catch(e) {}
  if (!sportData.categories) sportData.categories = [];
  if (!sportData.templates) sportData.templates = [];
  if (!sportData.sessions) sportData.sessions = [];
}

function saveSportData() {
  localStorage.setItem(SPORT_KEY, JSON.stringify(sportData));
}

// 页面切换
function switchPage(page) {
  ['main','sport','history','analysis'].forEach(p => {
    const el = document.getElementById(`page-${p}`);
    if (el) el.classList.toggle('hidden', p !== page);
  });
  document.querySelectorAll('.tab-nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === page);
  });
  const footerEl = document.querySelector('.footer-check');
  if (footerEl) footerEl.style.display = page === 'main' ? '' : 'none';
  if (page === 'sport') renderSportPage();
  if (page === 'history') { document.getElementById('history-page-content').innerHTML = ''; openHistoryInPage(); }
  if (page === 'analysis') { document.getElementById('analysis-page-content').innerHTML = ''; openAnalysisInPage(); }
}

function openHistoryInPage() {
  const container = document.getElementById('history-page-content');
  // 复用openHistory逻辑，渲染到容器内
  const tmpOverlay = document.createElement('div');
  document.body.appendChild(tmpOverlay);
  const origShow = window._origShowBase;
  openHistory();
  // openHistory uses showBasePanel which uses base-overlay; 
  // instead we render calendar directly
  closeBase();
  document.body.removeChild(tmpOverlay);
  renderHistoryPage(container);
}

function renderHistoryPage(container) {
  let calYear = new Date().getFullYear();
  let calMonth = new Date().getMonth();
  container.innerHTML = `
    <div style="padding-top:16px;">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
        <button class="icon-btn" id="hcal-prev">＜</button>
        <div id="hcal-title" style="font-size:15px; font-weight:500;"></div>
        <button class="icon-btn" id="hcal-next">＞</button>
      </div>
      <div style="display:grid; grid-template-columns:repeat(7,1fr); gap:2px; text-align:center; margin-bottom:4px;">
        ${['一','二','三','四','五','六','日'].map(d=>`<div style="font-size:10px; color:var(--text3); padding:4px 0;">${d}</div>`).join('')}
      </div>
      <div id="hcal-grid" style="display:grid; grid-template-columns:repeat(7,1fr); gap:3px;"></div>
      <div id="hcal-detail" style="margin-top:16px;"></div>
      <div style="margin-top:15px; padding-bottom:20px;">
        <button class="icon-btn" id="hExportBtn">📁 导出数据</button>
        <button class="icon-btn" id="hImportBtn">📂 导入数据</button>
      </div>
    </div>
  `;
  function renderHCal() {
    document.getElementById('hcal-title').innerText = `${calYear}年${calMonth+1}月`;
    const grid = document.getElementById('hcal-grid');
    grid.innerHTML = '';
    document.getElementById('hcal-detail').innerHTML = '';
    const firstDay = new Date(calYear, calMonth, 1);
    const startDow = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
    for (let i = 0; i < startDow; i++) grid.insertAdjacentHTML('beforeend', `<div></div>`);
    for (let day = 1; day <= daysInMonth; day++) {
      const k = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const d = S.days[k];
      const stats = d ? getStats(k) : null;
      const intake = stats ? Math.round(stats.intake) : 0;
      const hasData = !!d;
      let trainText = '';
      if (d) {
        const parts = [];
        if (d.s > 0 || d.ps) parts.push('力量' + (d.ps ? '·'+d.ps.split(',')[0] : ''));
        if (d.c > 0 || d.pc) parts.push('有氧' + (d.pc ? '·'+d.pc.split(',')[0] : ''));
        trainText = parts.join(' ');
      }
      const isToday = k === getK(new Date());
      grid.insertAdjacentHTML('beforeend', `
        <div data-hcal-date="${k}" style="border-radius:10px; background:${hasData?'rgba(0,122,255,0.08)':'var(--card-bg)'}; border:1px solid ${isToday?'var(--ios-blue)':'transparent'}; padding:4px 3px; cursor:${hasData?'pointer':'default'}; min-height:54px; display:flex; flex-direction:column; align-items:center; gap:2px;">
          <div style="font-size:11px; color:${isToday?'var(--ios-blue)':'var(--text2)'}; font-weight:${isToday?'600':'400'};">${day}</div>
          ${hasData && intake > 0 ? `<div style="width:100%; background:var(--ios-blue); border-radius:4px; padding:1px 3px; text-align:center;"><span style="font-size:9px; color:#fff; font-family:var(--mono);">${intake}</span></div>` : ''}
          ${trainText ? `<div style="font-size:8px; color:var(--ios-teal); text-align:center; line-height:1.2;">${trainText}</div>` : ''}
        </div>
      `);
    }
    grid.querySelectorAll('[data-hcal-date]').forEach(cell => {
      cell.addEventListener('click', () => {
        const k = cell.dataset.hcalDate;
        const d = S.days[k];
        if (!d) return;
        const plan = getPlan(d.p, d.m);
        const mealList = (d.customMeals && d.customMeals._mealList) || plan.meals;
        const stats = getStats(k);
        const net = stats ? Math.round(stats.deficit) : 0;
        const netColor = net < 0 ? 'var(--ios-green)' : 'var(--ios-orange)';
        const mealsHtml = mealList.map((m, idx) => {
          const done = d.checked.includes(idx);
          return `<div style="display:flex; align-items:center; gap:8px; padding:6px 0; border-bottom:1px solid var(--border-light);">
            <span style="color:${done?'var(--ios-green)':'var(--text3)'}; font-size:14px;">${done?'✓':'○'}</span>
            <span style="font-size:13px; color:${done?'var(--text1)':'var(--text3)'};">${m.i||''} ${m.n}</span>
            <span style="margin-left:auto; font-size:11px; color:var(--text3); font-family:var(--mono);">${Math.round(m.k)}kcal</span>
          </div>`;
        }).join('');
        let trainHtml = '';
        if (d.s > 0 || d.ps) {
          const tags = d.ps ? d.ps.split(',').filter(Boolean) : [];
          trainHtml += `<div style="padding:6px 0; border-bottom:1px solid var(--border-light);"><span style="font-size:13px;">💪 力量训练</span>${tags.length?`<span style="font-size:11px; color:var(--ios-teal); margin-left:8px;">${tags.join(' · ')}</span>`:''}<span style="float:right; font-family:var(--mono); font-size:12px; color:var(--ios-blue);">${d.s} kcal</span></div>`;
        }
        if (d.c > 0 || d.pc) {
          const tags = d.pc ? d.pc.split(',').filter(Boolean) : [];
          trainHtml += `<div style="padding:6px 0; border-bottom:1px solid var(--border-light);"><span style="font-size:13px;">🏃 有氧运动</span>${tags.length?`<span style="font-size:11px; color:var(--ios-teal); margin-left:8px;">${tags.join(' · ')}</span>`:''}<span style="float:right; font-family:var(--mono); font-size:12px; color:var(--ios-blue);">${d.c} kcal</span></div>`;
        }
        document.getElementById('hcal-detail').innerHTML = `
          <div style="background:var(--card-bg); border-radius:18px; padding:16px; border:1px solid var(--border-light);">
            <div style="font-size:14px; font-weight:500; margin-bottom:12px;">${k} · 阶段${d.p}·${d.m==='train'?'训练日':'休息日'}</div>
            <div style="margin-bottom:10px;">${mealsHtml}</div>
            ${trainHtml}
            <div style="margin-top:10px; text-align:right; font-family:var(--mono); font-size:13px; color:${netColor};">净赤字 ${net>=0?'+':''}${net} kcal</div>
          </div>`;
      });
    });
  }
  renderHCal();
  document.getElementById('hcal-prev').addEventListener('click', () => { calMonth--; if(calMonth<0){calMonth=11;calYear--;} renderHCal(); });
  document.getElementById('hcal-next').addEventListener('click', () => { calMonth++; if(calMonth>11){calMonth=0;calYear++;} renderHCal(); });
  document.getElementById('hExportBtn')?.addEventListener('click', exportData);
  document.getElementById('hImportBtn')?.addEventListener('click', importData);
}

function openAnalysisInPage() {
  const container = document.getElementById('analysis-page-content');
  container.style.paddingTop = '16px';
  // 直接调用openAnalysis但渲染到页面内
  openAnalysis();
  // 把base-panel内容搬过来
  setTimeout(() => {
    const panel = document.getElementById('base-panel-content');
    if (panel) {
      container.innerHTML = panel.innerHTML;
      closeBase();
      // 重新绑定tab事件
      container.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          container.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
          const tabEl = container.querySelector(`#tab${btn.dataset.tab}`);
          if (tabEl) tabEl.classList.remove('hidden');
        });
      });
      container.querySelector('#applySuggestionBtn')?.addEventListener('click', () => {
        applyPhaseSuggestion(getDay(activeK).p + 1);
      });
      setTimeout(() => {
        const pieCanvas = container.querySelector('#macroPie');
        if (pieCanvas) {
          const sorted = Object.keys(S.days).sort().reverse();
          const recentDays = sorted.slice(0,7);
          let totalCarb=0,totalProt=0,totalFat=0,count=0;
          for (let k of recentDays) {
            const d = S.days[k]; const plan = getPlan(d.p,d.m);
            if(plan){let cur={c:0,p:0,f:0};d.checked.forEach(idx=>{const m=getMeal(plan,idx,d.customMeals);cur.c+=m.c;cur.p+=m.p;cur.f+=m.f;});totalCarb+=cur.c;totalProt+=cur.p;totalFat+=cur.f;count++;}
          }
          drawPieChart(pieCanvas,[totalCarb/count||0,totalProt/count||0,totalFat/count||0],['碳水','蛋白','脂肪']);
        }
        const heatCanvas = container.querySelector('#heatmapCanvas');
        if (heatCanvas) drawHeatmap(heatCanvas, Object.keys(S.days).sort().reverse().slice(0,30));
      }, 50);
    }
  }, 50);
}

// ---- 运动页渲染 ----
function renderSportPage() {
  renderExerciseLibrary();
  renderTemplateList();
  renderTemplateQuickList();
  renderRecentWorkouts();
}

function renderExerciseLibrary() {
  const list = document.getElementById('exercise-category-list');
  if (!list) return;
  if (sportData.categories.length === 0) {
    list.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text3); font-size:13px;">暂无动作分类<br>点击"+ 大类"开始添加</div>`;
    return;
  }
  list.innerHTML = sportData.categories.map((cat, ci) => `
    <div class="category-block">
      <div class="category-header" data-ci="${ci}">
        <span>${cat.name}</span>
        <div style="display:flex; gap:8px;">
          <button class="icon-btn add-exercise-btn" data-ci="${ci}" style="font-size:11px; padding:4px 8px;">+ 动作</button>
          <button class="icon-btn del-cat-btn" data-ci="${ci}" style="font-size:11px; padding:4px 8px; color:var(--ios-red);">删</button>
        </div>
      </div>
      <div class="category-exercises" id="cat-exercises-${ci}">
        ${cat.exercises.length === 0 ? `<div style="font-size:12px; color:var(--text3); padding:4px 0;">暂无动作</div>` :
          cat.exercises.map((ex, ei) => `
            <div class="exercise-item">
              <span>${ex.name}</span>
              <button class="icon-btn del-ex-btn" data-ci="${ci}" data-ei="${ei}" style="font-size:11px; padding:3px 8px; color:var(--ios-red);">删</button>
            </div>
          `).join('')}
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.add-exercise-btn').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); addExercise(parseInt(btn.dataset.ci)); });
  });
  list.querySelectorAll('.del-cat-btn').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation();
      if (confirm('删除该分类及所有动作？')) { sportData.categories.splice(parseInt(btn.dataset.ci), 1); saveSportData(); renderExerciseLibrary(); }
    });
  });
  list.querySelectorAll('.del-ex-btn').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation();
      sportData.categories[parseInt(btn.dataset.ci)].exercises.splice(parseInt(btn.dataset.ei), 1);
      saveSportData(); renderExerciseLibrary();
    });
  });
}

function addExercise(ci) {
  const name = prompt('输入动作名称：');
  if (!name || !name.trim()) return;
  sportData.categories[ci].exercises.push({ name: name.trim(), pr: null });
  saveSportData();
  renderExerciseLibrary();
}

function renderTemplateList() {
  const list = document.getElementById('template-list');
  if (!list) return;
  if (sportData.templates.length === 0) {
    list.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text3); font-size:13px;">暂无模板<br>点击"+ 模板"开始创建</div>`;
    return;
  }
  list.innerHTML = sportData.templates.map((t, ti) => `
    <div class="template-card" data-ti="${ti}">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h3>${t.name}</h3>
        <button class="icon-btn del-template-btn" data-ti="${ti}" style="color:var(--ios-red); font-size:11px;">删</button>
      </div>
      <p>${t.exercises.map(e => e.name).join(' · ') || '暂无动作'}</p>
      <button class="icon-btn add-ex-to-template" data-ti="${ti}" style="margin-top:8px; font-size:11px;">+ 添加动作</button>
    </div>
  `).join('');

  list.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('icon-btn')) return;
      startWorkout(parseInt(card.dataset.ti));
    });
  });
  list.querySelectorAll('.del-template-btn').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation();
      if (confirm('删除该模板？')) { sportData.templates.splice(parseInt(btn.dataset.ti), 1); saveSportData(); renderTemplateList(); }
    });
  });
  list.querySelectorAll('.add-ex-to-template').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); addExerciseToTemplate(parseInt(btn.dataset.ti)); });
  });
}

function addExerciseToTemplate(ti) {
  const allExercises = sportData.categories.flatMap(c => c.exercises.map(e => e.name));
  if (allExercises.length === 0) { alert('请先在动作库添加动作'); return; }
  const name = prompt('输入动作名（可从库中选）：\n' + allExercises.join('、'));
  if (!name || !name.trim()) return;
  sportData.templates[ti].exercises.push({ name: name.trim() });
  saveSportData();
  renderTemplateList();
}

function renderTemplateQuickList() {
  const list = document.getElementById('template-quick-list');
  if (!list) return;
  if (sportData.templates.length === 0) {
    list.innerHTML = `<div style="font-size:12px; color:var(--text3);">还没有模板，去"模板"标签创建</div>`;
    return;
  }
  list.innerHTML = sportData.templates.map((t, ti) => `
    <div class="card" style="margin-bottom:10px;" data-quick-ti="${ti}">
      <div class="card-top">
        <div class="card-info">
          <h3 style="font-size:14px;">${t.name}</h3>
          <p>${t.exercises.map(e=>e.name).join(' · ') || '暂无动作'}</p>
        </div>
        <div style="color:var(--ios-blue); font-size:12px;">▶ 开始</div>
      </div>
    </div>
  `).join('');
  list.querySelectorAll('[data-quick-ti]').forEach(card => {
    card.addEventListener('click', () => startWorkout(parseInt(card.dataset.quickTi)));
  });
}

function renderRecentWorkouts() {
  const list = document.getElementById('recent-workout-list');
  if (!list) return;
  const recent = sportData.sessions.slice(-5).reverse();
  if (recent.length === 0) {
    list.innerHTML = `<div style="font-size:12px; color:var(--text3);">暂无训练记录</div>`;
    return;
  }
  list.innerHTML = recent.map(s => `
    <div class="workout-history-card">
      <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
        <span style="font-size:13px; font-weight:500;">${s.name}</span>
        <span style="font-size:11px; color:var(--text3); font-family:var(--mono);">${s.date}</span>
      </div>
      <div style="font-size:11px; color:var(--text3);">${s.exercises.map(e=>`${e.name} ${e.sets.length}组`).join(' · ')}</div>
      <div style="font-size:11px; color:var(--text3); margin-top:4px;">时长 ${s.duration || '--'}</div>
    </div>
  `).join('');
}

function startWorkout(templateIdx) {
  const template = templateIdx !== null ? sportData.templates[templateIdx] : { name: '空白训练', exercises: [] };
  currentSession = {
    name: template.name,
    date: getK(new Date()),
    startTime: Date.now(),
    exercises: template.exercises.map(e => ({
      name: e.name,
      sets: [{ weight: '', reps: '', done: false }]
    }))
  };
  renderSessionView();
  document.getElementById('workout-home').classList.add('hidden');
  document.getElementById('workout-session').classList.remove('hidden');
  // 切到训练子tab
  document.querySelectorAll('.sport-tab').forEach(t => t.classList.remove('active'));
  document.querySelector('[data-stab="workout"]').classList.add('active');
  document.querySelectorAll('.stab-content').forEach(c => c.classList.add('hidden'));
  document.getElementById('stab-workout').classList.remove('hidden');
  // 计时器
  sessionStartTime = Date.now();
  if (sessionTimerInterval) clearInterval(sessionTimerInterval);
  sessionTimerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
    const m = String(Math.floor(elapsed/60)).padStart(2,'0');
    const s2 = String(elapsed%60).padStart(2,'0');
    const el = document.getElementById('session-timer');
    if (el) el.innerText = `${m}:${s2}`;
  }, 1000);
}

function renderSessionView() {
  if (!currentSession) return;
  document.getElementById('session-title').innerText = currentSession.name;
  const container = document.getElementById('session-exercises');
  container.innerHTML = currentSession.exercises.map((ex, ei) => {
    // 找历史PR
    let pr = null;
    sportData.sessions.forEach(s => {
      s.exercises.forEach(se => {
        if (se.name === ex.name) {
          se.sets.forEach(set => {
            if (set.done && set.weight) {
              const w = parseFloat(set.weight);
              if (!pr || w > pr) pr = w;
            }
          });
        }
      });
    });
    return `
      <div class="exercise-block" id="ex-block-${ei}">
        <div class="exercise-block-title">
          <span>${ex.name}${pr ? `<span class="pr-badge">PR ${pr}kg</span>` : ''}</span>
          <button class="icon-btn del-ex-session" data-ei="${ei}" style="font-size:11px; color:var(--ios-red);">删</button>
        </div>
        <div class="set-rows" id="set-rows-${ei}">
          <div class="set-row" style="color:var(--text3); font-size:11px; margin-bottom:4px;">
            <span>组</span><span style="text-align:center;">重量(kg)</span><span style="text-align:center;">次数</span><span></span>
          </div>
          ${ex.sets.map((set, si) => `
            <div class="set-row" id="set-${ei}-${si}">
              <span class="set-num">${si+1}</span>
              <input type="number" class="set-weight" data-ei="${ei}" data-si="${si}" placeholder="0" value="${set.weight}" inputmode="decimal">
              <input type="number" class="set-reps" data-ei="${ei}" data-si="${si}" placeholder="0" value="${set.reps}" inputmode="numeric">
              <button class="set-done-btn ${set.done?'done':''}" data-ei="${ei}" data-si="${si}">${set.done?'✓':'○'}</button>
            </div>
          `).join('')}
        </div>
        <button class="icon-btn add-set-btn" data-ei="${ei}" style="margin-top:8px; font-size:11px; width:100%;">+ 添加一组</button>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.set-weight').forEach(input => {
    input.addEventListener('change', () => {
      currentSession.exercises[+input.dataset.ei].sets[+input.dataset.si].weight = input.value;
    });
  });
  container.querySelectorAll('.set-reps').forEach(input => {
    input.addEventListener('change', () => {
      currentSession.exercises[+input.dataset.ei].sets[+input.dataset.si].reps = input.value;
    });
  });
  container.querySelectorAll('.set-done-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const ei = +btn.dataset.ei, si = +btn.dataset.si;
      currentSession.exercises[ei].sets[si].done = !currentSession.exercises[ei].sets[si].done;
      btn.classList.toggle('done');
      btn.innerText = currentSession.exercises[ei].sets[si].done ? '✓' : '○';
    });
  });
  container.querySelectorAll('.add-set-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const ei = +btn.dataset.ei;
      currentSession.exercises[ei].sets.push({ weight: '', reps: '', done: false });
      renderSessionView();
    });
  });
  container.querySelectorAll('.del-ex-session').forEach(btn => {
    btn.addEventListener('click', () => {
      currentSession.exercises.splice(+btn.dataset.ei, 1);
      renderSessionView();
    });
  });
}

function finishSession() {
  if (!currentSession) return;
  if (sessionTimerInterval) clearInterval(sessionTimerInterval);
  const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
  const m = Math.floor(elapsed/60), s2 = elapsed%60;
  currentSession.duration = `${m}分${s2}秒`;

  // 更新PR
  currentSession.exercises.forEach(ex => {
    const catEx = sportData.categories.flatMap(c=>c.exercises).find(e=>e.name===ex.name);
    if (catEx) {
      ex.sets.forEach(set => {
        if (set.done && set.weight) {
          const w = parseFloat(set.weight);
          if (!catEx.pr || w > catEx.pr) catEx.pr = w;
        }
      });
    }
  });

  sportData.sessions.push(currentSession);
  saveSportData();
  currentSession = null;
  document.getElementById('workout-session').classList.add('hidden');
  document.getElementById('workout-home').classList.remove('hidden');
  renderSportPage();
  alert('训练完成！已保存记录。');
}