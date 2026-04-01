"""
test_iteration54_cache_busting.py
Tests for the cache-busting feature:
1. /api/version endpoint returns version and deployed_at
2. /api/version has no-store cache headers
3. All /api/* endpoints have no-cache headers
4. Health endpoint still works
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestVersionEndpoint:
    """Test /api/version endpoint functionality"""

    def test_version_endpoint_returns_200(self):
        """Verify /api/version returns 200 status"""
        response = requests.get(f"{BASE_URL}/api/version")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: /api/version returns 200")

    def test_version_response_has_required_fields(self):
        """Verify response has version and deployed_at fields"""
        response = requests.get(f"{BASE_URL}/api/version")
        data = response.json()
        
        assert "version" in data, "Response missing 'version' field"
        assert "deployed_at" in data, "Response missing 'deployed_at' field"
        assert isinstance(data["version"], str), "version should be a string"
        assert isinstance(data["deployed_at"], str), "deployed_at should be a string"
        print(f"PASS: Version response has required fields: version={data['version']}, deployed_at={data['deployed_at']}")

    def test_version_endpoint_no_store_headers(self):
        """Verify /api/version has no-store Cache-Control headers"""
        response = requests.get(f"{BASE_URL}/api/version")
        cache_control = response.headers.get('Cache-Control', '')
        pragma = response.headers.get('Pragma', '')
        
        assert 'no-store' in cache_control, f"Expected 'no-store' in Cache-Control, got: {cache_control}"
        assert 'no-cache' in pragma, f"Expected 'no-cache' in Pragma header, got: {pragma}"
        print(f"PASS: /api/version has correct cache headers: Cache-Control={cache_control}, Pragma={pragma}")


class TestAPICacheHeaders:
    """Test that all API endpoints have appropriate cache headers"""

    def test_health_endpoint_cache_headers(self):
        """Verify /api/health has no-cache headers"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.status_code}"
        
        cache_control = response.headers.get('Cache-Control', '')
        pragma = response.headers.get('Pragma', '')
        
        # API routes should have no-cache
        assert 'no-cache' in cache_control or 'no-store' in cache_control, \
            f"Expected 'no-cache' or 'no-store' in Cache-Control, got: {cache_control}"
        print(f"PASS: /api/health has cache headers: Cache-Control={cache_control}")

    def test_api_endpoint_cache_headers(self):
        """Verify a typical API endpoint has no-cache headers"""
        # Test onboarding progress endpoint as a sample API
        response = requests.get(f"{BASE_URL}/api/onboarding/progress")
        
        cache_control = response.headers.get('Cache-Control', '')
        pragma = response.headers.get('Pragma', '')
        expires = response.headers.get('Expires', '')
        
        # API routes should have no-cache
        assert 'no-cache' in cache_control or 'no-store' in cache_control, \
            f"Expected 'no-cache' or 'no-store' in Cache-Control for API, got: {cache_control}"
        assert 'no-cache' in pragma, f"Expected 'no-cache' in Pragma, got: {pragma}"
        print(f"PASS: API endpoint has cache headers: Cache-Control={cache_control}, Pragma={pragma}, Expires={expires}")


class TestHealthCheck:
    """Basic health check to verify server is running"""

    def test_health_endpoint(self):
        """Verify /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("status") in ["healthy", "degraded"], f"Unexpected status: {data}"
        print(f"PASS: Health check passed - status: {data.get('status')}")


class TestCacheMiddlewareIntegration:
    """Test cache middleware is properly integrated"""

    def test_version_vs_other_api_headers(self):
        """Verify /api/version has stricter no-store vs regular no-cache"""
        # Get version endpoint headers
        version_response = requests.get(f"{BASE_URL}/api/version")
        version_cache = version_response.headers.get('Cache-Control', '')
        
        # Get a regular API endpoint headers
        health_response = requests.get(f"{BASE_URL}/api/health")
        health_cache = health_response.headers.get('Cache-Control', '')
        
        # Version should have no-store (stricter)
        assert 'no-store' in version_cache, f"/api/version should have no-store, got: {version_cache}"
        
        # Both should have some form of cache control
        assert health_cache != '', "/api/health should have Cache-Control header"
        
        print(f"PASS: Cache headers properly differentiated - version: {version_cache}, health: {health_cache}")

    def test_multiple_api_endpoints_have_cache_headers(self):
        """Verify multiple API endpoints have cache control headers"""
        endpoints = [
            "/api/version",
            "/api/health",
            "/api/onboarding/progress",
        ]
        
        for endpoint in endpoints:
            response = requests.get(f"{BASE_URL}{endpoint}")
            cache_control = response.headers.get('Cache-Control', '')
            
            assert cache_control != '', f"{endpoint} should have Cache-Control header"
            assert 'no-cache' in cache_control or 'no-store' in cache_control, \
                f"{endpoint} should have no-cache or no-store, got: {cache_control}"
            print(f"PASS: {endpoint} has cache headers: {cache_control}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
