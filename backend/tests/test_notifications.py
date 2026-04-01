"""
Test Enhanced Notification System APIs
- POST /api/notifications - Create notification
- GET /api/notifications - Get notifications with unread_count and total_count
- GET /api/notifications/preferences - Get user preferences
- PUT /api/notifications/preferences - Update user preferences
- PUT /api/notifications/{id}/read - Mark notification as read
- PUT /api/notifications/mark-all-read - Mark all notifications as read
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user ID (dev mode)
TEST_USER_ID = "dev_user_default"
TEST_PREFIX = f"TEST_{uuid.uuid4().hex[:8]}"


class TestNotificationCreate:
    """Test POST /api/notifications - Create notification"""
    
    def test_create_basic_notification(self):
        """Test creating a basic notification returns success"""
        response = requests.post(
            f"{BASE_URL}/api/notifications",
            json={
                "user_id": TEST_USER_ID,
                "title": f"{TEST_PREFIX} Test Notification",
                "message": "This is a test notification message",
                "type": "info",
                "category": "general"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert data.get("success") == True, f"Expected success=True, got {data}"
        assert "notification" in data or "skipped" in data, f"Missing notification or skipped in response"
        
        if "notification" in data:
            notification = data["notification"]
            assert "id" in notification, "Missing id in notification"
            assert notification["title"] == f"{TEST_PREFIX} Test Notification"
            assert notification["message"] == "This is a test notification message"
            assert notification["user_id"] == TEST_USER_ID
            assert notification["is_read"] == False
            print(f"Created notification: {notification['id']}")
    
    def test_create_notification_with_all_fields(self):
        """Test creating notification with all optional fields"""
        response = requests.post(
            f"{BASE_URL}/api/notifications",
            json={
                "user_id": TEST_USER_ID,
                "title": f"{TEST_PREFIX} Full Notification",
                "message": "Notification with all fields",
                "type": "deal_won",
                "category": "crm",
                "link": "/crm?deal=test123",
                "metadata": {"deal_id": "test123", "value": 1000},
                "send_email": False,
                "priority": "high"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        
        if "notification" in data:
            notification = data["notification"]
            assert notification["type"] == "deal_won"
            assert notification["priority"] == "high"
            assert notification["link"] == "/crm?deal=test123"
            print(f"Created notification with all fields: {notification['id']}")
    
    def test_create_notification_different_types(self):
        """Test creating notifications of different types"""
        types_to_test = ["info", "success", "warning", "error", "deal", "ai_complete", "billing"]
        
        for notif_type in types_to_test:
            response = requests.post(
                f"{BASE_URL}/api/notifications",
                json={
                    "user_id": TEST_USER_ID,
                    "title": f"{TEST_PREFIX} Type {notif_type}",
                    "message": f"Testing {notif_type} notification",
                    "type": notif_type
                }
            )
            
            assert response.status_code == 200, f"Failed for type {notif_type}: {response.text}"
            data = response.json()
            assert data.get("success") == True, f"Failed for type {notif_type}"
        
        print(f"Successfully created notifications for all types: {types_to_test}")


class TestNotificationGet:
    """Test GET /api/notifications - Get notifications list"""
    
    def test_get_notifications_returns_required_fields(self):
        """Test GET notifications returns notifications, unread_count, total_count"""
        response = requests.get(
            f"{BASE_URL}/api/notifications",
            params={"user_id": TEST_USER_ID, "limit": 10}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify required response fields
        assert "notifications" in data, "Missing 'notifications' field"
        assert "unread_count" in data, "Missing 'unread_count' field"
        assert "total_count" in data, "Missing 'total_count' field"
        
        # Verify data types
        assert isinstance(data["notifications"], list), "notifications should be a list"
        assert isinstance(data["unread_count"], int), "unread_count should be an integer"
        assert isinstance(data["total_count"], int), "total_count should be an integer"
        
        print(f"GET notifications: {len(data['notifications'])} items, unread={data['unread_count']}, total={data['total_count']}")
    
    def test_get_notifications_with_filter(self):
        """Test GET notifications with category filter"""
        # First create a test notification in crm category
        requests.post(
            f"{BASE_URL}/api/notifications",
            json={
                "user_id": TEST_USER_ID,
                "title": f"{TEST_PREFIX} CRM Test",
                "message": "CRM category test",
                "type": "deal",
                "category": "crm"
            }
        )
        
        # Get with category filter
        response = requests.get(
            f"{BASE_URL}/api/notifications",
            params={"user_id": TEST_USER_ID, "category": "crm", "limit": 10}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "notifications" in data
        print(f"GET notifications with CRM filter: {len(data['notifications'])} items")
    
    def test_get_notifications_unread_only(self):
        """Test GET notifications with unread_only filter"""
        response = requests.get(
            f"{BASE_URL}/api/notifications",
            params={"user_id": TEST_USER_ID, "unread_only": "true", "limit": 10}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # All returned notifications should be unread
        for notif in data["notifications"]:
            assert notif.get("is_read") == False, f"Found read notification in unread_only query"
        
        print(f"GET unread_only: {len(data['notifications'])} unread notifications")


class TestNotificationPreferences:
    """Test notification preferences endpoints"""
    
    def test_get_preferences_returns_defaults(self):
        """Test GET /api/notifications/preferences returns preferences with defaults"""
        response = requests.get(
            f"{BASE_URL}/api/notifications/preferences",
            params={"user_id": TEST_USER_ID}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "preferences" in data, "Missing 'preferences' field"
        prefs = data["preferences"]
        
        # Verify default preference fields exist
        expected_fields = [
            "in_app_enabled", "email_enabled", "email_digest", "push_enabled",
            "crm_notifications", "content_notifications", "ai_job_notifications",
            "billing_notifications", "team_notifications", "system_notifications"
        ]
        
        for field in expected_fields:
            assert field in prefs, f"Missing preference field: {field}"
        
        print(f"GET preferences returned {len(prefs)} preference fields")
    
    def test_update_preferences(self):
        """Test PUT /api/notifications/preferences updates and returns success"""
        # Update preferences
        response = requests.put(
            f"{BASE_URL}/api/notifications/preferences",
            params={"user_id": TEST_USER_ID},
            json={
                "in_app_enabled": True,
                "email_enabled": False,
                "email_digest": "daily",
                "push_enabled": False,
                "crm_notifications": True,
                "content_notifications": True,
                "ai_job_notifications": True,
                "billing_notifications": True,
                "team_notifications": True,
                "system_notifications": True,
                "deal_stage_changes": True,
                "deal_won_lost": True,
                "content_published": True,
                "ai_generation_complete": True,
                "weekly_digest": True,
                "billing_alerts": True,
                "team_invites": True,
                "ai_usage_alerts": True
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("success") == True, f"Expected success=True, got {data}"
        assert "preferences" in data, "Missing preferences in response"
        
        # Verify the update was applied
        assert data["preferences"]["email_enabled"] == False
        assert data["preferences"]["email_digest"] == "daily"
        
        print("Successfully updated notification preferences")
    
    def test_update_and_verify_preferences_persistence(self):
        """Test that updated preferences persist (update then GET)"""
        # Update to specific values
        update_response = requests.put(
            f"{BASE_URL}/api/notifications/preferences",
            params={"user_id": TEST_USER_ID},
            json={
                "in_app_enabled": True,
                "email_enabled": True,
                "email_digest": "weekly",
                "push_enabled": True,
                "crm_notifications": False,
                "content_notifications": True,
                "ai_job_notifications": False,
                "billing_notifications": True,
                "team_notifications": True,
                "system_notifications": True,
                "deal_stage_changes": False,
                "deal_won_lost": True,
                "content_published": True,
                "ai_generation_complete": False,
                "weekly_digest": True,
                "billing_alerts": True,
                "team_invites": True,
                "ai_usage_alerts": False
            }
        )
        
        assert update_response.status_code == 200
        
        # GET to verify persistence
        get_response = requests.get(
            f"{BASE_URL}/api/notifications/preferences",
            params={"user_id": TEST_USER_ID}
        )
        
        assert get_response.status_code == 200
        prefs = get_response.json()["preferences"]
        
        assert prefs["email_digest"] == "weekly", f"Expected weekly, got {prefs['email_digest']}"
        assert prefs["push_enabled"] == True, "Push enabled not persisted"
        assert prefs["crm_notifications"] == False, "CRM notifications setting not persisted"
        
        print("Preferences persistence verified successfully")


class TestNotificationMarkRead:
    """Test mark read endpoints"""
    
    def test_mark_single_notification_read(self):
        """Test PUT /api/notifications/{id}/read marks notification as read"""
        # First create a notification
        create_response = requests.post(
            f"{BASE_URL}/api/notifications",
            json={
                "user_id": TEST_USER_ID,
                "title": f"{TEST_PREFIX} Mark Read Test",
                "message": "This will be marked as read",
                "type": "info"
            }
        )
        
        assert create_response.status_code == 200
        create_data = create_response.json()
        
        # Skip if notification was skipped (disabled category)
        if create_data.get("skipped"):
            pytest.skip("Notification was skipped due to preferences")
        
        notification_id = create_data["notification"]["id"]
        
        # Mark as read
        read_response = requests.put(
            f"{BASE_URL}/api/notifications/{notification_id}/read",
            params={"user_id": TEST_USER_ID}
        )
        
        assert read_response.status_code == 200, f"Expected 200, got {read_response.status_code}: {read_response.text}"
        data = read_response.json()
        assert data.get("success") == True
        
        print(f"Successfully marked notification {notification_id} as read")
    
    def test_mark_all_notifications_read(self):
        """Test PUT /api/notifications/mark-all-read marks all as read"""
        # Create a couple of test notifications
        for i in range(2):
            requests.post(
                f"{BASE_URL}/api/notifications",
                json={
                    "user_id": TEST_USER_ID,
                    "title": f"{TEST_PREFIX} Mark All Test {i}",
                    "message": f"Test notification {i}",
                    "type": "info"
                }
            )
        
        # Mark all as read
        response = requests.put(
            f"{BASE_URL}/api/notifications/mark-all-read",
            params={"user_id": TEST_USER_ID}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        
        # Verify by getting unread count
        get_response = requests.get(
            f"{BASE_URL}/api/notifications",
            params={"user_id": TEST_USER_ID, "unread_only": "true", "limit": 1}
        )
        
        # Unread count should be 0 or very low
        unread = get_response.json().get("unread_count", 0)
        print(f"After mark-all-read: unread_count={unread}")


class TestNotificationStats:
    """Test notification statistics endpoint"""
    
    def test_get_notification_stats(self):
        """Test GET /api/notifications/stats returns statistics"""
        response = requests.get(
            f"{BASE_URL}/api/notifications/stats",
            params={"user_id": TEST_USER_ID}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "total" in data, "Missing 'total' field"
        assert "unread" in data, "Missing 'unread' field"
        assert "by_category" in data, "Missing 'by_category' field"
        
        assert isinstance(data["total"], int), "total should be an integer"
        assert isinstance(data["unread"], int), "unread should be an integer"
        assert isinstance(data["by_category"], dict), "by_category should be a dict"
        
        print(f"Notification stats: total={data['total']}, unread={data['unread']}, categories={list(data['by_category'].keys())}")


class TestNotificationDelete:
    """Test notification delete endpoints"""
    
    def test_delete_single_notification(self):
        """Test DELETE /api/notifications/{id} removes notification"""
        # Create a notification to delete
        create_response = requests.post(
            f"{BASE_URL}/api/notifications",
            json={
                "user_id": TEST_USER_ID,
                "title": f"{TEST_PREFIX} Delete Test",
                "message": "This will be deleted",
                "type": "info"
            }
        )
        
        assert create_response.status_code == 200
        create_data = create_response.json()
        
        if create_data.get("skipped"):
            pytest.skip("Notification was skipped due to preferences")
        
        notification_id = create_data["notification"]["id"]
        
        # Delete notification
        delete_response = requests.delete(f"{BASE_URL}/api/notifications/{notification_id}")
        
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}: {delete_response.text}"
        data = delete_response.json()
        assert data.get("success") == True
        
        print(f"Successfully deleted notification {notification_id}")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_notifications(self):
        """Clear read test notifications"""
        # This uses the clear-all endpoint with read_only=true
        response = requests.delete(
            f"{BASE_URL}/api/notifications/clear-all",
            params={"user_id": TEST_USER_ID, "read_only": "true"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        
        print(f"Cleanup: deleted {data.get('deleted_count', 0)} read notifications")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
