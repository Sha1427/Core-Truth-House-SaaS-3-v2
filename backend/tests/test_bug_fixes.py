"""
Tests for bug fixes - Identity Studio, Blog CMS, Settings workspace
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://os-workspace-test.preview.emergentagent.com')

class TestIdentityStudio:
    """Tests for Identity Studio - Color palette and fonts saving"""
    
    def test_get_identity_default(self):
        """Test getting identity (returns saved or default)"""
        response = requests.get(f"{BASE_URL}/api/identity?user_id=fresh_test_user_identity")
        assert response.status_code == 200
        data = response.json()
        # Should have colors (either saved or default)
        assert 'colors' in data
        assert isinstance(data['colors'], list)
        assert len(data['colors']) >= 1
    
    def test_save_identity_colors(self):
        """Test saving brand colors"""
        test_colors = [
            {"name": "Primary", "hex": "#FF0000"},
            {"name": "Secondary", "hex": "#00FF00"},
            {"name": "Accent", "hex": "#0000FF"},
            {"name": "Background", "hex": "#1c0828"},
            {"name": "Text", "hex": "#f8f5fa"}
        ]
        test_fonts = {"heading": "Montserrat", "body": "Open Sans"}
        
        response = requests.post(
            f"{BASE_URL}/api/identity/save?user_id=test_user",
            json={"colors": test_colors, "fonts": test_fonts}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get('success') == True
    
    def test_identity_persistence(self):
        """Test that saved identity persists"""
        # First save
        test_colors = [
            {"name": "Primary", "hex": "#123456"},
            {"name": "Secondary", "hex": "#654321"},
            {"name": "Accent", "hex": "#AABBCC"}
        ]
        test_fonts = {"heading": "Bebas Neue", "body": "Roboto"}
        
        save_response = requests.post(
            f"{BASE_URL}/api/identity/save?user_id=test_persist_user",
            json={"colors": test_colors, "fonts": test_fonts}
        )
        assert save_response.status_code == 200
        
        # Then retrieve
        get_response = requests.get(f"{BASE_URL}/api/identity?user_id=test_persist_user")
        assert get_response.status_code == 200
        data = get_response.json()
        
        assert data['colors'][0]['hex'] == "#123456"
        assert data['fonts']['heading'] == "Bebas Neue"


class TestBlogCMS:
    """Tests for Blog CMS - Article CRUD and API paths"""
    
    def test_get_articles(self):
        """Test getting articles list"""
        response = requests.get(f"{BASE_URL}/api/blog/articles?user_id=test_user")
        assert response.status_code == 200
        data = response.json()
        assert 'articles' in data
    
    def test_get_analytics(self):
        """Test getting blog analytics"""
        response = requests.get(f"{BASE_URL}/api/blog/analytics?user_id=test_user")
        assert response.status_code == 200
        data = response.json()
        assert 'articles_by_status' in data
    
    def test_create_article(self):
        """Test creating a new article"""
        article_data = {
            "title": "TEST_Blog Post",
            "content": "This is test content for the blog post.",
            "excerpt": "Test excerpt",
            "status": "draft",
            "tags": ["test", "blog"]
        }
        response = requests.post(
            f"{BASE_URL}/api/blog/articles?user_id=test_user",
            json=article_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get('success') == True
        assert 'article' in data
        return data['article']['id']
    
    def test_blog_generate_endpoint(self):
        """Test that /api/blog/generate endpoint exists and accepts requests"""
        # This tests the API path fix from /blog/generate to /api/blog/generate
        response = requests.post(
            f"{BASE_URL}/api/blog/generate?user_id=test_user",
            json={
                "topic": "Test topic",
                "keywords": [],
                "tone": "professional",
                "word_count": 100,
                "include_outline": False
            }
        )
        # Should return 200 even if AI fails (due to missing keys)
        assert response.status_code == 200
        data = response.json()
        assert 'generated' in data or 'success' in data


class TestSettingsWorkspace:
    """Tests for Settings - Workspace name change"""
    
    def test_get_workspaces(self):
        """Test getting workspaces"""
        response = requests.get(f"{BASE_URL}/api/workspaces")
        assert response.status_code == 200
        data = response.json()
        # Should return list of workspaces
        assert isinstance(data, list) or 'workspaces' in data
    
    def test_update_workspace(self):
        """Test updating workspace brand name"""
        # First get workspaces to find a workspace ID
        get_response = requests.get(f"{BASE_URL}/api/workspaces")
        assert get_response.status_code == 200
        
        workspaces = get_response.json()
        if isinstance(workspaces, list) and len(workspaces) > 0:
            workspace_id = workspaces[0].get('id')
            if workspace_id:
                # Update the brand name
                update_response = requests.put(
                    f"{BASE_URL}/api/workspaces/{workspace_id}",
                    json={"brand_name": "TEST_Updated Brand Name"}
                )
                assert update_response.status_code in [200, 201]


class TestHealthCheck:
    """Basic health checks"""
    
    def test_dashboard_endpoint(self):
        """Test dashboard API"""
        response = requests.get(f"{BASE_URL}/api/dashboard")
        assert response.status_code == 200
    
    def test_user_plan(self):
        """Test user plan API (dev mode)"""
        response = requests.get(f"{BASE_URL}/api/user/plan?user_id=dev_user_default")
        assert response.status_code == 200
        data = response.json()
        assert 'plan' in data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
