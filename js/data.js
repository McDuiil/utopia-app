// 初始化全局变量，确保后续所有文件都能找到它
window.S = window.S || {}; 
window.sportData = window.sportData || {};

// 统一存储键名，仅在此处定义一次
window.DB_KEY = "utopia_v10";
window.SPORT_KEY = "utopia_v10_sport";

const MATRIX = {
    1: { train: { total:{k:1700,c:206,p:92,f:50} }, rest: { total:{k:1178,c:110,p:74.5,f:45} } },
    2: { train: { total:{k:1540,c:172,p:88,f:50} }, rest: { total:{k:1098,c:97,p:69.8,f:35} } },
    3: { train: { total:{k:1418,c:137,p:111,f:40} }, rest: { total:{k:961,c:76,p:83,f:29} } },
    4: { train: { total:{k:1340,c:103,p:123,f:42} }, rest: { total:{k:881,c:59,p:81,f:29} } }
};

const FOOD_DB = {
    "全蛋": { kcal: 155, carb: 1.1, protein: 13, fat: 11, unit: "个" },
    "熟土豆": { kcal: 77, carb: 17, protein: 2, fat: 0.1, unit: "g" },
    "鸡胸肉": { kcal: 165, carb: 0, protein: 31, fat: 3.6, unit: "g" },
    "蔬菜": { kcal: 25, carb: 5, protein: 1, fat: 0.2, unit: "g" }
};
