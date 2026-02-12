#!/usr/bin/env python3
"""
Slow, Careful Attacker Simulation for PhantomShield

Simulates a patient post-authentication attacker who blends in with normal traffic.
Designed to test long-term monitoring, risk decay logic, and whether a careful
attacker can evade rule-based detection.
"""

import asyncio
import random
import sys
import time
from typing import Dict, Optional, List, Tuple, Set
from urllib.parse import urljoin

import httpx


class SlowAttacker:
    """
    Simulates a slow, careful attacker who blends in with normal traffic.
    
    This attacker:
    - Makes requests slowly (2-5 second delays)
    - Mostly accesses normal user endpoints (80%)
    - Occasionally probes light sensitive endpoints (20%)
    - Avoids obvious brute-force or enumeration patterns
    - Maintains high interval variance (human-like timing)
    """
    
    # Authentication endpoint
    AUTH_ENDPOINT = "/auth/login"
    
    # Normal user endpoints (80% of traffic)
    NORMAL_ENDPOINTS = [
        # User profile and settings
        "/api/profile",
        "/api/settings",
        "/api/preferences",
        "/api/notifications",
        
        # Dashboard and activity
        "/api/dashboard",
        "/api/activity",
        "/api/activity/recent",
        "/api/feed",
        
        # Content and documents
        "/api/documents",
        "/api/documents/recent",
        "/api/files",
        "/api/files/shared",
        "/api/media",
        
        # General data access
        "/api/data",
        "/api/search",
        "/api/export",
        "/api/import",
        
        # Team and collaboration
        "/api/team",
        "/api/members",
        "/api/comments",
        "/api/mentions",
        
        # Status and health (non-sensitive)
        "/api/status",
        "/api/version",
        "/api/health",
        "/api/ping",
        
        # Common API patterns
        "/api/v1/profile",
        "/api/v1/dashboard",
        "/api/v1/documents",
        "/api/v2/profile",
    ]
    
    # Light sensitive endpoints (20% of traffic)
    # These are mildly sensitive but not extreme admin/canary endpoints
    LIGHT_SENSITIVE_ENDPOINTS = [
        # User directory (mildly sensitive)
        "/api/users",
        "/api/users/me",
        "/api/users/profile",
        
        # Admin-adjacent (but not core admin)
        "/api/admin/profile",  # Admin's own profile, not admin functions
        "/api/admin/activity",  # Admin activity log, not configuration
        "/api/admin/notifications",
        
        # Key management (light probing)
        "/api/keys/metadata",  # Just metadata, not actual keys
        "/api/keys/status",
        
        # Configuration (read-only)
        "/api/config/public",  # Public config only
        "/api/settings/public",
        
        # Audit (non-sensitive)
        "/api/audit/my-activity",  # User's own audit trail
        
        # Slightly elevated but common
        "/api/reports",
        "/api/reports/my-reports",
        "/api/analytics/personal",
        
        # Versioned sensitive endpoints
        "/api/v1/users/profile",
        "/api/v2/users/profile",
    ]
    
    # Request headers
    DEFAULT_HEADERS = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",  # Common browser UA
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Cache-Control": "max-age=0"
    }
    
    def __init__(self, base_url: str, verify_ssl: bool = True):
        """
        Initialize the slow attacker simulation.
        
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
            timeout=httpx.Timeout(30.0),
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
            verify=self.verify_ssl,
            follow_redirects=True,
            http2=True  # Modern browsers support HTTP/2
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
            "username": "careful_user",
            "password": "password123"
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
    
    def _get_next_target(self) -> Tuple[str, str]:
        """
        Randomly select the next target endpoint.
        
        80% probability: Normal user endpoint
        20% probability: Light sensitive endpoint
        
        Returns:
            Tuple of (endpoint, category) where category is "normal" or "sensitive"
        """
        # 80% normal, 20% light sensitive
        if random.random() < 0.8:
            return random.choice(self.NORMAL_ENDPOINTS), "normal"
        else:
            return random.choice(self.LIGHT_SENSITIVE_ENDPOINTS), "sensitive"
    
    async def make_request(self, endpoint: str, category: str, request_id: int, hit_endpoints: Set[str]) -> Tuple[str, int, bool, str]:
        """
        Make a single request to an endpoint.
        
        Args:
            endpoint: API endpoint to request
            category: Category of endpoint ("normal" or "sensitive")
            request_id: Sequential request identifier
            hit_endpoints: Set to track unique endpoints hit
            
        Returns:
            Tuple of (endpoint, status_code, success, category)
        """
        url = urljoin(self.base_url, endpoint)
        headers = self._get_auth_headers()
        
        # Track this endpoint
        hit_endpoints.add(endpoint)
        
        try:
            response = await self.client.get(url, headers=headers)
            is_success = response.status_code < 400
            
            # Format output with category indicator
            status_display = f"{response.status_code}"
            
            if is_success:
                print(f"  {request_id:3d} | {endpoint:<35} | {status_display:>3}")
            else:
                print(f"  {request_id:3d} | {endpoint:<35} | {status_display:>3} (blocked)")
            
            return endpoint, response.status_code, is_success, category
            
        except Exception as e:
            error_msg = str(e)[:30]
            print(f"  {request_id:3d} | {endpoint:<35} | ERROR: {error_msg}")
            return endpoint, 0, False, category
    
    async def run(self, total_requests: int = 20) -> None:
        """
        Execute the slow, careful attack sequence.
        
        Args:
            total_requests: Total number of requests to make (default: 20)
        """
        print(f"\n[+] Starting Slow, Careful Attacker Simulation")
        print("=" * 80)
        print(f"[+] Target: {self.base_url}")
        print(f"[+] Total requests: {total_requests}")
        print(f"[+] Request mix: 80% normal, 20% light sensitive")
        print(f"[+] Delay range: 2.0-5.0 seconds (very slow, human-like)")
        print("=" * 80)
        
        # Step 1: Authenticate
        if not await self.authenticate():
            print("[-] Cannot proceed without authentication token")
            return
        
        print(f"\n[+] Beginning slow, careful activity...")
        print("-" * 80)
        print("  #   | Endpoint                             | Status")
        print("-" * 80)
        
        # Track metrics
        successful_requests = 0
        failed_requests = 0
        normal_hits = 0
        sensitive_hits = 0
        hit_endpoints: Set[str] = set()
        
        # Track real attack duration
        start_time = time.time()
        
        for i in range(1, total_requests + 1):
            # Select next target with probability distribution
            endpoint, category = self._get_next_target()
            
            # Execute request with real category
            _, status_code, is_success, returned_category = await self.make_request(
                endpoint, category, i, hit_endpoints
            )
            
            # Update counters
            if is_success:
                successful_requests += 1
            else:
                failed_requests += 1
            
            # Track category distribution using returned category
            if returned_category == "normal":
                normal_hits += 1
            else:
                sensitive_hits += 1
            
            # Critical: Long, random delay between requests (2-5 seconds)
            # This mimics human browsing behavior and avoids rate-based detection
            delay = random.uniform(2.0, 5.0)
            
            # Only delay if this isn't the last request
            if i < total_requests:
                await asyncio.sleep(delay)
        
        end_time = time.time()
        duration = end_time - start_time
        
        print("-" * 80)
        print(f"\n[+] Attack Complete - Summary Statistics")
        print("=" * 80)
        
        # Calculate metrics with safe division
        total_attempts = successful_requests + failed_requests
        
        if total_attempts > 0:
            success_rate = (successful_requests / total_attempts) * 100
            normal_percentage = (normal_hits / total_attempts) * 100
            sensitive_percentage = (sensitive_hits / total_attempts) * 100
        else:
            success_rate = 0.0
            normal_percentage = 0.0
            sensitive_percentage = 0.0
        
        if duration > 0:
            request_rate = total_attempts / duration
        else:
            request_rate = 0.0
        
        print(f"    Total requests:        {total_attempts}")
        print(f"    Successful requests:   {successful_requests}")
        print(f"    Failed requests:       {failed_requests}")
        print(f"    Success rate:          {success_rate:.1f}%")
        print(f"    Unique endpoints hit:  {len(hit_endpoints)}")
        print(f"    Normal endpoints:      {normal_hits} ({normal_percentage:.1f}%)")
        print(f"    Sensitive endpoints:   {sensitive_hits} ({sensitive_percentage:.1f}%)")
        print(f"    Attack duration:       {duration:.2f} seconds")
        print(f"    Request rate:          {request_rate:.2f} req/sec")
        print("=" * 80)
        
        # Behavioral analysis
        print(f"\n[+] Behavioral Profile:")
        print(f"    - Request rate:        LOW ({request_rate:.2f} req/sec)")
        print(f"    - Interval variance:    HIGH (human-like)")
        print(f"    - Enumeration:          LOW (only {len(hit_endpoints)} unique endpoints)")
        print(f"    - Sensitive ratio:      {sensitive_percentage:.1f}%")
        print(f"    - Canary traps:         AVOIDED")
        print(f"\n[+] This attacker is designed to test:")
        print(f"    - Risk decay logic over time")
        print(f"    - Long-term monitoring effectiveness")
        print(f"    - Whether patient attackers evade rule-based detection")
        print("=" * 80)


async def run_attack(base_url: str, no_verify: bool = False, requests: int = 20) -> None:
    """
    Main attack entry point.
    
    Args:
        base_url: Base URL of the target PhantomShield instance
        no_verify: Disable SSL certificate verification
        requests: Total number of requests to make
    """
    async with SlowAttacker(
        base_url,
        verify_ssl=not no_verify
    ) as attacker:
        await attacker.run(total_requests=requests)


def main():
    """
    CLI entry point for the attack simulation.
    """
    import argparse
    
    parser = argparse.ArgumentParser(
        description="PhantomShield Slow, Careful Attacker Simulation",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Behavioral Profile:
  This attacker simulates a patient, careful adversary who:
  
  🎯 Goals:
  - Blend in with normal user traffic
  - Avoid rate-based detection
  - Slowly probe over extended periods
  - Test risk decay and long-term monitoring
  
  📊 Behavioral Metrics:
  - Request rate: 0.2-0.5 req/sec (very low)
  - Delay variance: 2-5 seconds (human-like)
  - Normal endpoints: 80% of traffic
  - Light sensitive: 20% of traffic
  - Enumeration: Minimal (avoids route_diversity rules)
  
  🔍 Detection Challenge:
  Can your system detect a patient attacker who:
  - Never triggers request_rate thresholds
  - Maintains high interval variance
  - Avoids obvious brute-force patterns
  - Slowly escalates over hours/days?

Examples:
  python slow_attacker.py http://localhost:8000
  python slow_attacker.py https://phantomshield.example.com --no-verify
  python slow_attacker.py http://localhost:8000 --requests 30
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
        default=20,
        help="Total number of requests to make (default: 20)"
    )
    
    args = parser.parse_args()
    
    # Validate request count
    if args.requests < 1:
        print("[-] Request count must be at least 1")
        sys.exit(1)
    
    # Run the attack
    try:
        asyncio.run(run_attack(
            args.base_url,
            args.no_verify,
            args.requests
        ))
    except KeyboardInterrupt:
        print("\n[!] Attack interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n[!] Attack failed: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
