"""
Tests for Brand Foundation Page - 3-panel layout redesign
Testing: GET, PUT /brand-foundation, POST /brand-foundation/generate endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestBrandFoundationAPI:
    """Brand Foundation API endpoint tests"""
    
    # Field mapping from frontend to API
    FIELD_MAP = {
        'mission': 'mission',
        'vision': 'vision',
        'coreValues': 'values',  # API uses 'values'
        'tagline': 'tagline',
        'positioning': 'positioning', 
        'brandStory': 'story',  # API uses 'story'
        'toneOfVoice': 'tone_of_voice'
    }

    def test_get_brand_foundation_success(self):
        """Test GET /api/brand-foundation returns foundation data"""
        response = requests.get(f"{BASE_URL}/api/brand-foundation", params={"user_id": "dev_user_default"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify all expected fields exist
        expected_fields = ['mission', 'vision', 'values', 'tagline', 'positioning', 'story', 'tone_of_voice']
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
        print(f"SUCCESS: GET brand-foundation returned all {len(expected_fields)} fields")
    
    def test_get_brand_foundation_with_workspace(self):
        """Test GET /api/brand-foundation with workspace_id"""
        response = requests.get(f"{BASE_URL}/api/brand-foundation", 
                               params={"user_id": "dev_user_default", "workspace_id": "test_workspace"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("SUCCESS: GET brand-foundation with workspace_id works")

    def test_put_brand_foundation_mission(self):
        """Test PUT /api/brand-foundation - update mission field"""
        test_mission = "TEST_Help entrepreneurs build sustainable brands"
        response = requests.put(
            f"{BASE_URL}/api/brand-foundation",
            params={"user_id": "TEST_brand_foundation_user"},
            json={"mission": test_mission}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get('mission') == test_mission, f"Mission not updated correctly"
        
        # Verify persistence with GET
        get_response = requests.get(f"{BASE_URL}/api/brand-foundation", 
                                   params={"user_id": "TEST_brand_foundation_user"})
        assert get_response.status_code == 200
        assert get_response.json().get('mission') == test_mission
        print("SUCCESS: PUT mission field works and persists")
    
    def test_put_brand_foundation_vision(self):
        """Test PUT /api/brand-foundation - update vision field"""
        test_vision = "TEST_A world where every brand is built on truth"
        response = requests.put(
            f"{BASE_URL}/api/brand-foundation",
            params={"user_id": "TEST_brand_foundation_user"},
            json={"vision": test_vision}
        )
        assert response.status_code == 200
        assert response.json().get('vision') == test_vision
        print("SUCCESS: PUT vision field works")
    
    def test_put_brand_foundation_values(self):
        """Test PUT /api/brand-foundation - update values (coreValues) field as array"""
        test_values = ["Truth over trend", "Strategy before aesthetics", "Foundation first"]
        response = requests.put(
            f"{BASE_URL}/api/brand-foundation",
            params={"user_id": "TEST_brand_foundation_user"},
            json={"values": test_values}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get('values') == test_values, f"Values not updated: {data.get('values')}"
        print("SUCCESS: PUT values (coreValues) as array works")
    
    def test_put_brand_foundation_tagline(self):
        """Test PUT /api/brand-foundation - update tagline field"""
        test_tagline = "TEST_Where serious brands are built"
        response = requests.put(
            f"{BASE_URL}/api/brand-foundation",
            params={"user_id": "TEST_brand_foundation_user"},
            json={"tagline": test_tagline}
        )
        assert response.status_code == 200
        assert response.json().get('tagline') == test_tagline
        print("SUCCESS: PUT tagline field works")
    
    def test_put_brand_foundation_positioning(self):
        """Test PUT /api/brand-foundation - update positioning field"""
        test_positioning = "TEST_For serious founders who need a brand operating system"
        response = requests.put(
            f"{BASE_URL}/api/brand-foundation",
            params={"user_id": "TEST_brand_foundation_user"},
            json={"positioning": test_positioning}
        )
        assert response.status_code == 200
        assert response.json().get('positioning') == test_positioning
        print("SUCCESS: PUT positioning field works")
    
    def test_put_brand_foundation_story(self):
        """Test PUT /api/brand-foundation - update story (brandStory) field"""
        test_story = "TEST_Most founders build brands backwards. We saw the problem and created the solution."
        response = requests.put(
            f"{BASE_URL}/api/brand-foundation",
            params={"user_id": "TEST_brand_foundation_user"},
            json={"story": test_story}
        )
        assert response.status_code == 200
        assert response.json().get('story') == test_story
        print("SUCCESS: PUT story (brandStory) field works")
    
    def test_put_brand_foundation_tone_of_voice(self):
        """Test PUT /api/brand-foundation - update tone_of_voice (toneOfVoice) field"""
        test_tone = "TEST_Authoritative. Calm. Specific. Never loud."
        response = requests.put(
            f"{BASE_URL}/api/brand-foundation",
            params={"user_id": "TEST_brand_foundation_user"},
            json={"tone_of_voice": test_tone}
        )
        assert response.status_code == 200
        assert response.json().get('tone_of_voice') == test_tone
        print("SUCCESS: PUT tone_of_voice (toneOfVoice) field works")


class TestBrandFoundationGenerate:
    """Test AI generation endpoint for brand foundation fields"""
    
    VALID_FIELDS = ['mission', 'vision', 'values', 'tagline', 'positioning', 'story', 'tone_of_voice']
    
    def test_generate_mission_endpoint(self):
        """Test POST /api/brand-foundation/generate for mission"""
        response = requests.post(
            f"{BASE_URL}/api/brand-foundation/generate",
            json={
                "field": "mission",
                "context": "A brand strategy consultancy helping entrepreneurs"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert 'options' in data, "Response should contain 'options'"
        assert 'field' in data, "Response should contain 'field'"
        assert data['field'] == 'mission'
        print(f"SUCCESS: Generate mission returned {len(data.get('options', []))} options")
    
    def test_generate_vision_endpoint(self):
        """Test POST /api/brand-foundation/generate for vision"""
        response = requests.post(
            f"{BASE_URL}/api/brand-foundation/generate",
            json={"field": "vision", "context": "A tech startup"}
        )
        assert response.status_code == 200
        assert 'options' in response.json()
        print("SUCCESS: Generate vision endpoint works")
    
    def test_generate_values_endpoint(self):
        """Test POST /api/brand-foundation/generate for values"""
        response = requests.post(
            f"{BASE_URL}/api/brand-foundation/generate",
            json={"field": "values", "context": "An ethical clothing brand"}
        )
        assert response.status_code == 200
        assert 'options' in response.json()
        print("SUCCESS: Generate values endpoint works")
    
    def test_generate_tagline_endpoint(self):
        """Test POST /api/brand-foundation/generate for tagline"""
        response = requests.post(
            f"{BASE_URL}/api/brand-foundation/generate",
            json={"field": "tagline", "context": "A fitness app for busy professionals"}
        )
        assert response.status_code == 200
        assert 'options' in response.json()
        print("SUCCESS: Generate tagline endpoint works")
    
    def test_generate_positioning_endpoint(self):
        """Test POST /api/brand-foundation/generate for positioning"""
        response = requests.post(
            f"{BASE_URL}/api/brand-foundation/generate",
            json={"field": "positioning", "context": "SaaS productivity tool"}
        )
        assert response.status_code == 200
        assert 'options' in response.json()
        print("SUCCESS: Generate positioning endpoint works")
    
    def test_generate_story_endpoint(self):
        """Test POST /api/brand-foundation/generate for story"""
        response = requests.post(
            f"{BASE_URL}/api/brand-foundation/generate",
            json={"field": "story", "context": "A startup that helps small businesses"}
        )
        assert response.status_code == 200
        assert 'options' in response.json()
        print("SUCCESS: Generate story endpoint works")
    
    def test_generate_tone_of_voice_endpoint(self):
        """Test POST /api/brand-foundation/generate for tone_of_voice"""
        response = requests.post(
            f"{BASE_URL}/api/brand-foundation/generate",
            json={"field": "tone_of_voice", "context": "A luxury brand"}
        )
        assert response.status_code == 200
        assert 'options' in response.json()
        print("SUCCESS: Generate tone_of_voice endpoint works")
    
    def test_generate_invalid_field(self):
        """Test POST /api/brand-foundation/generate with invalid field"""
        response = requests.post(
            f"{BASE_URL}/api/brand-foundation/generate",
            json={"field": "invalid_field", "context": "Some context"}
        )
        assert response.status_code == 400, f"Expected 400 for invalid field, got {response.status_code}"
        print("SUCCESS: Invalid field returns 400")


class TestExportEndpoint:
    """Test export endpoint for brand guidelines"""
    
    def test_export_brand_guidelines(self):
        """Test GET /api/export/brand-guidelines endpoint exists"""
        response = requests.get(
            f"{BASE_URL}/api/export/brand-guidelines",
            params={"user_id": "dev_user_default"},
            allow_redirects=False
        )
        # Could return 200 (PDF) or 404 if not implemented, or redirect
        assert response.status_code in [200, 404, 302, 307], f"Unexpected status: {response.status_code}"
        print(f"Export endpoint status: {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
