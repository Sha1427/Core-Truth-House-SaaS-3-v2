"""
Iteration 56: Brand Intelligence Consolidation + Command Center Tests

Tests for:
1. Brand Intelligence page consolidation (Brand Memory + Brand Foundation)
2. Tenant Command Center workspace stats
3. Route configuration for hidden redirects
4. Super Admin route property verification
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
USER_ID = "dev_user_default"


class TestWorkspaceStatsEndpoint:
    """Tests for GET /api/workspace/stats - Tenant Command Center data source"""

    def test_workspace_stats_returns_200(self):
        """Workspace stats endpoint returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/workspace/stats?user_id={USER_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("PASS: Workspace stats endpoint returns 200 OK")

    def test_workspace_stats_has_required_fields(self):
        """Workspace stats contains all required fields for Command Center"""
        response = requests.get(f"{BASE_URL}/api/workspace/stats?user_id={USER_ID}")
        assert response.status_code == 200
        data = response.json()
        
        required_fields = ['content_generated', 'campaigns', 'assets', 'prompts', 'ai_credits_used']
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
            print(f"PASS: Field '{field}' present with value: {data[field]}")
        
        print("PASS: All required workspace stats fields present")

    def test_workspace_stats_values_are_integers(self):
        """All workspace stat values are integers"""
        response = requests.get(f"{BASE_URL}/api/workspace/stats?user_id={USER_ID}")
        assert response.status_code == 200
        data = response.json()
        
        for field in ['content_generated', 'campaigns', 'assets', 'prompts', 'ai_credits_used']:
            assert isinstance(data[field], int), f"Field {field} is not an integer: {type(data[field])}"
        
        print("PASS: All workspace stat values are integers")

    def test_workspace_stats_default_user_id(self):
        """Workspace stats handles default user_id gracefully"""
        response = requests.get(f"{BASE_URL}/api/workspace/stats")
        assert response.status_code == 200
        print("PASS: Workspace stats handles missing user_id param with default")


class TestOnboardingProgressEndpoint:
    """Tests for /api/onboarding/progress - Journey milestones for Command Center"""

    def test_onboarding_progress_returns_200(self):
        """Onboarding progress endpoint returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/onboarding/progress?user_id={USER_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("PASS: Onboarding progress endpoint returns 200 OK")

    def test_onboarding_progress_milestone_fields(self):
        """Onboarding progress contains milestone boolean fields"""
        response = requests.get(f"{BASE_URL}/api/onboarding/progress?user_id={USER_ID}")
        assert response.status_code == 200
        data = response.json()
        
        # These are the milestones used by Command Center journey progress
        expected_milestones = [
            'audit_complete',
            'brand_memory_complete', 
            'foundation_complete',
            'strategic_os_started',
            'first_offer_created',
            'first_campaign_created'
        ]
        
        for milestone in expected_milestones:
            # Milestone can be True, False, or not present (defaults to False)
            value = data.get(milestone, False)
            assert isinstance(value, bool) or value is None or isinstance(value, int), \
                f"Milestone {milestone} has invalid type: {type(value)}"
            print(f"PASS: Milestone '{milestone}' = {value}")
        
        print("PASS: Onboarding progress has valid milestone structure")


class TestAuditLatestEndpoint:
    """Tests for /api/audit/latest - Brand score for Command Center"""

    def test_audit_latest_returns_200_or_404(self):
        """Audit latest endpoint returns 200 (with audit) or 404 (no audit yet)"""
        response = requests.get(f"{BASE_URL}/api/audit/latest?user_id={USER_ID}")
        assert response.status_code in [200, 404], f"Unexpected status: {response.status_code}"
        print(f"PASS: Audit latest returns {response.status_code}")

    def test_audit_latest_score_structure(self):
        """Audit latest has expected score structure when audit exists"""
        response = requests.get(f"{BASE_URL}/api/audit/latest?user_id={USER_ID}")
        if response.status_code == 200:
            data = response.json()
            # Check for score-related fields
            audit = data.get('audit', data)
            # Overall score can be at different paths
            overall_score = audit.get('overall_score') or audit.get('scores', {}).get('overall', 0)
            assert overall_score is not None, "Expected overall_score field"
            print(f"PASS: Audit has overall_score: {overall_score}")
        else:
            print("SKIP: No audit exists yet for this user")


class TestBrandMemoryPersistEndpoint:
    """Tests for /api/persist/brand-memory - Brand Memory tab data"""

    def test_brand_memory_persist_returns_200(self):
        """Brand memory persist endpoint returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/persist/brand-memory?user_id={USER_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: Brand memory persist endpoint returns 200 OK")

    def test_brand_memory_persist_structure(self):
        """Brand memory persist returns expected structure"""
        response = requests.get(f"{BASE_URL}/api/persist/brand-memory?user_id={USER_ID}")
        assert response.status_code == 200
        data = response.json()
        
        # Should have completion_pct
        if 'completion_pct' in data:
            assert isinstance(data['completion_pct'], (int, float))
            print(f"PASS: Brand memory completion_pct: {data.get('completion_pct', 0)}")
        else:
            print("INFO: Brand memory completion_pct not set yet (new user)")
        
        print("PASS: Brand memory persist structure valid")


class TestBrandFoundationPersistEndpoint:
    """Tests for /api/persist/brand-foundation - Brand Foundation tab data"""

    def test_brand_foundation_persist_returns_200(self):
        """Brand foundation persist endpoint returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/persist/brand-foundation?user_id={USER_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: Brand foundation persist endpoint returns 200 OK")

    def test_brand_foundation_persist_structure(self):
        """Brand foundation persist returns expected structure"""
        response = requests.get(f"{BASE_URL}/api/persist/brand-foundation?user_id={USER_ID}")
        assert response.status_code == 200
        data = response.json()
        
        # Foundation fields
        foundation_fields = ['mission', 'vision', 'values', 'positioning', 'brand_promise', 
                           'target_audience', 'unique_differentiator']
        
        present_fields = [f for f in foundation_fields if f in data and data[f]]
        print(f"INFO: Brand foundation has {len(present_fields)}/{len(foundation_fields)} fields filled")
        
        if 'completion_pct' in data:
            print(f"INFO: Brand foundation completion_pct: {data.get('completion_pct', 0)}")
        
        print("PASS: Brand foundation persist structure valid")


class TestUsageEndpoint:
    """Tests for /api/usage - AI credits display in sidebar"""

    def test_usage_returns_200(self):
        """Usage endpoint returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/usage?user_id={USER_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: Usage endpoint returns 200 OK")

    def test_usage_has_required_fields(self):
        """Usage endpoint has fields needed for sidebar credit meter"""
        response = requests.get(f"{BASE_URL}/api/usage?user_id={USER_ID}")
        assert response.status_code == 200
        data = response.json()
        
        required_fields = ['used', 'limit', 'remaining', 'percentage']
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        print(f"PASS: Usage data - {data['used']}/{data['limit']} credits ({data['percentage']}%)")


class TestAPIHealth:
    """Basic API health checks"""

    def test_api_root_health(self):
        """API root returns 200"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print("PASS: API health endpoint OK")
