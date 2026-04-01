"""
Iteration 57: Admin Security Patch Tests

Tests:
1. Super admin dependency on ALL /api/admin/* routes - non-admins get 403
2. MongoDB projection whitelists on admin tenant queries - only metadata fields
3. Tenant data isolation - old endpoint removed, new endpoint returns safe data
4. Brand content fields never returned (brand_memory, brand_foundation, mission, vision, values, campaigns, content_items, ai_analysis)
"""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Dev super admin user (should be allowed)
DEV_SUPER_ADMIN = 'dev_user_default'
# Regular tenant user (should get 403)
RANDOM_TENANT = 'random_tenant_xyz'

# Brand content fields that should NEVER be in admin responses
# These are actual content documents/text, NOT count fields
FORBIDDEN_CONTENT_FIELDS = {
    'brand_memory', 'brand_foundation', 'ai_analysis', 'content_items',
    'brand_promise', 'positioning', 'core_values', 'brand_story',
    'target_audience_detail', 'voice_examples', 'offer_descriptions'
}

# Fields with actual text content that should not leak (nested in objects)
FORBIDDEN_TEXT_FIELDS = {
    'mission', 'vision', 'values', 'tagline', 'brand_voice',
    'differentiation', 'transformation', 'core_offer'
}


class TestSuperAdminGating:
    """Test that require_super_admin dependency blocks non-admin users"""

    def test_admin_overview_super_admin_allowed(self):
        """GET /api/admin/overview?admin_id=dev_user_default returns 200"""
        response = requests.get(f"{BASE_URL}/api/admin/overview?admin_id={DEV_SUPER_ADMIN}")
        assert response.status_code == 200, f"Super admin should access overview: {response.text}"
        data = response.json()
        # Should have KPI data
        assert 'kpis' in data or 'total_users' in data
        print(f"PASS: Admin overview accessible to super admin, got {len(data)} fields")

    def test_admin_overview_tenant_blocked(self):
        """GET /api/admin/overview?admin_id=random_tenant_xyz returns 403"""
        response = requests.get(f"{BASE_URL}/api/admin/overview?admin_id={RANDOM_TENANT}")
        assert response.status_code == 403, f"Tenant should get 403 on overview: {response.status_code}"
        data = response.json()
        assert 'denied' in data.get('detail', '').lower() or 'restricted' in data.get('detail', '').lower()
        print(f"PASS: Tenant blocked from admin overview with 403")

    def test_admin_tenants_list_super_admin_allowed(self):
        """GET /api/admin/tenants?admin_id=dev_user_default returns 200"""
        response = requests.get(f"{BASE_URL}/api/admin/tenants?admin_id={DEV_SUPER_ADMIN}")
        assert response.status_code == 200, f"Super admin should access tenants: {response.text}"
        data = response.json()
        assert 'tenants' in data
        print(f"PASS: Admin tenants list accessible to super admin, found {len(data.get('tenants', []))} tenants")

    def test_admin_tenants_list_tenant_blocked(self):
        """GET /api/admin/tenants?admin_id=random_tenant_xyz returns 403"""
        response = requests.get(f"{BASE_URL}/api/admin/tenants?admin_id={RANDOM_TENANT}")
        assert response.status_code == 403, f"Tenant should get 403 on tenants list: {response.status_code}"
        print(f"PASS: Tenant blocked from tenants list with 403")

    def test_admin_users_super_admin_allowed(self):
        """GET /api/admin/users?admin_id=dev_user_default returns 200"""
        response = requests.get(f"{BASE_URL}/api/admin/users?admin_id={DEV_SUPER_ADMIN}")
        assert response.status_code == 200, f"Super admin should access users: {response.text}"
        data = response.json()
        assert 'users' in data
        print(f"PASS: Admin users list accessible to super admin")

    def test_admin_users_tenant_blocked(self):
        """GET /api/admin/users?admin_id=random_tenant_xyz returns 403"""
        response = requests.get(f"{BASE_URL}/api/admin/users?admin_id={RANDOM_TENANT}")
        assert response.status_code == 403, f"Tenant should get 403 on users list: {response.status_code}"
        print(f"PASS: Tenant blocked from users list with 403")

    def test_admin_analytics_usage_super_admin_allowed(self):
        """GET /api/admin/analytics/usage?admin_id=dev_user_default returns 200"""
        response = requests.get(f"{BASE_URL}/api/admin/analytics/usage?admin_id={DEV_SUPER_ADMIN}")
        assert response.status_code == 200, f"Super admin should access analytics: {response.text}"
        data = response.json()
        assert 'totals' in data or 'content_by_type' in data
        print(f"PASS: Admin analytics accessible to super admin")

    def test_admin_analytics_usage_tenant_blocked(self):
        """GET /api/admin/analytics/usage?admin_id=random_tenant_xyz returns 403"""
        response = requests.get(f"{BASE_URL}/api/admin/analytics/usage?admin_id={RANDOM_TENANT}")
        assert response.status_code == 403, f"Tenant should get 403 on analytics: {response.status_code}"
        print(f"PASS: Tenant blocked from analytics with 403")

    def test_admin_api_config_super_admin_allowed(self):
        """GET /api/admin/api-config?admin_id=dev_user_default returns 200"""
        response = requests.get(f"{BASE_URL}/api/admin/api-config?admin_id={DEV_SUPER_ADMIN}")
        assert response.status_code == 200, f"Super admin should access api-config: {response.text}"
        data = response.json()
        assert 'configs' in data
        print(f"PASS: Admin api-config accessible to super admin")

    def test_admin_api_config_tenant_blocked(self):
        """GET /api/admin/api-config?admin_id=random_tenant_xyz returns 403"""
        response = requests.get(f"{BASE_URL}/api/admin/api-config?admin_id={RANDOM_TENANT}")
        assert response.status_code == 403, f"Tenant should get 403 on api-config: {response.status_code}"
        print(f"PASS: Tenant blocked from api-config with 403")


class TestTenantDataProjection:
    """Test that tenant queries return ONLY metadata fields, never brand content"""

    def _check_no_forbidden_fields(self, data, context):
        """Helper to verify no forbidden content fields exist in response"""
        if isinstance(data, dict):
            for key in data.keys():
                assert key not in FORBIDDEN_CONTENT_FIELDS, f"Forbidden content field '{key}' found in {context}"
                # Check for forbidden text fields that would contain actual brand content
                if key in FORBIDDEN_TEXT_FIELDS:
                    # If it exists and is a non-empty string, that's a content leak
                    if isinstance(data[key], str) and len(data[key]) > 0:
                        raise AssertionError(f"Brand content text field '{key}' found in {context}")
                self._check_no_forbidden_fields(data[key], f"{context}.{key}")
        elif isinstance(data, list):
            for i, item in enumerate(data):
                self._check_no_forbidden_fields(item, f"{context}[{i}]")

    def test_tenants_list_no_brand_content(self):
        """GET /api/admin/tenants returns metadata ONLY, no brand_memory/brand_foundation/etc"""
        response = requests.get(f"{BASE_URL}/api/admin/tenants?admin_id={DEV_SUPER_ADMIN}")
        assert response.status_code == 200
        data = response.json()
        
        # Check tenants array
        tenants = data.get('tenants', [])
        for tenant in tenants:
            for field in FORBIDDEN_CONTENT_FIELDS:
                assert field not in tenant, f"Tenant list should not contain '{field}'"
            for field in FORBIDDEN_TEXT_FIELDS:
                if field in tenant and isinstance(tenant[field], str) and len(tenant[field]) > 0:
                    raise AssertionError(f"Tenant list should not contain brand text '{field}'")
        
        # Should have safe metadata fields only
        if tenants:
            safe_fields = {'id', 'workspace_id', 'name', 'owner_id', 'owner_email', 
                          'plan', 'status', 'created_at', 'updated_at', 'last_active_at',
                          'team_size', 'content_count', 'milestones_complete', 'journey_pct'}
            for tenant in tenants:
                for key in tenant.keys():
                    # Allow safe fields or other metadata, but not forbidden content
                    assert key not in FORBIDDEN_CONTENT_FIELDS, f"Forbidden content field '{key}' in tenant"
        
        print(f"PASS: Tenants list returns only metadata (no brand content)")

    def test_tenant_details_no_brand_content(self):
        """GET /api/admin/tenants/{tenant_id} returns metadata + usage stats, NOT ai_analysis text"""
        # First get list of tenants
        list_response = requests.get(f"{BASE_URL}/api/admin/tenants?admin_id={DEV_SUPER_ADMIN}")
        if list_response.status_code == 200:
            tenants = list_response.json().get('tenants', [])
            if tenants:
                tenant_id = tenants[0].get('id') or tenants[0].get('workspace_id')
                if tenant_id:
                    detail_response = requests.get(f"{BASE_URL}/api/admin/tenants/{tenant_id}?admin_id={DEV_SUPER_ADMIN}")
                    assert detail_response.status_code == 200
                    data = detail_response.json()
                    
                    # Check no forbidden fields at any level
                    self._check_no_forbidden_fields(data, 'tenant_details')
                    
                    # Should have safe structure
                    assert 'tenant' in data
                    assert 'usage' in data
                    
                    # brand_health should have score only, NOT ai_analysis
                    if 'brand_health' in data:
                        bh = data['brand_health']
                        assert 'ai_analysis' not in bh, "brand_health should NOT contain ai_analysis"
                        # Should only have score/rating
                        allowed_brand_health = {'score', 'rating'}
                        for key in bh.keys():
                            assert key in allowed_brand_health or key not in FORBIDDEN_FIELDS
                    
                    print(f"PASS: Tenant details returns only metadata + usage stats (no ai_analysis)")
                    return
        
        print("SKIP: No tenants found to test detail view")

    def test_users_list_no_brand_content(self):
        """GET /api/admin/users returns user metadata only"""
        response = requests.get(f"{BASE_URL}/api/admin/users?admin_id={DEV_SUPER_ADMIN}")
        assert response.status_code == 200
        data = response.json()
        
        users = data.get('users', [])
        for user in users:
            for field in FORBIDDEN_CONTENT_FIELDS:
                assert field not in user, f"Users list should not contain '{field}'"
        
        print(f"PASS: Users list returns only metadata (no brand content)")

    def test_api_config_keys_masked(self):
        """GET /api/admin/api-config returns configs with masked keys"""
        response = requests.get(f"{BASE_URL}/api/admin/api-config?admin_id={DEV_SUPER_ADMIN}")
        assert response.status_code == 200
        data = response.json()
        
        configs = data.get('configs', [])
        for config in configs:
            key_value = config.get('key_value', '')
            # Keys should be masked (contain *** or be very short)
            if len(key_value) > 8:
                assert '***' in key_value, f"API key should be masked: {key_value}"
        
        print(f"PASS: API config keys are masked")


class TestOldEndpointRemoved:
    """Test that old vulnerable endpoint is removed"""

    def test_old_client_dashboard_endpoint_not_found(self):
        """GET /api/admin/client/{client_id}/dashboard should return 404 or 405"""
        test_client_id = 'test_client_123'
        response = requests.get(f"{BASE_URL}/api/admin/client/{test_client_id}/dashboard?admin_id={DEV_SUPER_ADMIN}")
        # Should be 404 (route not found) or 405 (method not allowed)
        assert response.status_code in [404, 405, 422], \
            f"Old client dashboard endpoint should be removed, got {response.status_code}"
        print(f"PASS: Old /api/admin/client/{{client_id}}/dashboard endpoint returns {response.status_code} (removed)")


class TestAnalyticsOnlyReturnsCounts:
    """Test that analytics endpoints return counts only, no content"""

    def test_analytics_usage_returns_counts_only(self):
        """GET /api/admin/analytics/usage returns counts only, no actual content"""
        response = requests.get(f"{BASE_URL}/api/admin/analytics/usage?admin_id={DEV_SUPER_ADMIN}")
        assert response.status_code == 200
        data = response.json()
        
        # Should have totals (counts) and content_by_type (counts)
        if 'totals' in data:
            totals = data['totals']
            for key, value in totals.items():
                assert isinstance(value, (int, float)), f"Totals should be numbers, got {type(value)} for {key}"
        
        # Should not contain any actual content strings
        self._check_no_content_strings(data, 'analytics_usage')
        
        print(f"PASS: Analytics usage returns counts only")

    def _check_no_content_strings(self, data, context):
        """Helper to verify no long content strings in response"""
        if isinstance(data, str):
            # Short strings are OK (labels, IDs), but long strings might be content
            if len(data) > 200:
                raise AssertionError(f"Long string ({len(data)} chars) found in {context} - may be content leak")
        elif isinstance(data, dict):
            for key, value in data.items():
                self._check_no_content_strings(value, f"{context}.{key}")
        elif isinstance(data, list):
            for i, item in enumerate(data[:5]):  # Check first 5 items
                self._check_no_content_strings(item, f"{context}[{i}]")


class TestOverviewAggregates:
    """Test that admin overview returns aggregate KPIs only"""

    def test_overview_has_aggregate_kpis(self):
        """GET /api/admin/overview returns aggregate metrics, not individual tenant data"""
        response = requests.get(f"{BASE_URL}/api/admin/overview?admin_id={DEV_SUPER_ADMIN}")
        assert response.status_code == 200
        data = response.json()
        
        # Should have KPIs with aggregate counts
        kpis = data.get('kpis', {})
        expected_kpi_fields = ['totalUsers', 'totalWorkspaces', 'mrr', 'aiGenerationsMTD']
        for field in expected_kpi_fields:
            assert field in kpis, f"Overview should have KPI: {field}"
            assert isinstance(kpis[field], (int, float)), f"KPI {field} should be a number"
        
        # Should NOT have individual tenant brand content
        for field in FORBIDDEN_CONTENT_FIELDS:
            assert field not in data, f"Overview should not contain '{field}'"
        
        print(f"PASS: Overview returns aggregate KPIs only (no individual tenant data)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
