"""
PDCA Shokunin - 真實多代理協調系統
職人精神版本，追求極致的開發體驗
"""

__version__ = "2.0.0"
__author__ = "Raiy Yang"

from .core import PDCAOrchestrator
from .agents import DesignAgent, DeveloperAgent, QualityAgent, OptimizationAgent, RecorderAgent

__all__ = [
    "PDCAOrchestrator",
    "DesignAgent", 
    "DeveloperAgent",
    "QualityAgent",
    "OptimizationAgent", 
    "RecorderAgent"
]