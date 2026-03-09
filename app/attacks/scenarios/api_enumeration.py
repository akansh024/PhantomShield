#!/usr/bin/env python3
"""
API Enumeration Attack Simulation for PhantomShield

Simulates a realistic post-authentication API enumeration attack.
Used to trigger route_diversity rules and test forensic detection.
"""

import asyncio
import random
import sys
from typing import Dict, Optional, List
from urllib.parse import urljoin

import httpx


class ApiEnumerationAttack:
    """
    Simulates an API enumeration attack after successful authentication.
    
    Makes numerous requests to various API endpoints to trigger
    behavioral detection rules and forensic logging.
    """
    
    # Authentication endpoint
    AUTH_ENDPOINT = "/auth/login"
    
    # Base enumeration endpoints
    ENUMERATION_ENDPOINTS = [
        # Core user endpoints
        "/api/profile",
        "/api/settings",
        "/api/notifications",
        "/api/activity",
        
        # Dashboard and metrics
        "/api/dashboard",
        "/api/metrics",
        "/api/stats",
        "/api/analytics",
        
        # User management (will add query params dynamically)
        "/api/users",
        "/api/users/me",
        "/api/users/roles",
        "/api/users/permissions",
        
        # Admin endpoints
        "/api/admin",
        "/api/admin/users",
        "/api/admin/settings",
        "/api/admin/logs",
        "/api/admin/audit",
        "/api/admin/config",
        "/api/admin/health",
        
        # API keys and tokens
        "/api/keys",
        "/api/tokens",
        "/api/secrets",
        
        # Data endpoints
        "/api/data",
        "/api/files",
        "/api/documents",
        "/api/exports",
        
        # Reports
        "/api/reports",
        "/api/reports/daily",
        "/api/reports/weekly",
        "/api/reports/monthly",
        
        # System and health
        "/api/health",
        "/api/version",
        "/api/status",
        "/api/config",
        
        # Internal testing endpoints
        "/api/internal/test",
        "/api/internal/debug",
        "/api/internal/metrics",
        "/api/internal/cache",
        "/api/internal/queue",
        
        # Feature-specific endpoints
        "/api/features",
        "/api/preferences",
        "/api/search",
        "/api/export",
        "/api/import",
        "/api/backup",
        "/api/restore",
        
        # Versioned endpoints
        "/api/v1/users",
        "/api/v1/admin",
        "/api/v1/keys",
        "/api/v2/users",
        "/api/v2/admin",
        "/api/v2/keys",
    ]
    
    # Endpoints that support ID enumeration
    ID_ENUMERATION_ENDPOINTS = [
        "/api/users",
        "/api/keys",
        "/api/data",
    ]
    
    # Admin endpoints for burst behavior
    ADMIN_ENDPOINTS = [
        "/api/admin",
        "/api/admin/users",
        "/api/admin/settings",
        "/api/admin/logs",
        "/api/admin/audit",
        "/api/admin/config",
    ]
    
    # Request headers (non-auth specific)
    DEFAULT_HEADERS = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "PhantomShield-Attack-Simulation/1.0"
    }
    
    def __init__(self, base_url: str, verify_ssl: bool = True):
        """
        Initialize the attack simulation.
        
        Args:
            base_url: Base URL of the target PhantomShield instance
            verify_ssl: Whether to verify SSL certificates
        """
        self.base_url = base_url.rstrip('/')
        self.token: Optional[str] = None
        self.verify_ssl = verify_ssl
        self.client = None
        
    async def __aenter__(self):
        """Async context manager entry."""
        self.client = httpx.AsyncClient(
            headers=self.DEFAULT_HEADERS,
            timeout=httpx.Timeout(10.0),
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
            verify=self.verify_ssl
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self.client:
            await self.client.aclose()
    
    async def authenticate(self) -> bool:
        """
        Authenticate to get JWT token.
        
        Returns:
            True if authentication successful, False otherwise
        """
        auth_url = urljoin(self.base_url, self.AUTH_ENDPOINT)
        auth_payload = {
            "username": "attacker",
            "password": "password"
        }
        
        try:
            print(f"[*] Authenticating to {auth_url}")
            response = await self.client.post(auth_url, json=auth_payload)
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                if self.token:
                    print(f"[+] Authentication successful, token acquired")
                    return True
                else:
                    print("[-] Authentication failed: No access_token in response")
                    return False
            else:
                print(f"[-] Authentication failed: HTTP {response.status_code}")
                return False
                
        except Exception as e:
            print(f"[-] Authentication error: {str(e)}")
            return False
    
    def _get_auth_headers(self) -> Dict[str, str]:
        """
        Get headers with authorization token.
        
        Returns:
            Headers dictionary with Bearer token
        """
        if not self.token:
            return {}
        
        return {
            "Authorization": f"Bearer {self.token}"
        }
    
    def _build_url_with_params(self, base_endpoint: str) -> str:
        """
        Build URL with dynamic query parameters for endpoints that support ID enumeration.
        
        Args:
            base_endpoint: Base endpoint path
            
        Returns:
            Full URL with query parameters if applicable
        """
        # Check if this endpoint supports ID enumeration
        for enum_endpoint in self.ID_ENUMERATION_ENDPOINTS:
            if base_endpoint == enum_endpoint:
                # Random ID between 1-5
                user_id = random.randint(1, 5)
                return f"{base_endpoint}?id={user_id}"
        
        return base_endpoint
    
    def _get_request_delay(self, request_index: int, endpoint: str) -> float:
        """
        Calculate dynamic delay based on request phase and endpoint type.
        
        Args:
            request_index: Current request index (0-based)
            endpoint: Target endpoint
            
        Returns:
            Delay in seconds
        """
        # Admin endpoints occasionally have no delay
        if endpoint in self.ADMIN_ENDPOINTS and random.random() < 0.3:
            return 0.0
        
        # First 10 requests: burst mode (very fast)
        if request_index < 10:
            return random.uniform(0.01, 0.05)
        
        # Remaining requests: normal scanning speed
        return random.uniform(0.05, 0.2)
    
    async def enumerate_endpoint(self, endpoint: str, request_index: int) -> tuple:
        """
        Make a single enumeration request to an endpoint.
        
        Args:
            endpoint: API endpoint to request
            request_index: Current request index for delay calculation
            
        Returns:
            Tuple of (endpoint, status_code, success)
        """
        # Build URL with optional query parameters
        endpoint_with_params = self._build_url_with_params(endpoint)
        url = urljoin(self.base_url, endpoint_with_params)
        headers = self._get_auth_headers()
        
        try:
            response = await self.client.get(url, headers=headers)
            is_success = response.status_code < 400
            
            status_display = f"{response.status_code}"
            if is_success:
                print(f"  {endpoint_with_params:<35} -> {status_display:>3}")
            else:
                print(f"  {endpoint_with_params:<35} -> {status_display:>3} (failed)")
            
            return endpoint, response.status_code, is_success
            
        except Exception as e:
            error_msg = str(e)[:30]
            print(f"  {endpoint_with_params:<35} -> ERROR: {error_msg}")
            return endpoint, 0, False
    
    async def run(self) -> None:
        """
        Execute the full enumeration attack sequence.
        """
        print(f"\n[+] Starting API Enumeration Attack against {self.base_url}")
        print("=" * 80)
        
        # Step 1: Authenticate
        if not await self.authenticate():
            print("[-] Cannot proceed without authentication token")
            return
        
        # Expand endpoints with variations
        all_targets = self.ENUMERATION_ENDPOINTS.copy()
        
        # Add ID variations for enumeration endpoints
        for endpoint in self.ID_ENUMERATION_ENDPOINTS:
            # Add 3 ID variations for each
            for i in range(1, 4):
                all_targets.append(f"{endpoint}?id={i}")
        
        # Remove duplicates while preserving order
        seen = set()
        unique_targets = []
        for target in all_targets:
            if target not in seen:
                seen.add(target)
                unique_targets.append(target)
        
        print(f"[+] Starting endpoint enumeration ({len(unique_targets)} targets)")
        print(f"[+] Burst phase: first 10 requests (0.01-0.05s delay)")
        print(f"[+] Admin endpoints: 30% chance of zero delay")
        print("-" * 80)
        
        # Step 2: Enumerate endpoints with dynamic delays
        successful_requests = 0
        failed_requests = 0
        
        for i, endpoint in enumerate(unique_targets, 1):
            # Get dynamic delay based on request phase and endpoint
            delay = self._get_request_delay(i - 1, endpoint)
            
            _, status_code, is_success = await self.enumerate_endpoint(endpoint, i - 1)
            
            if is_success:
                successful_requests += 1
            else:
                failed_requests += 1
            
            # Apply delay (skip if delay is 0)
            if delay > 0:
                await asyncio.sleep(delay)
        
        print("-" * 80)
        print(f"[+] Enumeration complete")
        print(f"    Total requests: {successful_requests + failed_requests}")
        print(f"    Successful requests: {successful_requests}")
        print(f"    Failed requests: {failed_requests}")
        print(f"    Unique endpoints: {len(unique_targets)}")
        print("=" * 80)


async def run_attack(base_url: str, no_verify: bool = False) -> None:
    """
    Main attack entry point.
    
    Args:
        base_url: Base URL of the target PhantomShield instance
        no_verify: Disable SSL certificate verification
    """
    async with ApiEnumerationAttack(base_url, verify_ssl=not no_verify) as attack:
        await attack.run()


def main():
    """
    CLI entry point for the attack simulation.
    """
    import argparse
    
    parser = argparse.ArgumentParser(
        description="PhantomShield API Enumeration Attack Simulation",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python api_enumeration.py http://localhost:8000
  python api_enumeration.py https://phantomshield.example.com --no-verify
        """
    )
    
    parser.add_argument(
        "base_url",
        help="Base URL of the target PhantomShield instance"
    )
    
    parser.add_argument(
        "--no-verify",
        action="store_true",
        help="Disable SSL certificate verification"
    )
    
    args = parser.parse_args()
    
    # Run the attack
    try:
        asyncio.run(run_attack(args.base_url, args.no_verify))
    except KeyboardInterrupt:
        print("\n[!] Attack interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n[!] Attack failed: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
