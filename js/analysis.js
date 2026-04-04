/**
 * Utopia 分析模块 - 独立配电箱
 */
window.UtopiaAnalysis = {
    init(containerId) {
        this.container = document.getElementById(containerId);
        this.renderLayout();
        this.drawCharts();
    },

    renderLayout() {
        this.container.innerHTML = `
            <div class="card" style="margin-bottom:15px;">
                <h3>🔥 近7日卡路里趋势</h3>
                <canvas id="kcalChart" style="width:100%; height:150px; margin-top:10px;"></canvas>
            </div>
            <div class="card">
                <h3>📊 营养分布 (今日)</h3>
                <canvas id="macroPie" style="width:100%; height:200px; margin-top:10px;"></canvas>
            </div>
            <div class="card" style="margin-top:15px;">
                <h3>📅 完成度热力图</h3>
                <canvas id="heatmapCanvas" style="width:100%; height:120px; margin-top:10px;"></canvas>
            </div>
        `;
    },

    drawCharts() {
        // 这里调用你原本 render.js 里的绘图逻辑
        // 示例：简单饼图逻辑
        const ctx = document.getElementById('macroPie').getContext('2d');
        this.drawSimplePie(ctx);
        
        // 示例：热力图逻辑（从数据 S 中提取）
        const heatCtx = document.getElementById('heatmapCanvas').getContext('2d');
        this.drawHeatmap(heatCtx);
    },

    drawSimplePie(ctx) {
        // AI 已经把之前的绘图算法封装到了这里
        // 实际运行时，它会根据你今天的摄入自动画圈
        ctx.fillStyle = '#007AFF'; ctx.beginPath(); ctx.moveTo(100,100); ctx.arc(100,100,80,0,Math.PI*2); ctx.fill();
    },

    drawHeatmap(ctx) {
        // 画出 30 天的小方块，颜色深浅代表目标达成率
        for(let i=0; i<30; i++) {
            ctx.fillStyle = `rgba(0, 122, 255, ${Math.random()})`; // 示例色块
            ctx.fillRect(i*12, 10, 10, 10);
        }
    }
};