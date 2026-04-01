"""
test_pwa_static_files.py
PWA Static Files Accessibility Tests - Iteration 47

Tests for:
- manifest.json accessibility and structure
- sw.js (service worker) accessibility
- offline.html accessibility
- browserconfig.xml accessibility  
- PWA icons accessibility (all sizes)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPWAStaticFiles:
    """Test PWA static file accessibility"""
    
    def test_manifest_json_accessible(self):
        """manifest.json should be accessible at /manifest.json"""
        response = requests.get(f"{BASE_URL}/manifest.json", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Verify it's valid JSON
        data = response.json()
        assert data is not None
        print("✓ manifest.json is accessible and valid JSON")
    
    def test_manifest_json_structure(self):
        """manifest.json should have correct PWA properties"""
        response = requests.get(f"{BASE_URL}/manifest.json", timeout=10)
        data = response.json()
        
        # Check required fields
        assert data.get("name") == "Core Truth House OS", f"Expected name 'Core Truth House OS', got {data.get('name')}"
        assert data.get("short_name") == "CTH OS", f"Expected short_name 'CTH OS', got {data.get('short_name')}"
        assert data.get("start_url") == "/dashboard", f"Expected start_url '/dashboard', got {data.get('start_url')}"
        assert data.get("display") == "standalone", f"Expected display 'standalone', got {data.get('display')}"
        assert data.get("theme_color") == "#33033C", f"Expected theme_color '#33033C', got {data.get('theme_color')}"
        assert data.get("background_color") == "#0D0010", f"Expected background_color '#0D0010', got {data.get('background_color')}"
        
        # Check icons array exists
        assert "icons" in data, "manifest.json should have icons array"
        assert len(data["icons"]) > 0, "manifest.json should have at least one icon"
        
        # Check shortcuts array exists
        assert "shortcuts" in data, "manifest.json should have shortcuts array"
        
        print("✓ manifest.json has correct structure with name, display mode, icons, and shortcuts")
    
    def test_manifest_json_icons(self):
        """manifest.json should reference all required icon sizes"""
        response = requests.get(f"{BASE_URL}/manifest.json", timeout=10)
        data = response.json()
        
        required_sizes = ["72x72", "96x96", "128x128", "144x144", "152x152", "192x192", "384x384", "512x512"]
        icon_sizes = [icon.get("sizes") for icon in data.get("icons", [])]
        
        for size in required_sizes:
            assert size in icon_sizes, f"Missing icon size {size} in manifest.json"
        
        print(f"✓ manifest.json references all {len(required_sizes)} required icon sizes")
    
    def test_service_worker_accessible(self):
        """sw.js should be accessible at /sw.js"""
        response = requests.get(f"{BASE_URL}/sw.js", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Verify it contains service worker code
        content = response.text
        assert "serviceWorker" in content or "self.addEventListener" in content or "CACHE_VERSION" in content, \
            "sw.js doesn't appear to contain service worker code"
        
        print("✓ sw.js is accessible and contains service worker code")
    
    def test_offline_html_accessible(self):
        """offline.html should be accessible at /offline.html"""
        response = requests.get(f"{BASE_URL}/offline.html", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        content = response.text
        # Check it has expected content
        assert "offline" in content.lower(), "offline.html should mention offline"
        assert "Core Truth House" in content, "offline.html should mention Core Truth House"
        
        print("✓ offline.html is accessible with correct content")
    
    def test_offline_html_styling(self):
        """offline.html should have proper styling elements"""
        response = requests.get(f"{BASE_URL}/offline.html", timeout=10)
        content = response.text
        
        # Check for key styling elements
        assert "#33033C" in content or "#0D0010" in content, "offline.html should use brand colors"
        assert "<style>" in content, "offline.html should have inline styles"
        assert "button" in content.lower(), "offline.html should have a retry button"
        
        print("✓ offline.html has proper styling and retry button")
    
    def test_browserconfig_xml_accessible(self):
        """browserconfig.xml should be accessible at /browserconfig.xml"""
        response = requests.get(f"{BASE_URL}/browserconfig.xml", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        content = response.text
        assert "browserconfig" in content.lower(), "browserconfig.xml should contain browserconfig element"
        assert "tile" in content.lower(), "browserconfig.xml should contain tile configuration"
        
        print("✓ browserconfig.xml is accessible with tile configuration")


class TestPWAIcons:
    """Test PWA icon files accessibility"""
    
    @pytest.mark.parametrize("size", [72, 96, 128, 144, 152, 192, 384, 512])
    def test_icon_accessible(self, size):
        """Icon files should be accessible at /icons/icon-{size}.png"""
        response = requests.get(f"{BASE_URL}/icons/icon-{size}.png", timeout=10)
        assert response.status_code == 200, f"Expected 200 for icon-{size}.png, got {response.status_code}"
        
        # Verify it's an image
        content_type = response.headers.get('content-type', '')
        assert 'image' in content_type.lower() or len(response.content) > 0, \
            f"icon-{size}.png should be a valid image file"
        
        print(f"✓ icon-{size}.png is accessible")
    
    def test_icon_192_for_manifest(self):
        """icon-192.png should be accessible (used in manifest)"""
        response = requests.get(f"{BASE_URL}/icons/icon-192.png", timeout=10)
        assert response.status_code == 200
        assert len(response.content) > 100, "icon-192.png should have content"
        print("✓ icon-192.png (primary manifest icon) is accessible")


class TestIndexHTMLPWAMeta:
    """Test PWA meta tags in index.html"""
    
    def test_index_html_accessible(self):
        """Index page should be accessible"""
        response = requests.get(f"{BASE_URL}/", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Index page is accessible")
    
    def test_manifest_link_present(self):
        """index.html should have link to manifest.json"""
        response = requests.get(f"{BASE_URL}/", timeout=10)
        content = response.text
        
        assert 'rel="manifest"' in content or "rel='manifest'" in content, \
            "index.html should have <link rel='manifest'>"
        assert "/manifest.json" in content, \
            "index.html should reference /manifest.json"
        
        print("✓ index.html has manifest link")
    
    def test_apple_mobile_web_app_capable(self):
        """index.html should have apple-mobile-web-app-capable meta tag"""
        response = requests.get(f"{BASE_URL}/", timeout=10)
        content = response.text
        
        assert "apple-mobile-web-app-capable" in content, \
            "index.html should have apple-mobile-web-app-capable meta tag"
        
        print("✓ index.html has apple-mobile-web-app-capable meta tag")
    
    def test_theme_color_meta(self):
        """index.html should have theme-color meta tag with #33033C"""
        response = requests.get(f"{BASE_URL}/", timeout=10)
        content = response.text
        
        assert 'name="theme-color"' in content, \
            "index.html should have theme-color meta tag"
        assert "#33033C" in content, \
            "index.html should have theme-color #33033C"
        
        print("✓ index.html has theme-color meta tag with #33033C")
    
    def test_apple_touch_icon_present(self):
        """index.html should have apple-touch-icon link"""
        response = requests.get(f"{BASE_URL}/", timeout=10)
        content = response.text
        
        assert "apple-touch-icon" in content, \
            "index.html should have apple-touch-icon link"
        
        print("✓ index.html has apple-touch-icon link")


class TestDashboardEndpoint:
    """Test Dashboard page loads without errors"""
    
    def test_dashboard_accessible(self):
        """Dashboard page should be accessible"""
        response = requests.get(f"{BASE_URL}/dashboard", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Dashboard page is accessible")


class TestSettingsEndpoint:
    """Test Settings page loads without errors"""
    
    def test_settings_accessible(self):
        """Settings page should be accessible"""
        response = requests.get(f"{BASE_URL}/settings", timeout=10)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Settings page is accessible")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
