// js/data.js
window.S = window.S || {
    version: 2,
    phase: 1,
    mode: 'train',
    inheritPrevious: true,
    profile: { gender: 'male', age: 30, height: 175, weight: 70, goalWeight: 65, goalDeficit: 500, goalBodyFat: 12, useCustom: false, customBMR: null },
    days: {},
    statsCache: {}
};
window.sportData = window.sportData || { categories: [], templates: [], sessions: [] };
window.DB_KEY = "utopia_v10";
window.SPORT_KEY = "utopia_v10_sport";

// 初始化当前日期键
window.getK = (date) => {
    const d = new Date(date);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};
window.activeK = window.getK(new Date());

// 补全丢失的 getDay 函数
window.getDay = (k) => {
    if (!window.S.days) window.S.days = {};
    if (!window.S.days[k]) {
        window.S.days[k] = {
            checked: [], s: 0, ps: "", c: 0, pc: "", w: null, done: false,
            p: window.S.phase || 1, m: window.S.mode || 'train',
            bmr: window.calculateBMR(window.S.profile),
            customMeals: {}
        };
    }
    return window.S.days[k];
};

// 补全 BMR 计算
window.calculateBMR = (p) => {
    if (p.useCustom && p.customBMR) return p.customBMR;
    let bmr = (10 * p.weight) + (6.25 * p.height) - (5 * p.age);
    return p.gender === 'male' ? bmr + 5 : bmr - 161;
};

// 补全方案获取
window.getPlan = (p, m) => {
    const phase = MATRIX[p] || MATRIX[1];
    return phase[m] || phase['train'];
};

window.getMeal = (plan, idx, customMeals) => {
    if (customMeals && customMeals[idx]) return customMeals[idx];
    return plan.meals[idx];
};

window.isStrengthValid = (d) => (d.s > 0 || d.ps);
window.isCardioValid = (d) => (d.c > 0 || d.pc);
window.isDayComplete = (d, plan) => (d.checked.length >= plan.meals.length && (d.s > 0 || d.c > 0));

window.getStats = (k) => {
    const d = window.S.days[k];
    if (!d) return null;
    const plan = window.getPlan(d.p, d.m);
    let intake = 0;
    d.checked.forEach(idx => {
        const m = window.getMeal(plan, idx, d.customMeals);
        intake += m.k;
    });
    return {
        intake,
        totalMeals: plan.meals.length,
        mealsDone: d.checked.length,
        deficit: intake - (d.bmr + d.s + d.c),
        sportCompleted: (d.s > 0 || d.c > 0)
    };
};

window.updateStatsForDate = (k) => { /* 占位，防止报错 */ };
window.save = () => { window.saveState(); window.saveSportData(); };

// 矩阵数据
const MATRIX = {
    1: { train: { total:{k:1700,c:206,p:92,f:50}, meals:[{n:"早餐",k:400,c:50,p:25,f:10,i:"🍳",ings:[]},{n:"午餐",k:600,c:70,p:35,f:20,i:"🍱",ings:[]},{n:"晚餐",k:500,c:60,p:25,f:15,i:"🥗",ings:[]},{n:"加餐",k:200,c:26,p:7,f:5,i:"🍎",ings:[]}] }, rest: { total:{k:1200,c:100,p:80,f:40}, meals:[] } },
    2: { train: { total:{k:1500,c:150,p:90,f:45}, meals:[] }, rest: { total:{k:1100,c:80,p:70,f:35}, meals:[] } },
    3: { train: { total:{k:1300,c:100,p:100,f:40}, meals:[] }, rest: { total:{k:1000,c:50,p:80,f:30}, meals:[] } },
    4: { train: { total:{k:1200,c:50,p:110,f:40}, meals:[] }, rest: { total:{k:900,c:30,p:80,f:30}, meals:[] } }
};

const FOOD_DB = { "全蛋": { kcal: 155, carb: 1.1, protein: 13, fat: 11, unit: "个" } };
