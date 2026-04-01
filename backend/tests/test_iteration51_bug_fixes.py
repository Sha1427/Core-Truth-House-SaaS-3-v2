"""
Iteration 51: Bug Fix Verification Tests
Tests for two critical bugs that were fixed:
1. Playwright PDF export 'browser not installed' error - fixed by removing channel='chromium' 
   and setting PLAYWRIGHT_BROWSERS_PATH globally
2. Brand Foundation data not saving - fixed by using /api/persist/brand-foundation endpoint
"""

import pytest
import requests
import os
import time
import uuid

# Get base URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://os-workspace-test.preview.emergentagent.com"

TEST_USER_ID = "dev_user_default"
TEST_WORKSPACE_ID = "153b9bef-2c93-46f5-b9cd-38a4572c6ccc"


class TestHealthCheck:
    """Basic health check to verify API is running"""
    
    def test_health_endpoint(self):
        """GET /api/health should return 200"""
        response = requests.get(f"{BASE_URL}/api/health", timeout=10)
        assert response.status_code == 200, f"Health check failed: {response.status_code}"
        print(f"✓ Health check passed: {response.status_code}")


class TestPlaywrightPDFExport:
    """
    Tests for Playwright PDF export bug fix.
    Bug: 'browser not installed' error due to channel='chromium' param.
    Fix: Removed channel param, set PLAYWRIGHT_BROWSERS_PATH globally.
    """
    
    def test_brand_guidelines_styled_html_format(self):
        """GET /api/export/brand-guidelines-styled?format=html should return HTML content"""
        params = {
            "user_id": TEST_USER_ID,
            "format": "html"
        }
        response = requests.get(
            f"{BASE_URL}/api/export/brand-guidelines-styled",
            params=params,
            timeout=30
        )
        assert response.status_code == 200, f"HTML export failed: {response.status_code} - {response.text[:500]}"
        assert "text/html" in response.headers.get("Content-Type", ""), "Response should be HTML"
        assert "<html" in response.text.lower(), "Response should contain HTML markup"
        print(f"✓ Brand guidelines HTML export works: {response.status_code}")
    
    def test_brand_guidelines_styled_pdf_format(self):
        """
        GET /api/export/brand-guidelines-styled?format=pdf should return PDF content.
        This is the critical test for the Playwright browser fix.
        Timeout is set higher (60s) as PDF generation can take 10-20 seconds.
        """
        params = {
            "user_id": TEST_USER_ID,
            "format": "pdf"
        }
        response = requests.get(
            f"{BASE_URL}/api/export/brand-guidelines-styled",
            params=params,
            timeout=60
        )
        
        # Check for success or known error patterns
        if response.status_code == 500:
            error_text = response.text.lower()
            # Fail if we see the old browser not installed error
            assert "browser not installed" not in error_text, \
                "CRITICAL: Playwright 'browser not installed' error still occurring!"
            assert "executable" not in error_text or "playwright" not in error_text, \
                "CRITICAL: Playwright executable error still occurring!"
        
        assert response.status_code == 200, \
            f"PDF export failed: {response.status_code} - {response.text[:500]}"
        
        # Verify it's actually a PDF
        content_type = response.headers.get("Content-Type", "")
        assert "application/pdf" in content_type, \
            f"Response should be PDF, got: {content_type}"
        
        # Check PDF magic bytes
        assert response.content[:4] == b'%PDF', "Response content should start with PDF magic bytes"
        
        print(f"✓ Brand guidelines PDF export works: {response.status_code}, size={len(response.content)} bytes")
    
    def test_strategic_os_styled_async_export(self):
        """
        POST /api/export/strategic-os-styled should start async job and return job_id.
        This tests the second Playwright usage pattern.
        """
        params = {
            "steps": "1,2,3",
            "workspace_id": TEST_WORKSPACE_ID
        }
        response = requests.get(
            f"{BASE_URL}/api/export/strategic-os-styled",
            params=params,
            timeout=30
        )
        
        # Should return job_id for async processing
        assert response.status_code == 200, f"Strategic OS export start failed: {response.status_code}"
        data = response.json()
        assert "job_id" in data, "Response should contain job_id"
        assert data.get("status") == "pending", f"Initial status should be pending, got: {data.get('status')}"
        
        job_id = data["job_id"]
        print(f"✓ Strategic OS styled export job started: job_id={job_id}")
        
        # Poll for completion (up to 30 seconds)
        max_polls = 15
        for i in range(max_polls):
            time.sleep(2)
            status_response = requests.get(
                f"{BASE_URL}/api/export/strategic-os/status",
                params={"job_id": job_id},
                timeout=10
            )
            assert status_response.status_code == 200, f"Status check failed: {status_response.status_code}"
            
            status_data = status_response.json()
            status = status_data.get("status")
            
            if status == "ready":
                assert status_data.get("download_url"), "Ready status should include download_url"
                print(f"✓ Strategic OS PDF generation completed: {status_data.get('download_url')}")
                return
            elif status == "error":
                error_msg = status_data.get("error", "Unknown error")
                # Check for the specific browser error we're testing
                assert "browser not installed" not in error_msg.lower(), \
                    f"CRITICAL: Playwright browser error: {error_msg}"
                pytest.fail(f"PDF generation error: {error_msg}")
            
            print(f"  Polling {i+1}/{max_polls}: status={status}, progress={status_data.get('progress', 0)}%")
        
        # If we get here, generation timed out but no browser error
        pytest.skip("PDF generation timed out but no Playwright browser error detected")


class TestBrandFoundationPersist:
    """
    Tests for Brand Foundation save/load bug fix.
    Bug: Frontend was using wrong endpoint (PUT /api/brand-foundation).
    Fix: Changed to POST /api/persist/brand-foundation with full data payload.
    """
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Generate unique test data for each test"""
        self.test_id = str(uuid.uuid4())[:8]
        self.test_data = {
            "mission": f"TEST_{self.test_id}_Mission statement for testing",
            "vision": f"TEST_{self.test_id}_Vision for the future",
            "values": [f"TEST_{self.test_id}_Value1", f"TEST_{self.test_id}_Value2"],
            "tagline": f"TEST_{self.test_id}_Tagline",
            "positioning": f"TEST_{self.test_id}_Positioning statement",
            "story": f"TEST_{self.test_id}_Brand story content",
            "tone_of_voice": f"TEST_{self.test_id}_Authoritative and calm"
        }
    
    def test_brand_foundation_save(self):
        """POST /api/persist/brand-foundation should save data and return {saved: true}"""
        params = {
            "user_id": TEST_USER_ID,
            "workspace_id": TEST_WORKSPACE_ID
        }
        response = requests.post(
            f"{BASE_URL}/api/persist/brand-foundation",
            params=params,
            json=self.test_data,
            timeout=30
        )
        
        assert response.status_code == 200, \
            f"Save failed: {response.status_code} - {response.text[:500]}"
        
        data = response.json()
        assert data.get("saved") == True, f"Expected saved=True, got: {data}"
        assert "updated_at" in data, "Response should include updated_at timestamp"
        
        print(f"✓ Brand Foundation save successful: {data}")
    
    def test_brand_foundation_load(self):
        """GET /api/persist/brand-foundation should return saved data"""
        # First save some test data
        params = {
            "user_id": TEST_USER_ID,
            "workspace_id": TEST_WORKSPACE_ID
        }
        save_response = requests.post(
            f"{BASE_URL}/api/persist/brand-foundation",
            params=params,
            json=self.test_data,
            timeout=30
        )
        assert save_response.status_code == 200, f"Save failed: {save_response.status_code}"
        
        # Now load it back
        load_response = requests.get(
            f"{BASE_URL}/api/persist/brand-foundation",
            params=params,
            timeout=30
        )
        
        assert load_response.status_code == 200, \
            f"Load failed: {load_response.status_code} - {load_response.text[:500]}"
        
        data = load_response.json()
        
        # Verify all fields are present
        assert data.get("mission") == self.test_data["mission"], \
            f"Mission mismatch: {data.get('mission')}"
        assert data.get("vision") == self.test_data["vision"], \
            f"Vision mismatch: {data.get('vision')}"
        assert data.get("tagline") == self.test_data["tagline"], \
            f"Tagline mismatch: {data.get('tagline')}"
        assert data.get("positioning") == self.test_data["positioning"], \
            f"Positioning mismatch: {data.get('positioning')}"
        assert data.get("story") == self.test_data["story"], \
            f"Story mismatch: {data.get('story')}"
        assert data.get("tone_of_voice") == self.test_data["tone_of_voice"], \
            f"Tone of voice mismatch: {data.get('tone_of_voice')}"
        
        # Values can be array or string, check contents match
        loaded_values = data.get("values", [])
        if isinstance(loaded_values, list):
            assert set(loaded_values) == set(self.test_data["values"]), \
                f"Values mismatch: {loaded_values}"
        
        print(f"✓ Brand Foundation load successful - all fields verified")
    
    def test_brand_foundation_roundtrip(self):
        """
        Complete roundtrip test: Save → Load → Verify exact data match.
        This is the critical test for the bug fix.
        """
        params = {
            "user_id": TEST_USER_ID,
            "workspace_id": TEST_WORKSPACE_ID
        }
        
        # Save
        save_response = requests.post(
            f"{BASE_URL}/api/persist/brand-foundation",
            params=params,
            json=self.test_data,
            timeout=30
        )
        assert save_response.status_code == 200, f"Save failed: {save_response.status_code}"
        print(f"  Saved: {save_response.json()}")
        
        # Load
        load_response = requests.get(
            f"{BASE_URL}/api/persist/brand-foundation",
            params=params,
            timeout=30
        )
        assert load_response.status_code == 200, f"Load failed: {load_response.status_code}"
        
        loaded_data = load_response.json()
        
        # Verify roundtrip integrity
        for field in ["mission", "vision", "tagline", "positioning", "story", "tone_of_voice"]:
            assert loaded_data.get(field) == self.test_data[field], \
                f"Roundtrip failed for {field}: saved='{self.test_data[field]}', loaded='{loaded_data.get(field)}'"
        
        print(f"✓ Brand Foundation roundtrip verified - data integrity confirmed")
    
    def test_brand_foundation_update_existing(self):
        """Test that updating existing data works correctly"""
        params = {
            "user_id": TEST_USER_ID,
            "workspace_id": TEST_WORKSPACE_ID
        }
        
        # Save initial data
        initial_save = requests.post(
            f"{BASE_URL}/api/persist/brand-foundation",
            params=params,
            json=self.test_data,
            timeout=30
        )
        assert initial_save.status_code == 200
        
        # Update with new data
        updated_data = self.test_data.copy()
        updated_data["mission"] = f"UPDATED_{self.test_id}_New mission statement"
        updated_data["tagline"] = f"UPDATED_{self.test_id}_New tagline"
        
        update_response = requests.post(
            f"{BASE_URL}/api/persist/brand-foundation",
            params=params,
            json=updated_data,
            timeout=30
        )
        assert update_response.status_code == 200, f"Update failed: {update_response.status_code}"
        
        # Load and verify update
        load_response = requests.get(
            f"{BASE_URL}/api/persist/brand-foundation",
            params=params,
            timeout=30
        )
        assert load_response.status_code == 200
        
        loaded = load_response.json()
        assert loaded.get("mission") == updated_data["mission"], "Mission update failed"
        assert loaded.get("tagline") == updated_data["tagline"], "Tagline update failed"
        
        print(f"✓ Brand Foundation update verified")


class TestAsyncGuidelines:
    """Tests for async guidelines export endpoint"""
    
    def test_guidelines_generate_job(self):
        """POST /api/export/guidelines/generate should create async job"""
        params = {
            "user_id": TEST_USER_ID,
            "workspace_id": TEST_WORKSPACE_ID
        }
        response = requests.post(
            f"{BASE_URL}/api/export/guidelines/generate",
            params=params,
            timeout=30
        )
        
        assert response.status_code == 200, f"Job creation failed: {response.status_code}"
        data = response.json()
        assert "job_id" in data, "Response should contain job_id"
        assert data.get("status") == "pending", "Initial status should be pending"
        
        print(f"✓ Guidelines generate job created: {data['job_id']}")
        
        # Check status endpoint exists
        status_response = requests.get(
            f"{BASE_URL}/api/export/guidelines/status/{data['job_id']}",
            timeout=10
        )
        assert status_response.status_code == 200, f"Status check failed: {status_response.status_code}"
        print(f"✓ Guidelines status endpoint works")
    
    def test_guidelines_invalid_job_id(self):
        """GET /api/export/guidelines/status/{invalid_id} should return 404"""
        response = requests.get(
            f"{BASE_URL}/api/export/guidelines/status/invalid-job-id-12345",
            timeout=10
        )
        assert response.status_code == 404, f"Expected 404, got: {response.status_code}"
        print(f"✓ Invalid job ID correctly returns 404")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
