from __future__ import annotations

import re
from collections.abc import AsyncIterator
from typing import Any

from app.agents.memory.store import get_memory_store
from app.agents.prompts import get_system_prompt
from app.core.config import get_settings
from app.services.llm import llm_service

_CONTACT_INTENT_PATTERNS = (
    re.compile(r'\b(?:any|a|the|quick|short)\s+(?:(?:inquiry|enquiry|contact)\s+)?form\b', re.IGNORECASE),
    re.compile(r'\b(?:inquiry|enquiry|contact)\s+form\b', re.IGNORECASE),
    re.compile(
        r'\b(?:contact|reach out to|talk to|speak to|connect with)\s+'
        r'(?:(?:the|your)\s+)?(?:team|sales|someone|a person|a human)\b',
        re.IGNORECASE,
    ),
    re.compile(
        r'\b(?:i|we)\s+(?:want|would like|need|am interested|are interested)\b'
        r'.{0,80}\b(?:integrat\w*|implement\w*|add|set up|use|hire|chat agent|ai agent|assistant)\b',
        re.IGNORECASE,
    ),
    re.compile(r'\b(?:book|schedule)\s+(?:a\s+)?(?:call|meeting)\b', re.IGNORECASE),
    re.compile(r'\b(?:call|email|message|contact)\s+me\b', re.IGNORECASE),
)


def _is_contact_intent(message: str) -> bool:
    return any(pattern.search(message) for pattern in _CONTACT_INTENT_PATTERNS)


async def stream_chat(session_id: str, message: str) -> AsyncIterator[dict[str, Any]]:
    """Stream LLM reply chunks and emit show_lead_form when threshold is reached."""
    settings = get_settings()
    store = get_memory_store()
    history = store.get_history(session_id)

    # Count user messages BEFORE adding the new one
    prior_user_count = sum(1 for msg in history if msg.get('role') == 'user')
    current_user_count = prior_user_count + 1

    messages = [
        {'role': 'system', 'content': get_system_prompt()},
        *history[-settings.chat_max_context_messages:],
        {'role': 'user', 'content': message},
    ]

    reply_parts: list[str] = []
    async for chunk in llm_service.stream_reply(messages):
        if chunk:
            reply_parts.append(chunk)
            yield {'type': 'chunk', 'text': chunk}

    reply = ''.join(reply_parts).strip()
    if not reply:
        raise RuntimeError('The configured LLM returned an empty response')

    # Check if we should show the lead capture form
    # Show it once when the user reaches the configured message threshold
    show_form = (
        current_user_count == settings.lead_capture_after_messages
        or _is_contact_intent(message)
    )

    if show_form:
        # Append a soft CTA to the reply
        cta = (
            "\n\nIf you'd like our team to follow up personally, "
            "you can fill out the quick inquiry form below. It's optional — "
            "feel free to keep chatting!"
        )
        reply += cta
        yield {'type': 'chunk', 'text': cta}

    store.add_turn(session_id, message, reply)

    if show_form:
        yield {'type': 'show_lead_form', 'message_count': current_user_count}
