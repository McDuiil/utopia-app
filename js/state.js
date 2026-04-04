// ===== state.js: 状态管理、存储、Gist同步 =====
function safeMerge(remote, local) {
  // remote: 远程数据（旧），local: 本地新数据
  // 返回合并后的对象，以 local 为准，但保留 remote 中 local 没有的字段，并特殊处理 days
  if (!remote) return local;
  const output = { ...remote };

  // 1. 处理顶层普通字段（非 days 且非 profile 的字段）
  for (let key in local) {
    if (key === 'days' || key === 'profile') continue;
    // 如果是对象，递归合并，否则直接覆盖
    if (local[key] && typeof local[key] === 'object' && !Array.isArray(local[key])) {
      output[key] = safeMerge(remote[key], local[key]);
    } else {
      output[key] = local[key];
    }
  }

  // 2. 处理 profile
  if (local.profile) {
    if (!output.profile) output.profile = {};
    output.profile = safeMerge(remote.profile, local.profile);
  }

  // 3. 处理 days（最关键的合并）
  if (local.days) {
    if (!output.days) output.days = {};
    for (let dateKey in local.days) {
      const remoteDay = output.days[dateKey] || {};
      const localDay = local.days[dateKey];
      output.days[dateKey] = mergeDay(remoteDay, localDay);
    }
  }

  return output;
}

function mergeDay(remoteDay, localDay) {
  const merged = { ...remoteDay };
  // checked: 数组取并集，去重
  if (localDay.checked && Array.isArray(localDay.checked)) {
    const set = new Set([...(remoteDay.checked || []), ...localDay.checked]);
    merged.checked = Array.from(set);
  } else {
    merged.checked = localDay.checked || remoteDay.checked || [];
  }
  // s, c: 如果本地有值且大于0，用本地；否则用远程
  if (localDay.s !== undefined && localDay.s > 0) merged.s = localDay.s;
  else if (remoteDay.s !== undefined) merged.s = remoteDay.s;
  if (localDay.c !== undefined && localDay.c > 0) merged.c = localDay.c;
  else if (remoteDay.c !== undefined) merged.c = remoteDay.c;
  // ps, pc: 字符串，取并集（去重）
  if (localDay.ps !== undefined || remoteDay.ps !== undefined) {
    const localTags = localDay.ps ? localDay.ps.split(',').map(t => t.trim()).filter(Boolean) : [];
    const remoteTags = remoteDay.ps ? remoteDay.ps.split(',').map(t => t.trim()).filter(Boolean) : [];
    const allTags = [...new Set([...remoteTags, ...localTags])];
    merged.ps = allTags.join(',');
  }
  if (localDay.pc !== undefined || remoteDay.pc !== undefined) {
    const localTags = localDay.pc ? localDay.pc.split(',').map(t => t.trim()).filter(Boolean) : [];
    const remoteTags = remoteDay.pc ? remoteDay.pc.split(',').map(t => t.trim()).filter(Boolean) : [];
    const allTags = [...new Set([...remoteTags, ...localTags])];
    merged.pc = allTags.join(',');
  }
  // w: 如果本地有值（非空），用本地；否则用远程
  if (localDay.w !== undefined && localDay.w !== null && localDay.w !== 0) merged.w = localDay.w;
  else if (remoteDay.w !== undefined) merged.w = remoteDay.w;
  // done: 如果任一为 true，则为 true
  merged.done = !!(localDay.done || remoteDay.done);
  // p, m, bmr: 以本地为准，但若本地无则用远程
  merged.p = localDay.p !== undefined ? localDay.p : remoteDay.p;
  merged.m = localDay.m !== undefined ? localDay.m : remoteDay.m;
  merged.bmr = localDay.bmr !== undefined ? localDay.bmr : remoteDay.bmr;
  // customMeals: 合并对象，本地覆盖远程，但保留远程中本地没有的 meal 索引
  if (localDay.customMeals || remoteDay.customMeals) {
    merged.customMeals = { ...(remoteDay.customMeals || {}) };
    for (let mealIdx in (localDay.customMeals || {})) {
      merged.customMeals[mealIdx] = localDay.customMeals[mealIdx];
    }
  }
  // 其他字段（如 stats）可以忽略，因为会动态重新计算
  return merged;
}

// ------------------- Gist 云同步 -------------------
function getGistConfig() {
  return {
    token: localStorage.getItem('utopia_github_token') || '',
    gistId: localStorage.getItem('utopia_gist_id') || ''
  };
}

async function gistLoad(token, gistId) {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('读取失败 ' + res.status);
  const data = await res.json();
  const file = data.files[GIST_FILENAME];
  if (file && file.content) return JSON.parse(file.content);
  return null;
}

// 修改后的 gistSave：先拉取远程，用 safeMerge 合并，再写入
async function gistSave(token, gistId, localState) {
  let remoteState = null;
  try {
    remoteState = await gistLoad(token, gistId);
  } catch (e) {
    console.warn('拉取远程数据失败，将直接写入本地', e);
  }
  const finalState = remoteState ? safeMerge(remoteState, localState) : localState;
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: { [GIST_FILENAME]: { content: JSON.stringify(finalState, null, 2) } } })
  });
  if (!res.ok) throw new Error('写入失败 ' + res.status);
}

async function gistCreate(token, state) {
  const res = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: 'Utopia 减脂备赛助手数据',
      public: false,
      files: { [GIST_FILENAME]: { content: JSON.stringify(state, null, 2) } }
    })
  });
  if (!res.ok) throw new Error('创建失败 ' + res.status);
  const data = await res.json();
  return data.id;
}

// 打开云同步设置面板（优化版：不再手动合并，只验证连接）
function openSyncSettings() {
  const cfg = getGistConfig();
  const statusText = cfg.token && cfg.gistId ? '✅ 已配置云同步' : '⚠️ 未配置云同步';
  const html = `
    <h2>☁️ 云同步设置</h2>
    <p style="font-size:13px; color:var(--text2); margin-bottom:15px;">${statusText}</p>
    <p style="font-size:12px; color:var(--text3); margin-bottom:20px; line-height:1.6;">
      数据将保存到您的 GitHub 私密 Gist，PC 和 iOS 共用同一份数据。<br>
      Token 仅存在本设备浏览器中，不会上传到代码里。
    </p>
    <div style="margin-bottom:12px;">
      <label style="font-size:12px; color:var(--text3);">GitHub Token（需要 gist 权限）</label>
      <input type="password" id="syncToken" class="ios-input" style="font-size:14px; margin-top:6px;" 
        placeholder="ghp_xxxxxxxxxxxx" value="${cfg.token}">
    </div>
    <div style="margin-bottom:20px;">
      <label style="font-size:12px; color:var(--text3);">Gist ID（首次留空，自动创建）</label>
      <input type="text" id="syncGistId" class="ios-input" style="font-size:14px; margin-top:6px;" 
        placeholder="留空则自动创建新 Gist" value="${cfg.gistId}">
    </div>
    <button class="primary-btn" id="saveSyncBtn">保存并测试连接</button>
    <p id="syncStatus" style="font-size:12px; color:var(--text3); margin-top:12px; text-align:center;"></p>
    ${cfg.token && cfg.gistId ? '<button class="icon-btn danger-btn" id="clearSyncBtn" style="margin-top:10px; width:100%;">清除云同步配置</button>' : ''}
  `;
  showBasePanel(html);

  document.getElementById('saveSyncBtn').addEventListener('click', async () => {
    const token = document.getElementById('syncToken').value.trim();
    let gistId = document.getElementById('syncGistId').value.trim();
    const statusEl = document.getElementById('syncStatus');
    if (!token) { statusEl.innerText = '❌ 请输入 Token'; return; }
    statusEl.innerText = '🔄 连接中...';
    try {
      if (!gistId) {
        statusEl.innerText = '🔄 创建新 Gist...';
        gistId = await gistCreate(token, S);
        statusEl.innerText = '✅ 已创建 Gist！正在保存配置...';
      } else {
        // 已有 Gist ID：只验证连接，不修改本地 S（避免提前合并）
        statusEl.innerText = '🔄 验证连接...';
        await gistLoad(token, gistId);
        statusEl.innerText = '✅ 连接成功！正在保存配置...';
      }
      localStorage.setItem('utopia_github_token', token);
      localStorage.setItem('utopia_gist_id', gistId);
      // 调用 gistSave，内部会拉取远程并安全合并
      await gistSave(token, gistId, S);
      // 合并后重新加载本地 S（使当前页面拥有最新数据）
      const latest = await gistLoad(token, gistId);
      if (latest) {
        S = latest;
        if (!S.statsCache) S.statsCache = {};
        for (let k in S.days) migrateDay(S.days[k]);
        localStorage.setItem(DB_KEY, JSON.stringify(S));
        renderAll();
      }
      statusEl.innerText = '✅ 配置完成，数据已同步到云端！';
      setTimeout(() => closeBase(), 1500);
    } catch(e) {
      statusEl.innerText = '❌ 失败：' + e.message + '（请检查 Token 和权限）';
    }
  });

  document.getElementById('clearSyncBtn')?.addEventListener('click', () => {
    if (confirm('确认清除云同步配置？数据仍保留在本地。')) {
      localStorage.removeItem('utopia_github_token');
      localStorage.removeItem('utopia_gist_id');
      closeBase();
    }
  });
}

// 默认数据结构
const defaultState = {
  version: 2,
  phase: 1, mode: 'train',
  inheritPrevious: true,
  profile: {
    gender: 'male', age: 30, height: 175, weight: 75,
    customBMR: null, useCustom: false,
    goalWeight: 70, goalDeficit: 500, goalBodyFat: 12,
    bodyFat: null
  },
  days: {},
  statsCache: {}
};

let S = { ...defaultState };
let activeK = getK(new Date());
let currentTrainType = null;

// ------------------- 辅助函数（保持不变） -------------------
function getK(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function save() {
  localStorage.setItem(DB_KEY, JSON.stringify(S));
  const cfg = getGistConfig();
  if (cfg.token && cfg.gistId) {
    gistSave(cfg.token, cfg.gistId, S).catch(e => console.warn('Gist 保存失败:', e));
  }
}

async function loadState() {
  const cfg = getGistConfig();
  if (cfg.token && cfg.gistId) {
    try {
      const remote = await gistLoad(cfg.token, cfg.gistId);
      if (remote && typeof remote === 'object') {
        S = remote;if (!S.profile.goalDeficit) S.profile.goalDeficit = 500;
        if (!S.statsCache) S.statsCache = {};
        for (let k in S.days) migrateDay(S.days[k]);
        localStorage.setItem(DB_KEY, JSON.stringify(S));
        return;
      }
    } catch(e) { console.warn('Gist 加载失败，回退到本地:', e); }
  }
  const stored = localStorage.getItem(DB_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (!parsed.profile.bodyFat) parsed.profile.bodyFat = null;
      if (parsed.profile.customBmr !== undefined && parsed.profile.customBMR === undefined) {
        parsed.profile.customBMR = parsed.profile.customBmr;
        delete parsed.profile.customBmr;
      }
      S = parsed;if (!S.profile.goalDeficit) S.profile.goalDeficit = 500;
    } catch(e) { console.warn(e); }
  } else {
    S = JSON.parse(JSON.stringify(defaultState));
  }
  if (!S.statsCache) S.statsCache = {};
  for (let k in S.days) migrateDay(S.days[k]);
}

function migrateDay(day) {
  if (day.customMeals === undefined) day.customMeals = {};
  if (day.stats === undefined) day.stats = {};
  if (day.bmr === undefined) day.bmr = calculateBMR(S.profile);
  return day;
}

function calculateBMR(profile) {
  if (profile.useCustom && profile.customBMR !== null && profile.customBMR > 0) return profile.customBMR;
  const w = profile.weight, h = profile.height, a = profile.age;
  if (!w || !h || !a) return 0;
  if (profile.gender === 'male') return Math.round(10*w + 6.25*h - 5*a + 5);
  else return Math.round(10*w + 6.25*h - 5*a - 161);
}

function getPlan(phase, mode) {
  if (!MATRIX[phase] || !MATRIX[phase][mode]) {
    console.warn(`方案不存在: phase=${phase}, mode=${mode}, 回退到默认`);
    return MATRIX[1].train;
  }
  return MATRIX[phase][mode];
}

function getDay(k) {
  if (!S.days[k]) {
    let p = S.phase, m = S.mode;
    if (S.inheritPrevious) {
      const prevDates = Object.keys(S.days).sort().reverse();
      if (prevDates.length > 0) {
        const prevDay = S.days[prevDates[0]];
        p = prevDay.p !== undefined ? prevDay.p : p;
        m = prevDay.m !== undefined ? prevDay.m : m;
      }
    }
    S.days[k] = migrateDay({
      checked: [], s: 0, ps: '', c: 0, pc: '', w: 0, done: false,
      p: p, m: m,
      bmr: calculateBMR(S.profile),
      customMeals: {}
    });
    save();
  }
  const day = S.days[k];
   if (day.customMeals === undefined) migrateDay(day);
  // 确保 _mealList 存在（用于动态增删餐食）
  if (!day.customMeals._mealList) {
    const plan = getPlan(day.p, day.m);
    day.customMeals._mealList = plan.meals.map((m, idx) => ({
      ...m,
      _originalIdx: idx   // 保留原始索引用于重置
    }));
  }
  if (day.bmr === undefined) day.bmr = calculateBMR(S.profile);
  return day;
}

function getMeal(plan, idx, customMeals) {
  const custom = customMeals[idx];
  if (custom && custom.k !== undefined && !isNaN(custom.k)) return custom;
  return plan.meals[idx];
}

function updateStatsForDate(k) {
  const d = S.days[k];
  const plan = getPlan(d.p, d.m);
  const mealList = d.customMeals && d.customMeals._mealList;
  const meals = mealList || plan.meals;
  let intake = 0;
  d.checked.forEach(idx => {
    const m = mealList ? (meals[idx] || {k:0}) : getMeal(plan, idx, d.customMeals);
    intake += (m.k || 0);
  });
  const bmr = d.bmr || calculateBMR(S.profile);
  const deficit = intake - (bmr + d.s + d.c);
  S.statsCache[k] = {
    deficit,
    mealsDone: d.checked.length,
    totalMeals: meals.length,
    sportCompleted: (d.s > 0 || d.ps) || (d.c > 0 || d.pc),
    intake
  };
  save();
}

function getStats(k) {
  if (!S.statsCache[k]) updateStatsForDate(k);
  return S.statsCache[k];
}

function isStrengthValid(d) { return d.s > 0 || (d.ps && d.ps.trim() !== ''); }
function isCardioValid(d) { return d.c > 0 || (d.pc && d.pc.trim() !== ''); }

function getNetDeficit(d, plan) {
  const mealList = d.customMeals && d.customMeals._mealList;
  let intake = 0;
  d.checked.forEach(idx => {
    const m = mealList ? (mealList[idx] || {k:0}) : getMeal(plan, idx, d.customMeals);
    intake += (m.k || 0);
  });
  const bmr = d.bmr || calculateBMR(S.profile);
  return intake - (bmr + d.s + d.c);
}

function isDayComplete(d, plan) {
  const mealList = d.customMeals && d.customMeals._mealList;
  const totalMeals = mealList ? mealList.length : plan.meals.length;
  return d.checked.length === totalMeals && (isStrengthValid(d) || isCardioValid(d));
}

function estimateFromIngredients(ings) {
  let totalKcal = 0, totalCarb = 0, totalProt = 0, totalFat = 0;
  for (let ig of ings) {
    let name = ig.n.trim();
    let amountStr = ig.a.trim();
    let amountNum = parseFloat(amountStr);
    if (isNaN(amountNum)) continue;
    let food = FOOD_DB[name];
    if (food) {
      let multiplier = amountNum;
      if (food.unit === "个") multiplier = amountNum;
      else multiplier = amountNum / 100;
      totalKcal += food.kcal * multiplier;
      totalCarb += food.carb * multiplier;
      totalProt += food.protein * multiplier;
      totalFat += food.fat * multiplier;
    }
  }
  return { kcal: totalKcal, carb: totalCarb, prot: totalProt, fat: totalFat };
}

// ------------------- 渲染函数（保持不变） -------------------
