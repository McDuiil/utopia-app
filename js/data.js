// js/data.js
window.S = window.S || {
    version: 2,
    phase: 1,
    mode: 'train',
    profile: { gender: 'male', age: 30, height: 175, weight: 65.6, goalWeight: 70, goalDeficit: 500, goalBodyFat: 12 },
    days: {},
    inheritPrevious: true
};
window.sportData = window.sportData || { categories: [], templates: [], sessions: [] };
window.DB_KEY = "utopia_v10";
window.SPORT_KEY = "utopia_v10_sport";

// 获取日期键 (YYYY-MM-DD)
window.getK = (date) => {
    const d = new Date(date);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};
window.activeK = window.getK(new Date());

// 获取某一天的数据对象
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

// 计算 BMR
window.calculateBMR = (p) => {
    let bmr = (10 * p.weight) + (6.25 * p.height) - (5 * p.age);
    return p.gender === 'male' ? bmr + 5 : bmr - 161;
};

// 获取营养方案
window.getPlan = (p, m) => {
    const phase = MATRIX[p] || MATRIX[1];
    return phase[m] || phase['train'];
};

// 获取餐食数据
window.getMeal = (plan, idx, customMeals) => {
    if (customMeals && customMeals[idx]) return customMeals[idx];
    return plan.meals[idx];
};

// 状态检查
window.isStrengthValid = (d) => (d.s > 0 || d.ps);
window.isCardioValid = (d) => (d.c > 0 || d.pc);
window.isDayComplete = (d, plan) => (d.checked.length >= plan.meals.length);

// 统计计算
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

// 估算食材热量
window.estimateFromIngredients = (ings) => {
    let kcal = 0, carb = 0, prot = 0, fat = 0;
    ings.forEach(ig => {
        const food = FOOD_DB[ig.n];
        if (food) {
            const amount = parseFloat(ig.a) || 0;
            const ratio = food.unit === '个' ? amount : amount / 100;
            kcal += food.kcal * ratio;
            carb += food.carb * ratio;
            prot += food.protein * ratio;
            fat += food.fat * ratio;
        }
    });
    return { kcal, carb, prot, fat };
};

// 核心数据矩阵
const MATRIX = {
    1: { 
        train: { total:{k:1700,c:206,p:92,f:50}, meals:[{n:"早餐",k:400,c:50,p:25,f:10,i:"🍳",ings:[]},{n:"午餐",k:600,c:70,p:35,f:20,i:"🍱",ings:[]},{n:"晚餐",k:500,c:60,p:25,f:15,i:"🥗",ings:[]},{n:"加餐",k:200,c:26,p:7,f:5,i:"🍎",ings:[]}] },
        rest: { total:{k:1200,c:100,p:80,f:40}, meals:[{n:"全天摄入",k:1200,c:100,p:80,f:40,i:"📝",ings:[]}] }
    }
};

const FOOD_DB = { "全蛋": { kcal: 155, carb: 1.1, protein: 13, fat: 11, unit: "个" } };