// ===== js/state.js: 存储逻辑 =====
const DB_KEY = 'utopia_state_v2';
let S = { version: 2, days: {}, profile: {}, statsCache: {} };
let activeK = '';

function save() { localStorage.setItem(DB_KEY, JSON.stringify(S)); }

async function loadState() {
  const stored = localStorage.getItem(DB_KEY);
  if (stored) S = JSON.parse(stored);
}

function getK(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getDay(k) {
  if (!S.days[k]) S.days[k] = { checked: [], s: 0, ps: '', c: 0, pc: '', w: 0, done: false, p: 1, m: 'train', customMeals: {} };
  return S.days[k];
}

// 供 render.js 使用的工具函数
function updateStatsForDate(k) { save(); }
function isStrengthValid(d) { return d && (d.s > 0 || (d.ps && d.ps.length > 0)); }
function isCardioValid(d) { return d && (d.c > 0 || (d.pc && d.pc.length > 0)); }
function isDayComplete(d, plan) {
  const meals = (d.customMeals && d.customMeals._mealList) ? d.customMeals._mealList : plan.meals;
  return d.checked.length === meals.length && (isStrengthValid(d) || isCardioValid(d));
}
