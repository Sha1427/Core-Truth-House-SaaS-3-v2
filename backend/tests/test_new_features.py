"""
Tests for Core Truth House Brand OS - Multi-tenant Workspace, AI Content Generation, Media Studio
Testing: Workspace APIs, Brand Foundation AI, Content Generation AI, Media Generation (Image/Video)
"""
import pytest
import requests
import os
import time
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://os-workspace-test.preview.emergentagent.com').rstrip('/')
API_URL = f"{BASE_URL}/api"

# Test prefix for cleanup
TEST_PREFIX = f"TEST_{uuid.uuid4().hex[:8]}"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session."""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestRootEndpoint:
    """Test root API health check"""
    
    def test_api_root(self, api_client):
        """GET /api/ returns correct version"""
        response = api_client.get(f"{API_URL}/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Core Truth House API"
        assert "version" in data


class TestWorkspaceAPIs:
    """Multi-tenant Workspace API Tests"""
    
    def test_get_workspaces_creates_default(self, api_client):
        """GET /api/workspaces returns workspaces (creates default if none exist)"""
        response = api_client.get(f"{API_URL}/workspaces")
        assert response.status_code == 200
        data = response.json()
        assert "workspaces" in data
        assert len(data["workspaces"]) >= 1
        # Should have at least one default workspace
        workspaces = data["workspaces"]
        assert any(ws.get("is_default") or ws.get("name") == "My Brand" for ws in workspaces)
    
    def test_create_workspace(self, api_client):
        """POST /api/workspaces creates a new workspace"""
        payload = {
            "name": f"{TEST_PREFIX}_TestWorkspace",
            "description": "Test workspace",
            "brand_name": "Test Brand",
            "industry": "Technology",
            "color_primary": "#FF5733"
        }
        response = api_client.post(f"{API_URL}/workspaces", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == payload["name"]
        assert data["brand_name"] == payload["brand_name"]
        assert data["industry"] == payload["industry"]
        assert "id" in data
        
        # Store for later tests
        TestWorkspaceAPIs.created_workspace_id = data["id"]
    
    def test_update_workspace(self, api_client):
        """PUT /api/workspaces/{id} updates a workspace"""
        if not hasattr(TestWorkspaceAPIs, 'created_workspace_id'):
            pytest.skip("No workspace created in previous test")
        
        workspace_id = TestWorkspaceAPIs.created_workspace_id
        update_payload = {
            "name": f"{TEST_PREFIX}_UpdatedWorkspace",
            "description": "Updated description"
        }
        response = api_client.put(f"{API_URL}/workspaces/{workspace_id}", json=update_payload)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == update_payload["name"]
        assert data["description"] == update_payload["description"]
    
    def test_switch_workspace(self, api_client):
        """POST /api/workspaces/{id}/switch switches active workspace"""
        if not hasattr(TestWorkspaceAPIs, 'created_workspace_id'):
            pytest.skip("No workspace created in previous test")
        
        workspace_id = TestWorkspaceAPIs.created_workspace_id
        response = api_client.post(f"{API_URL}/workspaces/{workspace_id}/switch")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["active_workspace_id"] == workspace_id
    
    def test_delete_workspace(self, api_client):
        """DELETE /api/workspaces/{id} deletes non-default workspace"""
        if not hasattr(TestWorkspaceAPIs, 'created_workspace_id'):
            pytest.skip("No workspace created in previous test")
        
        workspace_id = TestWorkspaceAPIs.created_workspace_id
        response = api_client.delete(f"{API_URL}/workspaces/{workspace_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        
        # Verify it's deleted
        get_response = api_client.get(f"{API_URL}/workspaces/{workspace_id}")
        assert get_response.status_code == 404


class TestBrandFoundationGenerate:
    """AI-powered Brand Foundation Generation Tests (Uses Claude via Emergent LLM Key)"""
    
    def test_generate_tagline(self, api_client):
        """POST /api/brand-foundation/generate returns AI-generated tagline options (not mocked)"""
        payload = {
            "field": "tagline",
            "context": "A tech startup helping small businesses automate their operations"
        }
        # Allow longer timeout for AI generation
        response = api_client.post(f"{API_URL}/brand-foundation/generate", json=payload, timeout=90)
        assert response.status_code == 200
        data = response.json()
        assert data["field"] == "tagline"
        assert "options" in data
        assert len(data["options"]) >= 1
        # Verify it's actual content (not empty)
        assert any(len(opt.strip()) > 5 for opt in data["options"])
        print(f"Generated tagline options: {data['options'][:2]}")
    
    def test_generate_invalid_field(self, api_client):
        """POST /api/brand-foundation/generate rejects invalid field"""
        payload = {
            "field": "invalid_field",
            "context": "Test context"
        }
        response = api_client.post(f"{API_URL}/brand-foundation/generate", json=payload)
        assert response.status_code == 400


class TestContentGenerate:
    """AI Content Generation Tests (Uses Claude via Emergent LLM Key)"""
    
    def test_generate_tagline_ideas(self, api_client):
        """POST /api/content/generate returns AI-generated content for tagline_ideas"""
        payload = {
            "content_type": "tagline_ideas",
            "topic": "Sustainable fashion brand for millennials",
            "tone": "modern and eco-conscious"
        }
        response = api_client.post(f"{API_URL}/content/generate", json=payload, timeout=90)
        assert response.status_code == 200
        data = response.json()
        assert "content" in data
        assert data["content_type"] == "tagline_ideas"
        # Verify actual content
        assert len(data["content"]) > 20
        print(f"Generated content preview: {data['content'][:200]}")


class TestMediaGenerateImage:
    """Media Studio Image Generation Tests (Uses GPT Image 1)"""
    
    def test_generate_image(self, api_client):
        """POST /api/media/generate-image generates an image and returns image_url and image_base64"""
        payload = {
            "prompt": "A minimalist logo design for a technology company, abstract geometric shapes, dark background",
            "style": "professional"
        }
        # Image generation takes 30-90 seconds
        response = api_client.post(f"{API_URL}/media/generate-image", json=payload, timeout=120)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert data.get("success") == True
        assert "image_url" in data
        assert "image_base64" in data
        assert "media_id" in data
        
        # Verify image_url is valid path
        assert data["image_url"].startswith("/api/assets/file/")
        
        # Verify base64 data exists and is substantial
        assert len(data["image_base64"]) > 1000
        
        # Store for gallery test
        TestMediaGenerateImage.generated_media_id = data["media_id"]
        print(f"Image generated successfully: {data['image_url']}")


class TestMediaGenerateVideo:
    """Media Studio Video Generation Tests (Uses Sora 2 - async with polling)"""
    
    def test_generate_video_starts_job(self, api_client):
        """POST /api/media/generate-video starts a video job and returns job_id with status 'processing'"""
        payload = {
            "prompt": "A smooth animated brand intro with flowing particles, professional look",
            "size": "1280x720",
            "duration": 4
        }
        response = api_client.post(f"{API_URL}/media/generate-video", json=payload, timeout=30)
        assert response.status_code == 200
        data = response.json()
        
        # Verify job started
        assert "job_id" in data
        assert data["status"] == "processing"
        
        # Store job_id for status check
        TestMediaGenerateVideo.video_job_id = data["job_id"]
        print(f"Video job started: {data['job_id']}")
    
    def test_video_status_check(self, api_client):
        """GET /api/media/video-status/{job_id} returns current status of video generation"""
        if not hasattr(TestMediaGenerateVideo, 'video_job_id'):
            pytest.skip("No video job created in previous test")
        
        job_id = TestMediaGenerateVideo.video_job_id
        response = api_client.get(f"{API_URL}/media/video-status/{job_id}")
        assert response.status_code == 200
        data = response.json()
        
        # Status should be one of: processing, complete, failed
        assert data["status"] in ["processing", "complete", "failed"]
        print(f"Video job status: {data['status']}")
    
    def test_video_status_invalid_job(self, api_client):
        """GET /api/media/video-status/{invalid_job_id} returns 404"""
        response = api_client.get(f"{API_URL}/media/video-status/invalid-job-id-12345")
        assert response.status_code == 404
    
    def test_video_invalid_size(self, api_client):
        """POST /api/media/generate-video rejects invalid size"""
        payload = {
            "prompt": "Test video",
            "size": "invalid_size",
            "duration": 4
        }
        response = api_client.post(f"{API_URL}/media/generate-video", json=payload)
        assert response.status_code == 400
    
    def test_video_invalid_duration(self, api_client):
        """POST /api/media/generate-video rejects invalid duration"""
        payload = {
            "prompt": "Test video",
            "size": "1280x720",
            "duration": 99
        }
        response = api_client.post(f"{API_URL}/media/generate-video", json=payload)
        assert response.status_code == 400


class TestMediaGallery:
    """Media Gallery API Tests"""
    
    def test_get_gallery(self, api_client):
        """GET /api/media/gallery returns generated media items"""
        response = api_client.get(f"{API_URL}/media/gallery")
        assert response.status_code == 200
        data = response.json()
        assert "media" in data
        assert isinstance(data["media"], list)
        
        # If we have generated media, verify structure
        if len(data["media"]) > 0:
            item = data["media"][0]
            assert "id" in item
            assert "media_type" in item
            assert "prompt" in item
            assert "file_url" in item
            print(f"Gallery has {len(data['media'])} items")
    
    def test_get_gallery_filter_image(self, api_client):
        """GET /api/media/gallery?media_type=image filters by type"""
        response = api_client.get(f"{API_URL}/media/gallery?media_type=image")
        assert response.status_code == 200
        data = response.json()
        assert "media" in data
        # If there are items, they should all be images
        for item in data["media"]:
            assert item["media_type"] == "image"
    
    def test_get_gallery_filter_video(self, api_client):
        """GET /api/media/gallery?media_type=video filters by type"""
        response = api_client.get(f"{API_URL}/media/gallery?media_type=video")
        assert response.status_code == 200
        data = response.json()
        assert "media" in data
        # If there are items, they should all be videos
        for item in data["media"]:
            assert item["media_type"] == "video"


class TestDashboard:
    """Dashboard API Tests"""
    
    def test_get_dashboard(self, api_client):
        """GET /api/dashboard returns dashboard metrics"""
        response = api_client.get(f"{API_URL}/dashboard")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "brand_name" in data
        assert "metrics" in data
        assert "modules" in data
        
        # Verify metrics
        metrics = data["metrics"]
        assert "foundation_score" in metrics
        assert "offers_created" in metrics
        assert "systems_built" in metrics
        assert "content_generated" in metrics
        
        # Verify modules
        modules = data["modules"]
        assert "brand_foundation" in modules
        assert "content_studio" in modules


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
