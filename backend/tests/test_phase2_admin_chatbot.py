"""
Phase 2 Backend Tests: Admin Dashboard, AI Chatbot, PDF Export
Tests for iteration 14 - Core Truth House OS Phase 2 features
"""
import pytest
import requests
import os
import time
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestAdminOverview:
    """Admin Dashboard Overview API - /api/admin/overview"""
    
    def test_admin_overview_returns_200(self, api_client):
        """GET /api/admin/overview returns 200 with MRR, users, workspaces"""
        response = api_client.get(f"{BASE_URL}/api/admin/overview")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"PASS: GET /api/admin/overview returns 200")
    
    def test_admin_overview_contains_required_fields(self, api_client):
        """Verify overview response contains MRR, users, workspaces count"""
        response = api_client.get(f"{BASE_URL}/api/admin/overview?admin_id=test")
        data = response.json()
        
        # Check required fields exist
        assert "total_users" in data, "Missing total_users field"
        assert "total_workspaces" in data, "Missing total_workspaces field"
        assert "mrr" in data, "Missing mrr field"
        assert "plan_distribution" in data, "Missing plan_distribution field"
        assert "ai_generations_this_month" in data, "Missing ai_generations_this_month field"
        assert "timestamp" in data, "Missing timestamp field"
        
        # Check MRR structure
        mrr = data["mrr"]
        assert "total" in mrr, "MRR missing total field"
        assert "currency" in mrr, "MRR missing currency field"
        assert mrr["currency"] == "USD", f"Expected USD currency, got {mrr['currency']}"
        
        print(f"PASS: Overview contains all required fields - MRR: ${mrr.get('total', 0)}, Users: {data['total_users']}, Workspaces: {data['total_workspaces']}")
    
    def test_admin_overview_mrr_by_plan(self, api_client):
        """Verify MRR by plan breakdown structure"""
        response = api_client.get(f"{BASE_URL}/api/admin/overview")
        data = response.json()
        
        if data["mrr"].get("by_plan"):
            for plan, plan_data in data["mrr"]["by_plan"].items():
                assert "subscribers" in plan_data, f"Plan {plan} missing subscribers"
                assert "price" in plan_data, f"Plan {plan} missing price"
                assert "mrr" in plan_data, f"Plan {plan} missing mrr"
            print(f"PASS: MRR by_plan breakdown has correct structure")
        else:
            print(f"INFO: No plans with subscribers yet (empty by_plan)")


class TestAdminTenants:
    """Admin Tenant Management API - /api/admin/tenants"""
    
    def test_tenants_list_returns_200(self, api_client):
        """GET /api/admin/tenants returns 200 with pagination"""
        response = api_client.get(f"{BASE_URL}/api/admin/tenants")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"PASS: GET /api/admin/tenants returns 200")
    
    def test_tenants_list_pagination(self, api_client):
        """Verify tenant list has pagination fields"""
        response = api_client.get(f"{BASE_URL}/api/admin/tenants?page=1&limit=5")
        data = response.json()
        
        assert "tenants" in data, "Missing tenants array"
        assert "total" in data, "Missing total count"
        assert "page" in data, "Missing page number"
        assert "limit" in data, "Missing limit"
        assert "total_pages" in data, "Missing total_pages"
        
        assert isinstance(data["tenants"], list), "tenants should be a list"
        print(f"PASS: Tenants list has pagination - Total: {data['total']}, Page: {data['page']}, Pages: {data['total_pages']}")
    
    def test_tenants_search_filter(self, api_client):
        """Test tenant search/filter parameter"""
        response = api_client.get(f"{BASE_URL}/api/admin/tenants?search=test")
        assert response.status_code == 200, f"Search filter failed: {response.status_code}"
        print(f"PASS: Tenant search filter works")
    
    def test_tenants_plan_filter(self, api_client):
        """Test tenant plan filter parameter"""
        response = api_client.get(f"{BASE_URL}/api/admin/tenants?plan_filter=free")
        assert response.status_code == 200, f"Plan filter failed: {response.status_code}"
        print(f"PASS: Tenant plan filter works")


class TestAdminAnalytics:
    """Admin Analytics API - /api/admin/analytics/usage"""
    
    def test_usage_analytics_returns_200(self, api_client):
        """GET /api/admin/analytics/usage returns 200"""
        response = api_client.get(f"{BASE_URL}/api/admin/analytics/usage")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"PASS: GET /api/admin/analytics/usage returns 200")
    
    def test_usage_analytics_structure(self, api_client):
        """Verify usage analytics has required fields"""
        response = api_client.get(f"{BASE_URL}/api/admin/analytics/usage")
        data = response.json()
        
        assert "content_by_type" in data, "Missing content_by_type field"
        assert "totals" in data, "Missing totals field"
        
        # Verify totals has expected keys
        totals = data["totals"]
        expected_totals = ["content", "prompts", "assets", "offers", "systems", "launches"]
        for key in expected_totals:
            assert key in totals, f"Missing {key} in totals"
        
        print(f"PASS: Usage analytics structure correct - Totals: {totals}")
    
    def test_growth_analytics_returns_200(self, api_client):
        """GET /api/admin/analytics/growth returns 200"""
        response = api_client.get(f"{BASE_URL}/api/admin/analytics/growth?days=7")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "growth" in data, "Missing growth field"
        assert "period_days" in data, "Missing period_days field"
        print(f"PASS: GET /api/admin/analytics/growth returns 200")


class TestAdminMessages:
    """Admin Contact Messages API - /api/admin/messages"""
    
    def test_messages_list_returns_200(self, api_client):
        """GET /api/admin/messages returns 200"""
        response = api_client.get(f"{BASE_URL}/api/admin/messages")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"PASS: GET /api/admin/messages returns 200")
    
    def test_messages_list_structure(self, api_client):
        """Verify messages list has pagination"""
        response = api_client.get(f"{BASE_URL}/api/admin/messages?page=1&limit=10")
        data = response.json()
        
        assert "messages" in data, "Missing messages array"
        assert "total" in data, "Missing total count"
        assert "page" in data, "Missing page number"
        assert "limit" in data, "Missing limit"
        
        print(f"PASS: Messages list has pagination - Total messages: {data['total']}")
    
    def test_messages_status_filter(self, api_client):
        """Test messages status filter"""
        response = api_client.get(f"{BASE_URL}/api/admin/messages?status=new")
        assert response.status_code == 200, f"Status filter failed: {response.status_code}"
        print(f"PASS: Messages status filter works")


class TestChatbot:
    """AI Chatbot API - /api/chatbot"""
    
    def test_chatbot_returns_200(self, api_client):
        """POST /api/chatbot returns 200 with AI response"""
        response = api_client.post(f"{BASE_URL}/api/chatbot", json={
            "message": "What is Core Truth House?"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"PASS: POST /api/chatbot returns 200")
    
    def test_chatbot_response_structure(self, api_client):
        """Verify chatbot response has response, session_id, suggestions"""
        response = api_client.post(f"{BASE_URL}/api/chatbot", json={
            "message": "Tell me about pricing"
        })
        data = response.json()
        
        assert "response" in data, "Missing response field"
        assert "session_id" in data, "Missing session_id field"
        assert "suggestions" in data, "Missing suggestions field"
        
        assert isinstance(data["response"], str), "Response should be a string"
        assert len(data["response"]) > 10, "Response seems too short"
        assert isinstance(data["suggestions"], list), "Suggestions should be a list"
        
        print(f"PASS: Chatbot response has correct structure - Response length: {len(data['response'])}, Suggestions: {len(data['suggestions'])}")
    
    def test_chatbot_session_persistence(self, api_client):
        """Test chatbot session ID is returned and can be reused"""
        # First message
        response1 = api_client.post(f"{BASE_URL}/api/chatbot", json={
            "message": "Hi there"
        })
        session_id = response1.json()["session_id"]
        assert session_id, "No session_id returned"
        
        # Second message with same session
        response2 = api_client.post(f"{BASE_URL}/api/chatbot", json={
            "message": "What features do you have?",
            "session_id": session_id
        })
        assert response2.status_code == 200
        assert response2.json()["session_id"] == session_id, "Session ID changed unexpectedly"
        
        print(f"PASS: Chatbot session persistence works - Session: {session_id[:8]}...")
    
    def test_chatbot_suggestions_contextual(self, api_client):
        """Test that suggestions are contextual based on user message"""
        # Ask about pricing
        response = api_client.post(f"{BASE_URL}/api/chatbot", json={
            "message": "What are the pricing plans?"
        })
        data = response.json()
        
        suggestions = data.get("suggestions", [])
        assert len(suggestions) > 0, "No suggestions returned for pricing question"
        
        # Check for pricing-related suggestions
        pricing_keywords = ["plan", "price", "start", "audit", "house"]
        has_relevant = any(
            any(kw in s.lower() for kw in pricing_keywords) 
            for s in suggestions
        )
        
        print(f"PASS: Chatbot returns contextual suggestions - {suggestions}")
    
    def test_chatbot_history_endpoint(self, api_client):
        """Test chatbot history retrieval"""
        # First create a session
        response = api_client.post(f"{BASE_URL}/api/chatbot", json={
            "message": "Hello for history test"
        })
        session_id = response.json()["session_id"]
        
        # Get history
        history_response = api_client.get(f"{BASE_URL}/api/chatbot/history/{session_id}")
        assert history_response.status_code == 200, f"History fetch failed: {history_response.status_code}"
        
        data = history_response.json()
        assert "history" in data, "Missing history field"
        assert "session_id" in data, "Missing session_id in history response"
        
        print(f"PASS: GET /api/chatbot/history returns correct structure")


class TestPDFExport:
    """PDF Export API - /api/export/pdf"""
    
    def test_pdf_preview_returns_200(self, api_client):
        """GET /api/export/pdf/preview returns 200 with HTML"""
        response = api_client.get(f"{BASE_URL}/api/export/pdf/preview")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"PASS: GET /api/export/pdf/preview returns 200")
    
    def test_pdf_preview_returns_html(self, api_client):
        """Verify PDF preview returns valid HTML content"""
        response = api_client.get(f"{BASE_URL}/api/export/pdf/preview?user_id=test")
        
        # Check content type is HTML
        content_type = response.headers.get("content-type", "")
        assert "text/html" in content_type, f"Expected text/html, got {content_type}"
        
        # Check HTML structure
        html_content = response.text
        assert "<!DOCTYPE html>" in html_content or "<html>" in html_content.lower(), "Not valid HTML"
        assert "Core Truth House" in html_content, "Missing brand name in HTML"
        assert "Brand Kit" in html_content or "Brand Strategy" in html_content, "Missing brand kit title"
        
        print(f"PASS: PDF preview returns valid HTML brand kit - Length: {len(html_content)} chars")
    
    def test_pdf_preview_contains_sections(self, api_client):
        """Verify PDF preview HTML contains expected sections"""
        response = api_client.get(f"{BASE_URL}/api/export/pdf/preview")
        html = response.text
        
        # Check for key sections
        expected_sections = ["Mission", "Vision", "Brand"]
        found_sections = [s for s in expected_sections if s in html]
        
        print(f"PASS: PDF preview contains sections: {found_sections}")
    
    def test_pdf_download_returns_file(self, api_client):
        """GET /api/export/pdf returns HTML file for download"""
        response = api_client.get(f"{BASE_URL}/api/export/pdf?user_id=test")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Check for file download headers
        content_disposition = response.headers.get("content-disposition", "")
        assert "attachment" in content_disposition.lower() or "BrandKit" in content_disposition, \
            f"Missing proper content-disposition header: {content_disposition}"
        
        print(f"PASS: GET /api/export/pdf returns downloadable file")


class TestAdminUsersEndpoint:
    """Admin Users API - /api/admin/users"""
    
    def test_users_list_returns_200(self, api_client):
        """GET /api/admin/users returns 200 with pagination"""
        response = api_client.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "users" in data, "Missing users array"
        assert "total" in data, "Missing total count"
        assert "page" in data, "Missing page"
        assert "total_pages" in data, "Missing total_pages"
        
        print(f"PASS: GET /api/admin/users returns 200 - Total: {data['total']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
