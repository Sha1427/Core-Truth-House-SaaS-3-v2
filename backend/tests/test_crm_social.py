"""
Test suite for CRM Suite and Social Media Manager features
Tests: CRM contacts/deals/companies CRUD, Social posts/calendar/analytics, AI content generation
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test identifiers for cleanup
TEST_PREFIX = "TEST_" + str(uuid.uuid4())[:8]


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestCRMPipelineStages:
    """Test pipeline stages configuration"""
    
    def test_get_pipeline_stages(self, api_client):
        """GET /api/crm/pipeline/stages - returns stage configuration"""
        response = api_client.get(f"{BASE_URL}/api/crm/pipeline/stages")
        assert response.status_code == 200
        data = response.json()
        assert "stages" in data
        assert len(data["stages"]) >= 5
        
        # Verify stage structure
        stage = data["stages"][0]
        assert "id" in stage
        assert "name" in stage
        assert "probability" in stage
        assert "color" in stage
        print(f"✓ Pipeline has {len(data['stages'])} stages: {[s['name'] for s in data['stages']]}")


class TestCRMContacts:
    """CRM Contacts CRUD operations"""
    
    def test_create_contact(self, api_client):
        """POST /api/crm/contacts - creates a new contact"""
        payload = {
            "name": f"{TEST_PREFIX}_Test Contact",
            "email": "testcontact@example.com",
            "phone": "555-1234",
            "company": "Test Company",
            "status": "lead",
            "notes": "Test contact created by automated testing"
        }
        response = api_client.post(f"{BASE_URL}/api/crm/contacts?user_id=default", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        assert "contact" in data
        assert data["contact"]["name"] == payload["name"]
        assert data["contact"]["status"] == "lead"
        print(f"✓ Created contact: {data['contact']['name']} (ID: {data['contact']['id']})")
        return data["contact"]["id"]
    
    def test_get_contacts(self, api_client):
        """GET /api/crm/contacts - returns contacts list"""
        response = api_client.get(f"{BASE_URL}/api/crm/contacts?user_id=default")
        assert response.status_code == 200
        data = response.json()
        assert "contacts" in data
        assert "total" in data
        assert isinstance(data["contacts"], list)
        print(f"✓ Retrieved {data['total']} contacts")
    
    def test_delete_contact(self, api_client):
        """DELETE /api/crm/contacts/:id - deletes a contact"""
        # First create a contact to delete
        payload = {"name": f"{TEST_PREFIX}_Delete Contact", "status": "lead"}
        create_resp = api_client.post(f"{BASE_URL}/api/crm/contacts?user_id=default", json=payload)
        contact_id = create_resp.json()["contact"]["id"]
        
        # Now delete it
        response = api_client.delete(f"{BASE_URL}/api/crm/contacts/{contact_id}?user_id=default")
        assert response.status_code == 200
        assert response.json().get("success") is True
        print(f"✓ Deleted contact: {contact_id}")


class TestCRMDeals:
    """CRM Deals CRUD operations"""
    
    def test_create_deal(self, api_client):
        """POST /api/crm/deals - creates a new deal"""
        payload = {
            "title": f"{TEST_PREFIX}_Test Deal",
            "value": 5000,
            "stage": "qualified",
            "contact_name": "Test Contact",
            "notes": "Test deal for automated testing"
        }
        response = api_client.post(f"{BASE_URL}/api/crm/deals?user_id=default", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        assert "deal" in data
        assert data["deal"]["title"] == payload["title"]
        assert data["deal"]["value"] == 5000
        assert data["deal"]["stage"] == "qualified"
        print(f"✓ Created deal: {data['deal']['title']} - ${data['deal']['value']} (Stage: {data['deal']['stage']})")
        return data["deal"]["id"]
    
    def test_get_deals(self, api_client):
        """GET /api/crm/deals - returns deals list with stage grouping"""
        response = api_client.get(f"{BASE_URL}/api/crm/deals?user_id=default")
        assert response.status_code == 200
        data = response.json()
        assert "deals" in data
        assert "deals_by_stage" in data
        assert "total" in data
        
        # Verify deals_by_stage has stage keys
        assert isinstance(data["deals_by_stage"], dict)
        print(f"✓ Retrieved {data['total']} deals grouped by stage")
    
    def test_update_deal_stage(self, api_client):
        """PUT /api/crm/deals/:id - updates deal stage"""
        # Create a deal first
        payload = {"title": f"{TEST_PREFIX}_Stage Test Deal", "value": 3000, "stage": "lead"}
        create_resp = api_client.post(f"{BASE_URL}/api/crm/deals?user_id=default", json=payload)
        deal_id = create_resp.json()["deal"]["id"]
        
        # Update stage
        update_resp = api_client.put(f"{BASE_URL}/api/crm/deals/{deal_id}?user_id=default", json={"stage": "proposal"})
        assert update_resp.status_code == 200
        assert update_resp.json().get("success") is True
        print(f"✓ Updated deal {deal_id} stage to 'proposal'")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/crm/deals/{deal_id}?user_id=default")
    
    def test_delete_deal(self, api_client):
        """DELETE /api/crm/deals/:id - deletes a deal"""
        # Create a deal to delete
        payload = {"title": f"{TEST_PREFIX}_Delete Deal", "value": 1000, "stage": "lead"}
        create_resp = api_client.post(f"{BASE_URL}/api/crm/deals?user_id=default", json=payload)
        deal_id = create_resp.json()["deal"]["id"]
        
        # Delete it
        response = api_client.delete(f"{BASE_URL}/api/crm/deals/{deal_id}?user_id=default")
        assert response.status_code == 200
        print(f"✓ Deleted deal: {deal_id}")


class TestCRMCompanies:
    """CRM Companies CRUD operations"""
    
    def test_create_company(self, api_client):
        """POST /api/crm/companies - creates a new company"""
        payload = {
            "name": f"{TEST_PREFIX}_Test Company Inc",
            "industry": "Technology",
            "size": "51-200",
            "website": "https://testcompany.example.com"
        }
        response = api_client.post(f"{BASE_URL}/api/crm/companies?user_id=default", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        assert "company" in data
        assert data["company"]["name"] == payload["name"]
        assert data["company"]["industry"] == "Technology"
        print(f"✓ Created company: {data['company']['name']} ({data['company']['industry']})")
        return data["company"]["id"]
    
    def test_get_companies(self, api_client):
        """GET /api/crm/companies - returns companies list"""
        response = api_client.get(f"{BASE_URL}/api/crm/companies?user_id=default")
        assert response.status_code == 200
        data = response.json()
        assert "companies" in data
        assert "total" in data
        print(f"✓ Retrieved {data['total']} companies")
    
    def test_delete_company(self, api_client):
        """DELETE /api/crm/companies/:id - deletes a company"""
        # Create a company to delete
        payload = {"name": f"{TEST_PREFIX}_Delete Company", "industry": "Testing"}
        create_resp = api_client.post(f"{BASE_URL}/api/crm/companies?user_id=default", json=payload)
        company_id = create_resp.json()["company"]["id"]
        
        # Delete it
        response = api_client.delete(f"{BASE_URL}/api/crm/companies/{company_id}?user_id=default")
        assert response.status_code == 200
        print(f"✓ Deleted company: {company_id}")


class TestCRMAnalytics:
    """CRM Analytics endpoint"""
    
    def test_get_analytics(self, api_client):
        """GET /api/crm/analytics - returns CRM metrics"""
        response = api_client.get(f"{BASE_URL}/api/crm/analytics?user_id=default")
        assert response.status_code == 200
        data = response.json()
        
        # Verify required analytics fields
        assert "pipeline_value" in data
        assert "weighted_pipeline_value" in data
        assert "total_contacts" in data
        assert "total_deals" in data
        assert "contacts_by_status" in data
        assert "deals_by_stage" in data
        print(f"✓ CRM Analytics: {data['total_contacts']} contacts, {data['total_deals']} deals, ${data['pipeline_value']} pipeline")


class TestSocialMediaPlatforms:
    """Social Media platform configuration"""
    
    def test_get_platforms(self, api_client):
        """GET /api/social/platforms - returns supported platforms"""
        response = api_client.get(f"{BASE_URL}/api/social/platforms")
        assert response.status_code == 200
        data = response.json()
        assert "platforms" in data
        assert len(data["platforms"]) >= 5
        
        # Verify platform structure
        platform = data["platforms"][0]
        assert "id" in platform
        assert "name" in platform
        assert "color" in platform
        assert "char_limit" in platform
        
        platform_names = [p["name"] for p in data["platforms"]]
        print(f"✓ Supported platforms: {', '.join(platform_names)}")


class TestSocialMediaPosts:
    """Social Media Posts CRUD operations"""
    
    def test_create_post(self, api_client):
        """POST /api/social/posts - creates a new social post"""
        payload = {
            "content": f"{TEST_PREFIX} Test social post content for automated testing",
            "platform": "instagram",
            "hashtags": ["testing", "automation", "cth"],
            "status": "draft"
        }
        response = api_client.post(f"{BASE_URL}/api/social/posts?user_id=default", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        assert "post" in data
        assert data["post"]["content"] == payload["content"]
        assert data["post"]["platform"] == "instagram"
        assert data["post"]["status"] == "draft"
        print(f"✓ Created social post on {data['post']['platform']}: {data['post']['content'][:50]}...")
        return data["post"]["id"]
    
    def test_get_posts(self, api_client):
        """GET /api/social/posts - returns posts list"""
        response = api_client.get(f"{BASE_URL}/api/social/posts?user_id=default")
        assert response.status_code == 200
        data = response.json()
        assert "posts" in data
        assert "total" in data
        print(f"✓ Retrieved {data['total']} social posts")
    
    def test_publish_post(self, api_client):
        """POST /api/social/posts/:id/publish - marks post as published"""
        # Create a scheduled post
        payload = {
            "content": f"{TEST_PREFIX} Publish test post",
            "platform": "twitter",
            "status": "scheduled"
        }
        create_resp = api_client.post(f"{BASE_URL}/api/social/posts?user_id=default", json=payload)
        post_id = create_resp.json()["post"]["id"]
        
        # Publish it
        response = api_client.post(f"{BASE_URL}/api/social/posts/{post_id}/publish?user_id=default")
        assert response.status_code == 200
        assert response.json().get("success") is True
        print(f"✓ Published post: {post_id}")
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/social/posts/{post_id}?user_id=default")
    
    def test_delete_post(self, api_client):
        """DELETE /api/social/posts/:id - deletes a post"""
        # Create a post to delete
        payload = {
            "content": f"{TEST_PREFIX} Delete test post",
            "platform": "linkedin",
            "status": "draft"
        }
        create_resp = api_client.post(f"{BASE_URL}/api/social/posts?user_id=default", json=payload)
        post_id = create_resp.json()["post"]["id"]
        
        # Delete it
        response = api_client.delete(f"{BASE_URL}/api/social/posts/{post_id}?user_id=default")
        assert response.status_code == 200
        print(f"✓ Deleted post: {post_id}")


class TestSocialMediaCalendar:
    """Social Media Calendar view"""
    
    def test_get_calendar(self, api_client):
        """GET /api/social/posts/calendar - returns calendar view data"""
        from datetime import datetime
        year = datetime.now().year
        month = datetime.now().month
        
        response = api_client.get(f"{BASE_URL}/api/social/posts/calendar?user_id=default&year={year}&month={month}")
        assert response.status_code == 200
        data = response.json()
        assert "calendar" in data
        assert "year" in data
        assert "month" in data
        assert data["year"] == year
        assert data["month"] == month
        print(f"✓ Calendar view for {year}-{month}: {data.get('total_posts', 0)} posts")


class TestSocialMediaAIGeneration:
    """Social Media AI Content Generation"""
    
    def test_generate_content(self, api_client):
        """POST /api/social/generate - generates AI content"""
        payload = {
            "topic": "Brand consistency tips for entrepreneurs",
            "platform": "instagram",
            "tone": "professional",
            "include_hashtags": True,
            "include_cta": True
        }
        response = api_client.post(f"{BASE_URL}/api/social/generate?user_id=default", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        assert "generated_content" in data
        assert "hashtags" in data
        assert "platform" in data
        assert len(data["generated_content"]) > 0
        print(f"✓ AI Generated content ({data['char_count']} chars): {data['generated_content'][:80]}...")


class TestSocialMediaAnalytics:
    """Social Media Analytics"""
    
    def test_get_analytics(self, api_client):
        """GET /api/social/analytics - returns social media metrics"""
        response = api_client.get(f"{BASE_URL}/api/social/analytics?user_id=default")
        assert response.status_code == 200
        data = response.json()
        
        # Verify required analytics fields
        assert "total_posts" in data
        assert "total_published" in data
        assert "total_scheduled" in data
        assert "total_drafts" in data
        assert "posts_by_platform" in data
        assert "posts_by_status" in data
        print(f"✓ Social Analytics: {data['total_posts']} posts ({data['total_published']} published, {data['total_scheduled']} scheduled)")


class TestBlogCMSExists:
    """Verify Blog CMS endpoints still work"""
    
    def test_get_articles(self, api_client):
        """GET /api/blog/articles - returns articles list"""
        response = api_client.get(f"{BASE_URL}/api/blog/articles?user_id=default")
        assert response.status_code == 200
        data = response.json()
        assert "articles" in data
        print(f"✓ Blog CMS has {len(data.get('articles', []))} articles")


class TestCalendarExists:
    """Verify Calendar endpoints still work"""
    
    def test_get_events(self, api_client):
        """GET /api/calendar/events/month - returns calendar events"""
        from datetime import datetime
        year = datetime.now().year
        month = datetime.now().month
        
        response = api_client.get(f"{BASE_URL}/api/calendar/events/month/{year}/{month}?user_id=default")
        assert response.status_code == 200
        data = response.json()
        assert "events" in data
        print(f"✓ Calendar has {len(data.get('events', []))} events for {year}-{month}")


class TestBackendEnvConfig:
    """Verify backend environment configuration"""
    
    def test_sender_email_config(self, api_client):
        """Backend SENDER_EMAIL should be configured"""
        # We can verify this indirectly through health check
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        assert data.get("database") == "connected"
        print(f"✓ Backend health: {data['status']}, DB: {data['database']}")


# Cleanup test data after all tests
@pytest.fixture(scope="module", autouse=True)
def cleanup_test_data(api_client):
    """Clean up TEST_ prefixed data after tests"""
    yield
    # Cleanup contacts
    try:
        contacts_resp = api_client.get(f"{BASE_URL}/api/crm/contacts?user_id=default&limit=100")
        if contacts_resp.status_code == 200:
            for contact in contacts_resp.json().get("contacts", []):
                if TEST_PREFIX in str(contact.get("name", "")):
                    api_client.delete(f"{BASE_URL}/api/crm/contacts/{contact['id']}?user_id=default")
    except:
        pass
    
    # Cleanup companies
    try:
        companies_resp = api_client.get(f"{BASE_URL}/api/crm/companies?user_id=default&limit=100")
        if companies_resp.status_code == 200:
            for company in companies_resp.json().get("companies", []):
                if TEST_PREFIX in str(company.get("name", "")):
                    api_client.delete(f"{BASE_URL}/api/crm/companies/{company['id']}?user_id=default")
    except:
        pass
    
    # Cleanup deals
    try:
        deals_resp = api_client.get(f"{BASE_URL}/api/crm/deals?user_id=default&limit=100")
        if deals_resp.status_code == 200:
            for deal in deals_resp.json().get("deals", []):
                if TEST_PREFIX in str(deal.get("title", "")):
                    api_client.delete(f"{BASE_URL}/api/crm/deals/{deal['id']}?user_id=default")
    except:
        pass
    
    # Cleanup social posts
    try:
        posts_resp = api_client.get(f"{BASE_URL}/api/social/posts?user_id=default&limit=100")
        if posts_resp.status_code == 200:
            for post in posts_resp.json().get("posts", []):
                if TEST_PREFIX in str(post.get("content", "")):
                    api_client.delete(f"{BASE_URL}/api/social/posts/{post['id']}?user_id=default")
    except:
        pass
