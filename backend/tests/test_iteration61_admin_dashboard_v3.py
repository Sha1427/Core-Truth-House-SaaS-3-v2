"""
Iteration 61: Super Admin Dashboard v3 Redesign - Backend API Tests

Tests all 12 panels and their backend endpoints:
- Overview, Analytics, Tenants (with edit), Messages, Tenant API Keys
- Add-on Requests, My API Keys, AI Model, Preloaded Prompts (with Hub toggle)
- Media Prompt Engine, Training Videos, Affiliate Links
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_ID = "default"


class TestOverviewPanel:
    """Tests for Overview panel - KPIs, revenue, system status, tenant health"""
    
    def test_overview_endpoint_returns_200(self):
        """GET /api/admin/overview returns 200"""
        response = requests.get(f"{BASE_URL}/api/admin/overview?admin_id={ADMIN_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: Overview endpoint returns 200")
    
    def test_overview_has_kpis(self):
        """Overview response has KPIs structure"""
        response = requests.get(f"{BASE_URL}/api/admin/overview?admin_id={ADMIN_ID}")
        data = response.json()
        assert "kpis" in data, "Missing kpis in response"
        kpis = data["kpis"]
        assert "totalUsers" in kpis
        assert "totalWorkspaces" in kpis
        assert "mrr" in kpis
        assert "aiGenerationsMTD" in kpis
        assert "avgRevenuePerUser" in kpis
        print("PASS: Overview has KPIs structure")
    
    def test_overview_has_plan_distribution(self):
        """Overview has planDistribution for revenue by plan"""
        response = requests.get(f"{BASE_URL}/api/admin/overview?admin_id={ADMIN_ID}")
        data = response.json()
        assert "planDistribution" in data, "Missing planDistribution"
        assert isinstance(data["planDistribution"], list)
        print("PASS: Overview has planDistribution")
    
    def test_overview_has_system_status(self):
        """Overview has systemStatus array"""
        response = requests.get(f"{BASE_URL}/api/admin/overview?admin_id={ADMIN_ID}")
        data = response.json()
        assert "systemStatus" in data, "Missing systemStatus"
        assert isinstance(data["systemStatus"], list)
        assert len(data["systemStatus"]) >= 5  # API, DB, AI, Email, Storage, Stripe
        print("PASS: Overview has systemStatus")
    
    def test_overview_has_tenant_health(self):
        """Overview has tenantHealth with active/atRisk/inactive/churned"""
        response = requests.get(f"{BASE_URL}/api/admin/overview?admin_id={ADMIN_ID}")
        data = response.json()
        assert "tenantHealth" in data, "Missing tenantHealth"
        th = data["tenantHealth"]
        assert "active" in th
        assert "atRisk" in th
        assert "inactive" in th
        assert "churned" in th
        print("PASS: Overview has tenantHealth structure")


class TestTenantsPanel:
    """Tests for Tenants panel - list and edit modal"""
    
    def test_list_tenants_returns_200(self):
        """GET /api/admin/tenants returns tenant list"""
        response = requests.get(f"{BASE_URL}/api/admin/tenants?admin_id={ADMIN_ID}")
        assert response.status_code == 200
        data = response.json()
        assert "tenants" in data
        assert "total" in data
        print(f"PASS: List tenants returns {data['total']} tenants")
    
    def test_tenant_has_metadata_fields(self):
        """Each tenant has required metadata fields"""
        response = requests.get(f"{BASE_URL}/api/admin/tenants?admin_id={ADMIN_ID}")
        data = response.json()
        if data["tenants"]:
            tenant = data["tenants"][0]
            # Check safe metadata fields are present
            for field in ["name", "plan", "team_size", "content_count", "journey_pct"]:
                assert field in tenant, f"Missing field: {field}"
            print("PASS: Tenant has all required metadata fields")
        else:
            print("SKIP: No tenants to test metadata")
    
    def test_patch_tenant_updates_metadata(self):
        """PATCH /api/admin/tenants/{id} updates tenant metadata"""
        # First get a tenant
        response = requests.get(f"{BASE_URL}/api/admin/tenants?admin_id={ADMIN_ID}")
        tenants = response.json().get("tenants", [])
        if not tenants:
            pytest.skip("No tenants to test")
        
        tenant = tenants[0]
        ws_id = tenant.get("id") or tenant.get("workspace_id")
        
        # PATCH the tenant
        update_data = {"name": tenant.get("name", "Test"), "notes": "Admin note test"}
        response = requests.patch(
            f"{BASE_URL}/api/admin/tenants/{ws_id}?admin_id={ADMIN_ID}",
            json=update_data
        )
        assert response.status_code == 200, f"PATCH failed: {response.text}"
        assert response.json().get("success") == True
        print("PASS: PATCH tenant updates metadata")


class TestMessagesPanel:
    """Tests for Messages panel - compose platform messages"""
    
    def test_post_platform_message_returns_200(self):
        """POST /api/admin/platform-messages sends message"""
        message_data = {
            "target": "all",
            "subject": f"Test Message {uuid.uuid4().hex[:8]}",
            "body": "This is a test platform message.",
            "type": "info"
        }
        response = requests.post(
            f"{BASE_URL}/api/admin/platform-messages?admin_id={ADMIN_ID}",
            json=message_data
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "message" in data
        assert "recipients" in data
        print(f"PASS: Platform message sent to {data['recipients']} recipients")
    
    def test_platform_message_validates_required_fields(self):
        """POST /api/admin/platform-messages requires subject and body"""
        message_data = {"target": "all", "subject": "", "body": ""}
        response = requests.post(
            f"{BASE_URL}/api/admin/platform-messages?admin_id={ADMIN_ID}",
            json=message_data
        )
        assert response.status_code == 400, "Should reject empty subject/body"
        print("PASS: Platform message validates required fields")
    
    def test_list_platform_messages_returns_200(self):
        """GET /api/admin/platform-messages returns sent messages"""
        response = requests.get(f"{BASE_URL}/api/admin/platform-messages?admin_id={ADMIN_ID}")
        assert response.status_code == 200
        data = response.json()
        assert "messages" in data
        print(f"PASS: List platform messages returns {len(data['messages'])} messages")


class TestTenantApiKeysPanel:
    """Tests for Tenant API Keys panel - manage per-tenant"""
    
    def test_list_tenant_api_keys_returns_200(self):
        """GET /api/admin/tenants/{id}/api-keys returns keys"""
        # Get a tenant first
        response = requests.get(f"{BASE_URL}/api/admin/tenants?admin_id={ADMIN_ID}")
        tenants = response.json().get("tenants", [])
        if not tenants:
            pytest.skip("No tenants to test")
        
        ws_id = tenants[0].get("id") or tenants[0].get("workspace_id")
        response = requests.get(f"{BASE_URL}/api/admin/tenants/{ws_id}/api-keys?admin_id={ADMIN_ID}")
        assert response.status_code == 200
        data = response.json()
        assert "keys" in data
        print(f"PASS: List tenant API keys returns {len(data['keys'])} keys")
    
    def test_add_tenant_api_key_returns_200(self):
        """POST /api/admin/tenants/{id}/api-keys adds key"""
        # Get a tenant first
        response = requests.get(f"{BASE_URL}/api/admin/tenants?admin_id={ADMIN_ID}")
        tenants = response.json().get("tenants", [])
        if not tenants:
            pytest.skip("No tenants to test")
        
        ws_id = tenants[0].get("id") or tenants[0].get("workspace_id")
        key_data = {
            "name": f"Test Key {uuid.uuid4().hex[:8]}",
            "service": "stripe",
            "key": "sk_test_dummy_key_12345"
        }
        response = requests.post(
            f"{BASE_URL}/api/admin/tenants/{ws_id}/api-keys?admin_id={ADMIN_ID}",
            json=key_data
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["name"] == key_data["name"]
        print(f"PASS: Added tenant API key with id {data['id']}")
        
        # Cleanup: delete the key
        requests.delete(f"{BASE_URL}/api/admin/tenants/{ws_id}/api-keys/{data['id']}?admin_id={ADMIN_ID}")


class TestAddOnRequestsPanel:
    """Tests for Add-on Requests panel"""
    
    def test_list_addon_requests_returns_200(self):
        """GET /api/admin/addon-requests returns requests"""
        response = requests.get(f"{BASE_URL}/api/admin/addon-requests?admin_id={ADMIN_ID}")
        assert response.status_code == 200
        data = response.json()
        assert "requests" in data
        print(f"PASS: List addon requests returns {len(data['requests'])} requests")
    
    def test_create_addon_request_returns_200(self):
        """POST /api/admin/addon-requests creates request"""
        request_data = {
            "title": f"Test Add-on {uuid.uuid4().hex[:8]}",
            "description": "Need this feature",
            "category": "feature"
        }
        response = requests.post(
            f"{BASE_URL}/api/admin/addon-requests?user_id=test_user",
            json=request_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "request" in data
        print(f"PASS: Created addon request with id {data['request']['id']}")


class TestMyApiKeysPanel:
    """Tests for My API Keys panel - personal super admin keys"""
    
    def test_list_my_api_keys_returns_200(self):
        """GET /api/admin/my-api-keys returns personal keys"""
        response = requests.get(f"{BASE_URL}/api/admin/my-api-keys?admin_id={ADMIN_ID}")
        assert response.status_code == 200
        data = response.json()
        assert "keys" in data
        print(f"PASS: List my API keys returns {len(data['keys'])} keys")
    
    def test_add_my_api_key_returns_200(self):
        """POST /api/admin/my-api-keys adds personal key"""
        key_data = {
            "name": f"Test Personal Key {uuid.uuid4().hex[:8]}",
            "service": "anthropic",
            "key": "sk-ant-dummy-key-12345"
        }
        response = requests.post(
            f"{BASE_URL}/api/admin/my-api-keys?admin_id={ADMIN_ID}",
            json=key_data
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        print(f"PASS: Added personal API key with id {data['id']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/my-api-keys/{data['id']}?admin_id={ADMIN_ID}")
    
    def test_delete_my_api_key_returns_200(self):
        """DELETE /api/admin/my-api-keys/{id} removes key"""
        # First add a key
        key_data = {"name": "To Delete", "service": "openai", "key": "sk-dummy"}
        response = requests.post(
            f"{BASE_URL}/api/admin/my-api-keys?admin_id={ADMIN_ID}",
            json=key_data
        )
        key_id = response.json()["id"]
        
        # Delete it
        response = requests.delete(f"{BASE_URL}/api/admin/my-api-keys/{key_id}?admin_id={ADMIN_ID}")
        assert response.status_code == 200
        assert response.json().get("success") == True
        print("PASS: Deleted personal API key")


class TestAIModelPanel:
    """Tests for AI Model panel - radio-style model selector"""
    
    def test_get_ai_model_returns_200(self):
        """GET /api/admin/ai-model returns current model"""
        response = requests.get(f"{BASE_URL}/api/admin/ai-model?admin_id={ADMIN_ID}")
        assert response.status_code == 200
        data = response.json()
        assert "provider" in data
        assert "model_id" in data
        assert "available_models" in data
        print(f"PASS: Current AI model: {data['provider']}/{data['model_id']}")
    
    def test_put_ai_model_returns_200(self):
        """PUT /api/admin/ai-model updates model selection"""
        model_data = {"provider": "anthropic", "model_id": "claude-sonnet-4-5-20250929"}
        response = requests.put(
            f"{BASE_URL}/api/admin/ai-model?admin_id={ADMIN_ID}",
            json=model_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print("PASS: AI model updated")


class TestPreloadedPromptsPanel:
    """Tests for Preloaded Prompts panel - with Hub toggle"""
    
    def test_list_preloaded_prompts_returns_200(self):
        """GET /api/admin/preloaded-prompts returns prompts"""
        response = requests.get(f"{BASE_URL}/api/admin/preloaded-prompts?admin_id={ADMIN_ID}")
        assert response.status_code == 200
        data = response.json()
        assert "prompts" in data
        print(f"PASS: List preloaded prompts returns {len(data['prompts'])} prompts")
    
    def test_create_preloaded_prompt_returns_200(self):
        """POST /api/admin/preloaded-prompts creates prompt"""
        prompt_data = {
            "title": f"Test Prompt {uuid.uuid4().hex[:8]}",
            "content": "You are a brand strategist...",
            "category": "brand",
            "min_plan": "structure",
            "tags": ["test", "brand"]
        }
        response = requests.post(
            f"{BASE_URL}/api/admin/preloaded-prompts?admin_id={ADMIN_ID}",
            json=prompt_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "prompt" in data
        prompt_id = data["prompt"]["id"]
        print(f"PASS: Created preloaded prompt with id {prompt_id}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/preloaded-prompts/{prompt_id}?admin_id={ADMIN_ID}")
    
    def test_patch_prompt_hub_toggle_returns_200(self):
        """PATCH /api/admin/preloaded-prompts/{id} toggles Hub status"""
        # First create a prompt
        prompt_data = {"title": "Hub Test", "content": "Test content", "category": "test"}
        response = requests.post(
            f"{BASE_URL}/api/admin/preloaded-prompts?admin_id={ADMIN_ID}",
            json=prompt_data
        )
        prompt_id = response.json()["prompt"]["id"]
        
        # PATCH to toggle hub status
        response = requests.patch(
            f"{BASE_URL}/api/admin/preloaded-prompts/{prompt_id}?admin_id={ADMIN_ID}",
            json={"is_in_hub": False}
        )
        assert response.status_code == 200
        assert response.json().get("success") == True
        print("PASS: PATCH prompt Hub toggle works")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/preloaded-prompts/{prompt_id}?admin_id={ADMIN_ID}")


class TestMediaPromptEnginePanel:
    """Tests for Media Prompt Engine panel - upload zone + viral concepts"""
    
    def test_list_media_assets_returns_200(self):
        """GET /api/admin/media-assets returns assets"""
        response = requests.get(f"{BASE_URL}/api/admin/media-assets?admin_id={ADMIN_ID}")
        assert response.status_code == 200
        data = response.json()
        assert "assets" in data
        print(f"PASS: List media assets returns {len(data['assets'])} assets")
    
    def test_delete_media_asset_returns_404_for_invalid(self):
        """DELETE /api/admin/media-assets/{id} returns 404 for invalid id"""
        response = requests.delete(f"{BASE_URL}/api/admin/media-assets/nonexistent?admin_id={ADMIN_ID}")
        assert response.status_code == 404
        print("PASS: Delete media asset returns 404 for invalid id")


class TestTrainingVideosPanel:
    """Tests for Training Videos panel"""
    
    def test_list_training_videos_returns_200(self):
        """GET /api/admin/training-videos returns videos"""
        response = requests.get(f"{BASE_URL}/api/admin/training-videos?admin_id={ADMIN_ID}")
        assert response.status_code == 200
        data = response.json()
        assert "videos" in data
        print(f"PASS: List training videos returns {len(data['videos'])} videos")
    
    def test_create_training_video_returns_200(self):
        """POST /api/admin/training-videos creates video entry"""
        video_data = {
            "title": f"Test Video {uuid.uuid4().hex[:8]}",
            "url": "https://youtube.com/watch?v=test",
            "description": "A test training video",
            "category": "onboarding",
            "order": 0
        }
        response = requests.post(
            f"{BASE_URL}/api/admin/training-videos?admin_id={ADMIN_ID}",
            json=video_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "video" in data
        video_id = data["video"]["id"]
        print(f"PASS: Created training video with id {video_id}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/training-videos/{video_id}?admin_id={ADMIN_ID}")


class TestAffiliatLinksPanel:
    """Tests for Affiliate Links panel"""
    
    def test_list_affiliate_links_returns_200(self):
        """GET /api/admin/affiliate-links returns links"""
        response = requests.get(f"{BASE_URL}/api/admin/affiliate-links?admin_id={ADMIN_ID}")
        assert response.status_code == 200
        data = response.json()
        assert "links" in data
        print(f"PASS: List affiliate links returns {len(data['links'])} links")
    
    def test_create_affiliate_link_returns_200(self):
        """POST /api/admin/affiliate-links creates link"""
        link_data = {
            "title": f"Test Link {uuid.uuid4().hex[:8]}",
            "url": "https://example.com/affiliate",
            "description": "A test affiliate link",
            "category": "tools",
            "is_active": True
        }
        response = requests.post(
            f"{BASE_URL}/api/admin/affiliate-links?admin_id={ADMIN_ID}",
            json=link_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "link" in data
        link_id = data["link"]["id"]
        print(f"PASS: Created affiliate link with id {link_id}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/affiliate-links/{link_id}?admin_id={ADMIN_ID}")
    
    def test_patch_affiliate_link_returns_200(self):
        """PATCH /api/admin/affiliate-links/{id} updates link"""
        # First create a link
        link_data = {"title": "Patch Test", "url": "https://test.com", "is_active": True}
        response = requests.post(
            f"{BASE_URL}/api/admin/affiliate-links?admin_id={ADMIN_ID}",
            json=link_data
        )
        link_id = response.json()["link"]["id"]
        
        # PATCH to update
        response = requests.patch(
            f"{BASE_URL}/api/admin/affiliate-links/{link_id}?admin_id={ADMIN_ID}",
            json={"is_active": False, "title": "Updated Title"}
        )
        assert response.status_code == 200
        assert response.json().get("success") == True
        print("PASS: PATCH affiliate link works")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/affiliate-links/{link_id}?admin_id={ADMIN_ID}")


class TestRefreshDataButton:
    """Tests for refresh data functionality"""
    
    def test_overview_is_idempotent(self):
        """GET /api/admin/overview can be called multiple times (refresh)"""
        response1 = requests.get(f"{BASE_URL}/api/admin/overview?admin_id={ADMIN_ID}")
        response2 = requests.get(f"{BASE_URL}/api/admin/overview?admin_id={ADMIN_ID}")
        assert response1.status_code == 200
        assert response2.status_code == 200
        print("PASS: Overview endpoint is idempotent for refresh")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
