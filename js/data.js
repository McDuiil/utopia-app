// ===== js/data.js: 核心数据补丁 =====
const MATRIX = {
  1: { 
    train: { total:{k:1700,c:206,p:92,f:50}, meals:[{n:'今日摄入',k:1700,c:0,p:0,f:0,i:'📝'}] },
    rest: { total:{k:1100,c:100,p:80,f:40}, meals:[{n:'休息餐',k:1100,c:0,p:0,f:0,i:'☕'}] }
  }
};

// render.js 必须调用的函数
function getPlan(phase, mode) {
  const p = MATRIX[phase] || MATRIX[1];
  return p[mode] || p.train;
}

function calculateBMR(profile) {
  const w = profile.weight || 67;
  return Math.round(10 * w + 6.25 * 170 - 5 * 25 + 5); 
}
