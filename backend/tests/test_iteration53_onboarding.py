"""
Iteration 53: Onboarding Workflow API Tests
Core Truth House OS

Tests for:
- GET /api/onboarding/progress - Load all milestone flags
- POST /api/onboarding/milestone - Mark a milestone complete
- Validation of invalid milestones
- Verification of existing migrated endpoints still work
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user_id as specified in requirements
TEST_USER_ID = "dev_user_default"


class TestHealthCheck:
    """Health check endpoint test"""
    
    def test_health_endpoint(self):
        """GET /api/health returns 200"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.text}"
        data = response.json()
        assert "status" in data
        assert data["status"] in ["healthy", "degraded"]
        print(f"✓ Health check passed: {data}")


class TestOnboardingProgressEndpoint:
    """Tests for GET /api/onboarding/progress endpoint"""
    
    def test_get_progress_returns_200(self):
        """GET /api/onboarding/progress?user_id=dev_user_default returns 200"""
        response = requests.get(
            f"{BASE_URL}/api/onboarding/progress",
            params={"user_id": TEST_USER_ID}
        )
        assert response.status_code == 200, f"Progress endpoint failed: {response.text}"
        data = response.json()
        print(f"✓ Progress endpoint returned: {data}")
        
    def test_progress_response_structure(self):
        """Verify progress response contains all required fields"""
        response = requests.get(
            f"{BASE_URL}/api/onboarding/progress",
            params={"user_id": TEST_USER_ID}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify all required fields exist
        required_fields = [
            "audit_complete",
            "brand_memory_complete",
            "brand_memory_pct",
            "foundation_complete",
            "strategic_os_started",
            "strategic_os_steps_complete",
            "first_campaign_created",
            "total_campaigns"
        ]
        
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
            print(f"  ✓ Field '{field}': {data[field]}")
        
        # Verify field types
        assert isinstance(data["audit_complete"], bool), "audit_complete should be boolean"
        assert isinstance(data["brand_memory_complete"], bool), "brand_memory_complete should be boolean"
        assert isinstance(data["brand_memory_pct"], (int, float)), "brand_memory_pct should be numeric"
        assert isinstance(data["foundation_complete"], bool), "foundation_complete should be boolean"
        assert isinstance(data["strategic_os_started"], bool), "strategic_os_started should be boolean"
        assert isinstance(data["strategic_os_steps_complete"], (int, float)), "strategic_os_steps_complete should be numeric"
        assert isinstance(data["first_campaign_created"], bool), "first_campaign_created should be boolean"
        assert isinstance(data["total_campaigns"], (int, float)), "total_campaigns should be numeric"
        
        print(f"✓ All fields have correct types")
    
    def test_progress_default_user(self):
        """GET /api/onboarding/progress without user_id uses default"""
        response = requests.get(f"{BASE_URL}/api/onboarding/progress")
        assert response.status_code == 200
        data = response.json()
        assert "audit_complete" in data
        print(f"✓ Default user progress works: {data}")
    
    def test_progress_with_workspace_id(self):
        """GET /api/onboarding/progress with workspace_id parameter"""
        response = requests.get(
            f"{BASE_URL}/api/onboarding/progress",
            params={"user_id": TEST_USER_ID, "workspace_id": "test_workspace_123"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "audit_complete" in data
        print(f"✓ Progress with workspace_id works: {data}")


class TestOnboardingMilestoneEndpoint:
    """Tests for POST /api/onboarding/milestone endpoint"""
    
    def test_mark_milestone_audit_complete(self):
        """POST /api/onboarding/milestone with valid milestone returns 200"""
        response = requests.post(
            f"{BASE_URL}/api/onboarding/milestone",
            json={
                "milestone": "audit_complete",
                "user_id": TEST_USER_ID
            }
        )
        assert response.status_code == 200, f"Milestone endpoint failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "milestone" in data, "Response should contain 'milestone'"
        assert "marked_at" in data, "Response should contain 'marked_at'"
        assert data["milestone"] == "audit_complete"
        
        # Verify marked_at is a valid ISO timestamp
        assert len(data["marked_at"]) > 0
        print(f"✓ Milestone marked: {data}")
    
    def test_mark_milestone_brand_memory_complete(self):
        """Test marking brand_memory_complete milestone"""
        response = requests.post(
            f"{BASE_URL}/api/onboarding/milestone",
            json={
                "milestone": "brand_memory_complete",
                "user_id": TEST_USER_ID
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["milestone"] == "brand_memory_complete"
        print(f"✓ Brand memory milestone marked: {data}")
    
    def test_mark_milestone_foundation_complete(self):
        """Test marking foundation_complete milestone"""
        response = requests.post(
            f"{BASE_URL}/api/onboarding/milestone",
            json={
                "milestone": "foundation_complete",
                "user_id": TEST_USER_ID
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["milestone"] == "foundation_complete"
        print(f"✓ Foundation milestone marked: {data}")
    
    def test_mark_milestone_strategic_os_started(self):
        """Test marking strategic_os_started milestone"""
        response = requests.post(
            f"{BASE_URL}/api/onboarding/milestone",
            json={
                "milestone": "strategic_os_started",
                "user_id": TEST_USER_ID
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["milestone"] == "strategic_os_started"
        print(f"✓ Strategic OS started milestone marked: {data}")
    
    def test_mark_milestone_first_campaign_created(self):
        """Test marking first_campaign_created milestone"""
        response = requests.post(
            f"{BASE_URL}/api/onboarding/milestone",
            json={
                "milestone": "first_campaign_created",
                "user_id": TEST_USER_ID
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["milestone"] == "first_campaign_created"
        print(f"✓ First campaign milestone marked: {data}")
    
    def test_invalid_milestone_returns_400(self):
        """POST /api/onboarding/milestone with invalid milestone returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/onboarding/milestone",
            json={
                "milestone": "invalid_milestone_name",
                "user_id": TEST_USER_ID
            }
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data, "Error response should contain 'detail'"
        print(f"✓ Invalid milestone correctly rejected: {data}")
    
    def test_progress_after_milestone_update(self):
        """Verify progress shows updated values after marking milestone"""
        # First mark a milestone
        requests.post(
            f"{BASE_URL}/api/onboarding/milestone",
            json={
                "milestone": "audit_complete",
                "user_id": TEST_USER_ID
            }
        )
        
        # Then check progress
        response = requests.get(
            f"{BASE_URL}/api/onboarding/progress",
            params={"user_id": TEST_USER_ID}
        )
        assert response.status_code == 200
        data = response.json()
        
        # audit_complete should now be true
        assert data["audit_complete"] == True, f"audit_complete should be True after marking"
        print(f"✓ Progress correctly reflects milestone update: {data}")
    
    def test_milestone_with_workspace_id(self):
        """POST /api/onboarding/milestone with workspace_id"""
        response = requests.post(
            f"{BASE_URL}/api/onboarding/milestone",
            json={
                "milestone": "audit_complete",
                "user_id": TEST_USER_ID,
                "workspace_id": "test_workspace_456"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["milestone"] == "audit_complete"
        print(f"✓ Milestone with workspace_id works: {data}")


class TestMigratedEndpointsStillWork:
    """Verify existing migrated endpoints still function"""
    
    def test_persist_brand_foundation_generate(self):
        """POST /api/persist/brand-foundation/generate endpoint works"""
        response = requests.post(
            f"{BASE_URL}/api/persist/brand-foundation/generate",
            params={"user_id": TEST_USER_ID},
            json={"field": "mission"}  # Required field parameter
        )
        # Should return 200 (may take time for AI generation)
        assert response.status_code == 200, f"Brand foundation generate failed: {response.status_code} - {response.text}"
        print(f"✓ /api/persist/brand-foundation/generate returns 200")
    
    def test_persist_content_library(self):
        """GET /api/persist/content/library endpoint works"""
        response = requests.get(
            f"{BASE_URL}/api/persist/content/library",
            params={"user_id": TEST_USER_ID}
        )
        assert response.status_code == 200, f"Content library failed: {response.status_code} - {response.text}"
        data = response.json()
        assert isinstance(data, list), "Content library should return a list"
        print(f"✓ /api/persist/content/library returns 200 with {len(data)} items")
    
    def test_persist_os_variables_get(self):
        """GET /api/persist/brand-memory/os-variables endpoint works"""
        response = requests.get(
            f"{BASE_URL}/api/persist/brand-memory/os-variables",
            params={"user_id": TEST_USER_ID}
        )
        assert response.status_code == 200, f"OS variables get failed: {response.status_code} - {response.text}"
        print(f"✓ /api/persist/brand-memory/os-variables GET returns 200")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
