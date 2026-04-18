from setuptools import find_packages, setup

with open('requirements.txt') as f:
    install_requires = [line.strip() for line in f if line.strip()]

setup(
    name='erpnext_control_tower',
    version='0.2.0',
    description='ERPNext Control Tower Frappe app shell',
    author='OpenClaw',
    packages=find_packages(),
    include_package_data=True,
    zip_safe=False,
    install_requires=install_requires,
)
