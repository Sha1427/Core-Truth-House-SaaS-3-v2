from __future__ import annotations
import os
import secrets
import logging
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
import stripe
import resend
from pymongo import MongoClient

logger = logging.getLogger("coretruthhouse.headshots")

router = APIRouter(prefix="/api/headshots", tags=["headshots"])

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
resend.api_key = os.getenv("RESEND_API_KEY")

MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client["core_truth_house"]
tokens_collection = db["headshot_tokens"]

STUDIO_URL = "https://ais-pre-zecc37ofjq7mrbnqkroaxi-39918502251.us-east1.run.app"
SITE_URL = os.getenv("SITE_URL", "https://coretruthhouse.com")
PRICE_ID = os.getenv("HEADSHOT_STRIPE_PRICE_ID", "")
WEBHOOK_SECRET = os.getenv("HEADSHOT_WEBHOOK_SECRET", "")


@router.post("/checkout")
async def create_checkout(request: Request):
    try:
        body = await request.json()
        email = body.get("email", "")

        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "unit_amount": 4700,
                    "product_data": {
                        "name": "The Presence Studio",
                        "description": "Studio-quality AI headshots for founders and executives.",
                    },
                },
                "quantity": 1,
            }],
            mode="payment",
            customer_email=email if email else None,
            success_url=f"{SITE_URL}/studio/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{SITE_URL}/headshots",
            metadata={"product": "presence_studio"},
        )
        return {"url": session.url}
    except Exception as e:
        logger.error(f"Checkout error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, WEBHOOK_SECRET
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        email = session.get("customer_email") or session.get("customer_details", {}).get("email")
        
        if email:
            token = secrets.token_urlsafe(32)
            expires_at = datetime.utcnow() + timedelta(days=365)
            
            tokens_collection.insert_one({
                "token": token,
                "email": email,
                "created_at": datetime.utcnow(),
                "expires_at": expires_at,
                "stripe_session_id": session["id"],
                "used": False,
            })

            access_url = f"{SITE_URL}/studio/{token}"

            resend.Emails.send({
                "from": "Core Truth House <noreply@coretruthhouse.com>",
                "to": [email],
                "subject": "Your Presence Studio Access Is Ready",
                "html": f"""
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #0D0010; color: #fff; border-radius: 12px;">
                    <h1 style="color: #AF0024;">Your studio is ready.</h1>
                    <p>Thank you for purchasing The Presence Studio. Your exclusive access link is below.</p>
                    <a href="{access_url}" style="display: inline-block; padding: 16px 32px; background: #AF0024; color: white; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 24px 0;">
                        Launch My Studio
                    </a>
                    <p style="color: rgba(255,255,255,0.6); font-size: 14px;">This link is unique to you. Bookmark it for future access.</p>
                    <p style="color: rgba(255,255,255,0.6); font-size: 14px;">Questions? <a href="https://coretruthhouse.com/contact" style="color: #AF0024;">Contact us</a></p>
                </div>
                """
            })

    return JSONResponse(content={"status": "ok"})


@router.get("/verify/{token}")
async def verify_token(token: str):
    record = tokens_collection.find_one({"token": token})
    
    if not record:
        raise HTTPException(status_code=404, detail="Invalid access link.")
    
    if datetime.utcnow() > record["expires_at"]:
        raise HTTPException(status_code=410, detail="This access link has expired.")
    
    return {
        "valid": True,
        "email": record["email"],
        "studio_url": STUDIO_URL,
    }