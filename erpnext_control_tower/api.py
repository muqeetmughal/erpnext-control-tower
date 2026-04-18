import copy

import frappe

from . import __version__

SEED_STATE = {
    'alerts': [
        {
            'id': 'alert-1',
            'title': '14 sales orders risk missing promised date',
            'severity': 'critical',
            'owner': 'Fulfillment',
            'note': 'Average packing lag is 19h across Lahore warehouse.',
        },
        {
            'id': 'alert-2',
            'title': 'Raw material coverage below 6 days for 3 SKUs',
            'severity': 'warning',
            'owner': 'Procurement',
            'note': 'PLA filament black, thermal labels, packaging sleeves.',
        },
        {
            'id': 'alert-3',
            'title': 'Receivables spike from 4 enterprise accounts',
            'severity': 'info',
            'owner': 'Finance',
            'note': 'Aging trend suggests reminder workflow should fire before Monday.',
        },
    ],
    'queues': [
        {
            'id': 'queue-1',
            'type': 'Sales Order',
            'customer': 'Nexa Retail',
            'value': 18400,
            'stage': 'Ready to pack',
            'sla': '2h left',
            'risk': 'High',
        },
        {
            'id': 'queue-2',
            'type': 'Material Request',
            'customer': 'Karachi Plant',
            'value': 9200,
            'stage': 'Awaiting supplier quote',
            'sla': '6h left',
            'risk': 'Medium',
        },
        {
            'id': 'queue-3',
            'type': 'Payment Entry',
            'customer': 'Orbit Stores',
            'value': 7300,
            'stage': 'Follow-up scheduled',
            'sla': 'Today',
            'risk': 'Medium',
        },
        {
            'id': 'queue-4',
            'type': 'Quality Inspection',
            'customer': 'Batch FG-2214',
            'value': 0,
            'stage': 'Variance flagged',
            'sla': '45m left',
            'risk': 'High',
        },
    ],
    'automations': [
        {
            'id': 'auto-1',
            'name': 'Late order escalation',
            'description': 'Escalates Sales Orders when pick-pack-ship pace drops below SLA target.',
            'impact': 'Saves 4.5 coordinator hours/week',
            'active': True,
        },
        {
            'id': 'auto-2',
            'name': 'Stockout prevention nudges',
            'description': 'Groups low-stock SKUs into a single morning procurement digest.',
            'impact': 'Cuts stockout surprises by ~28%',
            'active': True,
        },
        {
            'id': 'auto-3',
            'name': 'Receivables chase assistant',
            'description': 'Drafts follow-up notes for overdue invoices and high-value customers.',
            'impact': 'Pulls cash forward by 2-4 days',
            'active': False,
        },
        {
            'id': 'auto-4',
            'name': 'Executive morning brief',
            'description': 'Creates a 90-second summary of sales, ops risk, and cash collection.',
            'impact': 'Better leadership visibility before standup',
            'active': True,
        },
    ],
    'playbooks': [
        {
            'id': 'play-1',
            'title': 'Warehouse slowdown response',
            'summary': 'Reprioritize waves, split bulky orders, and notify key customers automatically.',
            'actions': ['Boost staffing on pick lane B', 'Auto-split orders over 8 line items', 'Push ETA updates to CRM notes'],
        },
        {
            'id': 'play-2',
            'title': 'Supplier delay containment',
            'summary': 'Convert risk into alternates before production misses start compounding.',
            'actions': ['Raise alternate supplier RFQs', 'Reserve safety stock for top SKUs', 'Hold non-priority production jobs'],
        },
        {
            'id': 'play-3',
            'title': 'Receivables sprint',
            'summary': 'Focus collection effort on the small set of accounts creating most drag.',
            'actions': ['Sort by invoice age x value', 'Send first-touch WhatsApp/email scripts', 'Schedule account manager callbacks'],
        },
    ],
}


def _currency(value):
    return '${:,.0f}'.format(value)


def _simulation(order_surge, supplier_delay, absenteeism, payment_lag, active_automations):
    raw_risk = order_surge * 0.7 + supplier_delay * 8 + absenteeism * 2.4 + payment_lag * 1.6 - active_automations * 6
    risk_score = max(0, min(100, round(raw_risk)))
    throughput_delta = round((order_surge * 0.3 - absenteeism * 0.8 - supplier_delay * 2.5) * -1)
    cash_pressure = max(0, round(payment_lag * 1.9 + supplier_delay * 3))

    recommendations = []
    if risk_score > 70:
        recommendations.append('Trigger high-risk ops war room and freeze low-priority jobs for 24 hours.')
    if supplier_delay >= 4:
        recommendations.append('Spin up alternate supplier RFQs immediately for exposed BOM lines.')
    if payment_lag >= 10:
        recommendations.append('Switch on receivables chase automation before cash drag compounds.')
    if absenteeism >= 10:
        recommendations.append('Offer overtime on the most constrained workstation instead of blanket staffing.')
    if throughput_delta < -10:
        recommendations.append('Auto-split complex orders so the fastest 60% still leave on time.')

    return {
        'riskScore': risk_score,
        'throughputDelta': throughput_delta,
        'cashPressure': cash_pressure,
        'recommendations': recommendations,
    }


@frappe.whitelist()
def get_bootstrap():
    return {
        'state': copy.deepcopy(SEED_STATE),
        'meta': {
            'mode': 'demo-safe',
            'app_version': __version__,
            'user': frappe.session.user,
            'route': '/app/control-tower',
        },
    }


@frappe.whitelist()
def get_morning_brief():
    state = copy.deepcopy(SEED_STATE)
    high_risk_value = sum(item['value'] for item in state['queues'] if item['risk'] == 'High')
    hottest_queue = max(state['queues'], key=lambda item: item['value'])
    active_names = [item['name'] for item in state['automations'] if item['active']]
    brief = ' '.join([
        'ERPNext Control Tower morning brief.',
        f"{len(state['alerts'])} active alerts remain, with {_currency(high_risk_value)} tied up in the highest-risk queue items.",
        f"Top-value item needing attention: {hottest_queue['type']} for {hottest_queue['customer']}, currently {hottest_queue['stage']}.",
        f"{len(active_names)} automations are active: {', '.join(active_names)}.",
        'Recommended focus: clear fulfillment bottlenecks first, then run a short receivables sprint before noon.',
    ])
    return {'brief': brief}


@frappe.whitelist()
def simulate_scenario(order_surge=35, supplier_delay=3, absenteeism=8, payment_lag=12, active_automations=3):
    return _simulation(
        float(order_surge),
        float(supplier_delay),
        float(absenteeism),
        float(payment_lag),
        int(float(active_automations)),
    )
