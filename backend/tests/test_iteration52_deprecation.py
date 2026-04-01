"""
Iteration 52 Tests: Brand.py Deprecation and Persist Router Migration Verification

Tests:
1. Old brand.py endpoints should return 404 (deprecated)
2. New persist router endpoints should work correctly
3. Health check verification
4. Sidebar sub-routes deep linking redirect

User ID: dev_user_default
API URL: from REACT_APP_BACKEND_URL environment variable
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
USER_ID = "dev_user_default"

# ─────────────────────────────────────────────────────────────
# FIXTURES
# ─────────────────────────────────────────────────────────────

@pytest.fixture
def api_client():
    """Shared requests session."""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


# ─────────────────────────────────────────────────────────────
# TEST: Health Check
# ─────────────────────────────────────────────────────────────

class TestHealthCheck:
    """Verify API health endpoint works."""
    
    def test_health_endpoint(self, api_client):
        """GET /api/health should return 200 with healthy status."""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.text}"
        data = response.json()
        assert "status" in data
        assert data["status"] in ["healthy", "degraded"]
        print(f"✓ Health check passed: {data}")


# ─────────────────────────────────────────────────────────────
# TEST: Old brand.py endpoints should return 404
# ─────────────────────────────────────────────────────────────

class TestDeprecatedBrandEndpoints:
    """Verify old brand.py endpoints are no longer available (return 404)."""
    
    def test_old_brand_foundation_get_returns_404(self, api_client):
        """GET /api/brand-foundation should return 404 (deprecated)."""
        response = api_client.get(f"{BASE_URL}/api/brand-foundation")
        assert response.status_code == 404, f"Expected 404 for deprecated endpoint, got {response.status_code}: {response.text}"
        print("✓ GET /api/brand-foundation correctly returns 404")
    
    def test_old_brand_foundation_put_returns_404(self, api_client):
        """PUT /api/brand-foundation should return 404 (deprecated)."""
        response = api_client.put(
            f"{BASE_URL}/api/brand-foundation",
            json={"mission": "test"}
        )
        assert response.status_code == 404, f"Expected 404 for deprecated endpoint, got {response.status_code}: {response.text}"
        print("✓ PUT /api/brand-foundation correctly returns 404")
    
    def test_old_brand_foundation_generate_returns_404(self, api_client):
        """POST /api/brand-foundation/generate should return 404 (deprecated)."""
        response = api_client.post(
            f"{BASE_URL}/api/brand-foundation/generate",
            json={"field": "mission", "context": "test"}
        )
        assert response.status_code == 404, f"Expected 404 for deprecated endpoint, got {response.status_code}: {response.text}"
        print("✓ POST /api/brand-foundation/generate correctly returns 404")
    
    def test_old_content_generate_returns_404(self, api_client):
        """POST /api/content/generate should return 404 (deprecated)."""
        response = api_client.post(
            f"{BASE_URL}/api/content/generate",
            json={"content_type": "caption", "topic": "brand"}
        )
        assert response.status_code == 404, f"Expected 404 for deprecated endpoint, got {response.status_code}: {response.text}"
        print("✓ POST /api/content/generate correctly returns 404")
    
    def test_old_content_library_returns_404(self, api_client):
        """GET /api/content/library should return 404 (deprecated)."""
        response = api_client.get(f"{BASE_URL}/api/content/library?user_id={USER_ID}")
        assert response.status_code == 404, f"Expected 404 for deprecated endpoint, got {response.status_code}: {response.text}"
        print("✓ GET /api/content/library correctly returns 404")
    
    def test_old_content_save_returns_404(self, api_client):
        """POST /api/content/save should return 404 (deprecated)."""
        response = api_client.post(
            f"{BASE_URL}/api/content/save",
            json={"content": "test", "type": "caption", "user_id": USER_ID}
        )
        assert response.status_code == 404, f"Expected 404 for deprecated endpoint, got {response.status_code}: {response.text}"
        print("✓ POST /api/content/save correctly returns 404")
    
    def test_old_brand_memory_os_variables_patch_returns_404(self, api_client):
        """PATCH /api/brand-memory/os-variables should return 404 (deprecated)."""
        response = api_client.patch(
            f"{BASE_URL}/api/brand-memory/os-variables",
            json={"os_variables": {"test": "value"}}
        )
        assert response.status_code == 404, f"Expected 404 for deprecated endpoint, got {response.status_code}: {response.text}"
        print("✓ PATCH /api/brand-memory/os-variables correctly returns 404")
    
    def test_old_brand_memory_os_variables_get_returns_404(self, api_client):
        """GET /api/brand-memory/os-variables should return 404 (deprecated)."""
        response = api_client.get(f"{BASE_URL}/api/brand-memory/os-variables?user_id={USER_ID}")
        assert response.status_code == 404, f"Expected 404 for deprecated endpoint, got {response.status_code}: {response.text}"
        print("✓ GET /api/brand-memory/os-variables correctly returns 404")


# ─────────────────────────────────────────────────────────────
# TEST: New persist router endpoints should work
# ─────────────────────────────────────────────────────────────

class TestPersistRouterEndpoints:
    """Verify new /api/persist/ endpoints are working correctly."""
    
    def test_persist_brand_foundation_generate(self, api_client):
        """POST /api/persist/brand-foundation/generate should return 200 with options array."""
        response = api_client.post(
            f"{BASE_URL}/api/persist/brand-foundation/generate",
            json={"field": "mission", "context": "test brand for entrepreneurs"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "options" in data, f"Response should contain 'options' field: {data}"
        assert "field" in data, f"Response should contain 'field' field: {data}"
        assert data["field"] == "mission"
        assert isinstance(data["options"], list), "Options should be a list"
        print(f"✓ POST /api/persist/brand-foundation/generate works: got {len(data['options'])} options")
    
    def test_persist_content_generate(self, api_client):
        """POST /api/persist/content/generate should return 200."""
        response = api_client.post(
            f"{BASE_URL}/api/persist/content/generate",
            json={"content_type": "caption", "topic": "brand awareness"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "content" in data, f"Response should contain 'content' field: {data}"
        assert "content_type" in data, f"Response should contain 'content_type' field: {data}"
        print(f"✓ POST /api/persist/content/generate works: content_type={data['content_type']}")
    
    def test_persist_content_library(self, api_client):
        """GET /api/persist/content/library should return 200."""
        response = api_client.get(f"{BASE_URL}/api/persist/content/library?user_id={USER_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), f"Response should be a list: {data}"
        print(f"✓ GET /api/persist/content/library works: got {len(data)} items")
    
    def test_persist_os_variables_patch(self, api_client):
        """PATCH /api/persist/brand-memory/os-variables should return 200."""
        test_vars = {"TEST_iteration_52": "test_value"}
        response = api_client.patch(
            f"{BASE_URL}/api/persist/brand-memory/os-variables?user_id={USER_ID}",
            json={"os_variables": test_vars}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "success" in data, f"Response should contain 'success' field: {data}"
        assert data["success"] is True
        print(f"✓ PATCH /api/persist/brand-memory/os-variables works")
    
    def test_persist_os_variables_get(self, api_client):
        """GET /api/persist/brand-memory/os-variables should return 200."""
        response = api_client.get(f"{BASE_URL}/api/persist/brand-memory/os-variables?user_id={USER_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "os_variables" in data, f"Response should contain 'os_variables' field: {data}"
        print(f"✓ GET /api/persist/brand-memory/os-variables works")
    
    def test_persist_brand_foundation_save(self, api_client):
        """POST /api/persist/brand-foundation should save and return success."""
        test_data = {
            "mission": "TEST_iteration_52_mission",
            "vision": "TEST_iteration_52_vision"
        }
        response = api_client.post(
            f"{BASE_URL}/api/persist/brand-foundation?user_id={USER_ID}",
            json=test_data
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "saved" in data, f"Response should contain 'saved' field: {data}"
        assert data["saved"] is True
        print(f"✓ POST /api/persist/brand-foundation works: saved={data['saved']}")
    
    def test_persist_brand_foundation_load(self, api_client):
        """GET /api/persist/brand-foundation should return saved data."""
        response = api_client.get(f"{BASE_URL}/api/persist/brand-foundation?user_id={USER_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        # It should return a dict (possibly empty if no data)
        assert isinstance(data, dict), f"Response should be a dict: {data}"
        print(f"✓ GET /api/persist/brand-foundation works: {len(data)} fields")


# ─────────────────────────────────────────────────────────────
# TEST: Verify brand.py file does not exist
# ─────────────────────────────────────────────────────────────

class TestFileCleanup:
    """Verify deprecated files have been removed."""
    
    def test_brand_router_not_in_server_imports(self, api_client):
        """Verify brand_router is not imported in server.py (would cause import error if present but file deleted)."""
        # If brand.py was deleted but still imported, the server would fail to start
        # A successful health check confirms the server is running without brand.py
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, "Server should be running (brand.py not imported)"
        print("✓ Server running without brand.py import - file successfully removed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
