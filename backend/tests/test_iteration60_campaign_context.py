"""
test_iteration60_campaign_context.py
Testing Campaign Builder Strategic Context API Bug Fix

Bug: Strategic OS not populating Campaign Builder.
Fix: Rewrote campaign_context_router.py to read from step_inputs using correct keys
     AND fall back to brand_memory for all fields.

Tests:
- GET /api/campaign-builder/strategic-context returns prefilled fields from Brand Memory
- Response includes correct field_sources mapping
- completion_summary includes steps_complete, completed_steps, is_ready
- Empty user returns empty data with helpful message
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')


class TestStrategicContextAPI:
    """Test Campaign Builder Strategic Context endpoint"""

    def test_strategic_context_with_brand_memory_user_1(self):
        """Test user test_parser_user_3 - should have 9+ prefilled fields from Brand Memory"""
        response = requests.get(
            f"{BASE_URL}/api/campaign-builder/strategic-context",
            params={"user_id": "test_parser_user_3"}
        )
        
        # Status code
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Parse response
        data = response.json()
        
        # Verify structure
        assert "data" in data, "Response should have 'data' field"
        assert "prefilled_fields" in data, "Response should have 'prefilled_fields' field"
        assert "field_sources" in data, "Response should have 'field_sources' field"
        assert "completion_summary" in data, "Response should have 'completion_summary' field"
        
        # Verify at least 9 prefilled fields (as per requirement)
        assert len(data["prefilled_fields"]) >= 9, \
            f"Expected 9+ prefilled fields, got {len(data['prefilled_fields'])}: {data['prefilled_fields']}"
        
        # Verify key fields are present
        assert "target_audience" in data["data"], "target_audience should be in data"
        assert "pain_points" in data["data"], "pain_points should be in data"
        assert "desired_outcome" in data["data"], "desired_outcome should be in data"
        assert "unique_mechanism" in data["data"], "unique_mechanism should be in data"
        assert "primary_offer" in data["data"], "primary_offer should be in data"
        assert "brand_name" in data["data"], "brand_name should be in data"
        
        # Verify field_sources are populated
        assert len(data["field_sources"]) > 0, "field_sources should not be empty"
        
        # Verify completion_summary structure
        assert "steps_complete" in data["completion_summary"]
        assert "completed_steps" in data["completion_summary"]
        assert "missing_steps" in data["completion_summary"]
        assert "is_ready" in data["completion_summary"]
        
        print(f"test_parser_user_3: {len(data['prefilled_fields'])} prefilled fields")
        print(f"Fields: {data['prefilled_fields']}")

    def test_strategic_context_with_dev_user(self):
        """Test dev_user_default - should have fields from Brand Memory"""
        response = requests.get(
            f"{BASE_URL}/api/campaign-builder/strategic-context",
            params={"user_id": "dev_user_default"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "data" in data
        assert "prefilled_fields" in data
        assert "field_sources" in data
        
        # Should have at least some prefilled fields
        assert len(data["prefilled_fields"]) >= 5, \
            f"Expected 5+ prefilled fields, got {len(data['prefilled_fields'])}"
        
        # Verify key fields
        assert "target_audience" in data["data"], "target_audience should be present"
        assert "brand_name" in data["data"], "brand_name should be present"
        
        print(f"dev_user_default: {len(data['prefilled_fields'])} prefilled fields")
        print(f"Fields: {data['prefilled_fields']}")

    def test_field_sources_mapping(self):
        """Verify field_sources correctly maps to Brand Memory or Strategic OS step labels"""
        response = requests.get(
            f"{BASE_URL}/api/campaign-builder/strategic-context",
            params={"user_id": "test_parser_user_3"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check that field_sources contains valid values
        valid_sources = [
            "Brand Memory", 
            "Audience Psychology",  # Step 2
            "Differentiation",      # Step 3
            "Content Pillars",      # Step 5
            "Platform Strategy",    # Step 6
            "Content Calendar",     # Step 7
            "Conversion"            # Step 9
        ]
        
        for field, source in data["field_sources"].items():
            assert source in valid_sources, \
                f"Invalid source '{source}' for field '{field}'. Expected one of {valid_sources}"
        
        print(f"Field sources verified: {data['field_sources']}")

    def test_target_audience_populated(self):
        """Verify target_audience field is populated correctly"""
        response = requests.get(
            f"{BASE_URL}/api/campaign-builder/strategic-context",
            params={"user_id": "test_parser_user_3"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        target_audience = data["data"].get("target_audience", "")
        assert target_audience, "target_audience should not be empty"
        assert len(target_audience) > 10, "target_audience should have meaningful content"
        print(f"target_audience: {target_audience[:100]}...")

    def test_pain_points_populated(self):
        """Verify pain_points field is populated correctly"""
        response = requests.get(
            f"{BASE_URL}/api/campaign-builder/strategic-context",
            params={"user_id": "test_parser_user_3"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        pain_points = data["data"].get("pain_points", "")
        assert pain_points, "pain_points should not be empty"
        print(f"pain_points: {pain_points}")

    def test_desired_outcome_populated(self):
        """Verify desired_outcome field is populated correctly"""
        response = requests.get(
            f"{BASE_URL}/api/campaign-builder/strategic-context",
            params={"user_id": "test_parser_user_3"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        desired_outcome = data["data"].get("desired_outcome", "")
        assert desired_outcome, "desired_outcome should not be empty"
        print(f"desired_outcome: {desired_outcome[:100]}...")

    def test_unique_mechanism_populated(self):
        """Verify unique_mechanism field is populated correctly"""
        response = requests.get(
            f"{BASE_URL}/api/campaign-builder/strategic-context",
            params={"user_id": "test_parser_user_3"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        unique_mechanism = data["data"].get("unique_mechanism", "")
        assert unique_mechanism, "unique_mechanism should not be empty"
        print(f"unique_mechanism: {unique_mechanism[:100]}...")

    def test_primary_offer_populated(self):
        """Verify primary_offer field is populated correctly"""
        response = requests.get(
            f"{BASE_URL}/api/campaign-builder/strategic-context",
            params={"user_id": "test_parser_user_3"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        primary_offer = data["data"].get("primary_offer", "")
        assert primary_offer, "primary_offer should not be empty"
        print(f"primary_offer: {primary_offer}")

    def test_brand_name_populated(self):
        """Verify brand_name field is populated correctly"""
        response = requests.get(
            f"{BASE_URL}/api/campaign-builder/strategic-context",
            params={"user_id": "test_parser_user_3"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        brand_name = data["data"].get("brand_name", "")
        assert brand_name, "brand_name should not be empty"
        print(f"brand_name: {brand_name}")

    def test_completion_summary_structure(self):
        """Verify completion_summary includes required fields"""
        response = requests.get(
            f"{BASE_URL}/api/campaign-builder/strategic-context",
            params={"user_id": "test_parser_user_3"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        summary = data["completion_summary"]
        
        # Check structure
        assert isinstance(summary["steps_complete"], int)
        assert isinstance(summary["completed_steps"], list)
        assert isinstance(summary["missing_steps"], list)
        assert isinstance(summary["is_ready"], bool)
        
        # When user has Brand Memory, is_ready should be True
        assert summary["is_ready"] == True, "is_ready should be True for user with Brand Memory"
        
        print(f"completion_summary: {summary}")

    def test_empty_user_returns_helpful_message(self):
        """Test that empty user returns empty data with helpful message"""
        response = requests.get(
            f"{BASE_URL}/api/campaign-builder/strategic-context",
            params={"user_id": "nonexistent_test_user_xyz123"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Data should be empty
        assert data["data"] == {}, "data should be empty for nonexistent user"
        assert data["prefilled_fields"] == [], "prefilled_fields should be empty"
        
        # Should have a helpful message
        assert data["message"] is not None, "Should have a helpful message for empty user"
        assert "Strategic OS" in data["message"] or "Brand Memory" in data["message"], \
            "Message should mention Strategic OS or Brand Memory"
        
        # is_ready should be False
        assert data["completion_summary"]["is_ready"] == False
        
        print(f"Empty user message: {data['message']}")


class TestStrategicContextEdgeCases:
    """Edge case tests for the strategic context API"""

    def test_default_user_id(self):
        """Test that default user_id parameter works"""
        response = requests.get(
            f"{BASE_URL}/api/campaign-builder/strategic-context"
        )
        
        # Should work without user_id (defaults to "default")
        assert response.status_code == 200
        data = response.json()
        assert "data" in data
        assert "completion_summary" in data

    def test_with_workspace_id(self):
        """Test that workspace_id parameter is accepted"""
        response = requests.get(
            f"{BASE_URL}/api/campaign-builder/strategic-context",
            params={"user_id": "test_parser_user_3", "workspace_id": "test_workspace"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "data" in data

    def test_response_has_no_mongodb_id(self):
        """Verify response doesn't include MongoDB _id field"""
        response = requests.get(
            f"{BASE_URL}/api/campaign-builder/strategic-context",
            params={"user_id": "test_parser_user_3"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check that _id is not in any of the response fields
        assert "_id" not in data
        assert "_id" not in data.get("data", {})
        assert "_id" not in data.get("field_sources", {})
        assert "_id" not in data.get("completion_summary", {})


class TestBrandMemoryFallback:
    """Test that Brand Memory fallback is working correctly"""

    def test_brand_memory_fields_populated(self):
        """Verify Brand Memory is being used as fallback when Strategic OS steps are not complete"""
        response = requests.get(
            f"{BASE_URL}/api/campaign-builder/strategic-context",
            params={"user_id": "test_parser_user_3"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Count fields from Brand Memory
        brand_memory_fields = [
            field for field, source in data["field_sources"].items() 
            if source == "Brand Memory"
        ]
        
        # Since Strategic OS steps are not complete (0 steps_complete),
        # all fields should be from Brand Memory
        assert len(brand_memory_fields) >= 5, \
            f"Expected 5+ fields from Brand Memory, got {len(brand_memory_fields)}"
        
        print(f"Fields from Brand Memory: {brand_memory_fields}")
        print(f"Total Brand Memory fields: {len(brand_memory_fields)}")

    def test_field_mapping_correct(self):
        """Verify field mapping is working - Brand Memory fields are correctly named in response"""
        response = requests.get(
            f"{BASE_URL}/api/campaign-builder/strategic-context",
            params={"user_id": "test_parser_user_3"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # These are the expected field names in the response
        expected_fields = [
            "target_audience",
            "pain_points", 
            "desired_outcome",
            "unique_mechanism",
            "primary_offer",
            "primary_platform",
            "brand_name"
        ]
        
        present_fields = [f for f in expected_fields if f in data["data"]]
        assert len(present_fields) >= 5, \
            f"Expected 5+ of {expected_fields} to be present, got {present_fields}"
        
        print(f"Present fields: {present_fields}")
