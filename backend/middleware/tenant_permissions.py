from fastapi import Depends, HTTPException, Request
from .tenant_dependencies import get_tenant_context


def require_workspace_role(*allowed_roles: str):
    async def dependency(request: Request, ctx=Depends(get_tenant_context)):
        user_role = getattr(request.state, "workspace_role", None)

        if ctx.is_super_admin:
            return True

        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="Insufficient workspace permissions."
            )

        return True

    return dependency

