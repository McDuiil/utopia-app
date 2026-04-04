// js/data.js
// 1. 初始化全局基础变量
window.S = window.S || {
    version: 2,
    phase: 1,
    mode: 'train',
    inheritPrevious: true,
    profile: { gender: 'male', age: 30, height: 175, weight: 65.6, goalWeight: 70, goalDeficit: 500, goalBodyFat: 12, useCustom: false },
    days: {},
    statsCache: {}
};
window.sportData = window.sportData || { categories: [], templates: [], sessions: [] };
window.DB_KEY = "utopia_v10";
window.SPORT_KEY = "utopia_v10_sport";

// 2. 补全 render.js 报错找不到的 getK 函数 (获取日期键)
window.getK = (date) => {
    const d = new Date(date);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};
window.activeK = window.getK(new Date());

// 3. 补全 getDay 函数 (核心：获取某一天的数据)
window.getDay = (k) => {
    if (!window.S.days) window.S.days = {};
    if (!window.S.days[k]) {
        window.S.days[k] = {
            checked: [], s: 0, ps: "", c: 0, pc: "", w: null, done: false,
            p: window.S.phase || 1, m: window.S.mode || 'train',
            bmr: window.calculateBMR ? window.calculateBMR(window.S.profile) : 1700,
            customMeals: {}
        };
    }
    return window.S.days[k];
};

// 4. 补全 getPlan 函数 (获取营养方案)
window.getPlan = (p, m) => {
    const phase = MATRIX[p] || MATRIX[1];
    return phase[m] || phase['train'];
};

// 5. 补全 getMeal 函数
window.getMeal = (plan, idx, customMeals) => {
    if (customMeals && customMeals[idx]) return customMeals[idx];
    return plan.meals[idx];
};

// 6. 补全 BMR 计算逻辑
window.calculateBMR = (p) => {
    if (p.useCustom && p.customBMR) return p.customBMR;
    let bmr = (10 * p.weight) + (6.25 * p.height) - (5 * p.age);
    return p.gender === 'male' ? bmr + 5 : bmr - 161;
};

// 7. 补全状态检查函数
window.isStrengthValid = (d) => (d.s > 0 || d.ps);
window.isCardioValid = (d) => (d.c > 0 || d.pc);
window.isDayComplete = (d, plan) => (d.checked.length >= plan.meals.length);

// 8. 补全统计计算函数 (供历史和分析模块使用)
window.getStats = (k) => {
    const d = window.S.days[k];
    if (!d) return null;
    const plan = window.getPlan(d.p, d.m);
    let intake = 0;
    d.checked.forEach(idx => {
        const m = window.getMeal(plan, idx, d.customMeals);
        intake += (m.k || 0);
    });
    return {
        intake,
        totalMeals: plan.meals.length,
        mealsDone: d.checked.length,
        deficit: intake - (d.bmr + d.s + d.c),
        sportCompleted: (d.s > 0 || d.c > 0)
    };
};

// 9. 补全保存和更新占位
window.updateStatsForDate = (k) => { console.log("Stats updated for", k); };
window.save = () => { 
    if (typeof saveState === 'function') saveState();
    if (typeof saveSportData === 'function') saveSportData();
};

// 10. 基础矩阵数据 (确保 render.js 不会因为找不到 plan 而崩溃)
const MATRIX = {
    1: { 
        train: { total:{k:1700,c:206,p:92,f:50}, meals:[{n:"早餐",k:400,c:50,p:25,f:10,i:"🍳",ings:[]},{n:"午餐",k:600,c:70,p:35,f:20,i:"🍱",ings:[]},{n:"晚餐",k:500,c:60,p:25,f:15,i:"🥗",ings:[]},{n:"加餐",k:200,c:26,p:7,f:5,i:"🍎",ings:[]}] },
        rest: { total:{k:1200,c:100,p:80,f:40}, meals:[{n:"全天摄入",k:1200,c:100,p:80,f:40,i:"📝",ings:[]}] }
    },
    2: { train: { total:{k:1540,c:172,p:88,f:50}, meals:[] }, rest: { total:{k:1098,c:97,p:69.8,f:35}, meals:[] } },
    3: { train: { total:{k:1418,c:137,p:111,f:40}, meals:[] }, rest: { total:{k:961,c:76,p:83,f:29}, meals:[] } },
    4: { train: { total:{k:1340,c:103,p:123,f:42}, meals:[] }, rest: { total:{k:881,c:59,p:81,f:29}, meals:[] } }
};

const FOOD_DB = {
    "全蛋": { kcal: 155, carb: 1.1, protein: 13, fat: 11, unit: "个" },
    "鸡胸肉": { kcal: 165, carb: 0, protein: 31, fat: 3.6, unit: "g" }
};
