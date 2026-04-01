"""
Test file for Brand Asset Upload APIs
Testing: POST /api/assets/upload, GET /api/assets, GET /api/assets/file/{filename}, DELETE /api/assets/{id}
File validation and size limit tests included
"""
import pytest
import requests
import os
import io
from pathlib import Path

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data prefixes for cleanup
TEST_PREFIX = "TEST_"

class TestAssetUpload:
    """Asset Upload API tests - POST /api/assets/upload"""
    
    def test_upload_png_image(self):
        """Test uploading a PNG image file"""
        # Create a small valid PNG in memory
        png_data = self._create_test_png()
        
        files = {'file': ('test_logo.png', png_data, 'image/png')}
        data = {'asset_type': 'logo', 'user_id': f'{TEST_PREFIX}upload_user'}
        
        response = requests.post(f"{BASE_URL}/api/assets/upload", files=files, data=data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        result = response.json()
        assert result.get('success') is True
        assert 'asset' in result
        asset = result['asset']
        assert asset.get('asset_type') == 'logo'
        assert 'filename' in asset
        assert 'url' in asset
        assert asset['url'].startswith('/api/assets/file/')
        
        # Store asset_id for cleanup
        self.uploaded_asset_id = asset.get('id')
        print(f"PASS: PNG upload successful, asset_id: {self.uploaded_asset_id}")
    
    def test_upload_jpg_image(self):
        """Test uploading a JPG image file"""
        jpg_data = self._create_test_jpg()
        
        files = {'file': ('test_icon.jpg', jpg_data, 'image/jpeg')}
        data = {'asset_type': 'icon', 'user_id': f'{TEST_PREFIX}upload_user'}
        
        response = requests.post(f"{BASE_URL}/api/assets/upload", files=files, data=data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        result = response.json()
        assert result.get('success') is True
        print("PASS: JPG upload successful")
    
    def test_upload_svg_image(self):
        """Test uploading an SVG image file"""
        svg_data = b'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="red"/></svg>'
        
        files = {'file': ('test_logo.svg', svg_data, 'image/svg+xml')}
        data = {'asset_type': 'logo_light', 'user_id': f'{TEST_PREFIX}svg_user'}
        
        response = requests.post(f"{BASE_URL}/api/assets/upload", files=files, data=data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        result = response.json()
        assert result.get('success') is True
        print("PASS: SVG upload successful")
    
    def test_upload_webp_image(self):
        """Test uploading a WebP image file"""
        webp_data = self._create_test_webp()
        
        files = {'file': ('test.webp', webp_data, 'image/webp')}
        data = {'asset_type': 'logo', 'user_id': f'{TEST_PREFIX}webp_user'}
        
        response = requests.post(f"{BASE_URL}/api/assets/upload", files=files, data=data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("PASS: WebP upload successful")
    
    def test_upload_gif_image(self):
        """Test uploading a GIF image file"""
        gif_data = self._create_test_gif()
        
        files = {'file': ('test.gif', gif_data, 'image/gif')}
        data = {'asset_type': 'icon', 'user_id': f'{TEST_PREFIX}gif_user'}
        
        response = requests.post(f"{BASE_URL}/api/assets/upload", files=files, data=data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print("PASS: GIF upload successful")
    
    def test_upload_invalid_file_type(self):
        """Test that non-image files are rejected"""
        # Try to upload a text file
        text_data = b'This is not an image file'
        
        files = {'file': ('document.txt', text_data, 'text/plain')}
        data = {'asset_type': 'logo', 'user_id': f'{TEST_PREFIX}invalid_user'}
        
        response = requests.post(f"{BASE_URL}/api/assets/upload", files=files, data=data)
        
        assert response.status_code == 400, f"Expected 400 for invalid file type, got {response.status_code}"
        result = response.json()
        assert 'detail' in result
        assert 'not allowed' in result['detail'].lower() or 'file type' in result['detail'].lower()
        print("PASS: Invalid file type correctly rejected")
    
    def test_upload_pdf_rejected(self):
        """Test that PDF files are rejected"""
        pdf_data = b'%PDF-1.4 fake pdf content'
        
        files = {'file': ('document.pdf', pdf_data, 'application/pdf')}
        data = {'asset_type': 'logo', 'user_id': f'{TEST_PREFIX}pdf_user'}
        
        response = requests.post(f"{BASE_URL}/api/assets/upload", files=files, data=data)
        
        assert response.status_code == 400, f"Expected 400 for PDF, got {response.status_code}"
        print("PASS: PDF file correctly rejected")
    
    def test_upload_file_size_limit(self):
        """Test that files larger than 10MB are rejected"""
        # Create data slightly larger than 10MB (10.5MB)
        large_data = b'0' * (10 * 1024 * 1024 + 512 * 1024)  # 10.5MB
        
        files = {'file': ('large_logo.png', large_data, 'image/png')}
        data = {'asset_type': 'logo', 'user_id': f'{TEST_PREFIX}large_user'}
        
        response = requests.post(f"{BASE_URL}/api/assets/upload", files=files, data=data)
        
        assert response.status_code == 400, f"Expected 400 for oversized file, got {response.status_code}"
        result = response.json()
        assert 'detail' in result
        assert 'large' in result['detail'].lower() or 'size' in result['detail'].lower()
        print("PASS: Oversized file correctly rejected")
    
    def test_upload_replaces_existing_asset(self):
        """Test that uploading same asset_type replaces the old one"""
        user_id = f'{TEST_PREFIX}replace_user'
        
        # Upload first asset
        png_data1 = self._create_test_png()
        files = {'file': ('logo_v1.png', png_data1, 'image/png')}
        data = {'asset_type': 'logo', 'user_id': user_id}
        
        response1 = requests.post(f"{BASE_URL}/api/assets/upload", files=files, data=data)
        assert response1.status_code == 200
        asset1 = response1.json()['asset']
        
        # Upload second asset with same type
        png_data2 = self._create_test_png()
        files = {'file': ('logo_v2.png', png_data2, 'image/png')}
        data = {'asset_type': 'logo', 'user_id': user_id}
        
        response2 = requests.post(f"{BASE_URL}/api/assets/upload", files=files, data=data)
        assert response2.status_code == 200
        asset2 = response2.json()['asset']
        
        # Check that new asset has different id/filename
        assert asset1['filename'] != asset2['filename'], "Asset should be replaced with new filename"
        
        # Verify only one asset of this type exists for user
        assets_response = requests.get(f"{BASE_URL}/api/assets?user_id={user_id}")
        assert assets_response.status_code == 200
        assets = assets_response.json().get('assets', [])
        logo_assets = [a for a in assets if a.get('asset_type') == 'logo']
        assert len(logo_assets) == 1, f"Expected 1 logo asset, found {len(logo_assets)}"
        print("PASS: Asset replacement works correctly")
    
    def _create_test_png(self):
        """Create a minimal valid PNG file in memory"""
        # Minimal 1x1 red PNG
        return bytes([
            0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,  # PNG signature
            0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,  # IHDR chunk
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,  # 1x1 pixels
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
            0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41,  # IDAT chunk
            0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
            0x00, 0x00, 0x03, 0x00, 0x01, 0x00, 0x05, 0xfe,
            0xd4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,  # IEND chunk
            0x44, 0xae, 0x42, 0x60, 0x82
        ])
    
    def _create_test_jpg(self):
        """Create a minimal valid JPEG file in memory"""
        # Minimal 1x1 JPEG
        return bytes([
            0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
            0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
            0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
            0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
            0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c,
            0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
            0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d,
            0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20,
            0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
            0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27,
            0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34,
            0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
            0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4,
            0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
            0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
            0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff,
            0xc4, 0x00, 0xb5, 0x10, 0x00, 0x02, 0x01, 0x03,
            0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04,
            0x00, 0x00, 0x01, 0x7d, 0x01, 0x02, 0x03, 0x00,
            0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
            0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32,
            0x81, 0x91, 0xa1, 0x08, 0x23, 0x42, 0xb1, 0xc1,
            0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00,
            0x3f, 0x00, 0x7f, 0xff, 0xd9
        ])
    
    def _create_test_webp(self):
        """Create a minimal valid WebP file in memory"""
        # Minimal WebP header (lossy)
        return bytes([
            0x52, 0x49, 0x46, 0x46,  # "RIFF"
            0x24, 0x00, 0x00, 0x00,  # file size
            0x57, 0x45, 0x42, 0x50,  # "WEBP"
            0x56, 0x50, 0x38, 0x20,  # "VP8 "
            0x18, 0x00, 0x00, 0x00,  # chunk size
            0x30, 0x01, 0x00, 0x9d, 0x01, 0x2a, 0x01, 0x00,
            0x01, 0x00, 0x03, 0x00, 0x34, 0x25, 0xa4, 0x00,
            0x03, 0x70, 0x00, 0xfe, 0xfb, 0x94, 0x00, 0x00
        ])
    
    def _create_test_gif(self):
        """Create a minimal valid GIF file in memory"""
        # Minimal 1x1 GIF
        return bytes([
            0x47, 0x49, 0x46, 0x38, 0x39, 0x61,  # GIF89a
            0x01, 0x00, 0x01, 0x00,  # 1x1 pixels
            0x80, 0x00, 0x00,  # flags
            0xff, 0xff, 0xff,  # white
            0x00, 0x00, 0x00,  # black
            0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00,  # graphics control
            0x2c, 0x00, 0x00, 0x00, 0x00,  # image descriptor
            0x01, 0x00, 0x01, 0x00, 0x00,
            0x02, 0x02, 0x44, 0x01, 0x00,  # image data
            0x3b  # trailer
        ])


class TestAssetList:
    """Asset List API tests - GET /api/assets"""
    
    def test_get_assets_empty_user(self):
        """Test getting assets for user with no uploads"""
        response = requests.get(f"{BASE_URL}/api/assets?user_id={TEST_PREFIX}nonexistent_user")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        result = response.json()
        assert 'assets' in result
        assert isinstance(result['assets'], list)
        print("PASS: Empty assets list returned for new user")
    
    def test_get_assets_with_uploads(self):
        """Test getting assets after uploading"""
        user_id = f'{TEST_PREFIX}assets_list_user'
        
        # Upload an asset first
        png_data = TestAssetUpload()._create_test_png()
        files = {'file': ('test_list.png', png_data, 'image/png')}
        data = {'asset_type': 'logo', 'user_id': user_id}
        
        upload_response = requests.post(f"{BASE_URL}/api/assets/upload", files=files, data=data)
        assert upload_response.status_code == 200
        
        # Get assets list
        response = requests.get(f"{BASE_URL}/api/assets?user_id={user_id}")
        
        assert response.status_code == 200
        result = response.json()
        assert 'assets' in result
        assert len(result['assets']) >= 1
        
        # Verify asset structure
        asset = result['assets'][0]
        assert 'id' in asset
        assert 'asset_type' in asset
        assert 'filename' in asset
        assert 'url' in asset
        assert 'original_filename' in asset
        assert 'file_size' in asset
        print(f"PASS: Assets list returned with {len(result['assets'])} asset(s)")
    
    def test_assets_default_user(self):
        """Test getting assets for default user"""
        response = requests.get(f"{BASE_URL}/api/assets")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        result = response.json()
        assert 'assets' in result
        print(f"PASS: Default user has {len(result['assets'])} asset(s)")


class TestAssetServing:
    """Asset File Serving tests - GET /api/assets/file/{filename}"""
    
    def test_get_uploaded_file(self):
        """Test retrieving an uploaded file"""
        user_id = f'{TEST_PREFIX}serve_user'
        
        # Upload an asset
        png_data = TestAssetUpload()._create_test_png()
        files = {'file': ('serve_test.png', png_data, 'image/png')}
        data = {'asset_type': 'logo', 'user_id': user_id}
        
        upload_response = requests.post(f"{BASE_URL}/api/assets/upload", files=files, data=data)
        assert upload_response.status_code == 200
        
        filename = upload_response.json()['asset']['filename']
        
        # Get the file
        response = requests.get(f"{BASE_URL}/api/assets/file/{filename}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert response.headers.get('content-type') == 'image/png'
        assert len(response.content) > 0
        print(f"PASS: File retrieved successfully, size: {len(response.content)} bytes")
    
    def test_get_nonexistent_file(self):
        """Test retrieving a file that doesn't exist"""
        response = requests.get(f"{BASE_URL}/api/assets/file/nonexistent_file_xyz.png")
        
        assert response.status_code == 404, f"Expected 404 for nonexistent file, got {response.status_code}"
        print("PASS: Nonexistent file returns 404")
    
    def test_svg_content_type(self):
        """Test that SVG files are served with correct content type"""
        user_id = f'{TEST_PREFIX}svg_serve_user'
        
        svg_data = b'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="blue" width="100" height="100"/></svg>'
        files = {'file': ('test.svg', svg_data, 'image/svg+xml')}
        data = {'asset_type': 'logo', 'user_id': user_id}
        
        upload_response = requests.post(f"{BASE_URL}/api/assets/upload", files=files, data=data)
        assert upload_response.status_code == 200
        
        filename = upload_response.json()['asset']['filename']
        
        response = requests.get(f"{BASE_URL}/api/assets/file/{filename}")
        
        assert response.status_code == 200
        assert response.headers.get('content-type') == 'image/svg+xml'
        print("PASS: SVG served with correct content type")


class TestAssetDeletion:
    """Asset Deletion tests - DELETE /api/assets/{id}"""
    
    def test_delete_existing_asset(self):
        """Test deleting an existing asset"""
        user_id = f'{TEST_PREFIX}delete_user'
        
        # Upload an asset
        png_data = TestAssetUpload()._create_test_png()
        files = {'file': ('delete_test.png', png_data, 'image/png')}
        data = {'asset_type': 'logo', 'user_id': user_id}
        
        upload_response = requests.post(f"{BASE_URL}/api/assets/upload", files=files, data=data)
        assert upload_response.status_code == 200
        
        asset_id = upload_response.json()['asset']['id']
        filename = upload_response.json()['asset']['filename']
        
        # Delete the asset
        delete_response = requests.delete(f"{BASE_URL}/api/assets/{asset_id}")
        
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}"
        result = delete_response.json()
        assert result.get('success') is True
        
        # Verify file is no longer accessible
        file_response = requests.get(f"{BASE_URL}/api/assets/file/{filename}")
        assert file_response.status_code == 404, "File should be deleted"
        
        print("PASS: Asset deleted successfully")
    
    def test_delete_nonexistent_asset(self):
        """Test deleting an asset that doesn't exist"""
        fake_id = "nonexistent-asset-id-12345"
        
        response = requests.delete(f"{BASE_URL}/api/assets/{fake_id}")
        
        assert response.status_code == 404, f"Expected 404 for nonexistent asset, got {response.status_code}"
        print("PASS: Deleting nonexistent asset returns 404")
    
    def test_delete_removes_from_list(self):
        """Test that deleted asset is removed from asset list"""
        user_id = f'{TEST_PREFIX}delete_list_user'
        
        # Upload an asset
        png_data = TestAssetUpload()._create_test_png()
        files = {'file': ('delete_list_test.png', png_data, 'image/png')}
        data = {'asset_type': 'icon', 'user_id': user_id}
        
        upload_response = requests.post(f"{BASE_URL}/api/assets/upload", files=files, data=data)
        assert upload_response.status_code == 200
        
        asset_id = upload_response.json()['asset']['id']
        
        # Verify asset exists in list
        list_response = requests.get(f"{BASE_URL}/api/assets?user_id={user_id}")
        assets_before = list_response.json().get('assets', [])
        assert any(a.get('id') == asset_id for a in assets_before), "Asset should exist before deletion"
        
        # Delete the asset
        delete_response = requests.delete(f"{BASE_URL}/api/assets/{asset_id}")
        assert delete_response.status_code == 200
        
        # Verify asset removed from list
        list_response = requests.get(f"{BASE_URL}/api/assets?user_id={user_id}")
        assets_after = list_response.json().get('assets', [])
        assert not any(a.get('id') == asset_id for a in assets_after), "Asset should not exist after deletion"
        
        print("PASS: Asset correctly removed from list after deletion")


# Cleanup fixture for test data
@pytest.fixture(scope="module", autouse=True)
def cleanup_test_assets():
    """Cleanup test assets after all tests complete"""
    yield
    # Cleanup: Delete all TEST_ prefixed assets
    try:
        # Get all assets and delete those with TEST_ prefix in user_id
        # This is a best-effort cleanup
        for prefix in ['TEST_upload_user', 'TEST_svg_user', 'TEST_webp_user', 'TEST_gif_user',
                       'TEST_replace_user', 'TEST_assets_list_user', 'TEST_serve_user',
                       'TEST_svg_serve_user', 'TEST_delete_user', 'TEST_delete_list_user']:
            response = requests.get(f"{BASE_URL}/api/assets?user_id={prefix}")
            if response.status_code == 200:
                assets = response.json().get('assets', [])
                for asset in assets:
                    requests.delete(f"{BASE_URL}/api/assets/{asset.get('id')}")
    except Exception as e:
        print(f"Cleanup warning: {e}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
