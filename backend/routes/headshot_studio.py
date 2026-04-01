from __future__ import annotations

import os
import secrets
import logging
from datetime import datetime, timedelta

import stripe
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from database import get_db

logger = logging.getLogger("coretruthhouse.headshot_studio")

router = APIRouter(prefix="/api/headshot-studio", tags=["headshot-studio"])

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://coretruthhouse.com")
STUDIO_URL = os.getenv("STUDIO_URL", "https://ais-pre-zecc37ofjq7mrbnqkroaxi-39918502251.us-east1.run.app")


class CheckoutRequest(BaseModel):
    email: str


@router.post("/create-checkout")
async def create_checkout(body: CheckoutRequest):
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": "The Presence Studio",
                        "description": "Studio-quality AI headshots. One-time access.",
                    },
                    "unit_amount": 4700,
                },
                "quantity": 1,
            }],
            mode="payment",
            customer_email=body.email,
            success_url=f"{FRONTEND_URL}/studio/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}/headshots",
            metadata={"product": "presence_studio"},
        )
        return {"checkout_url": session.url}
    except Exception as e:
        logger.error(f"Stripe checkout error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create checkout session")


@router.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        email = session.get("customer_email", "")
        session_id = session.get("id", "")

        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(days=365)

        db = get_db()
        await db["studio_tokens"].insert_one({
            "token": token,
            "email": email,
            "stripe_session_id": session_id,
            "created_at": datetime.utcnow(),
            "expires_at": expires_at,
            "used": False,
        })

        await _send_access_email(email, token)

    return {"status": "ok"}


@router.get("/verify-token/{token}")
async def verify_token(token: str):
    db = get_db()
    record = await db["studio_tokens"].find_one({"token": token})

    if not record:
        raise HTTPException(status_code=404, detail="Invalid access token")

    if record["expires_at"] < datetime.utcnow():
        raise HTTPException(status_code=403, detail="Access token has expired")

    return {
        "valid": True,
        "email": record["email"],
        "studio_url": STUDIO_URL,
    }


async def _send_access_email(email: str, token: str):
    import httpx
    access_url = f"{FRONTEND_URL}/studio/{token}"

    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #AF0024;">Your Presence Studio is Ready</h1>
        <p>Thank you for your purchase. Your studio-quality AI headshot experience is one click away.</p>
        <a href="{access_url}" 
           style="display: inline-block; padding: 16px 32px; background: #AF0024; color: white; 
                  border-radius: 8px; text-decoration: none; font-weight: bold; margin: 24px 0;">
            Launch My Presence Studio
        </a>
        <p style="color: #666; font-size: 14px;">
            This link gives you lifetime access. Bookmark it for future use.
        </p>
        <p style="color: #666; font-size: 14px;">
            Questions? Reply to this email or visit 
            <a href="{FRONTEND_URL}/contact">coretruthhouse.com/contact</a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
        <p style="color: #999; font-size: 12px;">Core Truth House | Where serious brands are built.</p>
    </div>
    """

    async with httpx.AsyncClient() as client:
        await client.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": "Core Truth House <studio@coretruthhouse.com>",
                "to": [email],
                "subject": "Your Presence Studio Access is Ready",
                "html": html,
            },
        )