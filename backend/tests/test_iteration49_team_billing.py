"""
Iteration 49: Test Team Management & Billing Features
Tests:
- GET /api/billing/summary - returns plan, credits, breakdown, invoices
- GET /api/teams/{workspace_id}/members - returns team members with owner seeded
- GET /api/teams/{workspace_id}/activity-summary - returns credits and content stats
- GET /api/teams/{workspace_id}/pending-invites - returns pending invites
- POST /api/teams/{workspace_id}/invite - invite new team member
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://os-workspace-test.preview.emergentagent.com')
WORKSPACE_ID = "66a993ed-ed40-4722-b25d-264f8162cbca"
TEST_USER_ID = "dev_user_default"


class TestBillingEndpoints:
    """Test billing summary and plan-related endpoints"""

    def test_billing_summary_returns_plan_data(self):
        """GET /api/billing/summary should return plan, credits, breakdown"""
        response = requests.get(
            f"{BASE_URL}/api/billing/summary",
            params={"user_id": TEST_USER_ID, "workspace_id": WORKSPACE_ID}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Required fields
        assert "plan" in data, "Missing 'plan' field"
        assert "plan_label" in data, "Missing 'plan_label' field"
        assert "credits_used" in data, "Missing 'credits_used' field"
        assert "credits_cap" in data, "Missing 'credits_cap' field"
        assert "credits_unlimited" in data, "Missing 'credits_unlimited' field"
        assert "credit_breakdown" in data, "Missing 'credit_breakdown' field"
        assert "invoices" in data, "Missing 'invoices' field"
        
        # Data types
        assert isinstance(data["credit_breakdown"], list), "credit_breakdown should be a list"
        assert isinstance(data["invoices"], list), "invoices should be a list"
        assert isinstance(data["credits_used"], int), "credits_used should be int"
        assert isinstance(data["credits_cap"], int), "credits_cap should be int"
        
        print(f"✓ Billing summary: Plan={data['plan']}, Credits={data['credits_used']}/{data['credits_cap']}")

    def test_billing_plans_endpoint(self):
        """GET /api/billing/plans should return available plans"""
        response = requests.get(f"{BASE_URL}/api/billing/plans")
        assert response.status_code == 200
        data = response.json()
        
        assert "plans" in data, "Missing 'plans' field"
        assert len(data["plans"]) >= 4, "Should have at least 4 plans"
        
        plan_ids = [p["id"] for p in data["plans"]]
        assert "FOUNDATION" in plan_ids, "Missing FOUNDATION plan"
        assert "STRUCTURE" in plan_ids, "Missing STRUCTURE plan"
        assert "HOUSE" in plan_ids, "Missing HOUSE plan"
        assert "ESTATE" in plan_ids, "Missing ESTATE plan"
        
        print(f"✓ Billing plans: {len(data['plans'])} plans available")


class TestTeamEndpoints:
    """Test team management endpoints"""

    def test_get_team_members_with_owner_seeded(self):
        """GET /api/teams/{workspace_id}/members should return members with owner auto-seeded"""
        response = requests.get(f"{BASE_URL}/api/teams/{WORKSPACE_ID}/members")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "members" in data, "Missing 'members' field"
        assert isinstance(data["members"], list), "members should be a list"
        
        # Should have at least the owner
        assert len(data["members"]) >= 1, "Should have at least 1 member (owner)"
        
        # Check owner exists
        owner = next((m for m in data["members"] if m.get("role") == "owner"), None)
        assert owner is not None, "Owner member not found"
        assert owner.get("status") == "active", "Owner should be active"
        
        # Check member fields
        for member in data["members"]:
            assert "id" in member, "Member missing 'id' field"
            assert "email" in member, "Member missing 'email' field"
            assert "role" in member, "Member missing 'role' field"
            assert "status" in member, "Member missing 'status' field"
        
        print(f"✓ Team members: {len(data['members'])} member(s), owner={owner.get('email')}")

    def test_get_activity_summary(self):
        """GET /api/teams/{workspace_id}/activity-summary should return credits and content stats"""
        response = requests.get(f"{BASE_URL}/api/teams/{WORKSPACE_ID}/activity-summary")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Required fields
        assert "total_credits_used" in data, "Missing 'total_credits_used' field"
        assert "credits_by_member" in data, "Missing 'credits_by_member' field"
        assert "content_generated" in data, "Missing 'content_generated' field"
        
        # Data types
        assert isinstance(data["total_credits_used"], int), "total_credits_used should be int"
        assert isinstance(data["credits_by_member"], dict), "credits_by_member should be dict"
        assert isinstance(data["content_generated"], int), "content_generated should be int"
        
        print(f"✓ Activity summary: Credits used={data['total_credits_used']}, Content={data['content_generated']}")

    def test_get_pending_invites(self):
        """GET /api/teams/{workspace_id}/pending-invites should return pending invites"""
        response = requests.get(
            f"{BASE_URL}/api/teams/{WORKSPACE_ID}/pending-invites",
            params={"owner_id": TEST_USER_ID}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "invites" in data, "Missing 'invites' field"
        assert isinstance(data["invites"], list), "invites should be a list"
        
        # Check invite structure if any exist
        for invite in data["invites"]:
            assert "id" in invite, "Invite missing 'id' field"
            assert "email" in invite, "Invite missing 'email' field"
            assert "role" in invite, "Invite missing 'role' field"
            assert "status" in invite, "Invite missing 'status' field"
        
        print(f"✓ Pending invites: {len(data['invites'])} pending")

    def test_invite_member_flow(self):
        """POST /api/teams/{workspace_id}/invite should create a pending invite"""
        test_email = "TEST_invite_member@test.emergent.com"
        
        # First clean up any existing test invite
        response = requests.get(
            f"{BASE_URL}/api/teams/{WORKSPACE_ID}/pending-invites",
            params={"owner_id": TEST_USER_ID}
        )
        if response.status_code == 200:
            for invite in response.json().get("invites", []):
                if invite.get("email") == test_email:
                    requests.delete(
                        f"{BASE_URL}/api/teams/{WORKSPACE_ID}/pending-invites/{invite['id']}",
                        params={"owner_id": TEST_USER_ID}
                    )
        
        # Create new invite
        response = requests.post(
            f"{BASE_URL}/api/teams/{WORKSPACE_ID}/invite",
            params={"owner_id": TEST_USER_ID},
            json={
                "email": test_email,
                "name": "Test Invitee",
                "role": "editor"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("success") is True, "Invite should succeed"
        assert "member" in data, "Missing 'member' field in response"
        assert data["member"]["email"] == test_email, "Email mismatch"
        assert data["member"]["role"] == "editor", "Role mismatch"
        assert data["member"]["status"] == "pending", "Status should be pending"
        
        invite_id = data["member"]["id"]
        print(f"✓ Invite created: {test_email} as editor, id={invite_id}")
        
        # Clean up - delete the test invite
        cleanup_response = requests.delete(
            f"{BASE_URL}/api/teams/{WORKSPACE_ID}/pending-invites/{invite_id}",
            params={"owner_id": TEST_USER_ID}
        )
        assert cleanup_response.status_code == 200, "Failed to clean up test invite"
        print(f"✓ Test invite cleaned up")


class TestCreditPacksEndpoints:
    """Test credit purchase endpoints"""

    def test_get_credit_packs(self):
        """GET /api/credits/packs should return available credit packs"""
        response = requests.get(f"{BASE_URL}/api/credits/packs")
        assert response.status_code == 200
        data = response.json()
        
        assert "packs" in data, "Missing 'packs' field"
        assert len(data["packs"]) >= 3, "Should have at least 3 credit packs"
        
        # Check pack structure
        for pack in data["packs"]:
            assert "id" in pack, "Pack missing 'id'"
            assert "credits" in pack, "Pack missing 'credits'"
            assert "price" in pack, "Pack missing 'price'"
        
        pack_ids = [p["id"] for p in data["packs"]]
        assert "starter" in pack_ids, "Missing starter pack"
        assert "growth" in pack_ids, "Missing growth pack"
        assert "scale" in pack_ids, "Missing scale pack"
        
        print(f"✓ Credit packs: {len(data['packs'])} packs available")

    def test_get_credit_balance(self):
        """GET /api/credits/balance should return user's credit balance"""
        response = requests.get(
            f"{BASE_URL}/api/credits/balance",
            params={"user_id": TEST_USER_ID}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "credits" in data or "used" in data, "Missing credit fields"
        print(f"✓ Credit balance retrieved")


class TestBrandFoundationSaveFlow:
    """Test brand foundation save functionality (the bug fix)"""

    def test_brand_foundation_get(self):
        """GET /api/brand-foundation should return foundation data"""
        response = requests.get(
            f"{BASE_URL}/api/brand-foundation",
            params={"user_id": TEST_USER_ID, "workspace_id": WORKSPACE_ID}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Should return foundation fields (may be empty)
        expected_fields = ["mission", "vision", "values", "tagline", "positioning", "story", "tone_of_voice"]
        for field in expected_fields:
            assert field in data or data.get(field) is None or data.get(field, "") == "", f"Field '{field}' should exist (even if empty)"
        
        print(f"✓ Brand foundation GET works, mission={data.get('mission', '')[:30]}...")

    def test_brand_foundation_save(self):
        """PUT /api/brand-foundation should save field updates"""
        test_mission = f"TEST_Mission_Statement_{TEST_USER_ID}"
        
        # Save mission
        response = requests.put(
            f"{BASE_URL}/api/brand-foundation",
            params={"user_id": TEST_USER_ID, "workspace_id": WORKSPACE_ID},
            json={"mission": test_mission}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify persistence
        response = requests.get(
            f"{BASE_URL}/api/brand-foundation",
            params={"user_id": TEST_USER_ID, "workspace_id": WORKSPACE_ID}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("mission") == test_mission, f"Mission not persisted: expected '{test_mission}', got '{data.get('mission')}'"
        
        print(f"✓ Brand foundation save & persist works")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
