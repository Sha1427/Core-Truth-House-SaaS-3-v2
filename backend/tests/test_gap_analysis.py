"""Gap Analysis Backend Tests - Contact API"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')

class TestContactAPI:
    """Test Contact Form API"""
    
    def test_contact_form_submit_success(self):
        """Test successful contact form submission"""
        payload = {
            "name": "TEST_John Doe",
            "email": "test@example.com",
            "businessName": "Test Brand Inc",
            "subject": "I have a question about the platform",
            "message": "This is a test message from automated testing. Please ignore."
        }
        response = requests.post(f"{BASE_URL}/api/contact", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "message" in data
        print(f"✓ Contact form submitted successfully: {data}")
    
    def test_contact_form_without_business_name(self):
        """Test contact form without optional business name"""
        payload = {
            "name": "TEST_Jane Smith",
            "email": "jane@test.com",
            "subject": "Something else",
            "message": "Testing contact form without business name field."
        }
        response = requests.post(f"{BASE_URL}/api/contact", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        print(f"✓ Contact form without business name succeeded: {data}")
    
    def test_contact_form_missing_required_fields(self):
        """Test contact form with missing required fields"""
        payload = {
            "name": "TEST_Incomplete",
            "email": "incomplete@test.com"
            # Missing subject and message
        }
        response = requests.post(f"{BASE_URL}/api/contact", json=payload)
        
        # Should return 422 for validation error
        assert response.status_code == 422, f"Expected 422 for missing fields, got {response.status_code}"
        print(f"✓ Contact form validation working - rejected incomplete submission")
    
    def test_get_contact_messages(self):
        """Test retrieving contact messages (admin endpoint)"""
        response = requests.get(f"{BASE_URL}/api/contact")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "messages" in data
        assert isinstance(data["messages"], list)
        print(f"✓ Contact messages retrieved: {len(data['messages'])} messages found")
        
        # Verify our test messages are there
        test_messages = [m for m in data["messages"] if m.get("name", "").startswith("TEST_")]
        print(f"  - Found {len(test_messages)} test messages")


class TestPublicPages:
    """Test public page endpoints (About, Contact, 404)"""
    
    def test_about_page_loads(self):
        """Test About page is accessible"""
        response = requests.get(f"{BASE_URL}/about")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "Core Truth House" in response.text or "ct-logo" in response.text
        print(f"✓ About page loads successfully")
    
    def test_contact_page_loads(self):
        """Test Contact page is accessible"""
        response = requests.get(f"{BASE_URL}/contact")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "Core Truth House" in response.text or "ct-logo" in response.text
        print(f"✓ Contact page loads successfully")
    
    def test_404_page_for_nonexistent_route(self):
        """Test 404 page displays for non-existent routes"""
        response = requests.get(f"{BASE_URL}/random-page-that-does-not-exist")
        
        # Frontend SPA returns 200 with 404 content (React Router handles routing)
        assert response.status_code == 200, f"Expected 200 (SPA), got {response.status_code}"
        # The page should contain our app content (SPA serves index.html)
        print(f"✓ Non-existent route returns SPA (404 handled by React Router)")
    
    def test_landing_page_loads(self):
        """Test landing page is accessible"""
        response = requests.get(f"{BASE_URL}/")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ Landing page loads successfully")


class TestHealthCheck:
    """Quick health check"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"✓ API health check passed: {data}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
