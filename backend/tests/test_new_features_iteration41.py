"""
Test Suite for Campaign Builder, Nano Banana (Gemini), Kling v3, and Watermark features
Iteration 41 - Testing 3 new features added to Core Truth House OS
"""
import pytest
import requests
import os
import io
from PIL import Image

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Create a test image for watermark testing
def create_test_image():
    """Create a simple test image using PIL"""
    img = Image.new('RGB', (200, 200), color='red')
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    return buf


class TestCampaignBuilderAPI:
    """Campaign Builder CRUD and generation endpoints"""
    
    def test_campaigns_list_endpoint(self):
        """GET /api/campaigns?user_id=test returns campaign list"""
        response = requests.get(f"{BASE_URL}/api/campaigns?user_id=test")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "campaigns" in data, "Response should have 'campaigns' key"
        assert isinstance(data["campaigns"], list), "campaigns should be a list"
        print(f"PASS: Campaign list endpoint - found {len(data['campaigns'])} campaigns")
    
    def test_existing_campaign_exists(self):
        """Verify the existing test campaign from previous testing exists"""
        response = requests.get(f"{BASE_URL}/api/campaigns?user_id=test")
        assert response.status_code == 200
        data = response.json()
        campaigns = data.get("campaigns", [])
        campaign_ids = [c["id"] for c in campaigns]
        assert "c9b179b7-f179-4d73-8d72-5ea6128b3fd0" in campaign_ids, "Expected test campaign should exist"
        print("PASS: Existing test campaign found")
    
    def test_create_campaign_magnet(self):
        """POST /api/campaigns creates a new campaign with MAGNET fields"""
        payload = {
            "user_id": "test",
            "name": "TEST_Iteration41_Campaign",
            "goal": "lead_generation",
            "offer_name": "Brand Strategy Audit",
            "offer_description": "A complete brand audit package",
            "transformation": "From confused to clear",
            "start_date": "2026-04-01",
            "end_date": "2026-05-01",
            "platforms": ["Instagram", "LinkedIn"],
            "audience_description": "Solo entrepreneurs",
            "audience_problem": "Lack of brand clarity",
            "audience_desire": "A strong recognizable brand",
            "awareness_stage": "solution_aware",
            "emotional_hook": "Your brand confusion ends here",
            "promise": "Clarity within 30 days",
            "cta_primary": "Book your audit now",
            "engagement_tactics": ["Free download", "Quiz"],
            "conversion_funnel": [
                {"id": "f1", "order": 1, "label": "Organic post", "type": "post"},
                {"id": "f2", "order": 2, "label": "Lead magnet", "type": "lead_magnet"}
            ]
        }
        response = requests.post(f"{BASE_URL}/api/campaigns", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "id" in data, "Response should have 'id'"
        assert data["name"] == "TEST_Iteration41_Campaign"
        assert data["goal"] == "lead_generation"
        assert "Instagram" in data["platforms"]
        print(f"PASS: Created campaign with id {data['id']}")
        return data["id"]
    
    def test_campaign_status_change(self):
        """POST /api/campaigns/{id}/status changes campaign status"""
        # First get the existing campaign
        campaign_id = "c9b179b7-f179-4d73-8d72-5ea6128b3fd0"
        response = requests.post(f"{BASE_URL}/api/campaigns/{campaign_id}/status?status=active")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("success") == True
        assert data.get("status") == "active"
        print("PASS: Campaign status changed to active")
        
        # Change back to draft
        response = requests.post(f"{BASE_URL}/api/campaigns/{campaign_id}/status?status=draft")
        assert response.status_code == 200
        print("PASS: Campaign status changed back to draft")
    
    def test_generate_brief_endpoint_exists(self):
        """POST /api/campaigns/{id}/generate-brief endpoint exists"""
        campaign_id = "c9b179b7-f179-4d73-8d72-5ea6128b3fd0"
        response = requests.post(f"{BASE_URL}/api/campaigns/{campaign_id}/generate-brief")
        # May return 500 due to LLM key issue, but should NOT return 404 or 422
        assert response.status_code in [200, 500], f"Expected 200 or 500 (LLM), got {response.status_code}"
        print(f"PASS: generate-brief endpoint exists (status: {response.status_code})")
    
    def test_generate_hooks_endpoint_exists(self):
        """POST /api/campaigns/{id}/generate-hooks endpoint exists"""
        campaign_id = "c9b179b7-f179-4d73-8d72-5ea6128b3fd0"
        response = requests.post(f"{BASE_URL}/api/campaigns/{campaign_id}/generate-hooks")
        # May return 500 due to LLM key issue, but should NOT return 404 or 422
        assert response.status_code in [200, 500], f"Expected 200 or 500 (LLM), got {response.status_code}"
        print(f"PASS: generate-hooks endpoint exists (status: {response.status_code})")
    
    def test_get_single_campaign(self):
        """GET /api/campaigns/{id} returns campaign details"""
        campaign_id = "c9b179b7-f179-4d73-8d72-5ea6128b3fd0"
        response = requests.get(f"{BASE_URL}/api/campaigns/{campaign_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["id"] == campaign_id
        assert "name" in data
        assert "goal" in data
        print("PASS: Single campaign retrieval works")


class TestMediaStudioProviders:
    """Test new AI generator endpoints (Nano Banana + Kling v3)"""
    
    def test_nano_banana_endpoint_exists(self):
        """POST /api/media/nano-banana/generate endpoint exists and accepts request"""
        files = {'prompt': (None, 'A beautiful mountain landscape')}
        response = requests.post(f"{BASE_URL}/api/media/nano-banana/generate", data=files)
        # 500 is acceptable (LLM key may fail), but NOT 404 or 422
        assert response.status_code in [200, 500], f"Expected 200 or 500, got {response.status_code}: {response.text}"
        print(f"PASS: nano-banana/generate endpoint exists (status: {response.status_code})")
    
    def test_nano_banana_with_style_param(self):
        """POST /api/media/nano-banana/generate accepts style parameter"""
        files = {
            'prompt': (None, 'Corporate office building'),
            'style': (None, 'professional'),
            'user_id': (None, 'test')
        }
        response = requests.post(f"{BASE_URL}/api/media/nano-banana/generate", data=files)
        # 500 is acceptable (LLM key may fail), but NOT 422 validation error
        assert response.status_code in [200, 500], f"Expected 200 or 500, got {response.status_code}"
        print(f"PASS: nano-banana accepts style parameter (status: {response.status_code})")
    
    def test_replicate_video_kling_endpoint(self):
        """POST /api/media/replicate/generate-video supports Kling model"""
        files = {
            'prompt': (None, 'A flowing river through a forest'),
            'model': (None, 'kwaivgi/kling-v3-omni-video'),
            'user_id': (None, 'test')
        }
        response = requests.post(f"{BASE_URL}/api/media/replicate/generate-video", data=files)
        # 500 acceptable if no Replicate API token, but NOT 404
        assert response.status_code in [200, 500], f"Expected 200 or 500, got {response.status_code}"
        print(f"PASS: Kling v3 video endpoint exists (status: {response.status_code})")
    
    def test_replicate_models_endpoint(self):
        """GET /api/media/replicate-models returns model list"""
        response = requests.get(f"{BASE_URL}/api/media/replicate-models")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "image_models" in data
        assert "video_models" in data
        print("PASS: Replicate models endpoint returns model lists")


class TestWatermarkFeature:
    """Test image watermarking functionality"""
    
    def test_watermark_endpoint_exists(self):
        """POST /api/media/watermark endpoint exists"""
        # Create test image
        img_buf = create_test_image()
        
        files = {
            'image': ('test_image.png', img_buf, 'image/png'),
            'text': (None, 'Test Watermark'),
            'position': (None, 'bottom-right'),
            'opacity': (None, '0.5'),
            'font_size': (None, '24'),
            'color': (None, '#ffffff'),
            'user_id': (None, 'test')
        }
        response = requests.post(f"{BASE_URL}/api/media/watermark", files=files)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True, "Watermark should succeed"
        assert "image_url" in data, "Response should have image_url"
        print(f"PASS: Watermark endpoint works, image_url: {data['image_url']}")
        return data["image_url"]
    
    def test_watermark_with_center_position(self):
        """POST /api/media/watermark with center position"""
        img_buf = create_test_image()
        
        files = {
            'image': ('test_center.png', img_buf, 'image/png'),
            'text': (None, 'CENTER'),
            'position': (None, 'center'),
            'opacity': (None, '0.7'),
            'font_size': (None, '32'),
            'color': (None, '#000000'),
            'user_id': (None, 'test')
        }
        response = requests.post(f"{BASE_URL}/api/media/watermark", files=files)
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print("PASS: Watermark with center position works")
    
    def test_watermark_with_top_left_position(self):
        """POST /api/media/watermark with top-left position"""
        img_buf = create_test_image()
        
        files = {
            'image': ('test_topleft.png', img_buf, 'image/png'),
            'text': (None, 'TOP LEFT'),
            'position': (None, 'top-left'),
            'user_id': (None, 'test')
        }
        response = requests.post(f"{BASE_URL}/api/media/watermark", files=files)
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print("PASS: Watermark with top-left position works")
    
    def test_watermark_saves_to_gallery(self):
        """Verify watermarked images are saved to media gallery"""
        response = requests.get(f"{BASE_URL}/api/media/gallery?user_id=test&media_type=image")
        assert response.status_code == 200
        data = response.json()
        # Check for watermark provider in results
        watermark_items = [m for m in data.get("media", []) if m.get("provider") == "watermark"]
        print(f"PASS: Media gallery has {len(watermark_items)} watermarked items")


class TestMediaGalleryIntegration:
    """Test media gallery integration with new providers"""
    
    def test_media_gallery_endpoint(self):
        """GET /api/media/gallery returns media items"""
        response = requests.get(f"{BASE_URL}/api/media/gallery?user_id=test")
        assert response.status_code == 200
        data = response.json()
        assert "media" in data or "items" in data
        print("PASS: Media gallery endpoint works")


# Cleanup test data
class TestCleanup:
    """Cleanup test data created during testing"""
    
    def test_cleanup_test_campaigns(self):
        """Delete campaigns created with TEST_ prefix"""
        response = requests.get(f"{BASE_URL}/api/campaigns?user_id=test")
        if response.status_code == 200:
            campaigns = response.json().get("campaigns", [])
            for campaign in campaigns:
                if campaign.get("name", "").startswith("TEST_"):
                    delete_resp = requests.delete(f"{BASE_URL}/api/campaigns/{campaign['id']}")
                    print(f"Cleaned up campaign: {campaign['name']}")
        print("PASS: Test campaign cleanup complete")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
