"""
Full Regression Test Suite for Core Truth House API
Tests: Core routes, workspaces, brand foundation, content, offers, systems, 
       launches, identity, media, billing, team management, and brand kit export.
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://os-workspace-test.preview.emergentagent.com')


@pytest.fixture(scope="session")
def api_client():
    """Shared requests session."""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="session")
def workspace_id(api_client):
    """Get default workspace ID for tests."""
    response = api_client.get(f"{BASE_URL}/api/workspaces")
    assert response.status_code == 200
    workspaces = response.json().get("workspaces", [])
    return workspaces[0]["id"] if workspaces else None


class TestHealthAndRoot:
    """Test root and health endpoints."""
    
    def test_root_endpoint(self, api_client):
        """GET /api/ - Returns API info."""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Core Truth House API"
        assert data["version"] == "1.0.0"
        print("PASS: GET /api/ returns correct API info")
    
    def test_health_endpoint(self, api_client):
        """GET /api/health - Returns detailed health."""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "database" in data
        assert "ai_configured" in data
        assert data["database"] == "connected"
        assert data["ai_configured"] == True
        print(f"PASS: GET /api/health returns healthy status with DB={data['database']}, AI={data['ai_configured']}")


class TestDashboard:
    """Test dashboard endpoint."""
    
    def test_get_dashboard(self, api_client):
        """GET /api/dashboard - Returns metrics and brand info."""
        response = api_client.get(f"{BASE_URL}/api/dashboard")
        assert response.status_code == 200
        data = response.json()
        assert "brand_name" in data
        assert "metrics" in data
        assert "modules" in data
        assert "foundation_score" in data["metrics"]
        print(f"PASS: GET /api/dashboard returns metrics (foundation_score={data['metrics']['foundation_score']})")


class TestWorkspaces:
    """Test workspace CRUD operations."""
    
    def test_get_workspaces(self, api_client):
        """GET /api/workspaces - Returns workspaces (creates default)."""
        response = api_client.get(f"{BASE_URL}/api/workspaces")
        assert response.status_code == 200
        data = response.json()
        assert "workspaces" in data
        assert len(data["workspaces"]) >= 1
        print(f"PASS: GET /api/workspaces returns {len(data['workspaces'])} workspaces")
    
    def test_create_workspace(self, api_client):
        """POST /api/workspaces - Creates workspace."""
        response = api_client.post(
            f"{BASE_URL}/api/workspaces",
            json={
                "name": "TEST_Workspace",
                "description": "Test workspace for regression testing",
                "brand_name": "Test Brand",
                "industry": "Technology"
            }
        )
        # Can be 200 or 403 if limit reached (FOUNDATION plan has 1 workspace limit)
        assert response.status_code in [200, 403]
        if response.status_code == 200:
            data = response.json()
            assert data["name"] == "TEST_Workspace"
            print(f"PASS: POST /api/workspaces created workspace with id={data['id']}")
        else:
            print("PASS: POST /api/workspaces correctly returns 403 (workspace limit reached)")
    
    def test_update_workspace(self, api_client, workspace_id):
        """PUT /api/workspaces/{id} - Updates workspace."""
        response = api_client.put(
            f"{BASE_URL}/api/workspaces/{workspace_id}",
            json={"description": "Updated description"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["description"] == "Updated description"
        print(f"PASS: PUT /api/workspaces/{workspace_id} updated successfully")
    
    def test_switch_workspace(self, api_client, workspace_id):
        """POST /api/workspaces/{id}/switch - Switches active workspace."""
        response = api_client.post(f"{BASE_URL}/api/workspaces/{workspace_id}/switch")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["active_workspace_id"] == workspace_id
        print(f"PASS: POST /api/workspaces/{workspace_id}/switch switched successfully")


class TestBrandFoundation:
    """Test brand foundation endpoints."""
    
    def test_get_brand_foundation(self, api_client):
        """GET /api/brand-foundation - Returns foundation data."""
        response = api_client.get(f"{BASE_URL}/api/brand-foundation")
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "user_id" in data
        assert "mission" in data
        print(f"PASS: GET /api/brand-foundation returns foundation data")
    
    def test_generate_foundation_field(self, api_client):
        """POST /api/brand-foundation/generate - AI generates content."""
        response = api_client.post(
            f"{BASE_URL}/api/brand-foundation/generate",
            json={
                "field": "tagline",
                "context": "A brand management SaaS platform for entrepreneurs"
            },
            timeout=90  # AI generation can be slow
        )
        assert response.status_code == 200
        data = response.json()
        assert "options" in data
        assert "field" in data
        assert len(data["options"]) > 0
        print(f"PASS: POST /api/brand-foundation/generate returns {len(data['options'])} options for tagline")


class TestContentStudio:
    """Test content generation endpoints."""
    
    def test_generate_content(self, api_client):
        """POST /api/content/generate - AI content generation."""
        response = api_client.post(
            f"{BASE_URL}/api/content/generate",
            json={
                "content_type": "tagline_ideas",
                "topic": "Brand Management Platform",
                "tone": "professional and inspiring"
            },
            timeout=90
        )
        assert response.status_code == 200
        data = response.json()
        assert "content" in data
        assert "content_type" in data
        print(f"PASS: POST /api/content/generate returns content for tagline_ideas")


class TestOffers:
    """Test offer CRUD endpoints."""
    
    def test_get_offers(self, api_client):
        """GET /api/offers - Lists offers."""
        response = api_client.get(f"{BASE_URL}/api/offers")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET /api/offers returns {len(data)} offers")
    
    def test_create_offer(self, api_client):
        """POST /api/offers - Creates offer."""
        response = api_client.post(
            f"{BASE_URL}/api/offers",
            json={
                "name": "TEST_Offer",
                "description": "Test offer description",
                "price": 99.00,
                "features": ["Feature 1", "Feature 2"],
                "target_audience": "Entrepreneurs"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "TEST_Offer"
        assert data["price"] == 99.00
        print(f"PASS: POST /api/offers created offer with id={data['id']}")
        return data["id"]


class TestSystems:
    """Test systems CRUD endpoints."""
    
    def test_get_systems(self, api_client):
        """GET /api/systems - Lists systems."""
        response = api_client.get(f"{BASE_URL}/api/systems")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET /api/systems returns {len(data)} systems")
    
    def test_create_system(self, api_client):
        """POST /api/systems - Creates system."""
        response = api_client.post(
            f"{BASE_URL}/api/systems",
            json={
                "name": "TEST_System",
                "description": "Test system description",
                "category": "Marketing",
                "steps": [{"step": 1, "title": "Step 1"}]
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "TEST_System"
        print(f"PASS: POST /api/systems created system with id={data['id']}")


class TestLaunches:
    """Test launch CRUD endpoints."""
    
    def test_get_launches(self, api_client):
        """GET /api/launches - Lists launches."""
        response = api_client.get(f"{BASE_URL}/api/launches")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"PASS: GET /api/launches returns {len(data)} launches")
    
    def test_create_launch(self, api_client):
        """POST /api/launches - Creates launch."""
        response = api_client.post(
            f"{BASE_URL}/api/launches",
            json={
                "name": "TEST_Launch",
                "description": "Test launch description",
                "launch_date": "2026-04-01",
                "status": "planning"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "TEST_Launch"
        print(f"PASS: POST /api/launches created launch with id={data['id']}")


class TestIdentity:
    """Test identity studio endpoints."""
    
    def test_get_identity(self, api_client):
        """GET /api/identity - Returns identity data."""
        response = api_client.get(f"{BASE_URL}/api/identity")
        assert response.status_code == 200
        data = response.json()
        assert "colors" in data
        assert "fonts" in data
        print(f"PASS: GET /api/identity returns identity with {len(data.get('colors', []))} colors")
    
    def test_save_identity(self, api_client):
        """POST /api/identity/save - Saves identity."""
        response = api_client.post(
            f"{BASE_URL}/api/identity/save",
            json={
                "colors": [{"name": "Primary", "hex": "#AF0024"}],
                "fonts": {"heading": "Playfair Display", "body": "Inter"}
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"PASS: POST /api/identity/save saved identity successfully")


class TestBilling:
    """Test billing endpoints."""
    
    def test_get_plans(self, api_client):
        """GET /api/billing/plans - Returns 4 plans."""
        response = api_client.get(f"{BASE_URL}/api/billing/plans")
        assert response.status_code == 200
        data = response.json()
        assert "plans" in data
        assert len(data["plans"]) == 4
        plan_ids = [p["id"] for p in data["plans"]]
        assert "FOUNDATION" in plan_ids
        assert "STRUCTURE" in plan_ids
        assert "HOUSE" in plan_ids
        assert "ESTATE" in plan_ids
        print(f"PASS: GET /api/billing/plans returns 4 plans: {plan_ids}")


class TestMedia:
    """Test media generation endpoints."""
    
    def test_get_media_gallery(self, api_client):
        """GET /api/media/gallery - Lists generated media."""
        response = api_client.get(f"{BASE_URL}/api/media/gallery")
        assert response.status_code == 200
        data = response.json()
        assert "media" in data
        print(f"PASS: GET /api/media/gallery returns {len(data['media'])} media items")
    
    def test_gallery_filter_by_type(self, api_client):
        """GET /api/media/gallery?media_type=image - Filters by type."""
        response = api_client.get(f"{BASE_URL}/api/media/gallery?media_type=image")
        assert response.status_code == 200
        data = response.json()
        # All items should be images
        for item in data.get("media", []):
            assert item["media_type"] == "image"
        print(f"PASS: GET /api/media/gallery?media_type=image filters correctly")
    
    @pytest.mark.slow
    def test_generate_image(self, api_client):
        """POST /api/media/generate-image - Generates image with GPT Image 1."""
        response = api_client.post(
            f"{BASE_URL}/api/media/generate-image",
            json={
                "prompt": "A minimalist logo icon, simple geometric shape, dark background",
                "style": "minimalist"
            },
            timeout=120
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "image_url" in data
        assert "image_base64" in data
        print(f"PASS: POST /api/media/generate-image generated image at {data['image_url']}")
    
    def test_generate_video_starts_job(self, api_client):
        """POST /api/media/generate-video - Starts video generation job."""
        response = api_client.post(
            f"{BASE_URL}/api/media/generate-video",
            json={
                "prompt": "A simple animated logo reveal",
                "size": "1280x720",
                "duration": 4
            },
            timeout=30
        )
        assert response.status_code == 200
        data = response.json()
        assert "job_id" in data
        assert data["status"] == "processing"
        print(f"PASS: POST /api/media/generate-video started job {data['job_id']}")
        return data["job_id"]
    
    def test_video_invalid_size(self, api_client):
        """POST /api/media/generate-video - Rejects invalid size."""
        response = api_client.post(
            f"{BASE_URL}/api/media/generate-video",
            json={
                "prompt": "Test",
                "size": "invalid_size",
                "duration": 4
            }
        )
        assert response.status_code == 400
        print(f"PASS: POST /api/media/generate-video rejects invalid size with 400")
    
    def test_video_invalid_duration(self, api_client):
        """POST /api/media/generate-video - Rejects invalid duration."""
        response = api_client.post(
            f"{BASE_URL}/api/media/generate-video",
            json={
                "prompt": "Test",
                "size": "1280x720",
                "duration": 5  # Invalid (must be 4, 8, or 12)
            }
        )
        assert response.status_code == 400
        print(f"PASS: POST /api/media/generate-video rejects invalid duration with 400")


class TestTeamManagement:
    """Test team management endpoints."""
    
    def test_get_team_members(self, api_client, workspace_id):
        """GET /api/teams/{workspace_id}/members - Lists team members."""
        response = api_client.get(f"{BASE_URL}/api/teams/{workspace_id}/members")
        assert response.status_code == 200
        data = response.json()
        assert "members" in data
        print(f"PASS: GET /api/teams/{workspace_id}/members returns {len(data['members'])} members")
    
    def test_invite_team_member(self, api_client, workspace_id):
        """POST /api/teams/{workspace_id}/invite - Invites a team member."""
        test_email = f"test_invite_{int(time.time())}@example.com"
        response = api_client.post(
            f"{BASE_URL}/api/teams/{workspace_id}/invite",
            json={
                "email": test_email,
                "name": "Test Invitee",
                "role": "member"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "member" in data
        assert data["member"]["email"] == test_email
        assert data["member"]["status"] == "pending"
        assert "invite_token" in data["member"]
        print(f"PASS: POST /api/teams/{workspace_id}/invite created invite for {test_email}")
        return data["member"]["id"], data["member"]["invite_token"]
    
    def test_invite_duplicate_rejected(self, api_client, workspace_id):
        """POST /api/teams/{workspace_id}/invite - Rejects duplicate invite."""
        # First invite
        response1 = api_client.post(
            f"{BASE_URL}/api/teams/{workspace_id}/invite",
            json={"email": "dup_test@example.com", "name": "Dup Test"}
        )
        # Second invite to same email should fail
        response2 = api_client.post(
            f"{BASE_URL}/api/teams/{workspace_id}/invite",
            json={"email": "dup_test@example.com", "name": "Dup Test"}
        )
        assert response2.status_code == 400
        print(f"PASS: POST /api/teams/{workspace_id}/invite rejects duplicate invite")
    
    def test_accept_invite(self, api_client, workspace_id):
        """POST /api/teams/accept-invite - Accepts invitation by token."""
        # Create a fresh invite
        test_email = f"accept_test_{int(time.time())}@example.com"
        invite_response = api_client.post(
            f"{BASE_URL}/api/teams/{workspace_id}/invite",
            json={"email": test_email, "name": "Accept Test"}
        )
        assert invite_response.status_code == 200
        token = invite_response.json()["member"]["invite_token"]
        
        # Accept the invite
        response = api_client.post(
            f"{BASE_URL}/api/teams/accept-invite?token={token}&user_id=test_user_123"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["workspace_id"] == workspace_id
        print(f"PASS: POST /api/teams/accept-invite accepted invite successfully")
    
    def test_remove_member(self, api_client, workspace_id):
        """DELETE /api/teams/{workspace_id}/members/{id} - Removes non-owner member."""
        # Create a new invite and accept it
        test_email = f"remove_test_{int(time.time())}@example.com"
        invite_response = api_client.post(
            f"{BASE_URL}/api/teams/{workspace_id}/invite",
            json={"email": test_email, "name": "Remove Test", "role": "member"}
        )
        member_id = invite_response.json()["member"]["id"]
        
        # Remove the member
        response = api_client.delete(f"{BASE_URL}/api/teams/{workspace_id}/members/{member_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"PASS: DELETE /api/teams/{workspace_id}/members/{member_id} removed member")


class TestBrandKitExport:
    """Test brand kit export endpoints."""
    
    def test_export_brand_kit(self, api_client):
        """POST /api/export/brand-kit - Exports ZIP with PDF + assets + JSON."""
        response = api_client.post(f"{BASE_URL}/api/export/brand-kit")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "download_url" in data
        assert "filename" in data
        assert data["filename"].endswith(".zip")
        assert data["file_size"] > 0
        print(f"PASS: POST /api/export/brand-kit created {data['filename']} ({data['file_size']} bytes)")
        return data["download_url"], data["filename"]
    
    def test_download_export_file(self, api_client):
        """GET /api/export/download/{filename} - Downloads exported file."""
        # First create an export
        export_response = api_client.post(f"{BASE_URL}/api/export/brand-kit")
        download_url = export_response.json()["download_url"]
        
        # Then download it
        response = api_client.get(f"{BASE_URL}{download_url}")
        assert response.status_code == 200
        assert response.headers["Content-Type"] == "application/zip"
        assert int(response.headers["Content-Length"]) > 0
        print(f"PASS: GET {download_url} downloads file successfully")
    
    def test_download_nonexistent_file(self, api_client):
        """GET /api/export/download/{filename} - Returns 404 for missing file."""
        response = api_client.get(f"{BASE_URL}/api/export/download/nonexistent_file.zip")
        assert response.status_code == 404
        print(f"PASS: GET /api/export/download/nonexistent returns 404")


class TestCleanup:
    """Cleanup test data."""
    
    @pytest.fixture(autouse=True, scope="class")
    def cleanup_test_data(self, api_client, workspace_id):
        """Cleanup TEST_ prefixed data after tests."""
        yield
        # Cleanup offers with TEST_ prefix
        offers = api_client.get(f"{BASE_URL}/api/offers").json()
        for offer in offers:
            if offer.get("name", "").startswith("TEST_"):
                api_client.delete(f"{BASE_URL}/api/offers/{offer['id']}")
        
        # Cleanup systems
        systems = api_client.get(f"{BASE_URL}/api/systems").json()
        for system in systems:
            if system.get("name", "").startswith("TEST_"):
                api_client.delete(f"{BASE_URL}/api/systems/{system['id']}")
        
        # Cleanup launches
        launches = api_client.get(f"{BASE_URL}/api/launches").json()
        for launch in launches:
            if launch.get("name", "").startswith("TEST_"):
                api_client.delete(f"{BASE_URL}/api/launches/{launch['id']}")
        
        print("Cleaned up TEST_ prefixed data")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
