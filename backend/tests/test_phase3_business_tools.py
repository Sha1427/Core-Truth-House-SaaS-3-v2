"""
Phase 3 Business Tools API Tests
Testing: Blog CMS, Calendar, CRM Suite, and Social Media Manager APIs
"""
import pytest
import requests
import os
import uuid
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Skip all tests if BASE_URL is not configured
pytestmark = pytest.mark.skipif(not BASE_URL, reason="REACT_APP_BACKEND_URL not configured")


@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


# ===================
# BLOG CMS API TESTS
# ===================

class TestBlogArticles:
    """Blog Articles CRUD tests"""
    
    def test_get_articles_empty(self, api_client):
        """GET /api/blog/articles returns articles list"""
        response = api_client.get(f"{BASE_URL}/api/blog/articles?user_id=default")
        assert response.status_code == 200
        data = response.json()
        assert "articles" in data
        assert isinstance(data["articles"], list)
        assert "total" in data
        print(f"✓ GET /api/blog/articles - Returns {data['total']} articles")
    
    def test_create_article(self, api_client):
        """POST /api/blog/articles creates new article"""
        test_article = {
            "title": f"TEST_Article_{uuid.uuid4().hex[:8]}",
            "content": "This is a test article content with enough words to test the word count feature properly.",
            "excerpt": "Test excerpt",
            "status": "draft",
            "tags": ["test", "automated"]
        }
        response = api_client.post(f"{BASE_URL}/api/blog/articles?user_id=default", json=test_article)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "article" in data
        assert data["article"]["title"] == test_article["title"]
        assert data["article"]["status"] == "draft"
        assert "id" in data["article"]
        assert "slug" in data["article"]
        assert data["article"]["word_count"] > 0
        print(f"✓ POST /api/blog/articles - Created article '{data['article']['id']}'")
        return data["article"]["id"]
    
    def test_update_article(self, api_client):
        """PUT /api/blog/articles/{id} updates article"""
        # Create article first
        article_id = self.test_create_article(api_client)
        
        # Update it
        update_data = {
            "title": "TEST_Updated_Title",
            "content": "Updated content with more words for testing purposes."
        }
        response = api_client.put(f"{BASE_URL}/api/blog/articles/{article_id}?user_id=default", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        print(f"✓ PUT /api/blog/articles/{article_id} - Article updated")
        return article_id
    
    def test_publish_article(self, api_client):
        """POST /api/blog/articles/{id}/publish publishes article"""
        # Create article first
        article_id = self.test_create_article(api_client)
        
        # Publish it
        response = api_client.post(f"{BASE_URL}/api/blog/articles/{article_id}/publish?user_id=default")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "published" in data["message"].lower()
        print(f"✓ POST /api/blog/articles/{article_id}/publish - Article published")
        return article_id
    
    def test_delete_article(self, api_client):
        """DELETE /api/blog/articles/{id} deletes article"""
        # Create article first
        article_id = self.test_create_article(api_client)
        
        # Delete it
        response = api_client.delete(f"{BASE_URL}/api/blog/articles/{article_id}?user_id=default")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        
        # Verify deletion
        get_response = api_client.get(f"{BASE_URL}/api/blog/articles/{article_id}?user_id=default")
        assert get_response.status_code == 404
        print(f"✓ DELETE /api/blog/articles/{article_id} - Article deleted")


class TestBlogAnalytics:
    """Blog Analytics tests"""
    
    def test_get_blog_analytics(self, api_client):
        """GET /api/blog/analytics returns analytics"""
        response = api_client.get(f"{BASE_URL}/api/blog/analytics?user_id=default")
        assert response.status_code == 200
        data = response.json()
        assert "articles_by_status" in data
        assert "total_articles" in data
        assert "total_words_written" in data
        print(f"✓ GET /api/blog/analytics - Total articles: {data['total_articles']}")


class TestBlogGenerate:
    """Blog AI Generation tests"""
    
    def test_generate_article(self, api_client):
        """POST /api/blog/generate generates AI article"""
        payload = {
            "topic": "Brand consistency for entrepreneurs",
            "keywords": ["branding", "consistency"],
            "tone": "professional",
            "word_count": 500,
            "include_outline": True
        }
        response = api_client.post(f"{BASE_URL}/api/blog/generate?user_id=default", json=payload, timeout=30)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "generated" in data
        assert "title" in data["generated"]
        assert "content" in data["generated"]
        print(f"✓ POST /api/blog/generate - AI generated article title: '{data['generated'].get('title', 'N/A')[:50]}...'")


# ===================
# CALENDAR API TESTS
# ===================

class TestCalendarEvents:
    """Calendar Events CRUD tests"""
    
    def test_get_events_month(self, api_client):
        """GET /api/calendar/events/month/{year}/{month} returns events"""
        now = datetime.now(timezone.utc)
        response = api_client.get(f"{BASE_URL}/api/calendar/events/month/{now.year}/{now.month}?user_id=default")
        assert response.status_code == 200
        data = response.json()
        assert "events" in data
        assert isinstance(data["events"], list)
        assert "events_by_day" in data
        assert data["year"] == now.year
        assert data["month"] == now.month
        print(f"✓ GET /api/calendar/events/month/{now.year}/{now.month} - Returns {data['total']} events")
    
    def test_create_event(self, api_client):
        """POST /api/calendar/events creates new event"""
        now = datetime.now(timezone.utc)
        start_time = now + timedelta(days=1)
        end_time = start_time + timedelta(hours=2)
        
        test_event = {
            "title": f"TEST_Event_{uuid.uuid4().hex[:8]}",
            "description": "Test event description",
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "category": "meeting",
            "color": "#e04e35"
        }
        response = api_client.post(f"{BASE_URL}/api/calendar/events?user_id=default", json=test_event)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "event" in data
        assert data["event"]["title"] == test_event["title"]
        assert data["event"]["category"] == "meeting"
        assert "id" in data["event"]
        print(f"✓ POST /api/calendar/events - Created event '{data['event']['id']}'")
        return data["event"]["id"]
    
    def test_update_event(self, api_client):
        """PUT /api/calendar/events/{id} updates event"""
        # Create event first
        event_id = self.test_create_event(api_client)
        
        # Update it
        update_data = {
            "title": "TEST_Updated_Event_Title",
            "category": "deadline"
        }
        response = api_client.put(f"{BASE_URL}/api/calendar/events/{event_id}?user_id=default", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        print(f"✓ PUT /api/calendar/events/{event_id} - Event updated")
        return event_id
    
    def test_delete_event(self, api_client):
        """DELETE /api/calendar/events/{id} deletes event"""
        # Create event first
        event_id = self.test_create_event(api_client)
        
        # Delete it
        response = api_client.delete(f"{BASE_URL}/api/calendar/events/{event_id}?user_id=default")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        
        # Verify deletion
        get_response = api_client.get(f"{BASE_URL}/api/calendar/events/{event_id}?user_id=default")
        assert get_response.status_code == 404
        print(f"✓ DELETE /api/calendar/events/{event_id} - Event deleted")
    
    def test_get_event_categories(self, api_client):
        """GET /api/calendar/categories returns categories"""
        response = api_client.get(f"{BASE_URL}/api/calendar/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert isinstance(data["categories"], list)
        assert len(data["categories"]) > 0
        # Verify category structure
        for cat in data["categories"]:
            assert "id" in cat
            assert "name" in cat
            assert "color" in cat
        print(f"✓ GET /api/calendar/categories - Returns {len(data['categories'])} categories")
    
    def test_get_upcoming_events(self, api_client):
        """GET /api/calendar/upcoming returns upcoming events"""
        response = api_client.get(f"{BASE_URL}/api/calendar/upcoming?user_id=default&days=7")
        assert response.status_code == 200
        data = response.json()
        assert "events" in data
        assert isinstance(data["events"], list)
        print(f"✓ GET /api/calendar/upcoming - Returns {data['total']} upcoming events")


# ===================
# CRM SUITE API TESTS
# ===================

class TestCRMContacts:
    """CRM Contacts CRUD tests"""
    
    def test_get_contacts(self, api_client):
        """GET /api/crm/contacts returns contacts"""
        response = api_client.get(f"{BASE_URL}/api/crm/contacts?user_id=default")
        assert response.status_code == 200
        data = response.json()
        assert "contacts" in data
        assert isinstance(data["contacts"], list)
        assert "total" in data
        print(f"✓ GET /api/crm/contacts - Returns {data['total']} contacts")
    
    def test_create_contact(self, api_client):
        """POST /api/crm/contacts creates new contact"""
        test_contact = {
            "name": f"TEST_Contact_{uuid.uuid4().hex[:8]}",
            "email": "test@example.com",
            "phone": "555-1234",
            "status": "lead",
            "source": "website",
            "tags": ["test", "automated"]
        }
        response = api_client.post(f"{BASE_URL}/api/crm/contacts?user_id=default", json=test_contact)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "contact" in data
        assert data["contact"]["name"] == test_contact["name"]
        assert data["contact"]["status"] == "lead"
        assert "id" in data["contact"]
        print(f"✓ POST /api/crm/contacts - Created contact '{data['contact']['id']}'")
        return data["contact"]["id"]
    
    def test_update_contact(self, api_client):
        """PUT /api/crm/contacts/{id} updates contact"""
        # Create contact first
        contact_id = self.test_create_contact(api_client)
        
        # Update it
        update_data = {
            "name": "TEST_Updated_Contact",
            "status": "customer"
        }
        response = api_client.put(f"{BASE_URL}/api/crm/contacts/{contact_id}?user_id=default", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        print(f"✓ PUT /api/crm/contacts/{contact_id} - Contact updated")
        return contact_id
    
    def test_delete_contact(self, api_client):
        """DELETE /api/crm/contacts/{id} deletes contact"""
        # Create contact first
        contact_id = self.test_create_contact(api_client)
        
        # Delete it
        response = api_client.delete(f"{BASE_URL}/api/crm/contacts/{contact_id}?user_id=default")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        print(f"✓ DELETE /api/crm/contacts/{contact_id} - Contact deleted")


class TestCRMDeals:
    """CRM Deals/Pipeline tests"""
    
    def test_get_pipeline_stages(self, api_client):
        """GET /api/crm/pipeline/stages returns stages"""
        response = api_client.get(f"{BASE_URL}/api/crm/pipeline/stages")
        assert response.status_code == 200
        data = response.json()
        assert "stages" in data
        assert isinstance(data["stages"], list)
        assert len(data["stages"]) > 0
        # Verify stage structure
        for stage in data["stages"]:
            assert "id" in stage
            assert "name" in stage
            assert "probability" in stage
            assert "color" in stage
        print(f"✓ GET /api/crm/pipeline/stages - Returns {len(data['stages'])} stages")
    
    def test_create_deal(self, api_client):
        """POST /api/crm/deals creates new deal"""
        test_deal = {
            "title": f"TEST_Deal_{uuid.uuid4().hex[:8]}",
            "value": 5000.00,
            "currency": "USD",
            "stage": "lead",
            "probability": 10,
            "notes": "Test deal notes"
        }
        response = api_client.post(f"{BASE_URL}/api/crm/deals?user_id=default", json=test_deal)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "deal" in data
        assert data["deal"]["title"] == test_deal["title"]
        assert data["deal"]["value"] == test_deal["value"]
        assert data["deal"]["stage"] == "lead"
        assert "id" in data["deal"]
        print(f"✓ POST /api/crm/deals - Created deal '{data['deal']['id']}' worth ${data['deal']['value']}")
        return data["deal"]["id"]
    
    def test_get_deals(self, api_client):
        """GET /api/crm/deals returns deals"""
        response = api_client.get(f"{BASE_URL}/api/crm/deals?user_id=default")
        assert response.status_code == 200
        data = response.json()
        assert "deals" in data
        assert isinstance(data["deals"], list)
        assert "deals_by_stage" in data
        print(f"✓ GET /api/crm/deals - Returns {data['total']} deals")
    
    def test_update_deal_stage(self, api_client):
        """PUT /api/crm/deals/{id} updates deal stage"""
        # Create deal first
        deal_id = self.test_create_deal(api_client)
        
        # Update stage
        update_data = {"stage": "qualified"}
        response = api_client.put(f"{BASE_URL}/api/crm/deals/{deal_id}?user_id=default", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        print(f"✓ PUT /api/crm/deals/{deal_id} - Deal stage updated to 'qualified'")
        return deal_id
    
    def test_delete_deal(self, api_client):
        """DELETE /api/crm/deals/{id} deletes deal"""
        # Create deal first
        deal_id = self.test_create_deal(api_client)
        
        # Delete it
        response = api_client.delete(f"{BASE_URL}/api/crm/deals/{deal_id}?user_id=default")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        print(f"✓ DELETE /api/crm/deals/{deal_id} - Deal deleted")


class TestCRMAnalytics:
    """CRM Analytics tests"""
    
    def test_get_crm_analytics(self, api_client):
        """GET /api/crm/analytics returns analytics"""
        response = api_client.get(f"{BASE_URL}/api/crm/analytics?user_id=default")
        assert response.status_code == 200
        data = response.json()
        assert "contacts_by_status" in data
        assert "deals_by_stage" in data
        assert "pipeline_value" in data
        assert "total_contacts" in data
        assert "total_deals" in data
        print(f"✓ GET /api/crm/analytics - Pipeline value: ${data['pipeline_value']}")


# ===================
# SOCIAL MEDIA API TESTS
# ===================

class TestSocialPosts:
    """Social Media Posts CRUD tests"""
    
    def test_get_posts(self, api_client):
        """GET /api/social/posts returns posts"""
        response = api_client.get(f"{BASE_URL}/api/social/posts?user_id=default")
        assert response.status_code == 200
        data = response.json()
        assert "posts" in data
        assert isinstance(data["posts"], list)
        assert "total" in data
        print(f"✓ GET /api/social/posts - Returns {data['total']} posts")
    
    def test_create_post(self, api_client):
        """POST /api/social/posts creates new post"""
        now = datetime.now(timezone.utc) + timedelta(days=1)
        test_post = {
            "content": f"TEST_Post_{uuid.uuid4().hex[:8]} - This is a test social media post for automated testing.",
            "platform": "instagram",
            "scheduled_for": now.isoformat(),
            "status": "scheduled",
            "hashtags": ["test", "automated"]
        }
        response = api_client.post(f"{BASE_URL}/api/social/posts?user_id=default", json=test_post)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "post" in data
        assert data["post"]["platform"] == "instagram"
        assert data["post"]["status"] == "scheduled"
        assert "id" in data["post"]
        print(f"✓ POST /api/social/posts - Created post '{data['post']['id']}'")
        return data["post"]["id"]
    
    def test_update_post(self, api_client):
        """PUT /api/social/posts/{id} updates post"""
        # Create post first
        post_id = self.test_create_post(api_client)
        
        # Update it
        update_data = {
            "content": "TEST_Updated_Post_Content",
            "platform": "twitter"
        }
        response = api_client.put(f"{BASE_URL}/api/social/posts/{post_id}?user_id=default", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        print(f"✓ PUT /api/social/posts/{post_id} - Post updated")
        return post_id
    
    def test_publish_post(self, api_client):
        """POST /api/social/posts/{id}/publish publishes post"""
        # Create post first
        post_id = self.test_create_post(api_client)
        
        # Publish it
        response = api_client.post(f"{BASE_URL}/api/social/posts/{post_id}/publish?user_id=default")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        print(f"✓ POST /api/social/posts/{post_id}/publish - Post published")
        return post_id
    
    def test_delete_post(self, api_client):
        """DELETE /api/social/posts/{id} deletes post"""
        # Create post first
        post_id = self.test_create_post(api_client)
        
        # Delete it
        response = api_client.delete(f"{BASE_URL}/api/social/posts/{post_id}?user_id=default")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        print(f"✓ DELETE /api/social/posts/{post_id} - Post deleted")
    
    def test_get_platforms(self, api_client):
        """GET /api/social/platforms returns platforms"""
        response = api_client.get(f"{BASE_URL}/api/social/platforms")
        assert response.status_code == 200
        data = response.json()
        assert "platforms" in data
        assert isinstance(data["platforms"], list)
        assert len(data["platforms"]) > 0
        # Verify platform structure
        for platform in data["platforms"]:
            assert "id" in platform
            assert "name" in platform
            assert "char_limit" in platform
        print(f"✓ GET /api/social/platforms - Returns {len(data['platforms'])} platforms")


class TestSocialAnalytics:
    """Social Media Analytics tests"""
    
    def test_get_social_analytics(self, api_client):
        """GET /api/social/analytics returns analytics"""
        response = api_client.get(f"{BASE_URL}/api/social/analytics?user_id=default")
        assert response.status_code == 200
        data = response.json()
        assert "posts_by_platform" in data
        assert "posts_by_status" in data
        assert "total_posts" in data
        print(f"✓ GET /api/social/analytics - Total posts: {data['total_posts']}")


class TestSocialGenerate:
    """Social Media AI Generation tests"""
    
    def test_generate_social_content(self, api_client):
        """POST /api/social/generate generates AI content"""
        payload = {
            "topic": "Brand building tips",
            "platform": "instagram",
            "tone": "professional",
            "include_hashtags": True,
            "include_cta": True
        }
        response = api_client.post(f"{BASE_URL}/api/social/generate?user_id=default", json=payload, timeout=30)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "generated_content" in data
        assert "platform" in data
        print(f"✓ POST /api/social/generate - AI generated content for {data['platform']}")


# ===================
# CLEANUP (removed module-scoped fixture due to scope mismatch)
# ===================
