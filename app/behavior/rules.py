"""
Behavior Rule Engine for PhantomShield Cybersecurity System

Rule-based behavioral risk scoring that evaluates numeric features
and returns a risk delta. Pure, deterministic, with no side effects.
"""

from typing import Dict


class BehaviorRuleEngine:
    """
    Evaluates behavioral features against predefined rules to produce a risk delta.
    
    This class implements deterministic, rule-based risk assessment based on
    behavioral patterns. It does not modify state, access external systems,
    or make routing decisions.
    """
    
    # Rule constants - clearly defined and auditable
    # Request rate thresholds
    REQUEST_RATE_LOW_THRESHOLD = 8.0  # requests per second (increased from 5.0)
    REQUEST_RATE_HIGH_THRESHOLD = 20.0  # requests per second (increased from 15.0)
    REQUEST_RATE_LOW_RISK = 0.10
    REQUEST_RATE_HIGH_RISK = 0.20
    
    # Error rate threshold
    ERROR_RATE_THRESHOLD = 0.3  # 30% error rate
    ERROR_RATE_RISK = 0.15
    
    # Sensitive route threshold
    SENSITIVE_RATIO_THRESHOLD = 0.2  # 20% sensitive routes
    SENSITIVE_RATIO_RISK = 0.15
    
    # Enumeration behavior thresholds (increased to reduce false positives)
    ROUTE_DIVERSITY_THRESHOLD = 0.9  # 90% unique routes (increased from 0.8)
    ENUMERATION_REQUEST_THRESHOLD = 30  # total requests (increased from 20)
    ENUMERATION_RISK = 0.15
    
    # Automation pattern thresholds
    INTERVAL_VARIANCE_THRESHOLD = 0.001  # very consistent intervals
    AUTOMATION_REQUEST_THRESHOLD = 15  # total requests
    AUTOMATION_RISK = 0.10
    
    # Risk delta caps
    MAX_RISK_DELTA = 0.5  # Rules should not dominate ML entirely
    
    def evaluate(self, features: Dict[str, float]) -> float:
        """
        Evaluate features against behavioral rules and return risk delta.
        
        Args:
            features: Dictionary of numeric features from BehaviorFeatureExtractor
            
        Returns:
            Risk delta between 0.0 and 0.5 (inclusive)
            Returns 0.0 if no suspicious signals or empty features
            
        Note:
            Pure function with no side effects.
            Deterministic - same features always produce same risk delta.
        """
        # Handle empty features
        if not features:
            return 0.0
        
        risk_delta = 0.0
        
        # 1️⃣ High Request Rate Rule
        risk_delta += self._evaluate_request_rate(features)
        
        # 2️⃣ High Error Rate Rule
        risk_delta += self._evaluate_error_rate(features)
        
        # 3️⃣ Sensitive Route Probing Rule
        risk_delta += self._evaluate_sensitive_route_probing(features)
        
        # 4️⃣ Enumeration Behavior Rule
        risk_delta += self._evaluate_enumeration_behavior(features)
        
        # 5️⃣ Extremely Low Interval Variance (Automation Pattern) Rule
        risk_delta += self._evaluate_automation_pattern(features)
        
        # Cap the total risk delta
        return min(risk_delta, self.MAX_RISK_DELTA)
    
    def _evaluate_request_rate(self, features: Dict[str, float]) -> float:
        """Evaluate high request rate risk."""
        requests_per_second = features.get('requests_per_second', 0.0)
        
        if requests_per_second > self.REQUEST_RATE_HIGH_THRESHOLD:
            return self.REQUEST_RATE_HIGH_RISK
        elif requests_per_second > self.REQUEST_RATE_LOW_THRESHOLD:
            return self.REQUEST_RATE_LOW_RISK
        else:
            return 0.0
    
    def _evaluate_error_rate(self, features: Dict[str, float]) -> float:
        """Evaluate high error rate risk."""
        error_rate = features.get('error_rate', 0.0)
        
        if error_rate > self.ERROR_RATE_THRESHOLD:
            return self.ERROR_RATE_RISK
        else:
            return 0.0
    
    def _evaluate_sensitive_route_probing(self, features: Dict[str, float]) -> float:
        """Evaluate sensitive route probing risk."""
        sensitive_ratio = features.get('sensitive_ratio', 0.0)
        
        if sensitive_ratio > self.SENSITIVE_RATIO_THRESHOLD:
            return self.SENSITIVE_RATIO_RISK
        else:
            return 0.0
    
    def _evaluate_enumeration_behavior(self, features: Dict[str, float]) -> float:
        """Evaluate enumeration behavior risk."""
        route_diversity = features.get('route_diversity', 0.0)
        total_requests = features.get('total_requests', 0.0)
        
        if (route_diversity > self.ROUTE_DIVERSITY_THRESHOLD and 
            total_requests > self.ENUMERATION_REQUEST_THRESHOLD):
            return self.ENUMERATION_RISK
        else:
            return 0.0
    
    def _evaluate_automation_pattern(self, features: Dict[str, float]) -> float:
        """Evaluate automation pattern risk (low interval variance)."""
        interval_variance = features.get('interval_variance', 0.0)
        total_requests = features.get('total_requests', 0.0)
        
        # Fixed: Variance equal to 0 is highly suspicious for automation
        if (interval_variance < self.INTERVAL_VARIANCE_THRESHOLD and 
            total_requests > self.AUTOMATION_REQUEST_THRESHOLD):
            return self.AUTOMATION_RISK
        else:
            return 0.0
    
    def batch_evaluate(self, features_list: list[Dict[str, float]]) -> list[float]:
        """
        Evaluate multiple feature sets in batch.
        
        Args:
            features_list: List of feature dictionaries
            
        Returns:
            List of risk deltas in the same order as input
            
        Note:
            Pure function - each evaluation is independent.
        """
        return [self.evaluate(features) for features in features_list]
