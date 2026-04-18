import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

function mount(element, options = {}) {
  const root = ReactDOM.createRoot(element);
  root.render(
    <React.StrictMode>
      <App
        apiBase={options.apiBase || '/api/method/erpnext_control_tower.api'}
        embedded={options.embedded ?? true}
        titleSuffix={options.titleSuffix || 'Desk app shell'}
      />
    </React.StrictMode>
  );

  return () => root.unmount();
}

window.ERPNextControlTower = { mount };

export { mount };
