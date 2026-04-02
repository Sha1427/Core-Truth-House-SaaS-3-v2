"""Email service using Resend."""
import asyncio
import logging
import os

logger = logging.getLogger("cth.email")

RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')


async def send_email(to: str, subject: str, html: str) -> dict:
    """Send an email via Resend. Returns result dict."""
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not configured - email not sent")
        return {"status": "skipped", "reason": "No API key configured"}

    try:
        import resend
        resend.api_key = RESEND_API_KEY

        params = {
            "from": SENDER_EMAIL,
            "to": [to],
            "subject": subject,
            "html": html
        }
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent to {to}: {subject}")
        return {"status": "sent", "email_id": result.get("id")}
    except Exception as e:
        logger.error(f"Failed to send email to {to}: {e}")
        return {"status": "failed", "error": str(e)}


def payment_confirmation_html(plan_name: str, amount: float, billing_cycle: str) -> str:
    """Generate payment confirmation email HTML."""
    return f"""
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0d0010; color: #f8f5fa; padding: 40px;">
        <div style="text-align: center; margin-bottom: 32px;">
            <div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #AF0024, #e04e35); margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 24px; color: white;">&#x2713;</span>
            </div>
            <h1 style="font-size: 24px; margin: 0; color: #f8f5fa;">Payment Confirmed</h1>
        </div>
        <div style="background: rgba(175, 0, 36, 0.1); border: 1px solid rgba(175, 0, 36, 0.3); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; color: #C7A09D; font-size: 14px;">Plan</td>
                    <td style="padding: 8px 0; text-align: right; font-size: 14px; font-weight: 600;">{plan_name}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #C7A09D; font-size: 14px;">Amount</td>
                    <td style="padding: 8px 0; text-align: right; font-size: 14px; font-weight: 600;">${amount:.2f}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #C7A09D; font-size: 14px;">Billing</td>
                    <td style="padding: 8px 0; text-align: right; font-size: 14px; font-weight: 600;">{billing_cycle.title()}</td>
                </tr>
            </table>
        </div>
        <p style="font-size: 14px; color: #C7A09D; line-height: 1.6;">
            Thank you for subscribing to Core Truth House. Your account has been upgraded and all features are now available.
        </p>
        <div style="text-align: center; margin-top: 32px;">
            <a href="https://coretruthhouse.com/dashboard" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #e04e35, #AF0024); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Go to Dashboard</a>
        </div>
        <p style="font-size: 12px; color: #666; text-align: center; margin-top: 40px;">
            Core Truth House &middot; Brand OS
        </p>
    </div>
    """


def team_invite_html(workspace_name: str, inviter_name: str, invite_token: str) -> str:
    """Generate team invitation email HTML."""
    return f"""
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0d0010; color: #f8f5fa; padding: 40px;">
        <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 24px; margin: 0 0 8px; color: #f8f5fa;">You're Invited</h1>
            <p style="font-size: 14px; color: #C7A09D; margin: 0;">
                {inviter_name} has invited you to join <strong>{workspace_name}</strong>
            </p>
        </div>
        <div style="background: rgba(175, 0, 36, 0.1); border: 1px solid rgba(175, 0, 36, 0.3); border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
            <p style="font-size: 14px; color: #f8f5fa; margin: 0 0 16px;">
                Join the workspace to collaborate on brand building.
            </p>
            <p style="font-size: 12px; color: #C7A09D; margin: 0;">
                Invitation code: <strong style="color: #e04e35;">{invite_token}</strong>
            </p>
        </div>
        <div style="text-align: center; margin-top: 24px;">
            <a href="https://coretruthhouse.com/dashboard" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #e04e35, #AF0024); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Accept Invitation</a>
        </div>
        <p style="font-size: 12px; color: #666; text-align: center; margin-top: 40px;">
            Core Truth House &middot; Brand OS
        </p>
    </div>
    """

