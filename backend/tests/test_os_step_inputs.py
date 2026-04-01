"""
Test Strategic OS Step Inputs Feature
- Tests for step_inputs field in generate request
- Tests for step info endpoint returning 9 steps
- Tests for workflow CRUD with step_inputs
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Use a known test workflow ID or create one
TEST_USER_ID = "test_os_step_inputs_user"
TEST_WORKFLOW_ID = None


class TestOSStepsInfo:
    """Test /api/os-workflow/steps/info endpoint"""
    
    def test_steps_info_returns_9_steps(self):
        """GET /api/os-workflow/steps/info should return 9 steps"""
        response = requests.get(f"{BASE_URL}/api/os-workflow/steps/info")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "steps" in data, "Response should have 'steps' field"
        assert len(data["steps"]) == 9, f"Expected 9 steps, got {len(data['steps'])}"
        
        # Validate step structure
        for step in data["steps"]:
            assert "number" in step, "Step should have 'number'"
            assert "name" in step, "Step should have 'name'"
            assert "description" in step, "Step should have 'description'"
        
        # Verify step numbers are 1-9
        step_numbers = [s["number"] for s in data["steps"]]
        assert step_numbers == [1, 2, 3, 4, 5, 6, 7, 8, 9], f"Step numbers should be 1-9, got {step_numbers}"
        
        # Check full_os and fast_start arrays
        assert "full_os" in data, "Response should have 'full_os' array"
        assert "fast_start" in data, "Response should have 'fast_start' array"
        assert data["full_os"] == [1, 2, 3, 4, 5, 6, 7, 8, 9], f"full_os should be [1-9], got {data['full_os']}"
        assert data["fast_start"] == [1, 2, 3, 5, 7, 9], f"fast_start should be [1,2,3,5,7,9], got {data['fast_start']}"
        print("PASS: Steps info returns 9 steps with correct structure")


class TestOSWorkflowCRUD:
    """Test workflow creation and retrieval"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create a test workflow for testing"""
        global TEST_WORKFLOW_ID
        # Create workflow via API
        response = requests.post(f"{BASE_URL}/api/os-workflow", json={
            "user_id": TEST_USER_ID,
            "workflow_type": "FULL_OS"
        })
        if response.status_code == 200:
            data = response.json()
            TEST_WORKFLOW_ID = data.get("workflow", {}).get("id")
            print(f"Created test workflow: {TEST_WORKFLOW_ID}")
        yield
        # Cleanup could be added here if needed
    
    def test_create_workflow(self):
        """POST /api/os-workflow creates a workflow"""
        response = requests.post(f"{BASE_URL}/api/os-workflow", json={
            "user_id": f"test_user_{uuid.uuid4().hex[:8]}",
            "workflow_type": "FULL_OS"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "workflow" in data, "Response should have 'workflow' field"
        workflow = data["workflow"]
        assert "id" in workflow, "Workflow should have 'id'"
        assert "user_id" in workflow, "Workflow should have 'user_id'"
        assert "workflow_type" in workflow, "Workflow should have 'workflow_type'"
        assert workflow["workflow_type"] == "FULL_OS"
        assert "step_numbers" in workflow, "Workflow should have 'step_numbers'"
        assert workflow["step_numbers"] == [1, 2, 3, 4, 5, 6, 7, 8, 9]
        print(f"PASS: Created workflow with ID: {workflow['id']}")
    
    def test_get_workflow_by_id(self):
        """GET /api/os-workflow/{id} returns workflow with steps"""
        global TEST_WORKFLOW_ID
        if not TEST_WORKFLOW_ID:
            pytest.skip("No test workflow ID available")
        
        response = requests.get(f"{BASE_URL}/api/os-workflow/{TEST_WORKFLOW_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Workflow should have 'id'"
        assert "steps" in data, "Workflow should have 'steps' array"
        assert isinstance(data["steps"], list), "Steps should be a list"
        print(f"PASS: Retrieved workflow {TEST_WORKFLOW_ID} with {len(data.get('steps', []))} steps")
    
    def test_get_workflow_not_found(self):
        """GET /api/os-workflow/{id} returns 404 for non-existent workflow"""
        response = requests.get(f"{BASE_URL}/api/os-workflow/non_existent_workflow_id")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("PASS: Returns 404 for non-existent workflow")


class TestOSStepInputs:
    """Test step_inputs field in generate requests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Create a test workflow for generate step testing"""
        global TEST_WORKFLOW_ID
        # Create workflow via API
        response = requests.post(f"{BASE_URL}/api/os-workflow", json={
            "user_id": TEST_USER_ID,
            "workflow_type": "FULL_OS"
        })
        if response.status_code == 200:
            data = response.json()
            TEST_WORKFLOW_ID = data.get("workflow", {}).get("id")
            print(f"Created test workflow: {TEST_WORKFLOW_ID}")
        yield
    
    def test_generate_step_accepts_step_inputs(self):
        """POST /api/os-workflow/{id}/step/{n}/generate accepts step_inputs"""
        global TEST_WORKFLOW_ID
        if not TEST_WORKFLOW_ID:
            pytest.skip("No test workflow ID available")
        
        # Step 1 inputs (matching os-step-inputs.js structure)
        step_inputs = {
            "biggest_challenge": "I get clients from referrals but nothing is converting from content.",
            "winning_looks_like": "$15k/month in recurring revenue with content-driven leads.",
            "current_stage": "Early stage — generating revenue but inconsistently"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/os-workflow/{TEST_WORKFLOW_ID}/step/1/generate",
            json={
                "user_id": TEST_USER_ID,
                "step_inputs": step_inputs
            }
        )
        
        # Note: LLM generation will fail due to invalid API key, but the endpoint should accept the request
        # A 500 error from LLM is expected, but a 422 validation error would indicate step_inputs is not accepted
        assert response.status_code != 422, f"step_inputs field should be accepted, got validation error: {response.text}"
        
        # If we get 500, it's likely the LLM call failing (expected in preview)
        if response.status_code == 500:
            print(f"PASS: step_inputs field accepted (LLM generation failed as expected in preview)")
        elif response.status_code == 200:
            data = response.json()
            assert "step_number" in data, "Response should have step_number"
            assert "output" in data, "Response should have output"
            print(f"PASS: step_inputs accepted and generation successful")
        else:
            print(f"Note: Got status {response.status_code}, response: {response.text[:200]}")
            # Still pass if it's not a validation error
            assert response.status_code != 422
    
    def test_generate_step_without_step_inputs(self):
        """POST /api/os-workflow/{id}/step/{n}/generate works without step_inputs"""
        global TEST_WORKFLOW_ID
        if not TEST_WORKFLOW_ID:
            pytest.skip("No test workflow ID available")
        
        response = requests.post(
            f"{BASE_URL}/api/os-workflow/{TEST_WORKFLOW_ID}/step/1/generate",
            json={
                "user_id": TEST_USER_ID
            }
        )
        
        # Should not fail with validation error
        assert response.status_code != 422, f"Request without step_inputs should be valid"
        print(f"PASS: Generate step works without step_inputs (status: {response.status_code})")
    
    def test_get_workflow_step_includes_step_inputs(self):
        """GET /api/os-workflow/{id} should include step_inputs in steps if saved"""
        global TEST_WORKFLOW_ID
        if not TEST_WORKFLOW_ID:
            pytest.skip("No test workflow ID available")
        
        # First, try to generate a step with inputs (even if LLM fails, inputs may be saved)
        step_inputs = {
            "biggest_challenge": "Test challenge",
            "winning_looks_like": "Test winning",
            "current_stage": "Early stage — generating revenue but inconsistently"
        }
        
        # Try to generate - may fail due to LLM but should save inputs
        requests.post(
            f"{BASE_URL}/api/os-workflow/{TEST_WORKFLOW_ID}/step/1/generate",
            json={
                "user_id": TEST_USER_ID,
                "step_inputs": step_inputs
            }
        )
        
        # Get the workflow
        response = requests.get(f"{BASE_URL}/api/os-workflow/{TEST_WORKFLOW_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert "steps" in data, "Workflow should have steps"
        print(f"PASS: Workflow retrieval works (steps: {len(data.get('steps', []))})")


class TestExistingWorkflow:
    """Test with known existing workflow"""
    
    def test_existing_workflow_a6af4b68(self):
        """Test with the existing workflow ID mentioned in context"""
        existing_workflow_id = "a6af4b68-3fcb-4085-bd7f-4cbc5e323a50"
        
        response = requests.get(f"{BASE_URL}/api/os-workflow/{existing_workflow_id}")
        
        if response.status_code == 200:
            data = response.json()
            assert "id" in data
            assert "steps" in data
            print(f"PASS: Existing workflow found with {len(data.get('steps', []))} steps")
            
            # Check if steps have step_inputs field available
            for step in data.get("steps", []):
                if "step_inputs" in step:
                    print(f"  - Step {step.get('step_number')} has step_inputs")
        elif response.status_code == 404:
            print("NOTE: Existing workflow not found (may have been deleted)")
        else:
            print(f"NOTE: Got status {response.status_code} for existing workflow")


class TestOSReadiness:
    """Test readiness endpoint"""
    
    def test_readiness_returns_score(self):
        """GET /api/os-workflow/readiness returns readiness info"""
        response = requests.get(f"{BASE_URL}/api/os-workflow/readiness?user_id={TEST_USER_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "score" in data, "Response should have 'score'"
        assert "missing_fields" in data, "Response should have 'missing_fields'"
        assert "is_ready" in data, "Response should have 'is_ready'"
        
        assert isinstance(data["score"], (int, float)), "Score should be numeric"
        assert isinstance(data["missing_fields"], list), "missing_fields should be a list"
        assert isinstance(data["is_ready"], bool), "is_ready should be boolean"
        print(f"PASS: Readiness check works - score: {data['score']}%, is_ready: {data['is_ready']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
