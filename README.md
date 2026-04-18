# ERPNext Control Tower

ERPNext Control Tower is now packaged as a real Frappe app shell, while preserving the original React prototype UX.

## What changed

This repository now includes:

- a Frappe app package: `erpnext_control_tower`
- demo-safe backend API endpoints for bootstrap data, scenario simulation, and the morning brief
- a Desk page at `/app/control-tower`
- a React frontend that still runs standalone with Vite
- a Frappe-targeted bundle build that drops static assets into `erpnext_control_tower/public/control_tower`

## Project structure

- `src/`: React source for the control tower experience
- `erpnext_control_tower/api.py`: whitelisted API methods
- `erpnext_control_tower/page/control_tower/`: Desk route integration
- `erpnext_control_tower/config/desktop.py`: module registration
- `vite.frappe.config.js`: builds a static bundle for Frappe assets

## Standalone development

```bash
cd erpnext-control-tower
npm install
npm run dev
```

Then open the local Vite URL.

## Standalone production preview

```bash
npm run build
npm run preview
```

## Build assets for Frappe

```bash
npm install
npm run build:frappe
```

That generates:

- `erpnext_control_tower/public/control_tower/control_tower.js`
- `erpnext_control_tower/public/control_tower/control_tower.css`

## Install into a Frappe bench

From your bench apps directory:

```bash
git clone <repo-url>
cd erpnext-control-tower
npm install
npm run build:frappe
```

Then from the bench root:

```bash
bench get-app /path/to/apps/erpnext-control-tower
bench --site <your-site> install-app erpnext_control_tower
bench build --app erpnext_control_tower
bench --site <your-site> clear-cache
```

Open the Desk page at:

```text
/app/control-tower
```

## API endpoints

These whitelisted endpoints are available once the app is installed:

- `/api/method/erpnext_control_tower.api.get_bootstrap`
- `/api/method/erpnext_control_tower.api.get_morning_brief`
- `/api/method/erpnext_control_tower.api.simulate_scenario`

All current responses are demo-safe and do not require live ERPNext business data.

## Product story preserved

The original prototype remains intact in spirit:

- risk-first overview
- cross-functional control tower queue
- automation toggles
- scenario simulator
- executive morning brief

The difference is that it now has a Frappe-compatible backend and a Desk route, so it can evolve into a real ERPNext app instead of staying a browser-only mock.
