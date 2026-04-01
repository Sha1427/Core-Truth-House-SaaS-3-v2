"""Email templates for Core Truth House."""
from typing import Optional
import logging

logger = logging.getLogger("cth.email_templates")


def get_base_template(content: str) -> str:
    """Wrap content in base email template."""
    return f'''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Core Truth House</title>
    <style>
        body {{
            margin: 0;
            padding: 0;
            background-color: #0d0010;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }}
        
        .email-wrapper {{
            max-width: 600px;
            margin: 0 auto;
            background-color: #1a0020;
        }}
        
        .email-header {{
            background: linear-gradient(135deg, #0d0010, #1a0020);
            padding: 40px 30px;
            text-align: center;
            border-bottom: 1px solid rgba(224, 78, 53, 0.2);
        }}
        
        .logo {{
            display: inline-block;
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #e04e35, #af0024);
            border-radius: 12px;
            margin-bottom: 16px;
        }}
        
        .brand-name {{
            font-size: 20px;
            font-weight: 700;
            color: #ffffff;
        }}
        
        .brand-name span {{
            color: #e04e35;
        }}
        
        .email-content {{
            padding: 40px 30px;
            color: #c7a09d;
            line-height: 1.7;
        }}
        
        .email-content h1 {{
            color: #ffffff;
            font-size: 28px;
            margin: 0 0 20px 0;
            font-weight: 600;
        }}
        
        .email-content h2 {{
            color: #ffffff;
            font-size: 20px;
            margin: 30px 0 15px 0;
            font-weight: 600;
        }}
        
        .email-content p {{
            margin: 0 0 16px 0;
        }}
        
        .email-content a {{
            color: #e04e35;
            text-decoration: none;
        }}
        
        .cta-button {{
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #e04e35, #af0024);
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
        }}
        
        .cta-button:hover {{
            opacity: 0.9;
        }}
        
        .highlight-box {{
            background: rgba(224, 78, 53, 0.1);
            border: 1px solid rgba(224, 78, 53, 0.2);
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
        }}
        
        .highlight-box h3 {{
            color: #e04e35;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 0 0 10px 0;
        }}
        
        .features-list {{
            list-style: none;
            padding: 0;
            margin: 0;
        }}
        
        .features-list li {{
            padding: 8px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }}
        
        .features-list li:before {{
            content: "✓";
            color: #e04e35;
            margin-right: 10px;
        }}
        
        .email-footer {{
            padding: 30px;
            text-align: center;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            color: #4a3550;
            font-size: 12px;
        }}
        
        .social-links {{
            margin: 20px 0;
        }}
        
        .social-links a {{
            display: inline-block;
            margin: 0 10px;
            color: #763b5b;
        }}
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-header">
            <div class="logo" style="display: flex; align-items: center; justify-content: center; font-size: 24px; color: white;">⌂</div>
            <div class="brand-name">Core Truth <span>House</span></div>
        </div>
        
        <div class="email-content">
            {content}
        </div>
        
        <div class="email-footer">
            <div class="social-links">
                <a href="#">Instagram</a>
                <a href="#">Twitter</a>
                <a href="#">LinkedIn</a>
            </div>
            <p>© 2025 Core Truth House. All rights reserved.</p>
            <p style="margin-top: 10px;">
                <a href="https://coretruthhouse.com/privacy" style="color: #4a3550;">Privacy Policy</a> • 
                <a href="https://coretruthhouse.com/terms" style="color: #4a3550;">Terms of Service</a>
            </p>
            <p style="margin-top: 10px; color: #333;">
                You're receiving this email because you signed up for Core Truth House.
            </p>
        </div>
    </div>
</body>
</html>
'''


def welcome_email(user_name: str, plan_name: str = "Foundation") -> dict:
    """Generate welcome email for new users."""
    content = f'''
<h1>Welcome to Core Truth House, {user_name}!</h1>

<p>You've just taken the first step toward building a brand that's built on truth, not trends. We're excited to have you here.</p>

<div class="highlight-box">
    <h3>Your {plan_name} Plan Includes</h3>
    <ul class="features-list">
        <li>Brand Foundation Builder</li>
        <li>AI-Powered Content Studio</li>
        <li>Brand Memory Technology</li>
        <li>Strategy Document Export</li>
    </ul>
</div>

<h2>What to Do First</h2>

<p><strong>Step 1: Complete Your Brand Foundation</strong><br>
Start with your mission, vision, and values. This becomes the DNA of everything else you create on the platform.</p>

<p><strong>Step 2: Set Your Brand Voice</strong><br>
Tell us how you want to sound. Our AI will adapt to match your unique voice in every generation.</p>

<p><strong>Step 3: Generate Your First Content</strong><br>
Head to Content Studio and create your first piece of on-brand content. Watch the magic happen.</p>

<p style="text-align: center;">
    <a href="https://coretruthhouse.com/brand-foundation" class="cta-button">Start Building Your Brand →</a>
</p>

<p>If you have any questions, reply to this email or check out our <a href="https://coretruthhouse.com/contact">support page</a>.</p>

<p>Here's to building something that lasts.</p>

<p style="margin-top: 30px;">
<strong>The Core Truth House Team</strong>
</p>
'''
    
    return {
        "subject": f"Welcome to Core Truth House, {user_name}! 🏠",
        "html": get_base_template(content),
        "text": f"Welcome to Core Truth House, {user_name}! Start building your brand at https://coretruthhouse.com/brand-foundation"
    }


def payment_receipt_email(
    user_name: str,
    amount: float,
    plan_name: str,
    invoice_id: str,
    billing_period: str
) -> dict:
    """Generate payment receipt email."""
    content = f'''
<h1>Payment Received</h1>

<p>Hi {user_name},</p>

<p>Thank you for your payment. Here are the details:</p>

<div class="highlight-box">
    <h3>Receipt Details</h3>
    <table style="width: 100%; color: #c7a09d;">
        <tr>
            <td style="padding: 8px 0;">Plan</td>
            <td style="text-align: right; color: #ffffff;">{plan_name}</td>
        </tr>
        <tr>
            <td style="padding: 8px 0;">Amount</td>
            <td style="text-align: right; color: #e04e35; font-weight: 600;">${amount:.2f}</td>
        </tr>
        <tr>
            <td style="padding: 8px 0;">Billing Period</td>
            <td style="text-align: right; color: #ffffff;">{billing_period}</td>
        </tr>
        <tr>
            <td style="padding: 8px 0;">Invoice ID</td>
            <td style="text-align: right; color: #ffffff; font-family: monospace;">{invoice_id}</td>
        </tr>
    </table>
</div>

<p>You can view your billing history and download invoices from your <a href="https://coretruthhouse.com/billing">billing settings</a>.</p>

<p style="text-align: center;">
    <a href="https://coretruthhouse.com/dashboard" class="cta-button">Continue Building →</a>
</p>

<p style="font-size: 13px; color: #763b5b; margin-top: 30px;">
Questions about your billing? <a href="https://coretruthhouse.com/contact">Contact our support team</a>.
</p>
'''
    
    return {
        "subject": f"Receipt for Core Truth House - ${amount:.2f}",
        "html": get_base_template(content),
        "text": f"Payment received: ${amount:.2f} for {plan_name}. Invoice: {invoice_id}"
    }


def upgrade_confirmation_email(
    user_name: str,
    old_plan: str,
    new_plan: str,
    new_features: list
) -> dict:
    """Generate plan upgrade confirmation email."""
    features_html = "".join([f"<li>{feature}</li>" for feature in new_features])
    
    content = f'''
<h1>You've Upgraded! 🎉</h1>

<p>Hi {user_name},</p>

<p>Your plan has been upgraded from <strong>{old_plan}</strong> to <strong style="color: #e04e35;">{new_plan}</strong>. Here's what's now unlocked for you:</p>

<div class="highlight-box">
    <h3>New Features Available</h3>
    <ul class="features-list">
        {features_html}
    </ul>
</div>

<p>Your new features are available immediately. Here are some things to try:</p>

<ul style="color: #c7a09d; line-height: 2;">
    <li><strong>Prompt Hub Generators</strong> — Create unlimited AI prompts with our 4 specialized generators</li>
    <li><strong>Media Studio</strong> — Generate stunning brand images and videos</li>
    <li><strong>Advanced Analytics</strong> — Track your brand health with our 8-dimension scorecard</li>
</ul>

<p style="text-align: center;">
    <a href="https://coretruthhouse.com/dashboard" class="cta-button">Explore Your New Features →</a>
</p>

<p>Thank you for growing with us. We're excited to see what you build.</p>

<p style="margin-top: 30px;">
<strong>The Core Truth House Team</strong>
</p>
'''
    
    return {
        "subject": f"You've upgraded to {new_plan}! Here's what's new 🚀",
        "html": get_base_template(content),
        "text": f"Congratulations! You've upgraded from {old_plan} to {new_plan}. New features are now available."
    }


def password_reset_email(user_name: str, reset_link: str) -> dict:
    """Generate password reset email."""
    content = f'''
<h1>Reset Your Password</h1>

<p>Hi {user_name},</p>

<p>We received a request to reset your password. Click the button below to create a new password:</p>

<p style="text-align: center;">
    <a href="{reset_link}" class="cta-button">Reset Password →</a>
</p>

<p style="font-size: 13px; color: #763b5b; margin-top: 30px;">
This link will expire in 24 hours. If you didn't request this, you can safely ignore this email.
</p>

<p style="font-size: 12px; color: #4a3550; margin-top: 20px;">
Can't click the button? Copy and paste this URL:<br>
<span style="word-break: break-all;">{reset_link}</span>
</p>
'''
    
    return {
        "subject": "Reset your Core Truth House password",
        "html": get_base_template(content),
        "text": f"Reset your password: {reset_link}"
    }


def team_invite_email(
    inviter_name: str,
    workspace_name: str,
    invite_link: str
) -> dict:
    """Generate team invitation email."""
    content = f'''
<h1>You're Invited!</h1>

<p><strong>{inviter_name}</strong> has invited you to join the <strong style="color: #e04e35;">{workspace_name}</strong> workspace on Core Truth House.</p>

<div class="highlight-box">
    <h3>What is Core Truth House?</h3>
    <p style="margin: 0;">Core Truth House is an AI-powered Brand Operating System that helps teams build consistent, authentic brands together.</p>
</div>

<p>As a team member, you'll have access to:</p>

<ul style="color: #c7a09d; line-height: 2;">
    <li>Shared Brand Foundation & Identity</li>
    <li>AI Content Generation with Brand Memory</li>
    <li>Collaborative Content Library</li>
    <li>Team Analytics & Insights</li>
</ul>

<p style="text-align: center;">
    <a href="{invite_link}" class="cta-button">Accept Invitation →</a>
</p>

<p style="font-size: 13px; color: #763b5b; margin-top: 30px;">
This invitation expires in 7 days. Questions? Contact <a href="mailto:support@coretruthhouse.com">support@coretruthhouse.com</a>
</p>
'''
    
    return {
        "subject": f"{inviter_name} invited you to {workspace_name} on Core Truth House",
        "html": get_base_template(content),
        "text": f"{inviter_name} invited you to {workspace_name}. Accept: {invite_link}"
    }


def usage_warning_email(
    user_name: str,
    current_usage: int,
    limit: int,
    plan_name: str
) -> dict:
    """Generate usage warning email when approaching limits."""
    percentage = int((current_usage / limit) * 100)
    
    content = f'''
<h1>You're Running Low on Generations</h1>

<p>Hi {user_name},</p>

<p>You've used <strong style="color: #e04e35;">{percentage}%</strong> of your monthly AI generations on the {plan_name} plan.</p>

<div class="highlight-box">
    <h3>Usage Summary</h3>
    <table style="width: 100%; color: #c7a09d;">
        <tr>
            <td style="padding: 8px 0;">Used</td>
            <td style="text-align: right; color: #e04e35; font-weight: 600;">{current_usage}</td>
        </tr>
        <tr>
            <td style="padding: 8px 0;">Limit</td>
            <td style="text-align: right; color: #ffffff;">{limit}</td>
        </tr>
        <tr>
            <td style="padding: 8px 0;">Remaining</td>
            <td style="text-align: right; color: #ffffff;">{limit - current_usage}</td>
        </tr>
    </table>
</div>

<p>Need more? Upgrade your plan for higher limits and additional features.</p>

<p style="text-align: center;">
    <a href="https://coretruthhouse.com/billing" class="cta-button">Upgrade Now →</a>
</p>

<p style="font-size: 13px; color: #763b5b;">
Your generation count resets at the beginning of each billing cycle.
</p>
'''
    
    return {
        "subject": f"You've used {percentage}% of your monthly generations",
        "html": get_base_template(content),
        "text": f"You've used {current_usage}/{limit} generations ({percentage}%). Upgrade for more: https://coretruthhouse.com/billing"
    }


def weekly_digest_email(
    user_name: str,
    week_label: str,
    upcoming_events: list,
    recent_posts: list,
    pipeline_value: float,
    total_contacts: int,
    total_deals: int,
    new_contacts_count: int,
    published_posts_count: int,
    generation_count: int,
) -> dict:
    """Generate weekly digest email summarising activity across the platform."""

    # Events section
    if upcoming_events:
        events_rows = ""
        for ev in upcoming_events[:5]:
            cat = ev.get("category", "general").capitalize()
            title = ev.get("title", "Untitled")
            date_str = ev.get("start_time", "")[:10]
            events_rows += f'''
            <tr>
                <td style="padding: 8px 0; color: #ffffff;">{title}</td>
                <td style="padding: 8px 0; text-align: right; color: #c7a09d; font-size: 13px;">{date_str}</td>
                <td style="padding: 8px 0; text-align: right; color: #763b5b; font-size: 12px;">{cat}</td>
            </tr>'''
        events_html = f'''
        <div class="highlight-box">
            <h3>Upcoming Events ({len(upcoming_events)})</h3>
            <table style="width: 100%; border-collapse: collapse; color: #c7a09d;">
                {events_rows}
            </table>
        </div>'''
    else:
        events_html = '''
        <div class="highlight-box">
            <h3>Upcoming Events</h3>
            <p style="margin:0; font-size: 13px;">No upcoming events this week. <a href="https://coretruthhouse.com/calendar">Add one now</a>.</p>
        </div>'''

    # Blog posts section
    if recent_posts:
        posts_items = ""
        for post in recent_posts[:5]:
            status = post.get("status", "draft").capitalize()
            title = post.get("title", "Untitled")
            badge_color = "#4ade80" if status == "Published" else "#c7a09d"
            posts_items += f'''
            <li style="display: flex; justify-content: space-between; align-items: center;">
                <span>{title}</span>
                <span style="color: {badge_color}; font-size: 11px; text-transform: uppercase;">{status}</span>
            </li>'''
        posts_html = f'''
        <div class="highlight-box">
            <h3>Recent Blog Posts</h3>
            <ul class="features-list">{posts_items}</ul>
        </div>'''
    else:
        posts_html = '''
        <div class="highlight-box">
            <h3>Blog Activity</h3>
            <p style="margin:0; font-size: 13px;">No blog posts this week. <a href="https://coretruthhouse.com/blog-cms">Start writing</a>.</p>
        </div>'''

    content = f'''
<h1>Your Weekly Digest</h1>

<p>Hi {user_name},</p>

<p>Here's your brand activity summary for <strong>{week_label}</strong>.</p>

<h2>Quick Stats</h2>

<div style="display: flex; gap: 12px; margin-bottom: 24px;">
    <div style="flex: 1; background: rgba(224, 78, 53, 0.1); border: 1px solid rgba(224, 78, 53, 0.2); border-radius: 12px; padding: 16px; text-align: center;">
        <div style="font-size: 28px; font-weight: 700; color: #e04e35;">${pipeline_value:,.0f}</div>
        <div style="font-size: 11px; color: #c7a09d; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">Pipeline Value</div>
    </div>
    <div style="flex: 1; background: rgba(34, 197, 94, 0.08); border: 1px solid rgba(34, 197, 94, 0.15); border-radius: 12px; padding: 16px; text-align: center;">
        <div style="font-size: 28px; font-weight: 700; color: #22c55e;">{total_contacts}</div>
        <div style="font-size: 11px; color: #c7a09d; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">Contacts</div>
    </div>
    <div style="flex: 1; background: rgba(118, 59, 91, 0.12); border: 1px solid rgba(118, 59, 91, 0.2); border-radius: 12px; padding: 16px; text-align: center;">
        <div style="font-size: 28px; font-weight: 700; color: #763b5b;">{total_deals}</div>
        <div style="font-size: 11px; color: #c7a09d; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">Active Deals</div>
    </div>
</div>

<div style="display: flex; gap: 12px; margin-bottom: 24px;">
    <div style="flex: 1; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 12px; text-align: center;">
        <span style="font-size: 18px; font-weight: 600; color: #ffffff;">{new_contacts_count}</span>
        <span style="font-size: 12px; color: #4a3550; display: block;">new contacts</span>
    </div>
    <div style="flex: 1; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 12px; text-align: center;">
        <span style="font-size: 18px; font-weight: 600; color: #ffffff;">{published_posts_count}</span>
        <span style="font-size: 12px; color: #4a3550; display: block;">posts published</span>
    </div>
    <div style="flex: 1; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 12px; text-align: center;">
        <span style="font-size: 18px; font-weight: 600; color: #ffffff;">{generation_count}</span>
        <span style="font-size: 12px; color: #4a3550; display: block;">AI generations</span>
    </div>
</div>

{events_html}

{posts_html}

<p style="text-align: center; margin-top: 32px;">
    <a href="https://coretruthhouse.com/dashboard" class="cta-button">Open Dashboard</a>
</p>

<p style="font-size: 13px; color: #763b5b; margin-top: 30px;">
You're receiving this digest because you opted in. <a href="https://coretruthhouse.com/digest">Manage preferences</a>.
</p>
'''

    return {
        "subject": f"Your Weekly Brand Digest — {week_label}",
        "html": get_base_template(content),
        "text": f"Weekly digest for {week_label}: Pipeline ${pipeline_value:,.0f}, {total_contacts} contacts, {total_deals} deals. View at https://coretruthhouse.com/dashboard"
    }
