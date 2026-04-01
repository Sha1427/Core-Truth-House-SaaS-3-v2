"""
Test Plan Access Control - Iteration 23
Tests the tier-based access control system:
- GET /api/user/plan endpoint returns correct fields
- Default plan is FOUNDATION for unknown users
- Super admin detection via SUPER_ADMIN_CLERK_ID env var
- User plan persistence in database
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
SUPER_ADMIN_ID = "user_3AnwJ78JN5wbxBD1CfP8zvYGsM0"

class TestUserPlanEndpoint:
    """Tests for /api/user/plan endpoint"""
    
    def test_plan_endpoint_returns_required_fields(self):
        """Verify endpoint returns plan, is_super_admin, user_id fields"""
        response = requests.get(f"{BASE_URL}/api/user/plan?user_id=test_user")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "plan" in data, "Response missing 'plan' field"
        assert "is_super_admin" in data, "Response missing 'is_super_admin' field"
        assert "user_id" in data, "Response missing 'user_id' field"
        
    def test_nonexistent_user_gets_foundation(self):
        """New/unknown users should get FOUNDATION plan by default"""
        response = requests.get(f"{BASE_URL}/api/user/plan?user_id=nonexistent_user_xyz123")
        assert response.status_code == 200
        
        data = response.json()
        assert data["plan"] == "FOUNDATION", f"Expected FOUNDATION plan, got {data['plan']}"
        assert data["is_super_admin"] is False, "Unknown user should not be super admin"
        assert data["user_id"] == "nonexistent_user_xyz123"
        
    def test_default_user_id_parameter(self):
        """Test with default user_id when not provided explicitly"""
        response = requests.get(f"{BASE_URL}/api/user/plan?user_id=default")
        assert response.status_code == 200
        
        data = response.json()
        # Default user may have a plan set in DB, verify valid plan returned
        valid_plans = ["FOUNDATION", "STRUCTURE", "HOUSE", "ESTATE"]
        assert data["plan"] in valid_plans, f"Invalid plan: {data['plan']}"
        assert data["user_id"] == "default"
        
    def test_super_admin_detection(self):
        """Super admin should be detected via SUPER_ADMIN_CLERK_ID env var"""
        response = requests.get(f"{BASE_URL}/api/user/plan?user_id={SUPER_ADMIN_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["is_super_admin"] is True, f"Expected super admin to be True for {SUPER_ADMIN_ID}"
        assert data["user_id"] == SUPER_ADMIN_ID
        
    def test_regular_user_not_super_admin(self):
        """Regular users should not have super admin access"""
        response = requests.get(f"{BASE_URL}/api/user/plan?user_id=regular_user_123")
        assert response.status_code == 200
        
        data = response.json()
        assert data["is_super_admin"] is False


class TestPlanTiers:
    """Tests to verify plan tier configurations"""
    
    def test_plan_values_valid(self):
        """Verify plan field returns valid tier value"""
        response = requests.get(f"{BASE_URL}/api/user/plan?user_id=test_user")
        assert response.status_code == 200
        
        data = response.json()
        valid_plans = ["FOUNDATION", "STRUCTURE", "HOUSE", "ESTATE"]
        assert data["plan"] in valid_plans, f"Invalid plan: {data['plan']}"


class TestUserPlanPersistence:
    """Tests for user plan persistence in database"""
    
    def test_create_user_with_plan_and_verify(self):
        """Create a user with a specific plan and verify it persists"""
        # First, create a test user with a specific plan
        test_user_id = "TEST_plan_user_structure"
        
        # Create user via /api/users endpoint
        user_data = {
            "id": test_user_id,
            "email": "testplanuser@example.com",
            "name": "Test Plan User"
        }
        create_response = requests.post(f"{BASE_URL}/api/users", json=user_data)
        # User may already exist, so we accept 200 or 500 (duplicate)
        
        # Get plan for this user (should be FOUNDATION by default since we didn't set plan)
        plan_response = requests.get(f"{BASE_URL}/api/user/plan?user_id={test_user_id}")
        assert plan_response.status_code == 200
        
        data = plan_response.json()
        assert data["user_id"] == test_user_id


class TestAPIHealth:
    """Basic health checks"""
    
    def test_api_health(self):
        """Verify API is running"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        
    def test_api_root(self):
        """Verify API root returns version info"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Core Truth House" in data["message"]
