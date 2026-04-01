"""Shared Playwright browser management utilities."""
import os
import glob
import subprocess
import logging

logger = logging.getLogger(__name__)

# Support multiple possible browser paths
BROWSERS_PATH = os.environ.get('PLAYWRIGHT_BROWSERS_PATH', '/pw-browsers')
os.environ['PLAYWRIGHT_BROWSERS_PATH'] = BROWSERS_PATH

LAUNCH_ARGS = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']

# Cache the found browser path
_BROWSER_PATH_CACHE = None


def _find_browser() -> str | None:
    """Find installed Chromium browser binary. Returns path or None."""
    global _BROWSER_PATH_CACHE
    if _BROWSER_PATH_CACHE and os.path.exists(_BROWSER_PATH_CACHE):
        return _BROWSER_PATH_CACHE
    
    # Search in the configured path first
    search_paths = [BROWSERS_PATH]
    
    # Also check common alternative locations
    home = os.environ.get('HOME', '/root')
    search_paths.extend([
        os.path.join(home, '.cache', 'ms-playwright'),
        '/root/.cache/ms-playwright',
        '/home/app/.cache/ms-playwright',
    ])
    
    search_patterns = [
        'chromium_headless_shell-*/chrome-linux/headless_shell',
        'chromium_headless_shell-*/chrome-linux/chrome',
        'chromium-*/chrome-linux/chrome',
        'chromium-*/chrome-linux/headless_shell',
        'chromium_headless_shell-*/headless_shell',
        'chromium-*/chrome',
    ]
    
    for base_path in search_paths:
        if not os.path.exists(base_path):
            continue
        for pattern in search_patterns:
            matches = glob.glob(os.path.join(base_path, pattern))
            for m in matches:
                if os.path.isfile(m) and os.access(m, os.X_OK):
                    logger.info(f"Found browser at: {m}")
                    _BROWSER_PATH_CACHE = m
                    return m
    
    # Fallback: recursive walk to find any chrome/headless_shell binary
    BINARY_NAMES = {'headless_shell', 'chrome', 'chromium'}
    for base_path in search_paths:
        if not os.path.exists(base_path):
            continue
        for root, dirs, files in os.walk(base_path):
            for name in BINARY_NAMES:
                if name in files:
                    candidate = os.path.join(root, name)
                    if os.path.isfile(candidate) and os.access(candidate, os.X_OK):
                        logger.info(f"Found browser via walk at: {candidate}")
                        _BROWSER_PATH_CACHE = candidate
                        return candidate
    
    # Log what we found for debugging
    for base_path in search_paths:
        if os.path.exists(base_path):
            try:
                contents = os.listdir(base_path)
                logger.info(f"Contents of {base_path}: {contents[:10]}")
            except Exception as e:
                logger.warning(f"Could not list {base_path}: {e}")
    
    return None


def get_browser_executable() -> str | None:
    """Get the path to the Chromium executable. Returns None if not found."""
    return _find_browser()


def ensure_chromium_installed() -> bool:
    """Install Playwright Chromium if not present. Returns True on success."""
    found = _find_browser()
    if found:
        logger.info(f"Playwright chromium found at {found}")
        return True

    logger.info("Playwright chromium not found, attempting installation...")
    os.makedirs(BROWSERS_PATH, exist_ok=True)

    env = os.environ.copy()
    env['PLAYWRIGHT_BROWSERS_PATH'] = BROWSERS_PATH

    for cmd in [
        ["python", "-m", "playwright", "install", "chromium"],
        ["playwright", "install", "chromium"],
    ]:
        try:
            logger.info(f"Trying: {' '.join(cmd)}")
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300, env=env)
            if result.returncode == 0:
                found = _find_browser()
                if found:
                    logger.info(f"Playwright chromium installed at {found}")
                    return True
                logger.warning(f"Install reported success but browser not found. stdout: {result.stdout[:500]}")
            else:
                logger.warning(f"{' '.join(cmd)} failed (code {result.returncode}): {result.stderr[:500]}")
        except Exception as e:
            logger.warning(f"{' '.join(cmd)} exception: {e}")

    logger.error("All Playwright install methods failed")
    return False
