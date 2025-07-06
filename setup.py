#!/usr/bin/env python3
"""
PDCA Shokunin - 真實多代理協調系統
輕量級 pip 安裝套件
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="pdca-shokunin",
    version="2.0.0",
    author="Raiy Yang",
    author_email="raiy@example.com",
    description="真實多代理 PDCA 協調系統 - 輕量級職人精神版",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/raiyyang/pdca-shokunin",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
    python_requires=">=3.8",
    install_requires=[
        "anthropic>=0.20.0",
        "asyncio-throttle>=1.0.2",
    ],
    extras_require={
        "dev": ["pytest", "black", "flake8"],
    },
    entry_points={
        "console_scripts": [
            "pdca=pdca_shokunin.cli:main",
            "pdca-recorder=pdca_shokunin.cli:recorder_main",
        ],
    },
    include_package_data=True,
    zip_safe=False,
)