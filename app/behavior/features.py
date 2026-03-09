"""
Behavior Feature Extractor for PhantomShield Cybersecurity System

Converts raw behavioral snapshots into numeric features.
Pure function with no side effects, mutations, or external dependencies.
"""

import math
from typing import Dict, List, Optional
from statistics import mean, variance as stat_variance
from statistics import StatisticsError


class BehaviorFeatureExtractor:
    """
    Extracts numeric features from behavior snapshots.
    
    This class provides pure, deterministic functions that convert
    raw behavioral data into numeric features for downstream analysis.
    No state modification, no external calls, no side effects.
    """
    
    def extract(self, snapshot: Dict) -> Dict[str, float]:
        """
        Extract numeric features from a behavior snapshot.
        
        Args:
            snapshot: Dictionary from BehaviorCollector.get_session_snapshot()
            
        Returns:
            Dictionary of feature names to float values.
            Empty dictionary if snapshot is empty.
            
        Note:
            This is a pure function with no side effects.
            All edge cases are handled safely.
        """
        # Handle empty snapshot
        if not snapshot:
            return {}
        
        # Initialize features dictionary
        features = {}
        
        # 1️⃣ Volume Features
        features.update(self._extract_volume_features(snapshot))
        
        # 2️⃣ Timing Features
        features.update(self._extract_timing_features(snapshot))
        
        # 3️⃣ Behavioral Ratios
        features.update(self._extract_behavioral_ratios(snapshot))
        
        return features
    
    def _extract_volume_features(self, snapshot: Dict) -> Dict[str, float]:
        """Extract volume-related features."""
        features = {}
        
        # Total requests (convert to float for consistency)
        total_requests = float(snapshot.get('total_requests', 0))
        features['total_requests'] = total_requests
        
        # Requests per second using total_requests, not timestamp count
        timestamps = snapshot.get('request_timestamps', [])
        if len(timestamps) < 2:
            features['requests_per_second'] = 0.0
        else:
            duration = max(timestamps) - min(timestamps)
            # Prevent division by zero with small epsilon
            if duration > 1e-6:
                features['requests_per_second'] = total_requests / duration
            else:
                # Duration too small, use epsilon to avoid division by zero
                features['requests_per_second'] = total_requests / 1e-6
        
        return features
    
    def _extract_timing_features(self, snapshot: Dict) -> Dict[str, float]:
        """Extract timing-related features."""
        features = {}
        timestamps = snapshot.get('request_timestamps', [])
        
        # Session duration
        if len(timestamps) < 2:
            features['session_duration'] = 0.0
            features['interval_mean'] = 0.0
            features['interval_variance'] = 0.0
        else:
            # Sort timestamps to ensure chronological order
            sorted_timestamps = sorted(timestamps)
            
            # Session duration (seconds)
            duration = sorted_timestamps[-1] - sorted_timestamps[0]
            features['session_duration'] = duration
            
            # Calculate intervals between consecutive requests
            intervals = [
                sorted_timestamps[i + 1] - sorted_timestamps[i]
                for i in range(len(sorted_timestamps) - 1)
            ]
            
            # Mean interval
            features['interval_mean'] = mean(intervals) if intervals else 0.0
            
            # Interval variance (handle single interval case)
            if len(intervals) > 1:
                try:
                    features['interval_variance'] = stat_variance(intervals)
                except StatisticsError:
                    features['interval_variance'] = 0.0
            else:
                features['interval_variance'] = 0.0
        
        return features
    
    def _extract_behavioral_ratios(self, snapshot: Dict) -> Dict[str, float]:
        """Extract behavioral ratio features."""
        features = {}
        
        total_requests = float(snapshot.get('total_requests', 0))
        
        # Error rate (errors / total requests)
        if total_requests > 0:
            error_count = float(snapshot.get('error_count', 0))
            features['error_rate'] = error_count / total_requests
        else:
            features['error_rate'] = 0.0
        
        # Sensitive route ratio
        if total_requests > 0:
            sensitive_hits = float(snapshot.get('sensitive_route_hits', 0))
            features['sensitive_ratio'] = sensitive_hits / total_requests
        else:
            features['sensitive_ratio'] = 0.0
        
        # Route diversity (unique routes / total requests)
        if total_requests > 0:
            unique_routes_count = float(snapshot.get('unique_route_count', 0))
            features['route_diversity'] = unique_routes_count / total_requests
        else:
            features['route_diversity'] = 0.0
        
        return features
    
    def batch_extract(self, snapshots: List[Dict]) -> List[Dict[str, float]]:
        """
        Extract features from multiple snapshots.
        
        Args:
            snapshots: List of snapshot dictionaries
            
        Returns:
            List of feature dictionaries in the same order as input
            
        Note:
            Maintains pure function properties - no shared state between extractions.
        """
        return [self.extract(snapshot) for snapshot in snapshots]
