// js/navigation.js
class GlobalNavigation {
  // ... 保持你的 constructor 和 render 不变 ...
  bindEvents() {
    this.navElement.addEventListener('click', (e) => {
      const btn = e.target.closest('.global-tab-nav-btn');
      if (!btn) return;
      // 确保调用的是全局定义的 switchPage
      if (typeof window.switchPage === 'function') {
        window.switchPage(btn.dataset.page);
      } else {
        console.error("switchPage function not found!");
      }
    });
  }
  // ...
}
window.UtopiaNav = new GlobalNavigation();
