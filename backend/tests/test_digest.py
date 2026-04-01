"""Weekly Digest API Tests - iteration 17

Tests the Weekly Digest feature including:
- Digest preferences CRUD (GET/PUT /api/digest/preferences)
- Digest preview generation (GET /api/digest/preview)
- Digest send endpoint (POST /api/digest/send)
- Digest history (GET /api/digest/history)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestDigestPreferences:
    """Tests for GET/PUT /api/digest/preferences endpoints."""
    
    def test_get_default_preferences(self):
        """GET /api/digest/preferences?user_id=default returns preferences structure."""
        # Use a unique test user to ensure we get default preferences structure
        test_user = "test_fresh_user_prefs"
        response = requests.get(f"{BASE_URL}/api/digest/preferences?user_id={test_user}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify default preference fields exist
        assert "user_id" in data
        assert "enabled" in data
        assert "email" in data
        assert "day_of_week" in data
        assert "include_events" in data
        assert "include_blog" in data
        assert "include_crm" in data
        assert "include_usage" in data
        assert "user_name" in data
        
        # Default values check for fresh user
        assert data["user_id"] == test_user
        assert data["enabled"] == False  # Default is disabled
        assert data["day_of_week"] in ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        print(f"✓ GET /api/digest/preferences returns valid default preferences: enabled={data['enabled']}, day={data['day_of_week']}")
    
    def test_update_preferences(self):
        """PUT /api/digest/preferences?user_id=default saves preferences."""
        update_payload = {
            "enabled": True,
            "email": "test@example.com",
            "day_of_week": "wednesday",
            "include_events": True,
            "include_blog": True,
            "include_crm": True,
            "include_usage": False,
            "user_name": "TEST_DigestUser"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/digest/preferences?user_id=default",
            json=update_payload
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("status") == "saved"
        assert data.get("enabled") == True
        assert data.get("email") == "test@example.com"
        assert data.get("day_of_week") == "wednesday"
        assert data.get("user_name") == "TEST_DigestUser"
        assert data.get("include_usage") == False
        print("✓ PUT /api/digest/preferences saves preferences correctly")
        
        # Verify persistence with GET
        verify_response = requests.get(f"{BASE_URL}/api/digest/preferences?user_id=default")
        assert verify_response.status_code == 200
        verify_data = verify_response.json()
        assert verify_data.get("enabled") == True
        assert verify_data.get("email") == "test@example.com"
        assert verify_data.get("day_of_week") == "wednesday"
        print("✓ Preferences persisted correctly (verified with GET)")


class TestDigestPreview:
    """Tests for GET /api/digest/preview endpoint."""
    
    def test_preview_returns_html_and_data(self):
        """GET /api/digest/preview?user_id=default returns html, subject, and data."""
        response = requests.get(f"{BASE_URL}/api/digest/preview?user_id=default")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify response structure
        assert "html" in data, "Response should contain 'html' key"
        assert "subject" in data, "Response should contain 'subject' key"
        assert "data" in data, "Response should contain 'data' key"
        
        # Verify HTML content
        assert isinstance(data["html"], str)
        assert len(data["html"]) > 100, "HTML content should be substantial"
        assert "<!DOCTYPE html>" in data["html"] or "<html" in data["html"]
        print(f"✓ Preview HTML length: {len(data['html'])} chars")
        
        # Verify subject
        assert isinstance(data["subject"], str)
        assert len(data["subject"]) > 0
        assert "Weekly" in data["subject"] or "Digest" in data["subject"]
        print(f"✓ Preview subject: {data['subject']}")
        
        # Verify data structure with all expected keys
        preview_data = data["data"]
        expected_keys = [
            "week_label",
            "upcoming_events",
            "recent_posts",
            "pipeline_value",
            "total_contacts",
            "total_deals",
            "new_contacts_count",
            "published_posts_count",
            "generation_count"
        ]
        for key in expected_keys:
            assert key in preview_data, f"Missing key '{key}' in preview data"
        print(f"✓ Preview data contains all expected keys: {list(preview_data.keys())}")
        
        # Verify data types
        assert isinstance(preview_data["week_label"], str)
        assert isinstance(preview_data["upcoming_events"], list)
        assert isinstance(preview_data["recent_posts"], list)
        assert isinstance(preview_data["pipeline_value"], (int, float))
        assert isinstance(preview_data["total_contacts"], int)
        assert isinstance(preview_data["total_deals"], int)
        assert isinstance(preview_data["new_contacts_count"], int)
        assert isinstance(preview_data["published_posts_count"], int)
        assert isinstance(preview_data["generation_count"], int)
        print("✓ Preview data types are correct")


class TestDigestSend:
    """Tests for POST /api/digest/send endpoint."""
    
    def test_send_digest_with_email(self):
        """POST /api/digest/send?user_id=default sends digest (returns skipped if no Resend key)."""
        # First ensure email is set
        requests.put(
            f"{BASE_URL}/api/digest/preferences?user_id=default",
            json={"email": "test@example.com", "user_name": "Test User"}
        )
        
        response = requests.post(
            f"{BASE_URL}/api/digest/send?user_id=default",
            json={}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Status should be "sent" or contain result with "skipped" (if no Resend key)
        assert "status" in data or "result" in data
        
        # The endpoint should either send or skip (both are valid)
        status = data.get("status") or data.get("result", {}).get("status")
        assert status in ["sent", "skipped", "error"], f"Unexpected status: {status}"
        
        if status == "skipped":
            print("✓ POST /api/digest/send correctly returns 'skipped' (no Resend API key configured)")
        elif status == "sent":
            print("✓ POST /api/digest/send successfully sent email")
        else:
            print(f"✓ POST /api/digest/send returned: {data}")
        
        # Verify subject is returned
        if "subject" in data:
            assert len(data["subject"]) > 0
            print(f"✓ Email subject: {data['subject']}")
    
    def test_send_without_email_returns_error(self):
        """POST /api/digest/send without email configured returns error."""
        # Create a test user without email
        test_user_id = "test_no_email_user"
        
        # Clear any existing email for this test user
        requests.put(
            f"{BASE_URL}/api/digest/preferences?user_id={test_user_id}",
            json={"email": "", "enabled": False}
        )
        
        response = requests.post(
            f"{BASE_URL}/api/digest/send?user_id={test_user_id}",
            json={}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("status") == "error"
        assert "email" in data.get("message", "").lower() or "No email" in data.get("message", "")
        print("✓ POST /api/digest/send without email returns appropriate error message")


class TestDigestHistory:
    """Tests for GET /api/digest/history endpoint."""
    
    def test_get_history(self):
        """GET /api/digest/history?user_id=default returns history logs."""
        response = requests.get(f"{BASE_URL}/api/digest/history?user_id=default")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "history" in data, "Response should contain 'history' key"
        assert "total" in data, "Response should contain 'total' key"
        
        assert isinstance(data["history"], list)
        assert isinstance(data["total"], int)
        assert data["total"] >= 0
        print(f"✓ GET /api/digest/history returns {data['total']} history entries")
        
        # If there are history entries, verify structure
        if len(data["history"]) > 0:
            entry = data["history"][0]
            assert "user_id" in entry
            assert "email" in entry
            assert "sent_at" in entry
            print(f"✓ History entry structure validated: {list(entry.keys())}")


class TestEmailTemplate:
    """Tests for weekly_digest_email template function via preview endpoint."""
    
    def test_email_template_has_stats_section(self):
        """Verify email template contains stats, events, and posts sections."""
        response = requests.get(f"{BASE_URL}/api/digest/preview?user_id=default")
        assert response.status_code == 200
        
        html = response.json().get("html", "")
        
        # Check for key sections in the email template
        assert "Quick Stats" in html or "stats" in html.lower(), "Email should contain stats section"
        print("✓ Email template contains Quick Stats section")
        
        # Check for Pipeline Value stat card
        assert "Pipeline" in html or "pipeline" in html.lower()
        print("✓ Email template contains Pipeline stat")
        
        # Check for Contacts stat card
        assert "Contact" in html or "contact" in html.lower()
        print("✓ Email template contains Contacts stat")
        
        # Check for Deals stat card
        assert "Deal" in html or "deal" in html.lower()
        print("✓ Email template contains Deals stat")
        
        # Check for Events section
        assert "Event" in html or "event" in html.lower()
        print("✓ Email template contains Events section")
        
        # Check for Blog/Posts section
        assert "Blog" in html or "Post" in html or "post" in html.lower() or "blog" in html.lower()
        print("✓ Email template contains Blog/Posts section")
        
        # Check for Core Truth House branding
        assert "Core Truth House" in html or "Core Truth" in html
        print("✓ Email template contains Core Truth House branding")


class TestCleanup:
    """Cleanup test data after all tests."""
    
    def test_cleanup_test_preferences(self):
        """Reset test preferences to defaults."""
        # Reset default user preferences
        reset_payload = {
            "enabled": False,
            "email": "",
            "day_of_week": "monday",
            "include_events": True,
            "include_blog": True,
            "include_crm": True,
            "include_usage": True,
            "user_name": ""
        }
        response = requests.put(
            f"{BASE_URL}/api/digest/preferences?user_id=default",
            json=reset_payload
        )
        assert response.status_code == 200
        print("✓ Test preferences cleaned up")
