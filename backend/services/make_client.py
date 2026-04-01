from __future__ import annotations

import os

import httpx
from fastapi import HTTPException


class MakeClient:
    def __init__(self) -> None:
        self.webhook_url = os.getenv("MAKE_AGENTIC_WEBHOOK_URL", "").strip()
        self.shared_secret = os.getenv("MAKE_SHARED_SECRET", "").strip()
        self.timeout_seconds = float(os.getenv("MAKE_TIMEOUT_SECONDS", "20"))

    async def trigger_agentic_workflow(self, payload: dict) -> None:
        if not self.webhook_url:
            raise HTTPException(status_code=500, detail="Make webhook is not configured.")

        headers = {
            "Content-Type": "application/json",
            "X-CTH-Make-Secret": self.shared_secret,
        }

        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            response = await client.post(self.webhook_url, json=payload, headers=headers)

        if response.status_code >= 400:
            raise HTTPException(
                status_code=502,
                detail=f"Make webhook failed with status {response.status_code}",
            )


make_client = MakeClient()
