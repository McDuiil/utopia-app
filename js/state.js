// ===== state.js: 状态管理、存储、Gist同步 (修正 409 冲突版) =====

// ------------------- 数据合并逻辑 -------------------
function safeMerge(remote, local) {
  if (!remote) return local;
  const output = { ...remote };

  for (let key in local) {
    if (key === 'days' || key === 'profile') continue;
    if (local[key] && typeof local[key] === 'object' && !Array.isArray(local[key])) {
      output[key] = safeMerge(remote[key] || {}, local[key]);
    } else {
      output[key] = local[key];
    }
  }

  if (local.profile) {
    output.profile = safeMerge(remote.profile || {}, local.profile);
  }

  if (local.days) {
    if (!output.days) output.days = {};
    for (let dateKey in local.days) {
      output.days[dateKey] = mergeDay(output.days[dateKey] || {}, local.days[dateKey]);
    }
  }
  return output;
}

function mergeDay(remoteDay, localDay) {
  const merged = { ...remoteDay };
  // checked: 数组取并集去重
  if (localDay.checked && Array.isArray(localDay.checked)) {
    const set = new Set([...(remoteDay.checked || []), ...localDay.checked]);
    merged.checked = Array.from(set);
  } else {
    merged.checked = localDay.checked || remoteDay.checked || [];
  }
  
  // 运动消耗：优先本地有效值
  if (localDay.s > 0) merged.s = localDay.s;
  if (localDay.c > 0) merged.c = localDay.c;
  
  // 标签合并
  const mergeTags = (r, l) => [...new Set([...(r||'').split(','), ...(l||'').split(',')])].filter(Boolean).join(',');
  if (localDay.ps || remoteDay.ps) merged.ps = mergeTags(remoteDay.ps, localDay.ps);
  if (localDay.pc || remoteDay.pc) merged.pc = mergeTags(remoteDay.pc, localDay.pc);

  // 体重与状态
  if (localDay.w) merged.w = localDay.w;
  merged.done = !!(localDay.done || remoteDay.done);
  merged.p = localDay.p ?? remoteDay.p;
  merged.m = localDay.m ?? remoteDay.m;
  merged.bmr = localDay.bmr ?? remoteDay.bmr;

  // 自定义餐食列表：完全以本地为准（解决增删后的顺序一致性）
  if (localDay.customMeals) {
    merged.customMeals = { ...remoteDay.customMeals, ...localDay.customMeals };
  }
  return merged;
}

// ------------------- Gist 云同步核心 -------------------
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
  return file && file.content ? JSON.parse(file.content) : null;
}

async function gistSave(token, gistId, localState) {
  let remoteState = null;
  try {
    remoteState = await gistLoad(token, gistId);
  } catch (e) {
    console.warn('拉取远程失败，将尝试覆盖写入', e);
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
      description: 'Utopia 备赛助手数据',
      public: false,
      files: { [GIST_FILENAME]: { content: JSON.stringify(state, null, 2) } }
    })
  });
  if (!res.ok) throw new Error('创建失败 ' + res.status);
  const data = await res.json();
  return data.id;
}

// ------------------- 存储与防抖逻辑 -------------------
let S = { version: 2, days: {}, profile: {}, statsCache: {} };
let activeK = getK(new Date());
let saveTimer = null; // 防抖定时器

function save() {
  // 1. 瞬间存入本地，保证页面刷新不丢数据
  localStorage.setItem(DB_KEY, JSON.stringify(S));

  const cfg = getGistConfig();
  if (cfg.token && cfg.gistId) {
    // 2. 清除之前的等待任务
    if (saveTimer) clearTimeout(saveTimer);

    // 3. 开启 500ms 倒计时，停手后才执行云端同步
    saveTimer = setTimeout(() => {
      gistSave(cfg.token, cfg.gistId, S)
        .then(() => console.log('☁️ 云端同步成功'))
        .catch(e => console.error('☁️ 云端同步失败:', e));
    }, 500); 
  }
}

// ------------------- 初始化与加载 -------------------
async function loadState() {
  const cfg = getGistConfig();
  const stored = localStorage.getItem(DB_KEY);
  if (stored) S = JSON.parse(stored);

  if (cfg.token && cfg.gistId) {
    try {
      const remote = await gistLoad(cfg.token, cfg.gistId);
      if (remote) {
        S = safeMerge(remote, S); // 合并远程和本地最新修改
        localStorage.setItem(DB_KEY, JSON.stringify(S));
      }
    } catch(e) {
      console.warn('云端加载失败，使用本地缓存', e);
    }
  }
  // 补全缺失字段
  if (!S.statsCache) S.statsCache = {};
  for (let k in S.days) migrateDay(S.days[k]);
}

function getK(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function migrateDay(day) {
  if (!day.customMeals) day.customMeals = {};
  if (!day.bmr) day.bmr = 1700; // 默认兜底
  return day;
}

function getDay(k) {
  if (!S.days[k]) {
    S.days[k] = migrateDay({
      checked: [], s: 0, ps: '', c: 0, pc: '', w: 0, done: false,
      p: S.phase || 1, m: S.mode || 'train',
      customMeals: {}
    });
    save();
  }
  const d = S.days[k];
  // 确保动态列表存在
  if (!d.customMeals._mealList) {
    const plan = getPlan(d.p, d.m);
    d.customMeals._mealList = plan.meals.map((m, idx) => ({ ...m, _originalIdx: idx }));
  }
  return d;
}

// 其他辅助函数 (calculateBMR, getPlan, updateStatsForDate 等) 保持原样即可...
