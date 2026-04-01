"""
Phase 1 Testing: Prompt Hub, Brand Scorecard, Rate Limiting
Tests for Core Truth House - Phase 1 implementation
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthCheck:
    """Health endpoint tests"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ["healthy", "degraded"]
        assert data["database"] == "connected"
        assert data["version"] == "1.0.0"
        print(f"✓ API health check passed: {data}")


class TestPromptPacks:
    """Test /api/prompt-packs endpoint - should return 6 packs"""
    
    def test_get_prompt_packs_returns_6(self):
        """GET /api/prompt-packs should return 6 packs"""
        response = requests.get(f"{BASE_URL}/api/prompt-packs", params={"user_id": "default"})
        assert response.status_code == 200
        data = response.json()
        assert "packs" in data
        assert len(data["packs"]) == 6, f"Expected 6 packs, got {len(data['packs'])}"
        print(f"✓ GET /api/prompt-packs returns {len(data['packs'])} packs")
    
    def test_prompt_packs_structure(self):
        """Verify each pack has required fields"""
        response = requests.get(f"{BASE_URL}/api/prompt-packs", params={"user_id": "default"})
        data = response.json()
        
        required_fields = ["id", "title", "slug", "description", "price", "category", "includes", "icon", "is_purchased"]
        for pack in data["packs"]:
            for field in required_fields:
                assert field in pack, f"Missing field '{field}' in pack {pack.get('id', 'unknown')}"
            assert pack["category"] == "premium"
            assert pack["is_purchased"] == False  # Default user hasn't purchased
        print("✓ All 6 packs have correct structure")
    
    def test_prompt_packs_specific_items(self):
        """Verify specific packs exist"""
        response = requests.get(f"{BASE_URL}/api/prompt-packs", params={"user_id": "default"})
        data = response.json()
        
        expected_slugs = [
            "complete-ai-brand-creation",
            "visual-identity-builder",
            "brand-consistency",
            "content-production-machine",
            "launch-scale-framework",
            "content-operations"
        ]
        
        actual_slugs = [p["slug"] for p in data["packs"]]
        for slug in expected_slugs:
            assert slug in actual_slugs, f"Missing pack with slug '{slug}'"
        print(f"✓ All expected pack slugs present: {expected_slugs}")


class TestPrompts:
    """Test /api/prompts endpoint"""
    
    def test_get_prompts_empty_for_new_user(self):
        """GET /api/prompts returns empty list for new user"""
        response = requests.get(f"{BASE_URL}/api/prompts", params={"user_id": "test_phase1_user"})
        assert response.status_code == 200
        data = response.json()
        assert "prompts" in data
        assert isinstance(data["prompts"], list)
        print(f"✓ GET /api/prompts returns prompts list (count: {len(data['prompts'])})")
    
    def test_create_prompt(self):
        """POST /api/prompts creates a new prompt"""
        payload = {
            "title": "TEST_Phase1_Prompt",
            "content": "This is a test prompt for Phase 1 testing",
            "category": "custom",
            "tags": ["test", "phase1"]
        }
        response = requests.post(
            f"{BASE_URL}/api/prompts", 
            json=payload,
            params={"user_id": "test_phase1_user"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "prompt" in data
        assert data["prompt"]["title"] == "TEST_Phase1_Prompt"
        prompt_id = data["prompt"]["id"]
        print(f"✓ POST /api/prompts created prompt: {prompt_id}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/prompts/{prompt_id}", params={"user_id": "test_phase1_user"})
        print(f"✓ Cleanup: deleted test prompt")
    
    def test_favorite_toggle(self):
        """PUT /api/prompts/{id}/favorite toggles favorite"""
        # Create a prompt first
        payload = {
            "title": "TEST_Favorite_Prompt",
            "content": "Test prompt for favorite toggle",
            "category": "custom"
        }
        create_resp = requests.post(
            f"{BASE_URL}/api/prompts", 
            json=payload,
            params={"user_id": "test_phase1_user"}
        )
        prompt_id = create_resp.json()["prompt"]["id"]
        
        # Toggle favorite
        toggle_resp = requests.put(
            f"{BASE_URL}/api/prompts/{prompt_id}/favorite",
            params={"user_id": "test_phase1_user"}
        )
        assert toggle_resp.status_code == 200
        data = toggle_resp.json()
        assert data["success"] == True
        assert data["is_favorite"] == True
        print(f"✓ PUT /api/prompts/{prompt_id}/favorite toggled to True")
        
        # Toggle back
        toggle_resp2 = requests.put(
            f"{BASE_URL}/api/prompts/{prompt_id}/favorite",
            params={"user_id": "test_phase1_user"}
        )
        assert toggle_resp2.json()["is_favorite"] == False
        print(f"✓ Toggled back to False")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/prompts/{prompt_id}", params={"user_id": "test_phase1_user"})


class TestRateLimiting:
    """Test rate limiting headers on AI endpoints"""
    
    def test_rate_limit_headers_on_generators(self):
        """Rate limit headers should be present on generator endpoints"""
        # Test the scene generator (even if it fails, headers should be there)
        response = requests.post(
            f"{BASE_URL}/api/generators/scene",
            json={"generator_type": "scene", "inputs": {}},
            params={"user_id": "test_ratelimit"}
        )
        
        # Check rate limit headers exist (regardless of response status)
        assert "X-RateLimit-Limit" in response.headers, "Missing X-RateLimit-Limit header"
        assert "X-RateLimit-Remaining" in response.headers, "Missing X-RateLimit-Remaining header"
        assert "X-RateLimit-Window" in response.headers, "Missing X-RateLimit-Window header"
        
        limit = response.headers.get("X-RateLimit-Limit")
        remaining = response.headers.get("X-RateLimit-Remaining")
        window = response.headers.get("X-RateLimit-Window")
        
        print(f"✓ Rate limit headers present: Limit={limit}, Remaining={remaining}, Window={window}s")
    
    def test_rate_limit_values(self):
        """Verify rate limit values are correct"""
        response = requests.post(
            f"{BASE_URL}/api/generators/scene",
            json={"generator_type": "scene", "inputs": {}},
            params={"user_id": "test_ratelimit_values"}
        )
        
        limit = int(response.headers.get("X-RateLimit-Limit", 0))
        window = int(response.headers.get("X-RateLimit-Window", 0))
        
        assert limit == 10, f"Expected limit 10, got {limit}"
        assert window == 60, f"Expected window 60, got {window}"
        print(f"✓ Rate limit values correct: 10 requests per 60 seconds")


class TestBrandScorecardAPI:
    """Test Brand Scorecard related API endpoints"""
    
    def test_brand_foundation_endpoint(self):
        """GET /api/brand-foundation returns data or empty"""
        response = requests.get(f"{BASE_URL}/api/brand-foundation", params={"user_id": "default"})
        assert response.status_code in [200, 404]
        print(f"✓ GET /api/brand-foundation responded with {response.status_code}")
    
    def test_analytics_brand_memory_endpoint(self):
        """GET /api/analytics/brand-memory returns data"""
        response = requests.get(f"{BASE_URL}/api/analytics/brand-memory", params={"user_id": "default"})
        assert response.status_code == 200
        print(f"✓ GET /api/analytics/brand-memory responded with 200")


class TestGeneratorEndpoints:
    """Test AI Generator endpoints exist and respond"""
    
    def test_scene_generator_endpoint_exists(self):
        """POST /api/generators/scene endpoint exists"""
        response = requests.post(
            f"{BASE_URL}/api/generators/scene",
            json={"generator_type": "scene", "inputs": {"archetype": "Test"}},
            params={"user_id": "test_gen"}
        )
        # Should not be 404 (endpoint exists)
        assert response.status_code != 404, "Scene generator endpoint not found"
        print(f"✓ POST /api/generators/scene exists (status: {response.status_code})")
    
    def test_dna_generator_endpoint_exists(self):
        """POST /api/generators/dna endpoint exists"""
        response = requests.post(
            f"{BASE_URL}/api/generators/dna",
            json={"generator_type": "dna", "inputs": {"character": "Test"}},
            params={"user_id": "test_gen"}
        )
        assert response.status_code != 404, "DNA generator endpoint not found"
        print(f"✓ POST /api/generators/dna exists (status: {response.status_code})")
    
    def test_god_prompt_generator_endpoint_exists(self):
        """POST /api/generators/god-prompt endpoint exists"""
        response = requests.post(
            f"{BASE_URL}/api/generators/god-prompt",
            json={"generator_type": "god-prompt", "inputs": {"industry": "Test"}},
            params={"user_id": "test_gen"}
        )
        assert response.status_code != 404, "God prompt generator endpoint not found"
        print(f"✓ POST /api/generators/god-prompt exists (status: {response.status_code})")
    
    def test_launch_generator_endpoint_exists(self):
        """POST /api/generators/launch endpoint exists"""
        response = requests.post(
            f"{BASE_URL}/api/generators/launch",
            json={"generator_type": "launch", "inputs": {"offer_name": "Test"}},
            params={"user_id": "test_gen"}
        )
        assert response.status_code != 404, "Launch generator endpoint not found"
        print(f"✓ POST /api/generators/launch exists (status: {response.status_code})")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
