import { useEffect, useMemo, useState } from 'react';
import { computeSimulation, currency, loadState, riskTone, seedState, severityClass, storageKey, tabs } from './data';

function ScoreCard({ label, value, change, tone = 'default' }) {
  return (
    <div className={`panel score-card ${tone}`}>
      <span className="eyebrow">{label}</span>
      <strong>{value}</strong>
      <span className="muted">{change}</span>
    </div>
  );
}

function AlertCard({ alert, onResolve }) {
  return (
    <article className="panel alert-card">
      <div className="space-between top-align gap-sm">
        <div>
          <span className={`badge ${severityClass(alert.severity)}`}>{alert.severity}</span>
          <h3>{alert.title}</h3>
        </div>
        <button className="ghost small-btn" onClick={() => onResolve(alert.id)}>Resolve</button>
      </div>
      <p>{alert.note}</p>
      <div className="meta-row">
        <span>Owner: {alert.owner}</span>
      </div>
    </article>
  );
}

function QueueRow({ item, onAdvance }) {
  return (
    <div className="queue-row">
      <div>
        <strong>{item.type}</strong>
        <p>{item.customer}</p>
      </div>
      <div>{item.stage}</div>
      <div>{item.value ? currency(item.value) : 'N/A'}</div>
      <div><span className={`badge ${severityClass(riskTone(item.risk))}`}>{item.risk}</span></div>
      <div>{item.sla}</div>
      <button className="ghost small-btn" onClick={() => onAdvance(item.id)}>Advance</button>
    </div>
  );
}

function AutomationCard({ automation, onToggle }) {
  return (
    <article className="panel automation-card">
      <div className="space-between top-align gap-sm">
        <div>
          <div className="inline-row gap-sm wrap">
            <span className={`badge ${automation.active ? 'success' : 'muted-badge'}`}>{automation.active ? 'Active' : 'Paused'}</span>
            <span className="eyebrow">Automation</span>
          </div>
          <h3>{automation.name}</h3>
        </div>
        <button className={automation.active ? 'ghost small-btn' : 'small-btn'} onClick={() => onToggle(automation.id)}>
          {automation.active ? 'Pause' : 'Activate'}
        </button>
      </div>
      <p>{automation.description}</p>
      <div className="meta-row">
        <span>{automation.impact}</span>
      </div>
    </article>
  );
}

function PlaybookCard({ playbook }) {
  return (
    <article className="panel playbook-card">
      <span className="eyebrow">Suggested playbook</span>
      <h3>{playbook.title}</h3>
      <p>{playbook.summary}</p>
      <ul>
        {playbook.actions.map((action) => <li key={action}>{action}</li>)}
      </ul>
    </article>
  );
}

function Simulator({ automations, apiBase }) {
  const [inputs, setInputs] = useState({
    orderSurge: 35,
    supplierDelay: 3,
    absenteeism: 8,
    paymentLag: 12,
  });
  const [remoteSimulation, setRemoteSimulation] = useState(null);

  const activeCount = automations.filter((item) => item.active).length;
  const localSimulation = useMemo(() => computeSimulation(inputs, activeCount), [activeCount, inputs]);

  useEffect(() => {
    if (!apiBase) {
      setRemoteSimulation(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          order_surge: String(inputs.orderSurge),
          supplier_delay: String(inputs.supplierDelay),
          absenteeism: String(inputs.absenteeism),
          payment_lag: String(inputs.paymentLag),
          active_automations: String(activeCount),
        });
        const response = await fetch(`${apiBase}.simulate_scenario?${params.toString()}`);
        const payload = await response.json();
        if (!cancelled && payload.message) setRemoteSimulation(payload.message);
      } catch {
        if (!cancelled) setRemoteSimulation(null);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeCount, apiBase, inputs]);

  const simulation = remoteSimulation ?? localSimulation;

  return (
    <div className="stack-lg">
      <section className="panel hero mini-hero">
        <div>
          <span className="eyebrow">Scenario simulator</span>
          <h2>Pressure test tomorrow before it happens.</h2>
          <p className="muted">Adjust a few operational levers and see how much risk your current automation stack can absorb.</p>
        </div>
      </section>

      <section className="grid two-col simulator-grid">
        <div className="panel stack">
          {[
            ['Order surge (%)', 'orderSurge', 0, 100],
            ['Supplier delay (days)', 'supplierDelay', 0, 7],
            ['Absenteeism (%)', 'absenteeism', 0, 25],
            ['Payment lag (days)', 'paymentLag', 0, 30],
          ].map(([label, key, min, max]) => (
            <label key={key} className="stack slider-row">
              <div className="space-between">
                <span>{label}</span>
                <strong>{inputs[key]}</strong>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                value={inputs[key]}
                onChange={(event) => setInputs((current) => ({ ...current, [key]: Number(event.target.value) }))}
              />
            </label>
          ))}
        </div>

        <div className="stack">
          <div className="grid score-grid compact">
            <ScoreCard label="Risk score" value={`${simulation.riskScore}/100`} change={simulation.riskScore > 70 ? 'Uncomfortable' : 'Manageable'} tone={simulation.riskScore > 70 ? 'critical' : simulation.riskScore > 45 ? 'warning' : 'success'} />
            <ScoreCard label="Throughput impact" value={`${simulation.throughputDelta}%`} change="Expected change vs normal day" tone={simulation.throughputDelta < -10 ? 'critical' : 'default'} />
            <ScoreCard label="Cash pressure" value={`${simulation.cashPressure}%`} change="Relative collection stress" tone={simulation.cashPressure > 35 ? 'warning' : 'default'} />
          </div>

          <div className="panel stack">
            <div>
              <span className="eyebrow">Recommended moves</span>
              <h3>What the ops lead should do next</h3>
            </div>
            <ul>
              {(simulation.recommendations.length ? simulation.recommendations : ['Current automation coverage looks healthy. Keep executive brief and stockout nudge workflows active.']).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function App({ apiBase = '', embedded = false, titleSuffix = 'Ops cockpit prototype' }) {
  const [state, setState] = useState(loadState);
  const [tab, setTab] = useState('Overview');
  const [backendMode, setBackendMode] = useState(apiBase ? 'Connecting to Frappe API…' : 'Standalone demo mode');

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!apiBase) return;

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`${apiBase}.get_bootstrap`);
        const payload = await response.json();
        const nextState = payload?.message?.state;
        const mode = payload?.message?.meta?.mode;
        if (!cancelled && nextState) {
          setState((current) => ({ ...nextState, ...current }));
          setBackendMode(mode === 'demo-safe' ? 'Connected to demo-safe Frappe API' : 'Connected to Frappe API');
        }
      } catch {
        if (!cancelled) setBackendMode('Frappe API unavailable, using local demo data');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  const totals = useMemo(() => {
    const activeAutomations = state.automations.filter((item) => item.active).length;
    const atRiskValue = state.queues.filter((item) => item.risk === 'High').reduce((sum, item) => sum + item.value, 0);
    return {
      activeAutomations,
      atRiskValue,
      resolvedCoverage: `${Math.max(72, 72 + activeAutomations * 4)}%`,
      openAlerts: state.alerts.length,
    };
  }, [state]);

  const morningBrief = useMemo(() => {
    const hottestQueue = [...state.queues].sort((a, b) => (b.value || 0) - (a.value || 0))[0];
    const activeNames = state.automations.filter((item) => item.active).map((item) => item.name);
    return [
      'ERPNext Control Tower morning brief',
      `${state.alerts.length} active alerts remain, with ${currency(totals.atRiskValue)} tied up in the highest-risk queue items.`,
      hottestQueue ? `Top-value item needing attention: ${hottestQueue.type} for ${hottestQueue.customer}, currently ${hottestQueue.stage}.` : 'No urgent queue items right now.',
      `${activeNames.length} automations are active: ${activeNames.join(', ')}.`,
      'Recommended focus: clear fulfillment bottlenecks first, then run a short receivables sprint before noon.',
    ].join(' ');
  }, [state, totals.atRiskValue]);

  const resolveAlert = (id) => setState((current) => ({ ...current, alerts: current.alerts.filter((item) => item.id !== id) }));

  const advanceQueue = (id) => setState((current) => ({
    ...current,
    queues: current.queues.map((item) => {
      if (item.id !== id) return item;
      const nextStage = item.stage === 'Ready to pack'
        ? 'Packed, awaiting dispatch'
        : item.stage === 'Awaiting supplier quote'
          ? 'RFQs sent'
          : item.stage === 'Follow-up scheduled'
            ? 'Customer contacted'
            : item.stage === 'Variance flagged'
              ? 'Inspection approved'
              : 'Updated';
      const nextRisk = item.risk === 'High' ? 'Medium' : item.risk === 'Medium' ? 'Low' : 'Low';
      return { ...item, stage: nextStage, risk: nextRisk, sla: 'On track' };
    }),
  }));

  const toggleAutomation = (id) => setState((current) => ({
    ...current,
    automations: current.automations.map((item) => item.id === id ? { ...item, active: !item.active } : item),
  }));

  const resetDemo = () => {
    localStorage.removeItem(storageKey);
    setState(seedState);
  };

  const copyBrief = async () => {
    try {
      await navigator.clipboard.writeText(morningBrief);
      alert('Morning brief copied to clipboard.');
    } catch {
      alert('Clipboard unavailable in this browser. You can still copy the brief from the card.');
    }
  };

  return (
    <div className={embedded ? 'shell embedded-shell' : 'shell'}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">CT</div>
          <div>
            <strong>ERPNext Control Tower</strong>
            <p>{titleSuffix}</p>
          </div>
        </div>

        <nav className="nav-stack">
          {tabs.map((item) => (
            <button key={item} className={tab === item ? 'nav-btn active' : 'nav-btn'} onClick={() => setTab(item)}>
              {item}
            </button>
          ))}
        </nav>

        <div className="panel sidebar-card">
          <span className="eyebrow">Designed for</span>
          <h3>ERPNext teams who need visibility before chaos starts.</h3>
          <p>Think of this as a modern front-end concept for sales, stock, procurement, and cash-risk operations.</p>
        </div>
      </aside>

      <main className="main">
        <section className="hero panel">
          <div>
            <span className="eyebrow">Frappe app shell</span>
            <h1>An execution-first control tower for ERPNext operations.</h1>
            <p className="muted">It highlights operational risk, surfaces the most valuable work, lets you toggle workflow automations, and simulates how tomorrow will feel before the team clocks in.</p>
          </div>
          <div className="hero-actions">
            <button onClick={copyBrief}>Copy morning brief</button>
            <button className="ghost" onClick={resetDemo}>Reset demo state</button>
            <span className="muted tiny">{backendMode}</span>
          </div>
        </section>

        <section className="grid score-grid">
          <ScoreCard label="Open alerts" value={totals.openAlerts} change="Cross-functional issues needing action" tone={totals.openAlerts > 2 ? 'critical' : 'default'} />
          <ScoreCard label="At-risk value" value={currency(totals.atRiskValue)} change="High-risk work currently exposed" tone="warning" />
          <ScoreCard label="Automation coverage" value={totals.resolvedCoverage} change={`${totals.activeAutomations} workflows turned on`} tone="success" />
          <ScoreCard label="Morning readiness" value={totals.openAlerts <= 1 ? 'Strong' : 'Watch closely'} change="Based on active risk and workflow coverage" tone={totals.openAlerts <= 1 ? 'success' : 'warning'} />
        </section>

        {tab === 'Overview' && (
          <div className="stack-lg">
            <section className="grid two-col">
              <div className="stack">
                <div className="section-head">
                  <div>
                    <span className="eyebrow">Live alert stack</span>
                    <h2>What needs attention first</h2>
                  </div>
                </div>
                <div className="stack">
                  {state.alerts.map((alert) => <AlertCard key={alert.id} alert={alert} onResolve={resolveAlert} />)}
                  {state.alerts.length === 0 && <div className="panel empty">All current alerts are resolved. Nice.</div>}
                </div>
              </div>

              <div className="stack">
                <div className="section-head">
                  <div>
                    <span className="eyebrow">Morning brief</span>
                    <h2>Executive-ready summary</h2>
                  </div>
                </div>
                <div className="panel stack">
                  <p>{morningBrief}</p>
                  <textarea readOnly rows="8" value={morningBrief} />
                </div>
              </div>
            </section>

            <section className="grid three-col">
              {state.playbooks.map((playbook) => <PlaybookCard key={playbook.id} playbook={playbook} />)}
            </section>
          </div>
        )}

        {tab === 'Control Tower' && (
          <section className="panel stack-lg">
            <div className="section-head">
              <div>
                <span className="eyebrow">Work queue</span>
                <h2>Most valuable operational work, in one place</h2>
              </div>
            </div>
            <div className="queue-table">
              <div className="queue-row queue-head">
                <div>Document</div>
                <div>Current stage</div>
                <div>Value</div>
                <div>Risk</div>
                <div>SLA</div>
                <div></div>
              </div>
              {state.queues.map((item) => <QueueRow key={item.id} item={item} onAdvance={advanceQueue} />)}
            </div>
          </section>
        )}

        {tab === 'Automations' && (
          <section className="stack-lg">
            <div className="section-head">
              <div>
                <span className="eyebrow">AI-style workflows</span>
                <h2>Switch on the routines that remove coordination drag</h2>
              </div>
            </div>
            <div className="grid two-col">
              {state.automations.map((automation) => <AutomationCard key={automation.id} automation={automation} onToggle={toggleAutomation} />)}
            </div>
          </section>
        )}

        {tab === 'Simulator' && <Simulator automations={state.automations} apiBase={apiBase} />}
      </main>
    </div>
  );
}
