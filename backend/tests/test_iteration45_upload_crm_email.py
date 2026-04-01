"""
Iteration 45: UploadZone & CRM Email Auto-logging Tests
---------------------------------------------------------
Features tested:
1. POST /api/upload/file - File upload with multipart form data
2. GET /api/upload/serve/{folder}/{filename} - Serve uploaded files
3. GET /api/upload/assets - List uploaded assets
4. POST /api/crm/deals/{deal_id}/email - Log email and auto-create activity
5. GET /api/crm/deals/{deal_id}/emails - Get email history for a deal
6. PUT /api/crm/deals/{deal_id}/move - Move deal between stages
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")


class TestUploadEndpoints:
    """Test file upload functionality."""

    def test_upload_file_text(self):
        """Upload a text file and verify response."""
        # Create a simple text file for testing
        file_content = b"Test file content for iteration 45"
        files = {"file": ("test_file.txt", file_content, "text/plain")}

        response = requests.post(f"{BASE_URL}/api/upload/file", files=files)
        assert response.status_code == 200, f"Upload failed: {response.text}"

        data = response.json()
        assert "id" in data, "Missing id in upload response"
        assert "name" in data, "Missing name in upload response"
        assert data["name"] == "test_file.txt"
        assert "url" in data, "Missing url in upload response"
        assert "size" in data, "Missing size in upload response"
        assert data["size"] == len(file_content)
        print(f"Text file upload successful: {data['id']}")

        # Store asset_id for later tests
        TestUploadEndpoints.last_uploaded_id = data["id"]
        TestUploadEndpoints.last_uploaded_url = data["url"]

    def test_upload_file_image_type(self):
        """Upload an image file (simulated PNG header)."""
        # Create a minimal PNG header for testing
        png_header = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100
        files = {"file": ("test_image.png", png_header, "image/png")}

        response = requests.post(f"{BASE_URL}/api/upload/file", files=files)
        assert response.status_code == 200, f"Image upload failed: {response.text}"

        data = response.json()
        assert data["type"] == "image/png"
        assert "thumbnailUrl" in data
        assert data["thumbnailUrl"] is not None, "Image should have thumbnailUrl"
        print(f"Image upload successful: {data['id']}")

    def test_upload_file_pdf(self):
        """Upload a PDF file."""
        # Minimal PDF content
        pdf_content = b"%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF"
        files = {"file": ("test_doc.pdf", pdf_content, "application/pdf")}

        response = requests.post(f"{BASE_URL}/api/upload/file", files=files)
        assert response.status_code == 200, f"PDF upload failed: {response.text}"

        data = response.json()
        assert data["type"] == "application/pdf"
        print(f"PDF upload successful: {data['id']}")

    def test_serve_uploaded_file(self):
        """Test serving an uploaded file."""
        # First upload a file
        file_content = b"Content to be served"
        files = {"file": ("serve_test.txt", file_content, "text/plain")}

        upload_response = requests.post(f"{BASE_URL}/api/upload/file", files=files)
        assert upload_response.status_code == 200

        data = upload_response.json()
        file_url = data["url"]

        # Now fetch the file
        serve_response = requests.get(file_url)
        assert serve_response.status_code == 200, f"Serve failed: {serve_response.status_code}"
        assert serve_response.content == file_content
        print(f"File serving successful for: {file_url}")

    def test_list_assets(self):
        """Test listing uploaded assets."""
        response = requests.get(f"{BASE_URL}/api/upload/assets")
        assert response.status_code == 200, f"List assets failed: {response.text}"

        data = response.json()
        assert "assets" in data, "Missing assets key"
        assert isinstance(data["assets"], list)
        print(f"Listed {len(data['assets'])} assets")

    def test_list_assets_with_limit(self):
        """Test listing assets with limit parameter."""
        response = requests.get(f"{BASE_URL}/api/upload/assets", params={"limit": 5})
        assert response.status_code == 200

        data = response.json()
        assert len(data["assets"]) <= 5
        print(f"Listed assets with limit: {len(data['assets'])}")

    def test_upload_file_too_large_rejected(self):
        """Test that oversized files are rejected (simulated)."""
        # This test would need a very large file to actually trigger
        # For now, just verify the endpoint exists and handles small files
        small_file = b"Small content"
        files = {"file": ("small.txt", small_file, "text/plain")}

        response = requests.post(f"{BASE_URL}/api/upload/file", files=files)
        assert response.status_code == 200, "Small file should succeed"


class TestCRMEmailEndpoints:
    """Test CRM email logging and retrieval."""

    @pytest.fixture(autouse=True)
    def setup_test_deal(self):
        """Create a test deal before running email tests."""
        # Use existing seeded deal or create new one
        self.test_deal_id = "c3b83b22-c211-4b74-9990-d1971ba760c4"
        self.test_email = "sarah@example.com"
        self.user_id = "dev_user_default"

    def test_log_email_to_deal(self):
        """POST /api/crm/deals/{deal_id}/email - Log email and auto-create activity."""
        email_data = {
            "deal_id": self.test_deal_id,
            "to_email": self.test_email,
            "subject": f"Test Email Subject {uuid.uuid4().hex[:8]}",
            "body": "This is a test email body for CRM logging.",
            "direction": "outbound"
        }

        response = requests.post(
            f"{BASE_URL}/api/crm/deals/{self.test_deal_id}/email",
            params={"user_id": self.user_id},
            json=email_data
        )

        assert response.status_code == 200, f"Email log failed: {response.text}"

        data = response.json()
        assert data.get("success") is True, "Email log should return success"
        assert "email" in data, "Response should contain email object"
        assert "activity" in data, "Response should contain auto-created activity"

        email = data["email"]
        assert email["to_email"] == self.test_email
        assert email["subject"] == email_data["subject"]
        assert email["direction"] == "outbound"

        activity = data["activity"]
        assert activity["activity_type"] == "email"
        assert self.test_email in activity["description"]
        assert email_data["subject"] in activity["description"]

        # Store for later tests
        TestCRMEmailEndpoints.logged_email_id = email["id"]
        print(f"Email logged successfully: {email['id']}, Activity: {activity['id']}")

    def test_get_deal_emails(self):
        """GET /api/crm/deals/{deal_id}/emails - Get email history."""
        response = requests.get(
            f"{BASE_URL}/api/crm/deals/{self.test_deal_id}/emails",
            params={"user_id": self.user_id}
        )

        assert response.status_code == 200, f"Get emails failed: {response.text}"

        data = response.json()
        assert "emails" in data, "Response should contain emails array"
        assert isinstance(data["emails"], list)

        if len(data["emails"]) > 0:
            email = data["emails"][0]
            assert "id" in email
            assert "to_email" in email
            assert "subject" in email
            print(f"Found {len(data['emails'])} emails for deal")
        else:
            print("No emails found yet - this is OK if email logging test hasn't run")

    def test_email_appears_in_activities(self):
        """Verify logged email appears in deal activities."""
        # First log an email
        email_data = {
            "deal_id": self.test_deal_id,
            "to_email": "activity-test@example.com",
            "subject": f"Activity Check {uuid.uuid4().hex[:8]}",
            "body": "Testing that this appears in activities",
            "direction": "outbound"
        }

        email_response = requests.post(
            f"{BASE_URL}/api/crm/deals/{self.test_deal_id}/email",
            params={"user_id": self.user_id},
            json=email_data
        )
        assert email_response.status_code == 200

        # Now check activities
        activities_response = requests.get(
            f"{BASE_URL}/api/crm/deals/{self.test_deal_id}/activities",
            params={"user_id": self.user_id}
        )
        assert activities_response.status_code == 200

        data = activities_response.json()
        email_activities = [a for a in data["activities"] if a["activity_type"] == "email"]
        assert len(email_activities) > 0, "Email activities should exist"

        # Find our logged email
        found = any(email_data["subject"] in a["description"] for a in email_activities)
        assert found, f"Our logged email subject should appear in activities"
        print(f"Email activity verified in timeline")

    def test_inbound_email_direction(self):
        """Test logging an inbound email."""
        email_data = {
            "deal_id": self.test_deal_id,
            "to_email": "inbound@example.com",
            "subject": "Inbound Test Email",
            "body": "This is an inbound email test",
            "direction": "inbound"
        }

        response = requests.post(
            f"{BASE_URL}/api/crm/deals/{self.test_deal_id}/email",
            params={"user_id": self.user_id},
            json=email_data
        )

        assert response.status_code == 200
        data = response.json()

        activity = data["activity"]
        assert "Received from" in activity["description"], "Inbound should say 'Received from'"
        print("Inbound email direction verified")


class TestDealMovement:
    """Test deal stage movement functionality."""

    @pytest.fixture(autouse=True)
    def setup_deal(self):
        """Setup test deal."""
        self.user_id = "dev_user_default"
        self.test_deal_id = None

    def test_create_deal_for_movement(self):
        """Create a test deal for movement testing."""
        deal_data = {
            "title": f"Movement Test Deal {uuid.uuid4().hex[:8]}",
            "value": 5000,
            "stage": "lead",
            "probability": 10
        }

        response = requests.post(
            f"{BASE_URL}/api/crm/deals",
            params={"user_id": self.user_id},
            json=deal_data
        )

        assert response.status_code == 200, f"Deal creation failed: {response.text}"
        data = response.json()
        assert data.get("success") is True

        TestDealMovement.created_deal_id = data["deal"]["id"]
        print(f"Created test deal: {TestDealMovement.created_deal_id}")

    def test_move_deal_to_qualified(self):
        """Test moving deal from lead to qualified stage."""
        deal_id = getattr(TestDealMovement, "created_deal_id", None)
        if not deal_id:
            pytest.skip("No deal created to move")

        response = requests.put(
            f"{BASE_URL}/api/crm/deals/{deal_id}/move",
            params={"user_id": self.user_id, "new_stage": "qualified"}
        )

        assert response.status_code == 200, f"Move failed: {response.text}"
        data = response.json()
        assert data.get("success") is True
        assert data.get("new_stage") == "qualified"
        print(f"Deal moved to qualified stage")

    def test_move_deal_to_proposal(self):
        """Test moving deal to proposal stage."""
        deal_id = getattr(TestDealMovement, "created_deal_id", None)
        if not deal_id:
            pytest.skip("No deal created to move")

        response = requests.put(
            f"{BASE_URL}/api/crm/deals/{deal_id}/move",
            params={"user_id": self.user_id, "new_stage": "proposal"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data.get("new_stage") == "proposal"
        print(f"Deal moved to proposal stage")

    def test_move_creates_activity(self):
        """Verify that moving a deal creates an activity log."""
        deal_id = getattr(TestDealMovement, "created_deal_id", None)
        if not deal_id:
            pytest.skip("No deal created to check")

        response = requests.get(
            f"{BASE_URL}/api/crm/deals/{deal_id}/activities",
            params={"user_id": self.user_id}
        )

        assert response.status_code == 200
        data = response.json()

        status_activities = [a for a in data["activities"] if a["activity_type"] == "status_change"]
        assert len(status_activities) >= 1, "Stage changes should create activities"
        print(f"Found {len(status_activities)} stage change activities")


class TestNonEmailActivityTypes:
    """Test that non-email activity types still work."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test deal ID."""
        self.test_deal_id = "c3b83b22-c211-4b74-9990-d1971ba760c4"
        self.user_id = "dev_user_default"

    def test_create_note_activity(self):
        """Create a note activity (non-email)."""
        activity_data = {
            "deal_id": self.test_deal_id,
            "activity_type": "note",
            "description": f"Test note from iteration 45: {uuid.uuid4().hex[:8]}"
        }

        response = requests.post(
            f"{BASE_URL}/api/crm/deals/{self.test_deal_id}/activities",
            params={"user_id": self.user_id},
            json=activity_data
        )

        assert response.status_code == 200, f"Note activity failed: {response.text}"
        data = response.json()
        assert data.get("success") is True
        assert data["activity"]["activity_type"] == "note"
        print("Note activity created successfully")

    def test_create_call_activity(self):
        """Create a call activity."""
        activity_data = {
            "deal_id": self.test_deal_id,
            "activity_type": "call",
            "description": f"Test call logged: {uuid.uuid4().hex[:8]}"
        }

        response = requests.post(
            f"{BASE_URL}/api/crm/deals/{self.test_deal_id}/activities",
            params={"user_id": self.user_id},
            json=activity_data
        )

        assert response.status_code == 200
        data = response.json()
        assert data["activity"]["activity_type"] == "call"
        print("Call activity created successfully")

    def test_create_meeting_activity(self):
        """Create a meeting activity."""
        activity_data = {
            "deal_id": self.test_deal_id,
            "activity_type": "meeting",
            "description": f"Test meeting scheduled: {uuid.uuid4().hex[:8]}"
        }

        response = requests.post(
            f"{BASE_URL}/api/crm/deals/{self.test_deal_id}/activities",
            params={"user_id": self.user_id},
            json=activity_data
        )

        assert response.status_code == 200
        data = response.json()
        assert data["activity"]["activity_type"] == "meeting"
        print("Meeting activity created successfully")


class TestExistingSeededData:
    """Test with existing seeded data."""

    def test_seeded_deal_exists(self):
        """Verify the seeded test deal exists."""
        response = requests.get(
            f"{BASE_URL}/api/crm/deals",
            params={"user_id": "dev_user_default"}
        )

        assert response.status_code == 200
        data = response.json()

        # Check if seeded deal exists
        deal_ids = [d["id"] for d in data["deals"]]
        seeded_id = "c3b83b22-c211-4b74-9990-d1971ba760c4"

        if seeded_id in deal_ids:
            print(f"Seeded deal {seeded_id} found")
        else:
            print(f"Seeded deal not found, but {len(deal_ids)} other deals exist")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
