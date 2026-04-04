// ===== js/state.js: 完整状态管理与同步逻辑 =====
const DB_KEY = 'utopia_state_v2';
const GIST_FILENAME = 'utopia_v2.json';
let S = { version: 2, days: {}, profile: {}, statsCache: {} };
let activeK = ''; 
let saveTimer = null;

function getGistConfig() {
  return { token: localStorage.getItem('utopia_github_token') || '', gistId: localStorage.getItem('utopia_gist_id') || '' };
}

async function gistLoad(token, gistId) {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, { headers: { 'Authorization': `Bearer ${token}` } });
  if (!res.ok) throw new Error('读取失败');
  const data = await res.json();
  return JSON.parse(data.files[GIST_FILENAME].content);
}

async function gistSave(token, gistId, state) {
  await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: { [GIST_FILENAME]: { content: JSON.stringify(state, null, 2) } } })
  });
}

function save() {
  localStorage.setItem(DB_KEY, JSON.stringify(S));
  const cfg = getGistConfig();
  if (cfg.token && cfg.gistId) {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      gistSave(cfg.token, cfg.gistId, S).then(() => console.log('☁️ 已同步')).catch(console.error);
    }, 1000); // 增加防抖时长，防止 409
  }
}

async function loadState() {
  const stored = localStorage.getItem(DB_KEY);
  if (stored) S = JSON.parse(stored);
  const cfg = getGistConfig();
  if (cfg.token && cfg.gistId) {
    try {
      const remote = await gistLoad(cfg.token, cfg.gistId);
      if (remote) S = remote;
    } catch(e) { console.warn('云端加载失败'); }
  }
  if (!S.statsCache) S.statsCache = {};
}

function getK(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getDay(k) {
  if (!S.days[k]) {
    S.days[k] = { checked: [], s: 0, ps: '', c: 0, pc: '', w: 0, done: false, p: 1, m: 'train', customMeals: {} };
  }
  return S.days[k];
}

// 补全 render.js 必须调用的逻辑接口
function updateStatsForDate(k) { save(); }
function isStrengthValid(d) { return (d.s > 0) || (d.ps && d.ps.trim() !== ''); }
function isCardioValid(d) { return (d.c > 0) || (d.pc && d.pc.trim() !== ''); }
function isDayComplete(d, plan) {
  const meals = d.customMeals._mealList || plan.meals;
  return d.checked.length === meals.length && (isStrengthValid(d) || isCardioValid(d));
}
