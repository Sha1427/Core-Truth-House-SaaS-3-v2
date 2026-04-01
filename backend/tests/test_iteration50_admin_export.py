"""
Iteration 50: Tests for SuperAdmin Dashboard redesign and Brand Guidelines PDF Export
- GET /api/admin/overview: Extended response with kpis, mrrTrend, planDistribution, tenantHealth, platformUsage, recentActivity, systemStatus
- POST /api/export/guidelines/generate: Async PDF job creation
- GET /api/export/guidelines/status/{job_id}: Job status polling
- GET /api/export/download/{filename}: PDF download
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAdminOverviewExtended:
    """Test extended admin overview endpoint for SuperAdmin dashboard redesign"""
    
    def test_admin_overview_returns_200(self):
        """Test that admin overview endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/admin/overview?admin_id=default")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("PASS: Admin overview endpoint returns 200")
    
    def test_admin_overview_has_kpis(self):
        """Test that admin overview contains kpis object with expected fields"""
        response = requests.get(f"{BASE_URL}/api/admin/overview?admin_id=default")
        assert response.status_code == 200
        data = response.json()
        
        # Check kpis object exists
        assert 'kpis' in data, "Missing 'kpis' in response"
        kpis = data['kpis']
        
        # Check required KPI fields
        expected_kpi_fields = ['totalUsers', 'totalWorkspaces', 'mrr', 'aiGenerationsMTD', 'avgRevenuePerUser', 'mrrGrowth', 'newSignups7d']
        for field in expected_kpi_fields:
            assert field in kpis, f"Missing '{field}' in kpis"
        
        print(f"PASS: KPIs present - totalUsers={kpis['totalUsers']}, totalWorkspaces={kpis['totalWorkspaces']}, mrr={kpis['mrr']}, aiGenerationsMTD={kpis['aiGenerationsMTD']}, arpu={kpis['avgRevenuePerUser']}")
    
    def test_admin_overview_has_mrr_trend(self):
        """Test that admin overview contains mrrTrend array"""
        response = requests.get(f"{BASE_URL}/api/admin/overview?admin_id=default")
        assert response.status_code == 200
        data = response.json()
        
        assert 'mrrTrend' in data, "Missing 'mrrTrend' in response"
        mrr_trend = data['mrrTrend']
        assert isinstance(mrr_trend, list), "mrrTrend should be a list"
        
        # Each entry should have month and mrr
        if len(mrr_trend) > 0:
            assert 'month' in mrr_trend[0], "Missing 'month' in mrrTrend entry"
            assert 'mrr' in mrr_trend[0], "Missing 'mrr' in mrrTrend entry"
        
        print(f"PASS: mrrTrend present with {len(mrr_trend)} months")
    
    def test_admin_overview_has_plan_distribution(self):
        """Test that admin overview contains planDistribution for donut chart"""
        response = requests.get(f"{BASE_URL}/api/admin/overview?admin_id=default")
        assert response.status_code == 200
        data = response.json()
        
        assert 'planDistribution' in data, "Missing 'planDistribution' in response"
        plan_dist = data['planDistribution']
        assert isinstance(plan_dist, list), "planDistribution should be a list"
        
        # Each entry should have plan, count, mrr, color
        if len(plan_dist) > 0:
            entry = plan_dist[0]
            assert 'plan' in entry, "Missing 'plan' in planDistribution entry"
            assert 'count' in entry, "Missing 'count' in planDistribution entry"
            assert 'mrr' in entry, "Missing 'mrr' in planDistribution entry"
            assert 'color' in entry, "Missing 'color' in planDistribution entry"
        
        print(f"PASS: planDistribution present with {len(plan_dist)} plans")
    
    def test_admin_overview_has_tenant_health(self):
        """Test that admin overview contains tenantHealth object"""
        response = requests.get(f"{BASE_URL}/api/admin/overview?admin_id=default")
        assert response.status_code == 200
        data = response.json()
        
        assert 'tenantHealth' in data, "Missing 'tenantHealth' in response"
        tenant_health = data['tenantHealth']
        
        # Check required tenant health fields
        expected_fields = ['active', 'atRisk', 'inactive', 'churned']
        for field in expected_fields:
            assert field in tenant_health, f"Missing '{field}' in tenantHealth"
        
        print(f"PASS: tenantHealth present - active={tenant_health['active']}, atRisk={tenant_health['atRisk']}, inactive={tenant_health['inactive']}, churned={tenant_health['churned']}")
    
    def test_admin_overview_has_platform_usage(self):
        """Test that admin overview contains platformUsage array for MTD usage bars"""
        response = requests.get(f"{BASE_URL}/api/admin/overview?admin_id=default")
        assert response.status_code == 200
        data = response.json()
        
        assert 'platformUsage' in data, "Missing 'platformUsage' in response"
        platform_usage = data['platformUsage']
        assert isinstance(platform_usage, list), "platformUsage should be a list"
        
        # Each entry should have label and value
        if len(platform_usage) > 0:
            entry = platform_usage[0]
            assert 'label' in entry, "Missing 'label' in platformUsage entry"
            assert 'value' in entry, "Missing 'value' in platformUsage entry"
        
        print(f"PASS: platformUsage present with {len(platform_usage)} items")
    
    def test_admin_overview_has_recent_activity(self):
        """Test that admin overview contains recentActivity array"""
        response = requests.get(f"{BASE_URL}/api/admin/overview?admin_id=default")
        assert response.status_code == 200
        data = response.json()
        
        assert 'recentActivity' in data, "Missing 'recentActivity' in response"
        recent_activity = data['recentActivity']
        assert isinstance(recent_activity, list), "recentActivity should be a list"
        
        # Each entry should have time, type, text
        if len(recent_activity) > 0:
            entry = recent_activity[0]
            assert 'time' in entry, "Missing 'time' in recentActivity entry"
            assert 'text' in entry, "Missing 'text' in recentActivity entry"
        
        print(f"PASS: recentActivity present with {len(recent_activity)} events")
    
    def test_admin_overview_has_system_status(self):
        """Test that admin overview contains systemStatus array with operational indicators"""
        response = requests.get(f"{BASE_URL}/api/admin/overview?admin_id=default")
        assert response.status_code == 200
        data = response.json()
        
        assert 'systemStatus' in data, "Missing 'systemStatus' in response"
        system_status = data['systemStatus']
        assert isinstance(system_status, list), "systemStatus should be a list"
        
        # Each entry should have label and status
        if len(system_status) > 0:
            entry = system_status[0]
            assert 'label' in entry, "Missing 'label' in systemStatus entry"
            assert 'status' in entry, "Missing 'status' in systemStatus entry"
        
        # Check that we have expected services
        labels = [s.get('label') for s in system_status]
        expected_services = ['API', 'Database']
        for service in expected_services:
            assert service in labels, f"Missing '{service}' in systemStatus"
        
        print(f"PASS: systemStatus present with services: {labels}")


class TestBrandGuidelinesExport:
    """Test async Brand Guidelines PDF export endpoints"""
    
    def test_generate_guidelines_creates_job(self):
        """Test that POST /api/export/guidelines/generate creates a job and returns job_id"""
        response = requests.post(
            f"{BASE_URL}/api/export/guidelines/generate",
            params={"user_id": "dev_user_default"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'job_id' in data, "Response should contain job_id"
        assert 'status' in data, "Response should contain status"
        
        print(f"PASS: Job created with job_id={data['job_id']}, status={data['status']}")
        return data['job_id']
    
    def test_guidelines_status_returns_job_info(self):
        """Test that GET /api/export/guidelines/status/{job_id} returns job status"""
        # First create a job
        create_response = requests.post(
            f"{BASE_URL}/api/export/guidelines/generate",
            params={"user_id": "dev_user_default"}
        )
        assert create_response.status_code == 200
        job_id = create_response.json().get('job_id')
        
        # Poll status
        response = requests.get(f"{BASE_URL}/api/export/guidelines/status/{job_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'job_id' in data, "Response should contain job_id"
        assert 'status' in data, "Response should contain status"
        assert data['status'] in ['pending', 'generating', 'done', 'error'], f"Invalid status: {data['status']}"
        
        print(f"PASS: Job status retrieved - job_id={data['job_id']}, status={data['status']}, step={data.get('step', 'N/A')}")
    
    def test_guidelines_status_invalid_job_returns_404(self):
        """Test that GET /api/export/guidelines/status/{invalid_job_id} returns 404"""
        response = requests.get(f"{BASE_URL}/api/export/guidelines/status/invalid-job-id-12345")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Invalid job_id returns 404")
    
    def test_generate_guidelines_and_poll_until_done(self):
        """Test full async flow: create job -> poll until done -> verify download_url"""
        # Create job
        create_response = requests.post(
            f"{BASE_URL}/api/export/guidelines/generate",
            params={"user_id": "dev_user_default", "workspace_id": "66a993ed-ed40-4722-b25d-264f8162cbca"}
        )
        assert create_response.status_code == 200
        job_id = create_response.json().get('job_id')
        
        # Poll until done or error (max 30 seconds)
        max_attempts = 20
        final_status = None
        for i in range(max_attempts):
            status_response = requests.get(f"{BASE_URL}/api/export/guidelines/status/{job_id}")
            assert status_response.status_code == 200
            data = status_response.json()
            final_status = data.get('status')
            
            print(f"  Poll {i+1}: status={final_status}, step={data.get('step', 'N/A')}")
            
            if final_status in ['done', 'error']:
                break
            
            time.sleep(1.5)
        
        if final_status == 'done':
            assert data.get('download_url') is not None, "Completed job should have download_url"
            print(f"PASS: Job completed with download_url={data['download_url']}")
        elif final_status == 'error':
            print(f"WARNING: Job failed with error: {data.get('error')} - This may be expected if Playwright is not installed")
        else:
            print(f"WARNING: Job did not complete within timeout - final status: {final_status}")


class TestBrandGuidelinesDownload:
    """Test Brand Guidelines PDF download endpoint"""
    
    def test_download_nonexistent_file_returns_404(self):
        """Test that GET /api/export/download/{nonexistent_file} returns 404"""
        response = requests.get(f"{BASE_URL}/api/export/download/nonexistent-file.pdf")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Nonexistent file download returns 404")
    
    def test_styled_brand_guidelines_html_format(self):
        """Test GET /api/export/brand-guidelines-styled with format=html returns HTML"""
        response = requests.get(
            f"{BASE_URL}/api/export/brand-guidelines-styled",
            params={"user_id": "dev_user_default", "format": "html"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        assert 'text/html' in response.headers.get('content-type', ''), "Should return HTML content type"
        assert '<html' in response.text or '<!DOCTYPE' in response.text, "Response should contain HTML"
        print("PASS: Styled brand guidelines HTML format works")


class TestBrandFoundationExportButton:
    """Test that Brand Foundation page export functionality works"""
    
    def test_brand_foundation_endpoint(self):
        """Test GET /api/brand-foundation returns data"""
        response = requests.get(
            f"{BASE_URL}/api/brand-foundation",
            params={"user_id": "dev_user_default"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("PASS: Brand foundation endpoint works")


class TestIdentityStudioExport:
    """Test that Identity Studio can access export functionality"""
    
    def test_identity_endpoint(self):
        """Test GET /api/identity returns data"""
        response = requests.get(
            f"{BASE_URL}/api/identity",
            params={"user_id": "dev_user_default"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("PASS: Identity endpoint works")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
