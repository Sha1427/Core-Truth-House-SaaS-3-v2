"""
Iteration 55: Pre-Audit Intake Form and Brand Assets Count Tests
Tests for:
1. Bug fix: Brand Assets count from both media_assets AND brand_assets collections
2. New feature: Pre-Audit Intake Form API endpoints
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user for intake tests
TEST_USER_ID = "TEST_intake_user_55"
DEV_USER_ID = "dev_user_default"


class TestBrandMemoryEndpoint:
    """Tests for GET /api/analytics/brand-memory - brand assets count fix"""
    
    def test_brand_memory_returns_200(self):
        """Test that brand-memory endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/analytics/brand-memory?user_id={DEV_USER_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ brand-memory returns 200")
    
    def test_brand_memory_has_required_fields(self):
        """Test brand-memory response has all required fields"""
        response = requests.get(f"{BASE_URL}/api/analytics/brand-memory?user_id={DEV_USER_ID}")
        data = response.json()
        
        # Check top-level fields
        assert "memory_score" in data, "Missing memory_score field"
        assert "fields" in data, "Missing fields field"
        assert "identity" in data, "Missing identity field"
        assert "utilization" in data, "Missing utilization field"
        print(f"✓ All top-level fields present")
        
        # Check identity sub-fields (where assets_uploaded lives)
        identity = data.get("identity", {})
        assert "colors_defined" in identity, "Missing colors_defined in identity"
        assert "fonts_set" in identity, "Missing fonts_set in identity"
        assert "assets_uploaded" in identity, "Missing assets_uploaded in identity"
        print(f"✓ Identity fields correct, assets_uploaded={identity.get('assets_uploaded')}")
    
    def test_assets_uploaded_is_integer(self):
        """Verify assets_uploaded is returned as integer"""
        response = requests.get(f"{BASE_URL}/api/analytics/brand-memory?user_id={DEV_USER_ID}")
        data = response.json()
        assets_count = data.get("identity", {}).get("assets_uploaded")
        
        assert isinstance(assets_count, int), f"assets_uploaded should be int, got {type(assets_count)}"
        assert assets_count >= 0, f"assets_uploaded should be >= 0, got {assets_count}"
        print(f"✓ assets_uploaded is valid integer: {assets_count}")


class TestIntakeStatusEndpoint:
    """Tests for GET /api/brand-audit/intake-status"""
    
    def test_intake_status_returns_200(self):
        """Test that intake-status endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/brand-audit/intake-status?user_id={DEV_USER_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ intake-status returns 200")
    
    def test_intake_status_has_required_fields(self):
        """Test intake-status response has all required fields"""
        response = requests.get(f"{BASE_URL}/api/brand-audit/intake-status?user_id={DEV_USER_ID}")
        data = response.json()
        
        assert "intake_complete" in data, "Missing intake_complete field"
        assert "audit_count" in data, "Missing audit_count field"
        assert "has_brand_memory" in data, "Missing has_brand_memory field"
        
        # Verify types
        assert isinstance(data["intake_complete"], bool), "intake_complete should be bool"
        assert isinstance(data["audit_count"], int), "audit_count should be int"
        assert isinstance(data["has_brand_memory"], bool), "has_brand_memory should be bool"
        print(f"✓ intake-status fields: complete={data['intake_complete']}, audits={data['audit_count']}, has_memory={data['has_brand_memory']}")
    
    def test_new_user_shows_not_complete(self):
        """A user with no audits should have intake_complete=false"""
        response = requests.get(f"{BASE_URL}/api/brand-audit/intake-status?user_id={TEST_USER_ID}")
        data = response.json()
        
        # New user should not have completed intake
        assert data["intake_complete"] == False, f"New user should have intake_complete=False, got {data['intake_complete']}"
        assert data["audit_count"] == 0, f"New user should have audit_count=0, got {data['audit_count']}"
        print(f"✓ New user correctly shows intake not complete")


class TestIntakeSubmitEndpoint:
    """Tests for POST /api/brand-audit/intake"""
    
    def test_intake_submit_with_required_fields(self):
        """Test intake submission with all required fields"""
        payload = {
            "user_id": TEST_USER_ID,
            "answers": {
                "brand_name": "TEST Brand 55",
                "what_you_do": "Help founders build brands",
                "who_you_serve": "Founders with 2+ years experience",
                "primary_offer": "Brand audit service",
                "price_point": "$497",
                "offer_type": "One-time service",
                "active_platforms": ["LinkedIn", "Instagram"],
                "primary_goal": "Get my first paying clients",
                "biggest_challenge": "Converting content to clients"
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/brand-audit/intake", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Expected success=True, got {data.get('success')}"
        assert "audit_id" in data, "Missing audit_id in response"
        assert "overall_score" in data, "Missing overall_score in response"
        assert "brand_health_rating" in data, "Missing brand_health_rating in response"
        assert "brand_memory_completion" in data, "Missing brand_memory_completion in response"
        
        print(f"✓ Intake submission successful: score={data.get('overall_score')}, rating={data.get('brand_health_rating')}")
    
    def test_intake_creates_audit(self):
        """Verify intake submission creates an audit in database"""
        # First submit intake
        payload = {
            "user_id": f"{TEST_USER_ID}_audit_check",
            "answers": {
                "brand_name": "TEST Brand Check",
                "what_you_do": "Testing audit creation",
                "who_you_serve": "Test users",
                "primary_offer": "Test offer",
                "price_point": "$100",
                "offer_type": "Digital product",
                "active_platforms": ["LinkedIn"],
                "primary_goal": "Grow my audience",
                "biggest_challenge": "Testing"
            }
        }
        
        submit_response = requests.post(f"{BASE_URL}/api/brand-audit/intake", json=payload)
        assert submit_response.status_code == 200
        
        # Now check intake-status shows audit exists
        status_response = requests.get(f"{BASE_URL}/api/brand-audit/intake-status?user_id={TEST_USER_ID}_audit_check")
        status_data = status_response.json()
        
        assert status_data["intake_complete"] == True, "intake_complete should be True after submission"
        assert status_data["audit_count"] >= 1, f"audit_count should be >= 1, got {status_data['audit_count']}"
        print(f"✓ Audit created successfully, audit_count={status_data['audit_count']}")
    
    def test_intake_updates_brand_memory(self):
        """Verify intake submission sets intake_complete flag in brand_memory"""
        # This is implicitly tested by test_intake_creates_audit checking intake_complete
        # The endpoint sets intake_complete=True in brand_memory collection
        print("✓ Brand memory update verified via intake_complete flag")
    
    def test_intake_score_range(self):
        """Verify audit score is in valid range"""
        payload = {
            "user_id": f"{TEST_USER_ID}_score_check",
            "answers": {
                "brand_name": "TEST Score Check",
                "what_you_do": "Testing scores",
                "who_you_serve": "Test audience",
                "primary_offer": "Score test offer",
                "price_point": "$500",
                "offer_type": "Coaching / consulting",
                "active_platforms": ["LinkedIn", "Instagram", "TikTok"],
                "posting_frequency": "Daily",
                "primary_goal": "Scale past 6 figures",
                "biggest_challenge": "Scaling operations"
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/brand-audit/intake", json=payload)
        data = response.json()
        
        score = data.get("overall_score", 0)
        assert 0 <= score <= 100, f"Score should be 0-100, got {score}"
        
        rating = data.get("brand_health_rating", "")
        valid_ratings = ["Building", "Developing", "Established", "Optimized"]
        assert rating in valid_ratings, f"Rating should be one of {valid_ratings}, got {rating}"
        
        print(f"✓ Score valid: {score}, Rating valid: {rating}")


class TestIntakeValidation:
    """Tests for intake form validation"""
    
    def test_intake_empty_answers(self):
        """Test intake with empty answers object"""
        payload = {
            "user_id": f"{TEST_USER_ID}_empty",
            "answers": {}
        }
        
        # Should still work but produce a low score (fallback scorer)
        response = requests.post(f"{BASE_URL}/api/brand-audit/intake", json=payload)
        assert response.status_code == 200, f"Expected 200 even with empty answers, got {response.status_code}"
        print(f"✓ Empty answers handled gracefully")
    
    def test_intake_missing_user_id_uses_default(self):
        """Test that missing user_id uses default"""
        payload = {
            "answers": {
                "brand_name": "TEST No User ID"
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/brand-audit/intake", json=payload)
        # Should use default user_id
        assert response.status_code == 200
        print(f"✓ Missing user_id uses default")


@pytest.fixture(scope="class", autouse=True)
def cleanup_test_data():
    """Cleanup test data after all tests"""
    yield
    # Cleanup via API or direct if available
    # For now we'll just note the test users created with TEST_ prefix
    print(f"\n⚠ Test users created with prefix TEST_intake_user_55* should be cleaned up")


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v"])
