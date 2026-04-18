import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    emptyOutDir: false,
    outDir: path.resolve(__dirname, 'erpnext_control_tower/public/control_tower'),
    lib: {
      entry: path.resolve(__dirname, 'src/frappe-entry.jsx'),
      name: 'ERPNextControlTower',
      formats: ['iife'],
      fileName: () => 'control_tower.js',
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => assetInfo.name === 'style.css' ? 'control_tower.css' : 'assets/[name]-[hash][extname]',
      },
    },
  },
});
