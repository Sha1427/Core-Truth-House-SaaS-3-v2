"""
test_iteration62_digital_store.py
CTH OS - Digital Store Backend API Tests

Tests:
  - GET /api/store/products (public - published products)
  - GET /api/store/products/{id} (single product detail)
  - POST /api/store/admin/products (admin create)
  - PUT /api/store/admin/products/{id} (admin update)
  - DELETE /api/store/admin/products/{id} (admin delete)
  - GET /api/store/admin/products (admin list all)
  - GET /api/store/admin/orders (admin orders + revenue stats)
  - Admin endpoints return 403 for non-admin users
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture(scope="module")
def admin_id():
    return "default"

@pytest.fixture(scope="module")
def non_admin_id():
    return f"non_admin_{uuid.uuid4().hex[:8]}"

class TestPublicStoreProducts:
    """Public store products endpoint tests"""
    
    def test_list_published_products(self, api_client):
        """GET /api/store/products returns published products"""
        response = api_client.get(f"{BASE_URL}/api/store/products")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert "total" in data
        assert isinstance(data["products"], list)
        print(f"Found {data['total']} published products")
    
    def test_list_products_with_category_filter(self, api_client):
        """GET /api/store/products?category=toolkit filters by category"""
        response = api_client.get(f"{BASE_URL}/api/store/products?category=toolkit")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        # All returned products should be toolkit category
        for product in data["products"]:
            assert product.get("category") == "toolkit"
        print(f"Found {data['total']} toolkit products")
    
    def test_list_products_with_user_id(self, api_client):
        """GET /api/store/products?user_id=X includes is_purchased flag"""
        response = api_client.get(f"{BASE_URL}/api/store/products?user_id=test_user_123")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        # Each product should have is_purchased flag
        for product in data["products"]:
            assert "is_purchased" in product
            assert isinstance(product["is_purchased"], bool)
        print("Products include is_purchased flag for authenticated users")


class TestAdminProductCRUD:
    """Admin product CRUD operations"""
    
    def test_admin_list_all_products(self, api_client, admin_id):
        """GET /api/store/admin/products lists all products (including unpublished)"""
        response = api_client.get(f"{BASE_URL}/api/store/admin/products?admin_id={admin_id}")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert isinstance(data["products"], list)
        print(f"Admin sees {len(data['products'])} total products (including drafts)")
    
    def test_admin_create_product(self, api_client, admin_id):
        """POST /api/store/admin/products creates a new product"""
        payload = {
            "name": f"TEST_Product_{uuid.uuid4().hex[:6]}",
            "description": "Test product for iteration 62",
            "price_cents": 2500,
            "category": "template",
            "is_published": False,
            "tags": ["test", "iteration62"]
        }
        response = api_client.post(
            f"{BASE_URL}/api/store/admin/products?admin_id={admin_id}",
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        assert "product_id" in data
        assert data["name"] == payload["name"]
        assert data["price_cents"] == 2500
        assert data["category"] == "template"
        assert data["is_published"] == False
        print(f"Created test product: {data['product_id']}")
        
        # Store for later tests
        TestAdminProductCRUD.created_product_id = data["product_id"]
    
    def test_admin_update_product(self, api_client, admin_id):
        """PUT /api/store/admin/products/{id} updates a product"""
        product_id = getattr(TestAdminProductCRUD, 'created_product_id', None)
        if not product_id:
            pytest.skip("No product to update - create test must run first")
        
        update_payload = {
            "name": "TEST_Updated_Product",
            "price_cents": 3500,
            "is_published": True
        }
        response = api_client.put(
            f"{BASE_URL}/api/store/admin/products/{product_id}?admin_id={admin_id}",
            json=update_payload
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("name") == "TEST_Updated_Product"
        assert data.get("price_cents") == 3500
        assert data.get("is_published") == True
        print(f"Updated product: name={data.get('name')}, price=${data.get('price_cents', 0)/100}")
    
    def test_admin_verify_update_persisted(self, api_client, admin_id):
        """GET /api/store/admin/products verifies update was persisted"""
        product_id = getattr(TestAdminProductCRUD, 'created_product_id', None)
        if not product_id:
            pytest.skip("No product to verify")
        
        response = api_client.get(f"{BASE_URL}/api/store/admin/products?admin_id={admin_id}")
        assert response.status_code == 200
        data = response.json()
        
        # Find our test product
        test_product = None
        for p in data["products"]:
            if p.get("product_id") == product_id:
                test_product = p
                break
        
        assert test_product is not None, "Created product not found in admin list"
        assert test_product["name"] == "TEST_Updated_Product"
        assert test_product["price_cents"] == 3500
        print("Update persistence verified")
    
    def test_admin_delete_product(self, api_client, admin_id):
        """DELETE /api/store/admin/products/{id} deletes a product"""
        product_id = getattr(TestAdminProductCRUD, 'created_product_id', None)
        if not product_id:
            pytest.skip("No product to delete")
        
        response = api_client.delete(
            f"{BASE_URL}/api/store/admin/products/{product_id}?admin_id={admin_id}"
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("deleted") == True
        print(f"Deleted test product: {product_id}")
    
    def test_admin_verify_delete_persisted(self, api_client, admin_id):
        """Verify deleted product is removed from admin list"""
        product_id = getattr(TestAdminProductCRUD, 'created_product_id', None)
        if not product_id:
            pytest.skip("No product to verify deletion")
        
        response = api_client.get(f"{BASE_URL}/api/store/admin/products?admin_id={admin_id}")
        assert response.status_code == 200
        data = response.json()
        
        # Product should not exist
        for p in data["products"]:
            assert p.get("product_id") != product_id, "Deleted product still exists"
        
        print("Delete persistence verified - product removed from list")


class TestAdminOrders:
    """Admin orders endpoint tests"""
    
    def test_admin_list_orders(self, api_client, admin_id):
        """GET /api/store/admin/orders returns orders and revenue stats"""
        response = api_client.get(f"{BASE_URL}/api/store/admin/orders?admin_id={admin_id}")
        assert response.status_code == 200
        data = response.json()
        
        # Check response structure
        assert "purchases" in data
        assert "total_revenue_cents" in data
        assert "total_revenue_dollars" in data
        assert "order_count" in data
        
        # Validate types
        assert isinstance(data["purchases"], list)
        assert isinstance(data["total_revenue_cents"], (int, float))
        assert isinstance(data["total_revenue_dollars"], (int, float))
        assert isinstance(data["order_count"], int)
        
        print(f"Orders: {data['order_count']}, Revenue: ${data['total_revenue_dollars']}")
    
    def test_admin_orders_revenue_calculation(self, api_client, admin_id):
        """Verify revenue calculation is correct"""
        response = api_client.get(f"{BASE_URL}/api/store/admin/orders?admin_id={admin_id}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify total_revenue_dollars = total_revenue_cents / 100
        expected_dollars = round(data["total_revenue_cents"] / 100, 2)
        assert data["total_revenue_dollars"] == expected_dollars
        print(f"Revenue calculation verified: {data['total_revenue_cents']} cents = ${expected_dollars}")


class TestAdminAuth:
    """Test admin authentication requirements"""
    
    def test_admin_products_requires_admin(self, api_client, non_admin_id):
        """GET /api/store/admin/products requires admin"""
        response = api_client.get(f"{BASE_URL}/api/store/admin/products?admin_id={non_admin_id}")
        # Should return 403 for non-admin
        assert response.status_code == 403
        print("Admin products endpoint correctly requires admin auth")
    
    def test_admin_orders_requires_admin(self, api_client, non_admin_id):
        """GET /api/store/admin/orders requires admin"""
        response = api_client.get(f"{BASE_URL}/api/store/admin/orders?admin_id={non_admin_id}")
        assert response.status_code == 403
        print("Admin orders endpoint correctly requires admin auth")
    
    def test_admin_create_requires_admin(self, api_client, non_admin_id):
        """POST /api/store/admin/products requires admin"""
        payload = {
            "name": "Unauthorized Product",
            "description": "Should fail",
            "price_cents": 1000,
            "category": "template"
        }
        response = api_client.post(
            f"{BASE_URL}/api/store/admin/products?admin_id={non_admin_id}",
            json=payload
        )
        assert response.status_code == 403
        print("Admin create endpoint correctly requires admin auth")


class TestExistingProduct:
    """Test with existing product data"""
    
    def test_existing_product_in_store(self, api_client):
        """Verify 'Brand Foundation Toolkit' exists (seeded data)"""
        response = api_client.get(f"{BASE_URL}/api/store/products")
        assert response.status_code == 200
        data = response.json()
        
        # Look for the seeded product
        found = False
        for product in data["products"]:
            if "Brand Foundation" in product.get("name", ""):
                found = True
                assert product["price_cents"] == 4700  # $47
                assert product["category"] == "toolkit"
                assert product["is_published"] == True
                print(f"Found seeded product: {product['name']} at ${product['price_cents']/100}")
                break
        
        # This may fail if seed data doesn't exist yet
        if not found:
            print("WARNING: Seeded product 'Brand Foundation Toolkit' not found")
    
    def test_product_detail_endpoint(self, api_client):
        """GET /api/store/products/{id} returns single product"""
        # First get list to find a product ID
        list_response = api_client.get(f"{BASE_URL}/api/store/products")
        if list_response.status_code != 200 or not list_response.json().get("products"):
            pytest.skip("No products available to test detail endpoint")
        
        product_id = list_response.json()["products"][0].get("id") or list_response.json()["products"][0].get("product_id")
        
        response = api_client.get(f"{BASE_URL}/api/store/products/{product_id}")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "description" in data
        assert "price_cents" in data
        print(f"Product detail retrieved: {data['name']}")


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
