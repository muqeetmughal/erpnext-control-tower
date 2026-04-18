export const storageKey = 'erpnext-control-tower-state-v2';

export const seedState = {
  alerts: [
    { id: 'alert-1', title: '14 sales orders risk missing promised date', severity: 'critical', owner: 'Fulfillment', note: 'Average packing lag is 19h across Lahore warehouse.' },
    { id: 'alert-2', title: 'Raw material coverage below 6 days for 3 SKUs', severity: 'warning', owner: 'Procurement', note: 'PLA filament black, thermal labels, packaging sleeves.' },
    { id: 'alert-3', title: 'Receivables spike from 4 enterprise accounts', severity: 'info', owner: 'Finance', note: 'Aging trend suggests reminder workflow should fire before Monday.' },
  ],
  queues: [
    { id: 'queue-1', type: 'Sales Order', customer: 'Nexa Retail', value: 18400, stage: 'Ready to pack', sla: '2h left', risk: 'High' },
    { id: 'queue-2', type: 'Material Request', customer: 'Karachi Plant', value: 9200, stage: 'Awaiting supplier quote', sla: '6h left', risk: 'Medium' },
    { id: 'queue-3', type: 'Payment Entry', customer: 'Orbit Stores', value: 7300, stage: 'Follow-up scheduled', sla: 'Today', risk: 'Medium' },
    { id: 'queue-4', type: 'Quality Inspection', customer: 'Batch FG-2214', value: 0, stage: 'Variance flagged', sla: '45m left', risk: 'High' },
  ],
  automations: [
    { id: 'auto-1', name: 'Late order escalation', description: 'Escalates Sales Orders when pick-pack-ship pace drops below SLA target.', impact: 'Saves 4.5 coordinator hours/week', active: true },
    { id: 'auto-2', name: 'Stockout prevention nudges', description: 'Groups low-stock SKUs into a single morning procurement digest.', impact: 'Cuts stockout surprises by ~28%', active: true },
    { id: 'auto-3', name: 'Receivables chase assistant', description: 'Drafts follow-up notes for overdue invoices and high-value customers.', impact: 'Pulls cash forward by 2-4 days', active: false },
    { id: 'auto-4', name: 'Executive morning brief', description: 'Creates a 90-second summary of sales, ops risk, and cash collection.', impact: 'Better leadership visibility before standup', active: true },
  ],
  playbooks: [
    {
      id: 'play-1',
      title: 'Warehouse slowdown response',
      summary: 'Reprioritize waves, split bulky orders, and notify key customers automatically.',
      actions: ['Boost staffing on pick lane B', 'Auto-split orders over 8 line items', 'Push ETA updates to CRM notes'],
    },
    {
      id: 'play-2',
      title: 'Supplier delay containment',
      summary: 'Convert risk into alternates before production misses start compounding.',
      actions: ['Raise alternate supplier RFQs', 'Reserve safety stock for top SKUs', 'Hold non-priority production jobs'],
    },
    {
      id: 'play-3',
      title: 'Receivables sprint',
      summary: 'Focus collection effort on the small set of accounts creating most drag.',
      actions: ['Sort by invoice age x value', 'Send first-touch WhatsApp/email scripts', 'Schedule account manager callbacks'],
    },
  ],
};

export const tabs = ['Overview', 'Control Tower', 'Automations', 'Simulator'];

export function loadState() {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : seedState;
  } catch {
    return seedState;
  }
}

export function currency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export function severityClass(severity) {
  return severity.toLowerCase();
}

export function riskTone(risk) {
  return risk === 'High' ? 'critical' : risk === 'Medium' ? 'warning' : 'info';
}

export function computeSimulation(inputs, activeCount) {
  const rawRisk = inputs.orderSurge * 0.7 + inputs.supplierDelay * 8 + inputs.absenteeism * 2.4 + inputs.paymentLag * 1.6 - activeCount * 6;
  const riskScore = Math.max(0, Math.min(100, Math.round(rawRisk)));
  const throughputDelta = Math.round((inputs.orderSurge * 0.3 - inputs.absenteeism * 0.8 - inputs.supplierDelay * 2.5) * -1);
  const cashPressure = Math.max(0, Math.round(inputs.paymentLag * 1.9 + inputs.supplierDelay * 3));

  const recommendations = [
    riskScore > 70 && 'Trigger high-risk ops war room and freeze low-priority jobs for 24 hours.',
    inputs.supplierDelay >= 4 && 'Spin up alternate supplier RFQs immediately for exposed BOM lines.',
    inputs.paymentLag >= 10 && 'Switch on receivables chase automation before cash drag compounds.',
    inputs.absenteeism >= 10 && 'Offer overtime on the most constrained workstation instead of blanket staffing.',
    throughputDelta < -10 && 'Auto-split complex orders so the fastest 60% still leave on time.',
  ].filter(Boolean);

  return { riskScore, throughputDelta, cashPressure, recommendations };
}
