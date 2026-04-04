"""
PhantomShield - Server-side in-memory session store.
"""

from __future__ import annotations

import secrets
from datetime import datetime, timedelta
from threading import Lock
from typing import Optional

from app.session.constants import SESSION_EXPIRY_SECONDS
from app.session.models import SessionState

SESSION_ID_BYTES = 32


class InMemorySessionStore:
    def __init__(self) -> None:
        self._sessions: dict[str, SessionState] = {}
        self._lock = Lock()

    def _new_session_id(self) -> str:
        return secrets.token_urlsafe(SESSION_ID_BYTES)

    def _is_valid_session_id(self, session_id: str) -> bool:
        return bool(session_id and len(session_id) >= 20)

    def _is_expired(self, session: SessionState) -> bool:
        timeout = timedelta(seconds=SESSION_EXPIRY_SECONDS)
        return datetime.utcnow() - session.last_activity > timeout

    def get_session(self, session_id: str) -> Optional[SessionState]:
        """
        Validate and fetch an active session.
        Missing/invalid/expired IDs return None.
        """
        if not self._is_valid_session_id(session_id):
            return None

        with self._lock:
            session = self._sessions.get(session_id)
            if session is None:
                return None

            if self._is_expired(session):
                del self._sessions[session_id]
                return None

            # Every valid request refreshes activity timestamp.
            session.update_activity()
            return session

    def create_session(self) -> SessionState:
        session = SessionState(session_id=self._new_session_id())
        with self._lock:
            self._sessions[session.session_id] = session
        return session

    def rotate_session(self, old_id: str) -> SessionState:
        """
        Rotate session_id to prevent fixation after login.
        """
        with self._lock:
            old_state = self._sessions.pop(old_id, None)

            if old_state is None:
                new_state = SessionState(session_id=self._new_session_id())
            else:
                new_state = SessionState(
                    session_id=self._new_session_id(),
                    user_id=old_state.user_id,
                    routing_state=old_state.routing_state,
                    risk_score=old_state.risk_score,
                    created_at=old_state.created_at,
                    last_activity=datetime.utcnow(),
                    user_name=old_state.user_name,
                    flags=old_state.flags.copy(),
                )

            self._sessions[new_state.session_id] = new_state
            return new_state

    def cleanup_expired(self) -> int:
        with self._lock:
            to_remove = [sid for sid, state in self._sessions.items() if self._is_expired(state)]
            for sid in to_remove:
                del self._sessions[sid]
            return len(to_remove)


session_store = InMemorySessionStore()


def get_session_store() -> InMemorySessionStore:
    return session_store
