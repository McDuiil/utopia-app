// ===== js/data.js: 完整方案数据 =====
const MATRIX = {
  1: { 
    train: { 
      total:{k:1700,c:206,p:92,f:50}, 
      meals:[
        {n:'早餐①',t:'空腹有氧',i:'🌅',k:140,c:1,p:13,f:10,ings:[{n:'全蛋',a:'2个'}]},
        {n:'早餐②',t:'1.5h后',i:'🥚',k:360,c:47.75,p:18.5,f:10,ings:[{n:'全蛋',a:'2个'},{n:'熟土豆',a:'275g'}]},
        {n:'午餐',t:'力量前',i:'☀️',k:660,c:91.5,p:31.9,f:15,ings:[{n:'全蛋',a:'3个'},{n:'熟土豆',a:'500g'}]},
        {n:'练后餐',t:'练后',i:'💪',k:540,c:66,p:28.9,f:15,ings:[{n:'全蛋',a:'3个'},{n:'熟土豆',a:'350g'}]}
      ] 
    }, 
    rest: { 
      total:{k:1178,c:110,p:74.5,f:45}, 
      meals:[
        {n:'早餐',i:'☕',k:254,c:19.6,p:17,f:10,ings:[{n:'全蛋',a:'2个'}]},
        {n:'午餐',i:'☀️',k:353,c:24.5,p:42.8,f:4.3,ings:[{n:'鸡胸',a:'120g'}]}
      ] 
    } 
  }
};

function getPlan(phase, mode) {
  const p = MATRIX[phase] || MATRIX[1];
  return p[mode] || p.train;
}

function calculateBMR(profile) {
  const w = profile.weight || 67, h = profile.height || 170, a = profile.age || 25;
  return Math.round(10 * w + 6.25 * h - 5 * a + (profile.gender === 'female' ? -161 : 5));
}
