// ===== js/data.js: 核心数据接口 =====
const MATRIX = {
  1: { 
    train: { total:{k:1700,c:206,p:92,f:50}, meals:[{n:'早餐',k:400,c:50,p:20,f:10,i:'🌅'}] },
    rest: { total:{k:1200,c:100,p:80,f:40}, meals:[{n:'休息餐',k:600,c:40,p:30,f:10,i:'☕'}] }
  }
};

function getPlan(phase, mode) {
    const p = MATRIX[phase] || MATRIX[1];
    return p[mode] || p.train;
}

function calculateBMR(profile) {
    return 1700; // 简化处理，防止报错
}
