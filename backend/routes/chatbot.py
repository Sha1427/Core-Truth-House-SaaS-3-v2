"""AI Chatbot route for customer support."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import logging

from backend.database import get_db
from backend.services.ai import generate_with_ai

logger = logging.getLogger("cth.chatbot")

router = APIRouter(prefix="/api")

class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str
    suggestions: List[str] = []

# Knowledge base for the chatbot
KNOWLEDGE_BASE = """
# Core Truth House - Brand Operating System

## What is Core Truth House?
Core Truth House is a comprehensive AI-powered Brand Operating System designed for entrepreneurs and business owners who want to build authentic, consistent, and profitable brands. It's not just a tool - it's a complete system for building every layer of your brand in the right sequence.

## Pricing Plans
- **Foundation** ($47/month): Brand Foundation, Content Studio (30 generations), Basic templates
- **Structure** ($97/month): Everything in Foundation + Offer Builder, Systems Builder, Launch Planner (150 generations)
- **The House** ($197/month): Everything in Structure + Identity Studio, Media Studio (images & video), Prompt Hub generators (400 generations)
- **The Estate** ($497/month): Everything in The House + Team collaboration, Priority support, Custom integrations, Unlimited generations

## Core Features
1. **Brand Foundation**: Define your mission, vision, values, origin story, and positioning
2. **Content Studio**: AI-powered content generation for 16+ content types (Instagram, email, blogs, sales pages)
3. **Offer Builder**: Structure and optimize your products and services
4. **Systems Builder**: Document your processes and SOPs
5. **Launch Planner**: Plan and execute product launches
6. **Identity Studio**: Define your visual identity (colors, fonts, imagery)
7. **Media Studio**: Generate AI images (GPT Image 1) and videos (Sora 2)
8. **Prompt Hub**: Access premium prompt packs and AI generators
9. **Brand Audit**: Get an AI-powered assessment of your brand health
10. **Brand Scorecard**: Track your brand progress across 8 dimensions

## How Brand Memory Works
Brand Memory is our proprietary AI context system. It stores everything about your brand - your foundation, voice, audience, offers - and injects this context into every AI generation. This means every piece of content sounds like YOU, not generic AI output.

## Getting Started
1. Sign up and complete the onboarding questionnaire
2. Build your Brand Foundation first (mission, vision, values)
3. Move through each module in sequence
4. Use Content Studio for daily content needs
5. Access Prompt Hub for advanced generators

## Support
- Email: support@coretruthhouse.com
- Response time: Within 1 business day
- Enterprise inquiries: Select "Legacy Suite" in the contact form

## Common Questions
Q: Can I cancel anytime?
A: Yes, all plans are month-to-month with no contracts.

Q: What happens to my data if I cancel?
A: You can export your Brand Kit before cancelling. Data is retained for 30 days.

Q: Is there a free trial?
A: We offer a free Brand Audit to assess your current brand health.

Q: Can I upgrade/downgrade my plan?
A: Yes, you can change your plan anytime from billing settings.

Q: How is CTH different from ChatGPT?
A: CTH has Brand Memory - it learns your brand and applies that context to every generation. ChatGPT starts fresh each time.
"""

CHATBOT_SYSTEM_PROMPT = f"""You are the Core Truth House AI assistant. You help users understand the platform, answer questions about features and pricing, and guide them to the right resources.

{KNOWLEDGE_BASE}

Guidelines:
1. Be helpful, warm, and professional
2. If asked about something not in your knowledge, suggest contacting support
3. Keep responses concise but complete
4. Suggest relevant features or actions when appropriate
5. Don't make up features or pricing - only reference what's in your knowledge base
6. For technical issues, recommend contacting support
7. Use the brand voice: confident, warm, expert

Always end with a helpful follow-up question or suggestion when appropriate."""

@router.post("/chatbot", response_model=ChatResponse)
async def chat_with_bot(data: ChatMessage):
    """Handle chatbot conversation."""
    session_id = data.session_id or str(uuid.uuid4())
    
    # Get conversation history for this session
    history = await get_conversation_history(session_id)
    
    # Build conversation context
    conversation_context = ""
    if history:
        for msg in history[-5:]:  # Last 5 messages for context
            role = "User" if msg["role"] == "user" else "Assistant"
            conversation_context += f"{role}: {msg['content']}\n"
    
    # Generate response with full chatbot context embedded in prompt
    prompt = f"""{CHATBOT_SYSTEM_PROMPT}

Previous conversation:
{conversation_context}

User's new message: {data.message}

Respond helpfully based on the Core Truth House knowledge base above. Be concise and helpful."""

    try:
        response = await generate_with_ai(prompt=prompt)
        
        # Save conversation to history
        await save_message(session_id, "user", data.message)
        await save_message(session_id, "assistant", response)
        
        # Generate follow-up suggestions
        suggestions = generate_suggestions(data.message, response)
        
        return ChatResponse(
            response=response,
            session_id=session_id,
            suggestions=suggestions
        )
    except Exception as e:
        logger.error(f"Chatbot error: {e}")
        return ChatResponse(
            response="I apologize, but I'm having trouble processing your request right now. Please try again or contact support@coretruthhouse.com for assistance.",
            session_id=session_id,
            suggestions=["Contact Support", "View Pricing", "Start Free Audit"]
        )

async def get_conversation_history(session_id: str) -> List[dict]:
    """Get conversation history for a session."""
    messages = await db.chat_history.find(
        {"session_id": session_id},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(20)
    return messages
    db = get_db()

async def save_message(session_id: str, role: str, content: str):
    """Save a message to conversation history."""
    message_doc = {
        "id": str(uuid.uuid4()),
        "session_id": session_id,
        "role": role,
        "content": content,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.chat_history.insert_one(message_doc)
    db = get_db()

def generate_suggestions(user_message: str, response: str) -> List[str]:
    """Generate contextual follow-up suggestions."""
    message_lower = user_message.lower()
    
    if "price" in message_lower or "cost" in message_lower or "plan" in message_lower:
        return ["Compare all plans", "Start free audit", "What's included in The House?"]
    elif "cancel" in message_lower or "refund" in message_lower:
        return ["How to cancel", "Export my data", "Contact support"]
    elif "content" in message_lower or "generate" in message_lower:
        return ["Try Content Studio", "How does Brand Memory work?", "Content types available"]
    elif "image" in message_lower or "video" in message_lower or "media" in message_lower:
        return ["Media Studio features", "Image generation limits", "Video generation"]
    elif "start" in message_lower or "begin" in message_lower or "new" in message_lower:
        return ["Start free audit", "View pricing", "How to get started"]
    elif "prompt" in message_lower:
        return ["Prompt Hub features", "Premium prompt packs", "AI Generators"]
    else:
        return ["View all features", "Pricing plans", "Contact support"]

@router.get("/chatbot/history/{session_id}")
async def get_chat_history(session_id: str):
    """Get chat history for a session."""
    history = await get_conversation_history(session_id)
    return {"history": history, "session_id": session_id}

@router.delete("/chatbot/history/{session_id}")
async def clear_chat_history(session_id: str):
    """Clear chat history for a session."""
    result = await db.chat_history.delete_many({"session_id": session_id})
    return {"success": True, "deleted_count": result.deleted_count}
    db = get_db()
