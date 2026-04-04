// ===== js/data.js: 完整方案数据与核心工具 =====
const MATRIX = {
  1: { 
    train: { 
      total:{k:1700,c:206,p:92,f:50}, 
      meals:[
        {n:'早餐①',t:'空腹有氧后',i:'🌅',k:140,c:1,p:13,f:10,ings:[{n:'全蛋',a:'2个'}]},
        {n:'早餐②',t:'1.5h后',i:'🥚',k:360,c:47.75,p:18.5,f:10,ings:[{n:'全蛋',a:'2个'},{n:'熟土豆',a:'275g'}]},
        {n:'午餐',t:'力量前1h',i:'☀️',k:660,c:91.5,p:31.9,f:15,ings:[{n:'全蛋',a:'3个'},{n:'熟土豆',a:'500g'},{n:'蔬菜',a:'200g'}]},
        {n:'练后餐',t:'练后30min',i:'💪',k:540,c:66,p:28.9,f:15,ings:[{n:'全蛋',a:'3个'},{n:'熟土豆',a:'350g'},{n:'蔬菜',a:'200g'}]}
      ] 
    }, 
    rest: { 
      total:{k:1178,c:110,p:74.5,f:45}, 
      meals:[
        {n:'早餐',i:'☕',k:254,c:19.6,p:17,f:10,ings:[{n:'全蛋',a:'2个'},{n:'熟土豆',a:'80g'}]},
        {n:'午餐',i:'☀️',k:353,c:24.5,p:42.8,f:4.3,ings:[{n:'鸡胸肉',a:'120g'},{n:'熟土豆',a:'100g'}]},
        {n:'加餐',i:'🍃',k:254,c:19.6,p:17,f:10,ings:[{n:'全蛋',a:'2个'},{n:'熟土豆',a:'80g'}]}
      ] 
    } 
  }
};

// 核心函数：供 render.js 必须调用的接口
function getPlan(phase, mode) {
  const p = MATRIX[phase] || MATRIX[1];
  return p[mode] || p.train;
}

// 核心函数：基础代谢计算
function calculateBMR(profile) {
  const w = profile.weight || 67, h = profile.height || 170, a = profile.age || 25;
  if (profile.gender === 'female') return Math.round(10 * w + 6.25 * h - 5 * a - 161);
  return Math.round(10 * w + 6.25 * h - 5 * a + 5);
}
