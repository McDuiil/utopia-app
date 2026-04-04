/**
 * Utopia 历史模块 - 独立配电箱
 * 负责：日历渲染、历史记录展示、数据导入导出
 */
window.UtopiaHistory = {
    calYear: new Date().getFullYear(),
    calMonth: new Date().getMonth(),

    init(containerId) {
        this.container = document.getElementById(containerId);
        this.renderLayout();
        this.renderCalendar();
    },

    renderLayout() {
        this.container.innerHTML = `
            <div class="card" style="margin-bottom:15px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                    <button onclick="UtopiaHistory.changeMonth(-1)">◀</button>
                    <strong id="hcal-title">加载中...</strong>
                    <button onclick="UtopiaHistory.changeMonth(1)">▶</button>
                </div>
                <div id="hcal-grid" class="calendar-grid"></div>
            </div>
            <div id="hcal-detail" class="card hidden"></div>
            <div class="card" style="margin-top:15px;">
                <button class="icon-btn" onclick="UtopiaHistory.exportData()" style="width:100%; margin-bottom:10px;">备份数据 (JSON)</button>
                <input type="file" id="import-file" style="display:none" onchange="UtopiaHistory.importData(this)">
                <button class="icon-btn" onclick="document.getElementById('import-file').click()" style="width:100%; color:var(--ios-green);">恢复备份</button>
            </div>
        `;
    },

    renderCalendar() {
        const title = document.getElementById('hcal-title');
        const grid = document.getElementById('hcal-grid');
        if (!grid) return;

        title.innerText = `${this.calYear}年 ${this.calMonth + 1}月`;
        grid.innerHTML = ['日','一','二','三','四','五','六'].map(d => `<div class="cal-head">${d}</div>`).join('');

        const firstDay = new Date(this.calYear, this.calMonth, 1).getDay();
        const daysInMonth = new Date(this.calYear, this.calMonth + 1, 0).getDate();

        // 填充空白
        for (let i = 0; i < firstDay; i++) grid.innerHTML += '<div></div>';

        // 填充日期并对接数据
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${this.calYear}-${String(this.calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayData = S[dateStr] || {}; // 从 data.js 的全局变量 S 中取数
            
            // 检查是否有运动数据
            const hasSport = (sportData.sessions || []).some(s => s.date === dateStr);

            grid.innerHTML += `
                <div class="cal-day ${dayData.weight ? 'has-data' : ''}" onclick="UtopiaHistory.showDetail('${dateStr}')">
                    <span class="cal-date">${d}</span>
                    ${dayData.kcal ? `<span class="cal-kcal">${Math.round(dayData.kcal)}</span>` : ''}
                    ${hasSport ? `<span class="cal-dot">💪</span>` : ''}
                </div>
            `;
        }
    },

    changeMonth(step) {
        this.calMonth += step;
        if (this.calMonth > 11) { this.calMonth = 0; this.calYear++; }
        if (this.calMonth < 0) { this.calMonth = 11; this.calYear--; }
        this.renderCalendar();
    },

    showDetail(dateStr) {
        const detail = document.getElementById('hcal-detail');
        const day = S[dateStr] || {};
        const sessions = (sportData.sessions || []).filter(s => s.date === dateStr);

        detail.classList.remove('hidden');
        detail.innerHTML = `
            <h3 style="margin-bottom:10px;">${dateStr} 详情</h3>
            <div style="font-size:14px; line-height:1.8;">
                <div>⚖️ 体重: ${day.weight || '--'} kg</div>
                <div>🔥 摄入: ${day.kcal || 0} / ${day.target || '--'} kcal</div>
                <hr style="border:none; border-top:1px solid var(--border-light); margin:10px 0;">
                <div style="font-weight:600;">💪 运动记录:</div>
                ${sessions.length ? sessions.map(s => `
                    <div style="margin-top:5px; padding:5px; background:var(--bg2); border-radius:4px;">
                        ${s.name} (${s.duration || '未计时'})
                    </div>
                `).join('') : '<div style="color:var(--text3);">暂无运动</div>'}
            </div>
        `;
    },

    exportData() {
        const data = { diet: S, sport: sportData };
        const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `utopia_backup_${new Date().toLocaleDateString()}.json`;
        a.click();
    },

    importData(input) {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = JSON.parse(e.target.result);
            if (data.diet) Object.assign(S, data.diet);
            if (data.sport) Object.assign(sportData, data.sport);
            saveState(); // 保存到 localStorage
            saveSportData();
            alert('导入成功！');
            location.reload();
        };
        reader.readAsText(file);
    }
};