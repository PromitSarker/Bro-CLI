import platform
import uuid
import hashlib
import time
from typing import Optional

from .config import load_config, save_config
from .ui.terminal import console

# MOCK SERVER URL
VERIFY_URL = "http://localhost:8000/api/v1/auth/verify"
OFFLINE_GRACE_PERIOD_SECONDS = 7 * 24 * 60 * 60 # 7 days

def get_device_fingerprint() -> str:
    """Generate a unique device fingerprint based on MAC address and OS."""
    node = uuid.getnode()
    system = platform.system()
    machine = platform.machine()
    
    raw = f"{node}-{system}-{machine}"
    return hashlib.sha256(raw.encode('utf-8')).hexdigest()

def verify_license_sync() -> bool:
    """Synchronously verify the license key. Returns True if valid, False otherwise."""
    config = load_config()
    key = config.get("license_key")
    last_verified = config.get("last_verified", 0.0)
    
    if not key:
        console.print("\n[bold red]License Required[/bold red]")
        console.print("Bro-CLI is a premium tool. Please login with your license key.")
        console.print("Run: [bold cyan]bro auth login <YOUR-KEY>[/bold cyan]\n")
        return False
        
    fingerprint = get_device_fingerprint()
    
    try:
        # Mock actual request: we could just pretend it's successful if key == 'mock-valid-key'
        # But for real implementation, we would POST to the server.
        # import requests
        # res = requests.post(VERIFY_URL, json={"key": key, "fingerprint": fingerprint}, timeout=2.0)
        # data = res.json()
        
        # MOCK IMPLEMENTATION
        if key == "mock-valid-key":
            save_config(last_verified=time.time())
            return True
        else:
            console.print("\n[bold red]Invalid License Key[/bold red]")
            console.print("Please check your license key or purchase a new one.\n")
            return False
            
    except Exception as e:
        # Offline mode fallback
        current_time = time.time()
        if (current_time - last_verified) < OFFLINE_GRACE_PERIOD_SECONDS:
            # We are offline, but within the grace period. Allow execution silently.
            return True
        else:
            console.print("\n[bold red]License Verification Failed[/bold red]")
            console.print("We couldn't reach the verification server and your offline grace period (7 days) has expired.")
            console.print("Please connect to the internet to verify your license.\n")
            return False
            
def handle_auth_login(key: str) -> int:
    """Handle the 'bro auth login <key>' command."""
    # We could do a synchronous validation right here before saving
    fingerprint = get_device_fingerprint()
    console.print(f"Verifying license for device {fingerprint[:8]}...")
    
    # Mocking validation
    if key == "mock-valid-key":
        save_config(license_key=key, last_verified=time.time())
        console.print("[bold green]Success![/bold green] Your license has been activated on this device.")
        return 0
    else:
        console.print("[bold red]Failed to activate license.[/bold red] The key is invalid.")
        return 1

def handle_auth_logout() -> int:
    """Handle the 'bro auth logout' command."""
    save_config(license_key="", last_verified=0.0)
    console.print("[bold green]Logged out.[/bold green] License key removed from this device.")
    return 0
