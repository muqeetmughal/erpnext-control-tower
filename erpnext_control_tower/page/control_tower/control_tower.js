frappe.pages['control-tower'] = {
  on_page_load(wrapper) {
    const page = frappe.ui.make_app_page({
      parent: wrapper,
      title: 'Control Tower',
      single_column: true,
    });

    const root = document.createElement('div');
    root.className = 'control-tower-root';
    page.main.appendChild(root);

    const cssHref = '/assets/erpnext_control_tower/control_tower/control_tower.css';
    const jsSrc = '/assets/erpnext_control_tower/control_tower/control_tower.js';

    const ensureCss = () => {
      if (document.querySelector(`link[data-control-tower-css="${cssHref}"]`)) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssHref;
      link.dataset.controlTowerCss = cssHref;
      document.head.appendChild(link);
    };

    const ensureScript = () => new Promise((resolve, reject) => {
      if (window.ERPNextControlTower?.mount) {
        resolve(window.ERPNextControlTower);
        return;
      }

      const existing = document.querySelector(`script[data-control-tower-js="${jsSrc}"]`);
      if (existing) {
        existing.addEventListener('load', () => resolve(window.ERPNextControlTower), { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = jsSrc;
      script.async = true;
      script.dataset.controlTowerJs = jsSrc;
      script.onload = () => resolve(window.ERPNextControlTower);
      script.onerror = reject;
      document.body.appendChild(script);
    });

    ensureCss();
    ensureScript()
      .then((app) => {
        if (wrapper.__controlTowerUnmount) wrapper.__controlTowerUnmount();
        wrapper.__controlTowerUnmount = app.mount(root, {
          apiBase: '/api/method/erpnext_control_tower.api',
          embedded: true,
          titleSuffix: 'Desk app shell',
        });
      })
      .catch(() => {
        root.innerHTML = '<div style="padding: 24px; color: #1f2937;">Failed to load Control Tower assets. Run <code>npm run build:frappe</code> inside the app repository.</div>';
      });
  },
  on_page_hide(wrapper) {
    if (wrapper.__controlTowerUnmount) {
      wrapper.__controlTowerUnmount();
      wrapper.__controlTowerUnmount = null;
    }
  },
};
