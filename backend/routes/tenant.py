"""
tenant_router.py
Core Truth House OS — Workspace Management Routes

Routes:
  GET  /api/workspaces/mine       - Get user's workspaces
  GET  /api/workspaces/{id}       - Get single workspace
  POST /api/workspaces            - Create new workspace
  GET  /api/admin/workspaces      - Super Admin get all workspaces
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import secrets

router = APIRouter(prefix="/api")


# ── Models ────────────────────────────────────────────────────

class CreateWorkspaceRequest(BaseModel):
    name: str
    owner_email: Optional[str] = None


# ── Routes ────────────────────────────────────────────────────

@router.get('/workspaces/mine')
async def get_my_workspaces(request: Request):
    """
    Returns the workspaces the current user is a member of.
    If no workspaces exist, creates a default one.
    """
    db = request.app.state.db
    user_id = getattr(request.state, 'user_id', None)
    
    if not user_id:
        # For dev mode, create/return default workspace
        user_id = 'default'
    
    # Find user's memberships
    memberships = await db.workspace_members.find(
        {'user_id': user_id, 'status': 'active'}
    ).to_list(length=50)

    workspace_ids = [m['workspace_id'] for m in memberships]
    
    if workspace_ids:
        workspaces_cursor = db.workspaces.find({'workspace_id': {'$in': workspace_ids}})
        workspaces = await workspaces_cursor.to_list(length=50)
    else:
        # No workspaces — create a default one for new users
        workspace_id = secrets.token_urlsafe(16)
        now = datetime.utcnow()
        
        workspace = {
            'workspace_id': workspace_id,
            'name': 'My Brand',
            'owner_email': '',
            'plan': 'audit',
            'credits': 0,
            'credits_cap': 0,
            'status': 'active',
            'created_at': now,
            'updated_at': now,
        }
        await db.workspaces.insert_one(workspace)
        
        # Add membership
        await db.workspace_members.insert_one({
            'workspace_id': workspace_id,
            'user_id': user_id,
            'email': '',
            'role': 'owner',
            'status': 'active',
            'joined_at': now,
        })
        
        workspaces = [workspace]

    return {
        'workspaces': [_format_workspace(ws) for ws in workspaces]
    }


@router.get('/workspaces/{workspace_id}')
async def get_workspace(workspace_id: str, request: Request):
    """Get a single workspace."""
    db = request.app.state.db

    ws = await db.workspaces.find_one({'workspace_id': workspace_id})
    if not ws:
        raise HTTPException(status_code=404, detail='Workspace not found')

    return _format_workspace(ws)


@router.post('/workspaces')
async def create_workspace(body: CreateWorkspaceRequest, request: Request):
    """Create a new tenant workspace."""
    db = request.app.state.db
    user_id = getattr(request.state, 'user_id', 'default')
    
    workspace_id = secrets.token_urlsafe(16)
    now = datetime.utcnow()

    workspace = {
        'workspace_id': workspace_id,
        'name': body.name,
        'owner_email': body.owner_email or '',
        'plan': 'audit',
        'credits': 0,
        'credits_cap': 0,
        'status': 'active',
        'created_at': now,
        'updated_at': now,
    }
    await db.workspaces.insert_one(workspace)
    
    # Add creator as owner
    await db.workspace_members.insert_one({
        'workspace_id': workspace_id,
        'user_id': user_id,
        'email': body.owner_email or '',
        'role': 'owner',
        'status': 'active',
        'joined_at': now,
    })
    
    return _format_workspace(workspace)


@router.get('/admin/workspaces')
async def admin_get_all_workspaces(
    request: Request,
    q: str = '',
    skip: int = 0,
    limit: int = 50,
):
    """Super Admin — returns all workspaces with search."""
    db = request.app.state.db
    
    query = {}
    if q:
        query['$or'] = [
            {'name': {'$regex': q, '$options': 'i'}},
            {'owner_email': {'$regex': q, '$options': 'i'}},
        ]
    
    total = await db.workspaces.count_documents(query)
    cursor = db.workspaces.find(query).skip(skip).limit(limit)
    workspaces = await cursor.to_list(length=limit)

    return {
        'workspaces': [_format_workspace(ws) for ws in workspaces],
        'total': total,
    }


@router.put('/workspaces/{workspace_id}/plan')
async def update_workspace_plan(workspace_id: str, request: Request):
    """Update workspace plan."""
    db = request.app.state.db
    body = await request.json()
    plan = body.get('plan', 'audit')
    
    await db.workspaces.update_one(
        {'workspace_id': workspace_id},
        {'$set': {'plan': plan, 'updated_at': datetime.utcnow()}}
    )
    
    return {'success': True, 'plan': plan}


# ── Helper ────────────────────────────────────────────────────

def _format_workspace(ws: dict) -> dict:
    return {
        'workspace_id': ws.get('workspace_id'),
        'name': ws.get('name'),
        'owner_email': ws.get('owner_email'),
        'plan': ws.get('plan', 'audit'),
        'credits': ws.get('credits', 0),
        'credits_cap': ws.get('credits_cap', 0),
        'status': ws.get('status', 'active'),
        'created_at': ws.get('created_at', '').isoformat() if ws.get('created_at') else None,
    }
