class GlobalNavigation {
  constructor() {
    this.navItems = [
      { id: 'main', icon: '🏠', label: '主页' },
      { id: 'sport', icon: '💪', label: '运动' },
      { id: 'history', icon: '📊', label: '历史' },
      { id: 'analysis', icon: '📈', label: '分析' }
    ];
    this.init();
  }

  init() {
    this.injectStyles();
    this.render();
    this.bindEvents();
  }

  injectStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
      .global-tab-nav {
        position: sticky; top: 0; background: var(--bg0); z-index: 9999;
        display: flex; justify-content: center; border-bottom: 1px solid var(--border-light);
        padding: 0 10px; max-width: 480px; margin: 0 auto; width: 100%; box-sizing: border-box;
      }
      .global-tab-nav-btn {
        flex: 1; background: none; border: none; padding: 12px 0;
        font-size: 12px; color: var(--text3); cursor: pointer; transition: 0.2s;
        border-bottom: 2px solid transparent;
      }
      .global-tab-nav-btn.active {
        color: var(--ios-blue); border-bottom-color: var(--ios-blue); font-weight: 600;
      }
    `;
    document.head.appendChild(style);
  }

  render() {
    this.navElement = document.createElement('nav');
    this.navElement.className = 'global-tab-nav';
    this.navElement.innerHTML = this.navItems.map((item, index) => `
      <button class="global-tab-nav-btn ${index === 0 ? 'active' : ''}" data-page="${item.id}">
        ${item.icon} ${item.label}
      </button>
    `).join('');
    document.body.insertBefore(this.navElement, document.body.firstChild);
  }

  bindEvents() {
    this.navElement.addEventListener('click', (e) => {
      const btn = e.target.closest('.global-tab-nav-btn');
      if (!btn) return;
      window.switchPage(btn.dataset.page);
    });
  }

  setActive(pageId) {
    this.navElement.querySelectorAll('.global-tab-nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === pageId);
    });
  }
}
window.UtopiaNav = new GlobalNavigation();