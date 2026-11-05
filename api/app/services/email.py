"""SMTP email service for lead notifications and visitor confirmations."""

from __future__ import annotations

import logging
from email.message import EmailMessage
from email.utils import formataddr
from html import escape
from typing import Any

from app.core.config import Settings, get_settings

logger = logging.getLogger(__name__)


def _email_layout(title: str, content: str, settings: Settings) -> str:
    """Wrap content in a branded HTML email template."""
    brand = settings.business_name
    website = settings.business_website_url
    return (
        "<!doctype html><html><body style=\"margin:0;padding:24px 12px;"
        "background-color:#0a0c14;font-family:Arial,Helvetica,sans-serif;"
        "color:#eef1f8;line-height:1.6\">"
        "<div style=\"display:none;max-height:0;overflow:hidden;opacity:0\">"
        f"{escape(title)}</div>"
        "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" "
        "width=\"100%\" style=\"max-width:620px;margin:0 auto;background:#11141f;"
        "border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden\">"
        "<tr><td style=\"padding:18px 24px;background:#04050a\">"
        "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\">"
        "<tr><td style=\"vertical-align:middle;color:#ffffff\">"
        f"<strong style=\"font-size:17px;letter-spacing:.3px;color:#2f6bff\">{escape(brand)}</strong>"
        "</td></tr></table></td></tr>"
        "<tr><td style=\"padding:28px 28px 24px\">"
        f"<h1 style=\"margin:0 0 18px;color:#3de0ff;font-size:23px;line-height:1.3\">"
        f"{escape(title)}</h1>{content}</td></tr>"
        "<tr><td style=\"padding:16px 28px;background:#0a0c14;border-top:1px solid rgba(255,255,255,0.08);"
        "color:#8e97ad;font-size:12px\">"
        f"{escape(brand)} &middot; "
        f"<a href=\"{escape(website, quote=True)}\" style=\"color:#2f6bff;text-decoration:none\">"
        f"{escape(website)}</a><br>"
        "This message was sent in response to an inquiry on our website.</td></tr>"
        "</table></body></html>"
    )


def _build_message(
    settings: Settings,
    subject: str,
    to_email: str,
    text_body: str,
    html_body: str,
    reply_to: str | None = None,
) -> EmailMessage:
    """Create a fully formed EmailMessage."""
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = formataddr((settings.business_name, settings.email_from))
    msg["To"] = to_email
    if reply_to:
        msg["Reply-To"] = reply_to
    msg.set_content(text_body)
    msg.add_alternative(html_body, subtype="html")
    return msg


async def _send(msg: EmailMessage, settings: Settings) -> bool:
    """Send via SMTP. Returns True on success, False on failure."""
    if not settings.smtp_enabled:
        logger.info("SMTP sending is disabled by configuration")
        return False
    if not settings.smtp_host or not settings.email_from:
        logger.warning("SMTP not configured — skipping email send")
        return False
    try:
        import aiosmtplib

        await aiosmtplib.send(
            msg,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_username or None,
            password=settings.smtp_password or None,
            start_tls=settings.smtp_use_tls,
            use_tls=settings.smtp_use_ssl,
            timeout=settings.email_timeout_seconds,
        )
        return True
    except Exception as exc:
        logger.warning(
            "Email delivery failed host=%s type=%s detail=%s",
            settings.smtp_host,
            type(exc).__name__,
            str(exc)[:200],
        )
        return False


# ── Lead / Booking notification ──────────────────────────────────────────


async def send_lead_notification(lead: dict[str, Any], settings: Settings | None = None) -> bool:
    """Notify the business owner about a new lead / booking request."""
    settings = settings or get_settings()

    name = lead.get("name", "Unknown")
    email = lead.get("email", "")
    phone = lead.get("phone", "")
    business_name = lead.get("business_name", "Not provided")
    need = lead.get("need", "")
    source = lead.get("source_page") or "/"

    text_body = (
        f"NEW LEAD — {settings.business_name}\n\n"
        f"Name: {name}\nEmail: {email}\nPhone: {phone}\n"
        f"Business: {business_name}\n"
        f"Need: {need}\nSource: {source}\n"
    )

    html_content = (
        "<p style=\"margin:0 0 20px;color:#8e97ad\">A new visitor has submitted an enquiry "
        "through your website.</p>"
        "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" "
        "width=\"100%\" style=\"border-collapse:collapse;font-size:14px\">"
        f"<tr><td style=\"padding:10px;border-bottom:1px solid rgba(255,255,255,0.08);color:#8e97ad\">Name</td>"
        f"<td style=\"padding:10px;border-bottom:1px solid rgba(255,255,255,0.08)\"><strong>{escape(name)}</strong></td></tr>"
        f"<tr><td style=\"padding:10px;border-bottom:1px solid rgba(255,255,255,0.08);color:#8e97ad\">Email</td>"
        f"<td style=\"padding:10px;border-bottom:1px solid rgba(255,255,255,0.08)\">"
        f"<a href=\"mailto:{escape(email, quote=True)}\" style=\"color:#2f6bff\">{escape(email)}</a></td></tr>"
        f"<tr><td style=\"padding:10px;border-bottom:1px solid rgba(255,255,255,0.08);color:#8e97ad\">Phone</td>"
        f"<td style=\"padding:10px;border-bottom:1px solid rgba(255,255,255,0.08)\">{escape(phone)}</td></tr>"
        f"<tr><td style=\"padding:10px;border-bottom:1px solid rgba(255,255,255,0.08);color:#8e97ad\">Business</td>"
        f"<td style=\"padding:10px;border-bottom:1px solid rgba(255,255,255,0.08)\">{escape(business_name)}</td></tr>"
        f"<tr><td style=\"padding:10px;color:#8e97ad\">Need</td>"
        f"<td style=\"padding:10px\">{escape(need)}</td></tr></table>"
        f"<p style=\"margin:18px 0 0;color:#8e97ad;font-size:13px\">Source page: {escape(source)}</p>"
    )

    msg = _build_message(
        settings,
        subject=f"New enquiry from {name}",
        to_email=settings.email_to,
        text_body=text_body,
        html_body=_email_layout("New website enquiry", html_content, settings),
        reply_to=email,
    )
    return await _send(msg, settings)


# ── Chat inquiry notification (with transcript) ─────────────────────────


async def send_chat_inquiry_notification(
    inquiry: dict[str, Any],
    transcript: list[dict[str, str]],
    settings: Settings | None = None,
) -> bool:
    """Send a chat inquiry with the full conversation transcript to the business."""
    settings = settings or get_settings()

    name = inquiry.get("name", "Unknown")
    email = inquiry.get("email", "")
    phone = inquiry.get("phone", "")
    business_name = inquiry.get("business_name", "Not provided")
    session_id = inquiry.get("session_id", "")

    # Build transcript text
    transcript_text_parts = []
    transcript_html_parts = []
    for item in transcript:
        role = str(item.get("role", "visitor")).title()
        content = str(item.get("content", ""))
        transcript_text_parts.append(f"{role}: {content}")
        transcript_html_parts.append(
            "<tr><td style=\"padding:12px;border-bottom:1px solid rgba(255,255,255,0.08);"
            "vertical-align:top;width:80px;color:#3de0ff;font-weight:bold;font-size:13px\">"
            f"{escape(role)}</td>"
            "<td style=\"padding:12px;border-bottom:1px solid rgba(255,255,255,0.08);color:#eef1f8\">"
            f"{escape(content)}</td></tr>"
        )

    transcript_text = "\n\n".join(transcript_text_parts)
    transcript_html = "".join(transcript_html_parts)

    text_body = (
        f"CHAT INQUIRY — {settings.business_name}\n\n"
        f"Name: {name}\nBusiness: {business_name}\n"
        f"Email: {email}\nPhone: {phone}\n"
        f"Session: {session_id}\n\n"
        f"Conversation:\n{transcript_text}\n"
    )

    html_content = (
        "<p style=\"margin:0 0 20px;color:#8e97ad\">A visitor submitted an inquiry during a chat. "
        "Reply to this email to follow up.</p>"
        "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" "
        "width=\"100%\" style=\"border-collapse:collapse;font-size:14px\">"
        f"<tr><td style=\"padding:10px;color:#8e97ad\">Name</td><td style=\"padding:10px\"><strong>{escape(name)}</strong></td></tr>"
        f"<tr><td style=\"padding:10px;color:#8e97ad\">Business</td><td style=\"padding:10px\">{escape(business_name)}</td></tr>"
        f"<tr><td style=\"padding:10px;color:#8e97ad\">Email</td><td style=\"padding:10px\">"
        f"<a href=\"mailto:{escape(email, quote=True)}\" style=\"color:#2f6bff\">{escape(email)}</a></td></tr>"
        f"<tr><td style=\"padding:10px;color:#8e97ad\">Phone</td><td style=\"padding:10px\">{escape(phone)}</td></tr>"
        f"<tr><td style=\"padding:10px;color:#8e97ad\">Session</td><td style=\"padding:10px\">{escape(session_id)}</td></tr>"
        "</table>"
        "<h2 style=\"margin:24px 0 10px;color:#3de0ff;font-size:17px\">Conversation</h2>"
        "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" "
        "width=\"100%\" style=\"border-collapse:collapse;background:#0a0c14;border-radius:8px\">"
        f"{transcript_html}</table>"
    )

    msg = _build_message(
        settings,
        subject=f"Chat inquiry from {name}",
        to_email=settings.email_to,
        text_body=text_body,
        html_body=_email_layout("Chat inquiry received", html_content, settings),
        reply_to=email,
    )
    return await _send(msg, settings)


# ── Visitor confirmation ─────────────────────────────────────────────────


async def send_visitor_confirmation(
    visitor_email: str,
    visitor_name: str,
    settings: Settings | None = None,
) -> bool:
    """Send a thank-you confirmation to the visitor."""
    settings = settings or get_settings()
    brand = settings.business_name
    website = settings.business_website_url
    phone = settings.business_phone

    text_body = (
        f"Thank you for reaching out to {brand}, {visitor_name}!\n\n"
        f"We have received your enquiry and our team will review it shortly.\n"
        f"We typically respond within 1 business day.\n\n"
        f"In the meantime, feel free to reach us:\n"
        f"Phone: {phone}\nEmail: {settings.email_from}\nWebsite: {website}\n\n"
        f"Warm regards,\n{brand} Team"
    )

    html_content = (
        f"<p style=\"margin:0 0 16px;color:#eef1f8\">Dear {escape(visitor_name)},</p>"
        "<p style=\"margin:0 0 20px;color:#8e97ad\">Thank you for reaching out to "
        f"{escape(brand)}. We have received your enquiry and our team will review it shortly.</p>"
        "<div style=\"margin:0 0 22px;padding:16px 18px;background:#0a0c14;"
        "border-left:4px solid #f5a524;border-radius:4px\">"
        "<strong style=\"color:#f5a524\">What happens next?</strong>"
        "<p style=\"margin:6px 0 0;color:#8e97ad\">A member of our team will review your inquiry "
        "and contact you. We typically respond within 1 business day.</p></div>"
        f"<p style=\"margin:0 0 6px;color:#8e97ad;font-size:13px\">Phone: {escape(phone)}</p>"
        f"<p style=\"margin:0 0 6px;color:#8e97ad;font-size:13px\">Email: {escape(settings.email_from)}</p>"
        f"<p style=\"margin:0 0 18px;color:#8e97ad;font-size:13px\">Website: "
        f"<a href=\"{escape(website, quote=True)}\" style=\"color:#2f6bff\">{escape(website)}</a></p>"
        f"<p style=\"margin:22px 0 0;color:#eef1f8\">Warm regards,<br><strong>{escape(brand)} Team</strong></p>"
    )

    msg = _build_message(
        settings,
        subject=f"Your {brand} enquiry — received",
        to_email=visitor_email,
        text_body=text_body,
        html_body=_email_layout("Thank you for your enquiry", html_content, settings),
    )
    return await _send(msg, settings)
