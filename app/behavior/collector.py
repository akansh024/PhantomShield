"""
Behavior Collector for PhantomShield Cybersecurity System

Collects raw behavioral signals per request without any analysis or state modification.
Designed to be async-compatible and isolated by session.
"""

import time
from typing import Dict, List, Optional, Set, Deque
from dataclasses import dataclass, field
from collections import defaultdict, deque
import asyncio


@dataclass
class SessionBehavior:
    """Container for raw behavioral data per session."""
    session_id: str
    total_requests: int = 0
    unique_routes: Set[str] = field(default_factory=set)
    request_timestamps: Deque[float] = field(default_factory=lambda: deque(maxlen=1000))  # Capped at 1000
    error_count: int = 0
    sensitive_route_hits: int = 0
    _lock: asyncio.Lock = field(default_factory=asyncio.Lock)
    
    # Track last updated timestamp for potential cleanup
    last_updated: float = field(default_factory=time.time)


class BehaviorCollector:
    """
    Collects raw behavioral signals per request.
    
    This class only collects data - no analysis, scoring, or state modification.
    All session data is isolated by session_id and maintained in memory.
    """
    
    def __init__(self, max_timestamps_per_session: int = 1000):
        """
        Initialize the BehaviorCollector.
        
        Args:
            max_timestamps_per_session: Maximum number of timestamps to store per session
            
        Uses a thread-safe dictionary to store session behaviors.
        """
        self._session_behaviors: Dict[str, SessionBehavior] = {}
        self._cleanup_lock = asyncio.Lock()
        self._max_timestamps_per_session = max_timestamps_per_session
        
        # Configuration for sensitive routes (could be loaded from config)
        # Using startswith() for matching, so we track route prefixes
        self._sensitive_route_prefixes = {
            '/admin', '/api/admin', '/api/keys', 
            '/auth/token', '/password/reset', '/api/users',
            '/api/v1/admin', '/api/v1/keys', '/api/v1/users'
        }
    
    async def collect_request(
        self,
        session_id: str,
        route: str,
        method: str,
        timestamp: Optional[float] = None,
        response_status: Optional[int] = None,
        query_params: Optional[Dict] = None,
        user_agent: Optional[str] = None
    ) -> None:
        """
        Collect raw behavioral signals for a single request.
        
        Args:
            session_id: Unique identifier for the session
            route: Request route/path
            method: HTTP method (GET, POST, etc.)
            timestamp: Request timestamp (uses current time if None)
            response_status: HTTP response status code
            query_params: Query parameters from the request
            user_agent: User agent string from the request
            
        Note:
            This method only collects raw data - no analysis or state modification.
        """
        if timestamp is None:
            timestamp = time.time()
        
        # Get or create session behavior object
        session_behavior = await self._get_or_create_session_behavior(session_id)
        
        # Update session behavior under lock to ensure thread safety
        async with session_behavior._lock:
            # Basic request counting
            session_behavior.total_requests += 1
            
            # Track unique routes
            session_behavior.unique_routes.add(route)
            
            # Track request timestamps (automatically capped by deque)
            session_behavior.request_timestamps.append(timestamp)
            
            # Count errors (4xx and 5xx status codes)
            if response_status and (400 <= response_status < 600):
                session_behavior.error_count += 1
            
            # Track sensitive route hits using startswith() for prefix matching
            if self._is_sensitive_route(route):
                session_behavior.sensitive_route_hits += 1
            
            # Update last accessed timestamp
            session_behavior.last_updated = timestamp
    
    def _is_sensitive_route(self, route: str) -> bool:
        """
        Check if a route is sensitive by checking if it starts with any sensitive prefix.
        
        Args:
            route: The route to check
            
        Returns:
            True if the route starts with any sensitive prefix, False otherwise
        """
        # Check if route starts with any sensitive prefix
        for prefix in self._sensitive_route_prefixes:
            if route.startswith(prefix):
                return True
        return False
    
    async def _get_or_create_session_behavior(self, session_id: str) -> SessionBehavior:
        """
        Get existing session behavior or create a new one.
        
        Args:
            session_id: Session identifier
            
        Returns:
            SessionBehavior object for the given session
        """
        if session_id not in self._session_behaviors:
            async with self._cleanup_lock:
                # Double-check after acquiring lock
                if session_id not in self._session_behaviors:
                    self._session_behaviors[session_id] = SessionBehavior(
                        session_id=session_id
                    )
                    # Set the maxlen for timestamps deque
                    self._session_behaviors[session_id].request_timestamps = deque(
                        maxlen=self._max_timestamps_per_session
                    )
        
        return self._session_behaviors[session_id]
    
    async def get_session_snapshot(self, session_id: str) -> Dict:
        """
        Get raw behavioral metrics for a specific session.
        
        Args:
            session_id: Session identifier
            
        Returns:
            Dictionary containing raw behavioral metrics
            
        Note:
            Returns empty dict if session doesn't exist.
            This is intentional - non-existent sessions have no behavior.
        """
        if session_id not in self._session_behaviors:
            return {}
        
        session_behavior = self._session_behaviors[session_id]
        
        # Create a snapshot under lock to ensure consistency
        async with session_behavior._lock:
            # Convert deque to list for serialization
            timestamps_list = list(session_behavior.request_timestamps)
            
            return {
                "session_id": session_behavior.session_id,
                "total_requests": session_behavior.total_requests,
                "unique_routes": list(session_behavior.unique_routes),
                "unique_route_count": len(session_behavior.unique_routes),
                "request_timestamps": timestamps_list,
                "timestamp_count": len(timestamps_list),
                "max_timestamps_cap": self._max_timestamps_per_session,
                "error_count": session_behavior.error_count,
                "sensitive_route_hits": session_behavior.sensitive_route_hits,
                "last_updated": session_behavior.last_updated
            }
    
    async def get_all_session_snapshots(self) -> Dict[str, Dict]:
        """
        Get snapshots for all active sessions.
        
        Returns:
            Dictionary mapping session_id to snapshot
        """
        snapshots = {}
        for session_id in list(self._session_behaviors.keys()):
            snapshot = await self.get_session_snapshot(session_id)
            if snapshot:  # Only include non-empty snapshots
                snapshots[session_id] = snapshot
        return snapshots
    
    async def clear_session(self, session_id: str) -> bool:
        """
        Clear behavior data for a specific session.
        
        Args:
            session_id: Session identifier
            
        Returns:
            True if session was cleared, False if session didn't exist
        """
        if session_id in self._session_behaviors:
            async with self._cleanup_lock:
                if session_id in self._session_behaviors:
                    del self._session_behaviors[session_id]
                    return True
        return False
    
    async def cleanup_old_sessions(self, max_age_seconds: float = 3600) -> int:
        """
        Remove sessions that haven't been updated in a while.
        
        Args:
            max_age_seconds: Maximum age in seconds before cleanup
            
        Returns:
            Number of sessions removed
            
        Note:
            This is a simple cleanup mechanism to prevent memory leaks.
            In production, consider a more sophisticated approach.
        """
        current_time = time.time()
        sessions_to_remove = []
        
        # First, identify sessions to remove
        for session_id, behavior in self._session_behaviors.items():
            if current_time - behavior.last_updated > max_age_seconds:
                sessions_to_remove.append(session_id)
        
        # Then remove them under lock
        async with self._cleanup_lock:
            for session_id in sessions_to_remove:
                if session_id in self._session_behaviors:
                    del self._session_behaviors[session_id]
        
        return len(sessions_to_remove)
    
    def get_active_session_count(self) -> int:
        """
        Get count of active sessions.
        
        Returns:
            Number of active sessions being tracked
        """
        return len(self._session_behaviors)
    
    def get_max_timestamps_per_session(self) -> int:
        """
        Get the maximum number of timestamps stored per session.
        
        Returns:
            The maximum timestamps cap
        """
        return self._max_timestamps_per_session
