"""
Core Truth House API Tests
Auth-aware integration tests for protected API routes
"""

import os
import pytest
import requests

BASE_URL = os.environ.get("API_BASE_URL", "https://coretruthhouse.com").rstrip("/")
TEST_BEARER_TOKEN = os.environ.get("TEST_BEARER_TOKEN", "")
TEST_WORKSPACE_ID = os.environ.get("TEST_WORKSPACE_ID", "")


def auth_headers(include_workspace=True):
    headers = {}
    if TEST_BEARER_TOKEN:
        headers["Authorization"] = f"Bearer {TEST_BEARER_TOKEN}"
    if include_workspace and TEST_WORKSPACE_ID:
        headers["X-Workspace-ID"] = TEST_WORKSPACE_ID
    return headers


def require_auth():
    if not TEST_BEARER_TOKEN:
        pytest.skip("TEST_BEARER_TOKEN not set")


def require_workspace():
    if not TEST_WORKSPACE_ID:
        pytest.skip("TEST_WORKSPACE_ID not set")


class TestPublicEndpoints:
    def test_api_health(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "database" in data

    def test_api_version(self):
        response = requests.get(f"{BASE_URL}/api/version")
        assert response.status_code == 200
        data = response.json()
        assert "version" in data


class TestProtectedEndpoints:
    def test_brand_foundation_get(self):
        require_auth()
        require_workspace()

        response = requests.get(
            f"{BASE_URL}/api/brand-foundation",
            headers=auth_headers(),
        )
        assert response.status_code in (200, 404, 204)

    def test_offers_get(self):
        require_auth()
        require_workspace()

        response = requests.get(
            f"{BASE_URL}/api/offers",
            headers=auth_headers(),
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_systems_get(self):
        require_auth()
        require_workspace()

        response = requests.get(
            f"{BASE_URL}/api/systems",
            headers=auth_headers(),
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_usage_get(self):
        require_auth()

        response = requests.get(
            f"{BASE_URL}/api/usage",
            headers=auth_headers(include_workspace=False),
        )
        assert response.status_code in (200, 404)

    def test_workspaces_mine(self):
        require_auth()

        response = requests.get(
            f"{BASE_URL}/api/workspaces/mine",
            headers=auth_headers(include_workspace=False),
        )
        assert response.status_code == 200


class TestCreateUpdateDeleteOffer:
    created_offer_id = None

    def test_create_offer(self):
        require_auth()
        require_workspace()

        payload = {
            "name": "TEST Brand Strategy Intensive",
            "description": "Complete brand strategy for entrepreneurs",
            "price": 997,
            "features": ["1:1 Strategy Session", "Custom Brand Playbook"],
            "target_audience": "Entrepreneurs and founders",
            "transformation": "From scattered brand to clear positioning",
            "workspace_id": TEST_WORKSPACE_ID,
        }

        response = requests.post(
            f"{BASE_URL}/api/offers",
            json=payload,
            headers=auth_headers(),
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        TestCreateUpdateDeleteOffer.created_offer_id = data["id"]

    def test_delete_offer(self):
        require_auth()
        require_workspace()

        if not TestCreateUpdateDeleteOffer.created_offer_id:
            pytest.skip("No created offer id")

        response = requests.delete(
            f"{BASE_URL}/api/offers/{TestCreateUpdateDeleteOffer.created_offer_id}",
            headers=auth_headers(),
        )
        assert response.status_code == 200
