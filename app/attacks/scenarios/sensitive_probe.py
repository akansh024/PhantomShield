#!/usr/bin/env python3
"""
Sensitive Endpoint Probe Simulation for PhantomShield

Simulates a post-authentication privilege probing attack targeting only sensitive endpoints.
Used to trigger sensitive_ratio rules and test canary traps in isolation.
"""

import asyncio
import random
import sys
from typing import Dict, Optional, List, Tuple, Set
from urllib.parse import urljoin

import httpx


class SensitiveProbeAttack:
    """
    Simulates a privilege probing attack targeting sensitive endpoints.
    
    Makes repeated requests to sensitive/admin endpoints to trigger
    sensitive_ratio detection rules without aggressive request rates.
    """
    
    # Authentication endpoint
    AUTH_ENDPOINT = "/auth/login"
    
    # Sensitive endpoints to probe (high-value targets)
    SENSITIVE_ENDPOINTS = [
        # Admin interfaces
        "/api/admin",
        "/api/admin/users",
        "/api/admin/users/1",
        "/api/admin/roles",
        "/api/admin/permissions",
        "/api/admin/settings",
        "/api/admin/logs",
        "/api/admin/audit",
        "/api/admin/backups",
        "/api/admin/maintenance",
        
        # Key and secret management
        "/api/keys",
        "/api/keys/1",
        "/api/keys/rotate",
        "/api/secrets",
        "/api/secrets/1",
        "/api/tokens",
        "/api/tokens/validate",
        "/api/credentials",
        
        # Internal debugging endpoints
        "/api/internal/debug",
        "/api/internal/debug/stacktrace",
        "/api/internal/debug/vars",
        "/api/internal/metrics",
        "/api/internal/metrics/prometheus",
        "/api/internal/health/detailed",
        "/api/internal/status",
        "/api/internal/cache/dump",
        "/api/internal/queue/inspect",
        
        # System configuration
        "/api/config",
        "/api/config/database",
        "/api/config/cache",
        "/api/config/auth",
        "/api/system/config",
        "/api/system/env",
        "/api/system/info",
        "/api/system/dependencies",
        "/api/system/health",
        
        # Additional sensitive routes
        "/api/v1/admin",
        "/api/v1/keys",
        "/api/v1/secrets",
        "/api/v2/admin",
        "/api/v2/keys",
        "/api/v2/secrets",
        "/api/private",
        "/api/private/users",
        "/api/console",
        "/api/debug",
    ]
    
    # High-value canary trap endpoints (extra sensitive)
    CANARY_TRAP_ENDPOINTS = [
        "/api/admin/backups/credentials",
        "/api/internal/debug/secrets",
        "/api/system/env/aws",
        "/api/config/passwords",
        "/api/admin/users/root",
    ]
    
    # Request headers (non-auth specific)
    DEFAULT_HEADERS = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "PhantomShield-Sensitive-Probe/1.0"
    }
    
    def __init__(self, base_url: str, verify_ssl: bool = True, canary_probability: float = 0.2):
        """
        Initialize the sensitive probe attack simulation.
        
        Args:
            base_url: Base URL of the target PhantomShield instance
            verify_ssl: Whether to verify SSL certificates
            canary_probability: Probability of probing a canary trap endpoint (0.0-1.0)
        """
        self.base_url = base_url.rstrip('/')
        self.token: Optional[str] = None
        self.verify_ssl = verify_ssl
        self.canary_probability = canary_probability
        self.client = None
        
    async def __aenter__(self):
        """Async context manager entry."""
        self.client = httpx.AsyncClient(
            headers=self.DEFAULT_HEADERS,
            timeout=httpx.Timeout(15.0),
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
            verify=self.verify_ssl,
            follow_redirects=False
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
    
    def _get_next_target(self) -> str:
        """
        Randomly select the next target endpoint.
        
        Includes occasional canary trap probes to test detection.
        
        Returns:
            Endpoint path for next request
        """
        # Use configured canary probability
        if random.random() < self.canary_probability:
            return random.choice(self.CANARY_TRAP_ENDPOINTS)
        
        # Otherwise probe regular sensitive endpoints
        return random.choice(self.SENSITIVE_ENDPOINTS)
    
    async def probe_endpoint(self, endpoint: str, request_id: int, hit_endpoints: Set[str]) -> Tuple[str, int, bool]:
        """
        Make a single probe request to a sensitive endpoint.
        
        Args:
            endpoint: API endpoint to probe
            request_id: Sequential request identifier
            hit_endpoints: Set to track unique endpoints hit
            
        Returns:
            Tuple of (endpoint, status_code, success)
        """
        url = urljoin(self.base_url, endpoint)
        headers = self._get_auth_headers()
        
        # Track this endpoint
        hit_endpoints.add(endpoint)
        
        try:
            response = await self.client.get(url, headers=headers)
            is_success = response.status_code < 400
            
            # Determine if this is a canary trap
            is_canary = endpoint in self.CANARY_TRAP_ENDPOINTS
            canary_marker = " 🪤" if is_canary else ""
            
            # Format output
            status_display = f"{response.status_code}"
            if is_success:
                print(f"  {request_id:3d} | {endpoint:<45} | {status_display:>3}{canary_marker}")
            else:
                print(f"  {request_id:3d} | {endpoint:<45} | {status_display:>3} (blocked){canary_marker}")
            
            return endpoint, response.status_code, is_success
            
        except Exception as e:
            error_msg = str(e)[:30]
            print(f"  {request_id:3d} | {endpoint:<45} | ERROR: {error_msg}")
            return endpoint, 0, False
    
    async def run(self, total_requests: int = 40) -> None:
        """
        Execute the full sensitive probe attack sequence.
        
        Args:
            total_requests: Total number of probe requests to make (default: 40)
        """
        print(f"\n[+] Starting Sensitive Endpoint Probe Attack against {self.base_url}")
        print("=" * 80)
        print(f"[+] Target: {self.base_url}")
        print(f"[+] Total requests: {total_requests}")
        print(f"[+] Delay range: 0.15-0.35 seconds (moderate)")
        print(f"[+] Canary trap probability: {self.canary_probability:.0%}")
        print("=" * 80)
        
        # Step 1: Authenticate
        if not await self.authenticate():
            print("[-] Cannot proceed without authentication token")
            return
        
        print(f"\n[+] Starting sensitive endpoint probing...")
        print("-" * 80)
        print("  #   | Endpoint                                        | Status")
        print("-" * 80)
        
        # Step 2: Probe sensitive endpoints with moderate, randomized delays
        successful_requests = 0
        failed_requests = 0
        canary_hits = 0
        hit_endpoints: Set[str] = set()
        
        for i in range(1, total_requests + 1):
            # Select next target with randomization
            endpoint = self._get_next_target()
            
            # Execute probe
            _, status_code, is_success = await self.probe_endpoint(endpoint, i, hit_endpoints)
            
            # Update counters
            if is_success:
                successful_requests += 1
            else:
                failed_requests += 1
            
            # Track canary hits
            if endpoint in self.CANARY_TRAP_ENDPOINTS:
                canary_hits += 1
            
            # Moderate delay between requests (0.15-0.35 seconds)
            # This ensures we don't aggressively trigger request_rate rules
            delay = random.uniform(0.15, 0.35)
            await asyncio.sleep(delay)
        
        print("-" * 80)
        print(f"\n[+] Attack Complete")
        print("=" * 80)
        print(f"    Total requests:     {successful_requests + failed_requests}")
        print(f"    Successful probes:  {successful_requests}")
        print(f"    Failed probes:      {failed_requests}")
        print(f"    Success rate:       {(successful_requests/(successful_requests+failed_requests))*100:.1f}%")
        print(f"    Canary traps hit:   {canary_hits}")
        print(f"    Unique endpoints:   {len(hit_endpoints)}")
        print("=" * 80)


async def run_attack(base_url: str, no_verify: bool = False, requests: int = 40, canary_probability: float = 0.2) -> None:
    """
    Main attack entry point.
    
    Args:
        base_url: Base URL of the target PhantomShield instance
        no_verify: Disable SSL certificate verification
        requests: Total number of probe requests to make
        canary_probability: Probability of probing a canary trap endpoint
    """
    async with SensitiveProbeAttack(
        base_url, 
        verify_ssl=not no_verify,
        canary_probability=canary_probability
    ) as attack:
        await attack.run(total_requests=requests)


def main():
    """
    CLI entry point for the attack simulation.
    """
    import argparse
    
    parser = argparse.ArgumentParser(
        description="PhantomShield Sensitive Endpoint Probe Attack Simulation",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Behavioral Intent:
  This attack simulates a privilege probing attacker who:
  - Has valid authentication
  - Repeatedly accesses sensitive/admin endpoints
  - Uses moderate request rates to avoid detection
  - Occasionally triggers canary traps
  
  Expected detection: High sensitive_ratio, possible canary alerts
  Minimal impact on request_rate rules.

Examples:
  python sensitive_probe.py http://localhost:8000
  python sensitive_probe.py https://phantomshield.example.com --no-verify
  python sensitive_probe.py http://localhost:8000 --requests 50
  python sensitive_probe.py http://localhost:8000 --canary-probability 0.3
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
    
    parser.add_argument(
        "--requests",
        type=int,
        default=40,
        help="Total number of probe requests to make (default: 40)"
    )
    
    parser.add_argument(
        "--canary-probability",
        type=float,
        default=0.2,
        help="Probability of hitting canary traps (default: 0.2)"
    )
    
    args = parser.parse_args()
    
    # Validate request count
    if args.requests < 1:
        print("[-] Request count must be at least 1")
        sys.exit(1)
    
    # Validate canary probability
    if not 0 <= args.canary_probability <= 1:
        print("[-] Canary probability must be between 0 and 1")
        sys.exit(1)
    
    # Run the attack
    try:
        asyncio.run(run_attack(
            args.base_url, 
            args.no_verify, 
            args.requests,
            args.canary_probability
        ))
    except KeyboardInterrupt:
        print("\n[!] Attack interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n[!] Attack failed: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
