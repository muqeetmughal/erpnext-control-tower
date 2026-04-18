from frappe import _


def get_data():
    return [
        {
            'module_name': 'ERPNext Control Tower',
            'type': 'module',
            'label': _('ERPNext Control Tower'),
            'color': 'blue',
            'icon': 'octicon octicon-dashboard',
            'description': _('Execution-first ops cockpit with demo-safe APIs.'),
        }
    ]
