"""
Iteration 44: Campaign Builder v3 - Backend API Tests
Tests for:
- Results tab API (POST /api/campaigns/{id}/update-results)
- Calendar modal API (POST /api/campaigns/calendar-items)
- GET campaigns with new fields (actual_value, additional_metrics, weekly_results)
- Status change endpoints
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
SEEDED_CAMPAIGN_ID = "dc745f60-6d2c-4dcd-97ed-cdd8f2ff7b3b"
TEST_USER_ID = "dev_user_default"


class TestCampaignBuilderV3:
    """Campaign Builder v3 API tests"""

    # Test GET campaigns returns seeded campaign with new fields
    def test_get_campaigns_returns_seeded_data(self):
        """Verify GET /api/campaigns returns seeded campaign with actual_value, additional_metrics, weekly_results"""
        response = requests.get(f"{BASE_URL}/api/campaigns?user_id={TEST_USER_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "campaigns" in data, "Response should contain 'campaigns' key"
        assert len(data["campaigns"]) > 0, "Should have at least one campaign"
        
        # Find seeded campaign
        seeded = next((c for c in data["campaigns"] if c["id"] == SEEDED_CAMPAIGN_ID), None)
        assert seeded is not None, f"Seeded campaign {SEEDED_CAMPAIGN_ID} not found"
        
        # Check campaign has required fields
        assert seeded["name"] == "Q2 Foundation Launch", "Campaign name mismatch"
        assert seeded["status"] == "active", "Campaign status should be active"
        assert seeded["target_value"] == "50", "Target value should be 50"
        print(f"SUCCESS: GET campaigns returned seeded campaign with correct data")

    def test_get_campaigns_has_new_v3_fields(self):
        """Verify seeded campaign has actual_value, additional_metrics, weekly_results"""
        response = requests.get(f"{BASE_URL}/api/campaigns?user_id={TEST_USER_ID}")
        assert response.status_code == 200
        
        data = response.json()
        seeded = next((c for c in data["campaigns"] if c["id"] == SEEDED_CAMPAIGN_ID), None)
        assert seeded is not None
        
        # Check v3 fields
        assert "actual_value" in seeded, "Campaign should have actual_value field"
        assert seeded["actual_value"] == "42", f"actual_value should be '42', got {seeded.get('actual_value')}"
        
        assert "additional_metrics" in seeded, "Campaign should have additional_metrics field"
        assert isinstance(seeded["additional_metrics"], list), "additional_metrics should be a list"
        
        assert "weekly_results" in seeded, "Campaign should have weekly_results field"
        assert isinstance(seeded["weekly_results"], list), "weekly_results should be a list"
        print(f"SUCCESS: Campaign has all v3 fields (actual_value, additional_metrics, weekly_results)")

    def test_get_campaign_by_id(self):
        """Test GET /api/campaigns/{id} returns single campaign"""
        response = requests.get(f"{BASE_URL}/api/campaigns/{SEEDED_CAMPAIGN_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["id"] == SEEDED_CAMPAIGN_ID
        assert data["name"] == "Q2 Foundation Launch"
        print(f"SUCCESS: GET campaign by ID works correctly")

    def test_get_campaign_not_found(self):
        """Test GET /api/campaigns/{id} returns 404 for invalid ID"""
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = requests.get(f"{BASE_URL}/api/campaigns/{fake_id}")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"SUCCESS: GET campaign returns 404 for invalid ID")


class TestResultsUpdate:
    """Tests for POST /api/campaigns/{id}/update-results endpoint"""

    def test_update_results_with_actual_value(self):
        """Test updating campaign with actual_value"""
        payload = {"actual_value": "45"}
        response = requests.post(
            f"{BASE_URL}/api/campaigns/{SEEDED_CAMPAIGN_ID}/update-results",
            json=payload
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["success"] == True, "Response should indicate success"
        
        # Verify update persisted
        verify = requests.get(f"{BASE_URL}/api/campaigns/{SEEDED_CAMPAIGN_ID}")
        assert verify.status_code == 200
        campaign = verify.json()
        assert campaign["actual_value"] == "45", f"actual_value should be '45', got {campaign.get('actual_value')}"
        print(f"SUCCESS: update-results endpoint updates actual_value correctly")

    def test_update_results_with_additional_metrics(self):
        """Test updating campaign with additional_metrics"""
        payload = {
            "additional_metrics": [
                {"id": "m1", "label": "Impressions", "target": "25000", "actual": "31200"},
                {"id": "m2", "label": "Leads captured", "target": "120", "actual": "94"}
            ]
        }
        response = requests.post(
            f"{BASE_URL}/api/campaigns/{SEEDED_CAMPAIGN_ID}/update-results",
            json=payload
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify update persisted
        verify = requests.get(f"{BASE_URL}/api/campaigns/{SEEDED_CAMPAIGN_ID}")
        campaign = verify.json()
        assert len(campaign["additional_metrics"]) == 2, "Should have 2 additional metrics"
        print(f"SUCCESS: update-results endpoint updates additional_metrics correctly")

    def test_update_results_with_weekly_results(self):
        """Test updating campaign with weekly_results"""
        payload = {
            "weekly_results": [
                {"week": 1, "type": "awareness", "reach": "8200", "engagements": "430", "leads": "12"},
                {"week": 2, "type": "education", "reach": "11400", "engagements": "620", "leads": "28"},
                {"week": 3, "type": "authority", "reach": "9800", "engagements": "540", "leads": "31"},
                {"week": 4, "type": "promotion", "reach": "14200", "engagements": "890", "leads": "23"}
            ]
        }
        response = requests.post(
            f"{BASE_URL}/api/campaigns/{SEEDED_CAMPAIGN_ID}/update-results",
            json=payload
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify update persisted
        verify = requests.get(f"{BASE_URL}/api/campaigns/{SEEDED_CAMPAIGN_ID}")
        campaign = verify.json()
        assert len(campaign["weekly_results"]) == 4, "Should have 4 weekly results"
        print(f"SUCCESS: update-results endpoint updates weekly_results correctly")

    def test_update_results_all_fields(self):
        """Test updating all results fields at once"""
        payload = {
            "actual_value": "42",
            "additional_metrics": [
                {"id": "m1", "label": "Impressions", "target": "25000", "actual": "31200"},
                {"id": "m2", "label": "Leads captured", "target": "120", "actual": "94"}
            ],
            "weekly_results": [
                {"week": 1, "type": "awareness", "reach": "8200", "engagements": "430", "leads": "12"},
                {"week": 2, "type": "education", "reach": "11400", "engagements": "620", "leads": "28"},
                {"week": 3, "type": "authority", "reach": "9800", "engagements": "540", "leads": "31"},
                {"week": 4, "type": "promotion", "reach": "14200", "engagements": "890", "leads": "23"}
            ]
        }
        response = requests.post(
            f"{BASE_URL}/api/campaigns/{SEEDED_CAMPAIGN_ID}/update-results",
            json=payload
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"SUCCESS: update-results endpoint handles all fields at once")

    def test_update_results_empty_payload(self):
        """Test update-results with empty payload returns success"""
        payload = {}
        response = requests.post(
            f"{BASE_URL}/api/campaigns/{SEEDED_CAMPAIGN_ID}/update-results",
            json=payload
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"SUCCESS: update-results with empty payload returns success")

    def test_update_results_invalid_campaign(self):
        """Test update-results returns 404 for invalid campaign"""
        fake_id = "00000000-0000-0000-0000-000000000000"
        payload = {"actual_value": "100"}
        response = requests.post(
            f"{BASE_URL}/api/campaigns/{fake_id}/update-results",
            json=payload
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"SUCCESS: update-results returns 404 for invalid campaign")


class TestCalendarItems:
    """Tests for POST /api/campaigns/calendar-items endpoint"""

    def test_push_calendar_items_success(self):
        """Test pushing calendar items creates entries"""
        test_id = str(uuid.uuid4())[:8]
        payload = {
            "items": [
                {
                    "campaign_id": SEEDED_CAMPAIGN_ID,
                    "campaign_name": "Q2 Foundation Launch",
                    "content_item_id": f"test-c1-{test_id}",
                    "format": "Reel Hook",
                    "platform": "Instagram",
                    "topic": "Test topic for calendar",
                    "phase": "awareness",
                    "status": "draft",
                    "scheduled_date": "2026-04-01"
                },
                {
                    "campaign_id": SEEDED_CAMPAIGN_ID,
                    "campaign_name": "Q2 Foundation Launch",
                    "content_item_id": f"test-c2-{test_id}",
                    "format": "Thread",
                    "platform": "LinkedIn",
                    "topic": "Another test topic",
                    "phase": "awareness",
                    "status": "draft",
                    "scheduled_date": "2026-04-01"
                }
            ]
        }
        response = requests.post(
            f"{BASE_URL}/api/campaigns/calendar-items",
            json=payload
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["success"] == True, "Response should indicate success"
        assert data["items_created"] == 2, f"Should create 2 items, got {data.get('items_created')}"
        print(f"SUCCESS: calendar-items endpoint creates calendar entries")

    def test_push_calendar_items_single_item(self):
        """Test pushing single calendar item"""
        test_id = str(uuid.uuid4())[:8]
        payload = {
            "items": [
                {
                    "campaign_id": SEEDED_CAMPAIGN_ID,
                    "campaign_name": "Q2 Foundation Launch",
                    "content_item_id": f"test-single-{test_id}",
                    "format": "Email Newsletter",
                    "platform": "Email",
                    "topic": "Single item test",
                    "phase": "promotion",
                    "status": "draft",
                    "scheduled_date": "2026-04-25"
                }
            ]
        }
        response = requests.post(
            f"{BASE_URL}/api/campaigns/calendar-items",
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        assert data["items_created"] == 1
        print(f"SUCCESS: Single calendar item creation works")

    def test_push_calendar_items_empty_list(self):
        """Test pushing empty list of calendar items"""
        payload = {"items": []}
        response = requests.post(
            f"{BASE_URL}/api/campaigns/calendar-items",
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        assert data["items_created"] == 0
        print(f"SUCCESS: Empty calendar items list handled correctly")


class TestStatusChange:
    """Tests for POST /api/campaigns/{id}/status endpoint"""

    def test_status_change_to_paused(self):
        """Test changing campaign status to paused"""
        response = requests.post(f"{BASE_URL}/api/campaigns/{SEEDED_CAMPAIGN_ID}/status?status=paused")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["success"] == True
        assert data["status"] == "paused"
        print(f"SUCCESS: Status change to 'paused' works")

    def test_status_change_to_active(self):
        """Test changing campaign status to active"""
        response = requests.post(f"{BASE_URL}/api/campaigns/{SEEDED_CAMPAIGN_ID}/status?status=active")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert data["status"] == "active"
        print(f"SUCCESS: Status change to 'active' works")

    def test_status_change_to_complete(self):
        """Test changing campaign status to complete"""
        response = requests.post(f"{BASE_URL}/api/campaigns/{SEEDED_CAMPAIGN_ID}/status?status=complete")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert data["status"] == "complete"
        
        # Restore to active for other tests
        requests.post(f"{BASE_URL}/api/campaigns/{SEEDED_CAMPAIGN_ID}/status?status=active")
        print(f"SUCCESS: Status change to 'complete' works")

    def test_status_change_invalid_status(self):
        """Test invalid status returns 400"""
        response = requests.post(f"{BASE_URL}/api/campaigns/{SEEDED_CAMPAIGN_ID}/status?status=invalid_status")
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print(f"SUCCESS: Invalid status returns 400")


class TestNewCampaignCreation:
    """Tests for POST /api/campaigns endpoint (MAGNET framework campaign creation)"""

    def test_create_campaign_minimal(self):
        """Test creating campaign with minimal required fields"""
        test_id = str(uuid.uuid4())[:8]
        payload = {
            "user_id": "test_user",
            "name": f"TEST_Campaign_{test_id}",
            "goal": "lead_generation"
        }
        response = requests.post(f"{BASE_URL}/api/campaigns", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Response should contain campaign id"
        assert data["name"] == payload["name"]
        assert data["goal"] == payload["goal"]
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/campaigns/{data['id']}")
        print(f"SUCCESS: Minimal campaign creation works")

    def test_create_campaign_with_magnet_fields(self):
        """Test creating campaign with full MAGNET framework fields"""
        test_id = str(uuid.uuid4())[:8]
        payload = {
            "user_id": "test_user",
            "name": f"TEST_Full_MAGNET_{test_id}",
            "goal": "offer_launch",
            "offer_name": "Test Offer ($99)",
            "offer_description": "Test offer description",
            "transformation": "From A to B",
            "start_date": "2026-05-01",
            "end_date": "2026-05-31",
            "platforms": ["Instagram", "LinkedIn"],
            "target_metric": "Signups",
            "target_value": "100",
            "audience_description": "Test audience",
            "audience_problem": "Test problem",
            "awareness_stage": "problem_aware",
            "emotional_hook": "Test hook",
            "promise": "Test promise",
            "cta_primary": "Test CTA",
            "content_plan": [
                {"id": "cp1", "week": 1, "type": "awareness", "format": "Reel", "platform": "Instagram", "topic": "Topic 1"}
            ],
            "engagement_tactics": ["Comment prompt", "Poll or vote"],
            "actual_value": "",
            "additional_metrics": [],
            "weekly_results": []
        }
        response = requests.post(f"{BASE_URL}/api/campaigns", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["platforms"] == ["Instagram", "LinkedIn"]
        assert data["target_value"] == "100"
        assert len(data["content_plan"]) == 1
        
        # Verify the new v3 fields are in response
        assert "actual_value" in data
        assert "additional_metrics" in data
        assert "weekly_results" in data
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/campaigns/{data['id']}")
        print(f"SUCCESS: Full MAGNET campaign creation works with v3 fields")


class TestCampaignContentPlan:
    """Tests for campaign content_plan field"""

    def test_seeded_campaign_has_content_plan(self):
        """Verify seeded campaign has content_plan for calendar modal"""
        response = requests.get(f"{BASE_URL}/api/campaigns/{SEEDED_CAMPAIGN_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert "content_plan" in data
        assert isinstance(data["content_plan"], list)
        assert len(data["content_plan"]) >= 5, f"Should have at least 5 content items, got {len(data['content_plan'])}"
        
        # Check content plan item structure
        item = data["content_plan"][0]
        required_fields = ["id", "week", "type", "format", "platform"]
        for field in required_fields:
            assert field in item, f"Content plan item missing '{field}' field"
        print(f"SUCCESS: Seeded campaign has complete content_plan for calendar modal")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
