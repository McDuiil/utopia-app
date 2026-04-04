// 补全 render.js 缺失的 UI 函数
function showBasePanel(html) {
  const panel = document.getElementById('base-panel-content');
  if (!panel) {
      // 如果 HTML 里没这个 ID，就用 alert 兜底
      alert("请在 HTML 中添加 id='base-panel-content' 的容器");
      return;
  }
  panel.innerHTML = html + `<button id="closeBaseBtn" style="width:100%; color:var(--text3); border:none; background:none; margin-top:20px;">关闭</button>`;
  document.getElementById('closeBaseBtn').addEventListener('click', closeBase);
  document.getElementById('base-overlay').classList.remove('hidden');
}

function closeBase() {
  const overlay = document.getElementById('base-overlay');
  if (overlay) overlay.classList.add('hidden');
}
