#!/usr/bin/env python3
"""
Request Driver for PhantomShield Attack Simulations

A pure traffic engine that handles authentication, request sending,
and statistics tracking. Designed to be used by all attack scenario scripts.
No detection logic, no database access, no attacker behavior simulation.
"""

import asyncio
import random
import time
from typing import Dict, Optional, Any
from urllib.parse import urljoin

import httpx


class RequestDriver:
    """
    Pure traffic engine for attack simulations.
    
    Handles authentication, request sending with automatic authorization headers,
    configurable delays, and statistics tracking. No detection logic or
    attacker behavior simulation.
    
    Usage:
        async with RequestDriver(base_url, "user", "pass") as driver:
            result = await driver.send_request("GET", "/api/endpoint")
            stats = driver.get_stats()
    """
    
    # Authentication endpoint (assumed standard across PhantomShield)
    AUTH_ENDPOINT = "/auth/login"
    
    # Default request timeout in seconds
    DEFAULT_TIMEOUT = 30.0
    
    # Default headers for all requests
    DEFAULT_HEADERS = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "PhantomShield-Attack-Driver/1.0"
    }
    
    def __init__(
        self,
        base_url: str,
        username: str = "attacker",
        password: str = "password",
        verify_ssl: bool = True,
        min_delay: Optional[float] = None,
        max_delay: Optional[float] = None,
        timeout: float = DEFAULT_TIMEOUT,
        auto_authenticate: bool = True
    ):
        """
        Initialize the RequestDriver.
        
        Args:
            base_url: Base URL of the target PhantomShield instance
            username: Username for authentication
            password: Password for authentication
            verify_ssl: Whether to verify SSL certificates
            min_delay: Minimum delay between requests in seconds (optional)
            max_delay: Maximum delay between requests in seconds (optional)
            timeout: Request timeout in seconds
            auto_authenticate: Whether to authenticate automatically in context manager
        
        Raises:
            ValueError: If min_delay or max_delay are invalid
        """
        self.base_url = base_url.rstrip('/')
        self.username = username
        self.password = password
        self.verify_ssl = verify_ssl
        self.timeout = timeout
        self.auto_authenticate = auto_authenticate
        
        # Validate delay configuration
        if min_delay is not None or max_delay is not None:
            if min_delay is None or max_delay is None:
                raise ValueError("Both min_delay and max_delay must be provided together")
            if min_delay < 0 or max_delay < 0:
                raise ValueError("Delays cannot be negative")
            if min_delay > max_delay:
                raise ValueError("min_delay cannot be greater than max_delay")
        
        self.min_delay = min_delay
        self.max_delay = max_delay
        
        # Internal state
        self.token: Optional[str] = None
        self.client: Optional[httpx.AsyncClient] = None
        self._authenticated = False
        
        # Statistics tracking
        self.total_requests = 0
        self.successful_requests = 0
        self.failed_requests = 0
    
    async def __aenter__(self):
        """Async context manager entry - initializes client and optionally authenticates."""
        self.client = httpx.AsyncClient(
            headers=self.DEFAULT_HEADERS.copy(),
            timeout=httpx.Timeout(self.timeout),
            limits=httpx.Limits(max_keepalive_connections=10, max_connections=20),
            verify=self.verify_ssl,
            follow_redirects=True,
            http2=True
        )
        
        if self.auto_authenticate:
            await self.authenticate()
        
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit - cleans up client."""
        if self.client:
            await self.client.aclose()
            self.client = None
    
    async def authenticate(self) -> None:
        """
        Authenticate with the target service and store JWT token.
        
        Raises:
            RuntimeError: If authentication fails
        """
        if not self.client:
            raise RuntimeError("Client not initialized. Use async context manager.")
        
        auth_url = urljoin(self.base_url, self.AUTH_ENDPOINT)
        auth_payload = {
            "username": self.username,
            "password": self.password
        }
        
        try:
            response = await self.client.post(auth_url, json=auth_payload)
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                
                if not self.token:
                    raise RuntimeError(
                        "Authentication successful but no access_token in response"
                    )
                
                self._authenticated = True
                
                # Update client headers with authorization token
                self.client.headers.update({
                    "Authorization": f"Bearer {self.token}"
                })
                
            else:
                raise RuntimeError(
                    f"Authentication failed with status code: {response.status_code}"
                )
                
        except httpx.RequestError as e:
            raise RuntimeError(f"Authentication request failed: {str(e)}") from e
        except ValueError as e:
            raise RuntimeError(f"Failed to parse authentication response: {str(e)}") from e
    
    async def send_request(
        self,
        method: str,
        endpoint: str,
        json: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Send an authenticated HTTP request.
        
        Args:
            method: HTTP method (GET, POST, PUT, DELETE, etc.)
            endpoint: API endpoint path
            json: Optional JSON payload for request body
        
        Returns:
            Dictionary containing:
                - endpoint: The requested endpoint
                - status_code: HTTP status code (0 if request failed)
                - success: True if status code < 400
                - response_time: Request duration in seconds
                - error: Error message if request failed, None otherwise
        
        Raises:
            RuntimeError: If not authenticated or client not initialized
        """
        if not self.client:
            raise RuntimeError("Client not initialized. Use async context manager.")
        
        if not self.is_authenticated:
            raise RuntimeError("Driver is not authenticated.")
        
        url = urljoin(self.base_url, endpoint)
        start_time = time.perf_counter()
        error = None
        
        try:
            response = await self.client.request(method.upper(), url, json=json)
            status_code = response.status_code
            is_success = status_code < 400
            
        except httpx.RequestError as e:
            status_code = 0
            is_success = False
            error = str(e)
        
        response_time = time.perf_counter() - start_time
        
        # Update statistics
        self.total_requests += 1
        if is_success:
            self.successful_requests += 1
        else:
            self.failed_requests += 1
        
        # Apply delay after request if configured
        if self.min_delay is not None and self.max_delay is not None:
            delay = random.uniform(self.min_delay, self.max_delay)
            await asyncio.sleep(delay)
        
        return {
            "endpoint": endpoint,
            "status_code": status_code,
            "success": is_success,
            "response_time": response_time,
            "error": error
        }
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get current request statistics.
        
        Returns:
            Dictionary containing:
                - total_requests: Total number of requests sent
                - successful_requests: Number of successful requests (status < 400)
                - failed_requests: Number of failed requests
                - success_rate: Percentage of successful requests (0-100)
                - authenticated: Whether authentication was successful
        """
        success_rate = 0.0
        if self.total_requests > 0:
            success_rate = (self.successful_requests / self.total_requests) * 100
        
        return {
            "total_requests": self.total_requests,
            "successful_requests": self.successful_requests,
            "failed_requests": self.failed_requests,
            "success_rate": success_rate,
            "authenticated": self.is_authenticated
        }
    
    def reset_stats(self) -> None:
        """Reset all request statistics to zero."""
        self.total_requests = 0
        self.successful_requests = 0
        self.failed_requests = 0
    
    @property
    def is_authenticated(self) -> bool:
        """Check if the driver is authenticated."""
        return self._authenticated and self.token is not None
    
    @property
    def has_delay_configured(self) -> bool:
        """Check if delay between requests is configured."""
        return self.min_delay is not None and self.max_delay is not None
