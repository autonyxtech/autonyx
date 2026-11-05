'use client';

import { ArrowUpRight, Bot, Check, LoaderCircle, MessageCircle, Send, X } from 'lucide-react';
import Link from 'next/link';
import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { BRAND } from '@/content/site';

type Message = { role: 'user' | 'assistant'; text: string };
type ContactDetails = { name?: string; email?: string; phone?: string; business_name?: string };

/** Scan all messages for name / email / phone / business-name the visitor typed. */
function extractContactDetails(messages: Message[]): ContactDetails {
  const details: ContactDetails = {};
  const emailRe = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/;
  const phoneRe = /(?:\+?\d[\d\s-]{7,15}\d)/;
  for (const m of messages) {
    if (m.role !== 'user') continue;
    const text = m.text;
    if (!details.email) { const match = text.match(emailRe); if (match) details.email = match[0]; }
    if (!details.phone) { const match = text.match(phoneRe); if (match) details.phone = match[0].trim(); }
    // Lines like "my name is X" or "I'm X" or "name: X"
    if (!details.name) {
      const nameMatch = text.match(/(?:(?:my name is|i'?m|name[:\s]+)\s*)([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/i);
      if (nameMatch) details.name = nameMatch[1].trim();
    }
    // Lines like "company is X" or "business name: X" or "from X Corp"
    if (!details.business_name) {
      const bizMatch = text.match(/(?:(?:company|business|business name|organization|org)[:\s]+is?\s*)([A-Z][\w\s&.-]+)/i)
        || text.match(/(?:from\s+)([A-Z][\w\s&.-]+(?:Ltd|LLC|Corp|Inc|Tech|Technologies|Solutions|Pvt|Private))/i);
      if (bizMatch) details.business_name = bizMatch[1].trim();
    }
  }
  return details;
}

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : '')
).replace(/\/$/, '');
const STARTERS = ['What can your AI assistant do?', 'How does a project get started?', 'Can you help with a business website?'];
const MAX_MESSAGES = 20;
const MAX_LENGTH = 1000;

function getSessionId() {
  try {
    const existing = window.localStorage.getItem('autonyx-chat-session');
    if (existing) return existing;
    const value = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem('autonyx-chat-session', value);
    return value;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

/** Parse inline markdown: **bold**, *italic*, ~~strike~~, `code`, [links](url), bare URLs */
function renderInline(text: string): React.ReactNode[] {
  // Order matters: bold-italic first, then bold, then italic
  const inlinePattern =
    /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|~~(.+?)~~|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s]+))/g;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = inlinePattern.exec(text)) !== null) {
    // Push text before match
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const [, , boldItalic, bold, italic, strike, code, linkText, linkUrl, bareUrl] = match;

    if (boldItalic) {
      nodes.push(<strong key={`bi-${key}`}><em>{boldItalic}</em></strong>);
    } else if (bold) {
      nodes.push(<strong key={`b-${key}`}>{bold}</strong>);
    } else if (italic) {
      nodes.push(<em key={`i-${key}`}>{italic}</em>);
    } else if (strike) {
      nodes.push(<del key={`s-${key}`}>{strike}</del>);
    } else if (code) {
      nodes.push(<code key={`c-${key}`} className="chat-inline-code">{code}</code>);
    } else if (linkText && linkUrl) {
      nodes.push(<a key={`l-${key}`} href={linkUrl} target="_blank" rel="noreferrer">{linkText}</a>);
    } else if (bareUrl) {
      nodes.push(<a key={`u-${key}`} href={bareUrl} target="_blank" rel="noreferrer">{bareUrl}</a>);
    }

    lastIndex = match.index + match[0].length;
    key++;
  }

  // Push remaining text
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

function renderMessage(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let listType: 'ul' | 'ol' | null = null;

  function flushList() {
    if (listItems.length > 0 && listType) {
      const Tag = listType;
      elements.push(<Tag key={`list-${elements.length}`} className="chat-md-list">{listItems}</Tag>);
      listItems = [];
      listType = null;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Heading: # ## ### etc.
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      flushList();
      const hLevel = Math.min(headingMatch[1].length + 1, 6);
      const inner = renderInline(headingMatch[2]);
      if (hLevel === 2) elements.push(<h2 key={`h-${i}`} className="chat-md-heading">{inner}</h2>);
      else if (hLevel === 3) elements.push(<h3 key={`h-${i}`} className="chat-md-heading">{inner}</h3>);
      else if (hLevel === 4) elements.push(<h4 key={`h-${i}`} className="chat-md-heading">{inner}</h4>);
      else elements.push(<h5 key={`h-${i}`} className="chat-md-heading">{inner}</h5>);
      continue;
    }

    // Unordered list: - item or * item
    const bulletMatch = line.match(/^[-*+]\s+(.+)$/);
    if (bulletMatch) {
      if (listType === 'ol') flushList();
      listType = 'ul';
      listItems.push(<li key={`li-${i}`}>{renderInline(bulletMatch[1])}</li>);
      continue;
    }

    // Ordered list: 1. item or 1) item
    const orderedMatch = line.match(/^\d+[.)]\s+(.+)$/);
    if (orderedMatch) {
      if (listType === 'ul') flushList();
      listType = 'ol';
      listItems.push(<li key={`li-${i}`}>{renderInline(orderedMatch[1])}</li>);
      continue;
    }

    // Empty line
    if (!line.trim()) {
      flushList();
      continue;
    }

    // Normal text line
    flushList();
    elements.push(
      <span key={`p-${i}`}>
        {renderInline(line)}
        {i < lines.length - 1 && <br />}
      </span>
    );
  }

  flushList();
  return elements;
}

/* ── Inline inquiry form (shown after 3-4 messages) ───────────────────── */

function InquiryForm({ sessionId, onComplete, initialData }: { sessionId: string; onComplete: () => void; initialData?: ContactDetails }) {
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formError, setFormError] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormState('submitting');
    setFormError('');

    const fd = new FormData(e.currentTarget);
    const name = (fd.get('name') as string)?.trim();
    const businessName = (fd.get('business_name') as string)?.trim();
    const email = (fd.get('email') as string)?.trim();
    const phone = (fd.get('phone') as string)?.trim();

    if (!name || !email || !phone) {
      setFormState('error');
      setFormError('Please fill in all required fields.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/v1/chat-inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, name, business_name: businessName || '', email, phone }),
      });
      if (!res.ok) throw new Error('Could not send your details. Please try again.');
      setFormState('success');
      onComplete();
    } catch (err) {
      setFormState('error');
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  if (formState === 'success') {
    return (
      <div className="chat-inquiry-success">
        <div className="inquiry-success-icon"><Check size={16} /></div>
        <p><strong>Thanks! Our team will reach out soon.</strong></p>
        <p className="inquiry-subtext">We typically respond within 1 business day.</p>
      </div>
    );
  }

  return (
    <div className="chat-inquiry-form-wrapper">
      <div className="inquiry-header">
        <Bot size={14} aria-hidden="true" />
        <span>Quick inquiry — let our team follow up</span>
      </div>
      <form className="chat-inquiry-form" onSubmit={handleSubmit}>
        <div className="inquiry-field">
          <label htmlFor="inquiry-name">Name *</label>
          <input id="inquiry-name" name="name" placeholder="Your name" required autoComplete="name" defaultValue={initialData?.name ?? ''} />
        </div>
        <div className="inquiry-field">
          <label htmlFor="inquiry-business">Business name</label>
          <input id="inquiry-business" name="business_name" placeholder="Company (optional)" autoComplete="organization" defaultValue={initialData?.business_name ?? ''} />
        </div>
        <div className="inquiry-field">
          <label htmlFor="inquiry-email">Email *</label>
          <input id="inquiry-email" name="email" type="email" placeholder="you@business.com" required autoComplete="email" defaultValue={initialData?.email ?? ''} />
        </div>
        <div className="inquiry-field">
          <label htmlFor="inquiry-phone">Phone / WhatsApp *</label>
          <input id="inquiry-phone" name="phone" type="tel" placeholder="+91 ..." required autoComplete="tel" defaultValue={initialData?.phone ?? ''} />
        </div>
        {initialData && Object.values(initialData).some(Boolean) && <p className="inquiry-autofill-note">✨ We filled in details from your conversation. Please verify and submit.</p>}
        {formError && <p className="inquiry-error" role="alert">{formError}</p>}
        <button type="submit" className="inquiry-submit" disabled={formState === 'submitting'}>
          {formState === 'submitting' ? <><LoaderCircle size={14} className="animate-spin" /> Sending…</> : <>Send inquiry <Send size={13} /></>}
        </button>
        <p className="inquiry-note">Your chat history will be shared with our team for context.</p>
      </form>
    </div>
  );
}

/* ── Main ChatWidget ──────────────────────────────────────────────────── */

export function ChatWidget() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const streamRef = useRef<HTMLDivElement>(null);
  const lastMsgRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);

  const open = useCallback(() => {
    sessionRef.current = getSessionId();
    setShowGreeting(false);
    setIsOpen(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setShowGreeting(false);
      return;
    }

    let showTimer: number;
    let hideTimer: number;

    const showGreetingAfterDelay = () => {
      showTimer = window.setTimeout(() => {
        setShowGreeting(true);
        hideTimer = window.setTimeout(() => {
          setShowGreeting(false);
          showGreetingAfterDelay();
        }, 5000);
      }, 15000);
    };

    showGreetingAfterDelay();
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleOpen = () => open();
    window.addEventListener('autonyx:chat-open', handleOpen);
    return () => window.removeEventListener('autonyx:chat-open', handleOpen);
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // Scroll to the last message element (not the absolute bottom) so the answer is visible first
  useEffect(() => {
    if (lastMsgRef.current) {
      lastMsgRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      streamRef.current?.scrollTo({ top: streamRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isSending]);

  useEffect(() => {
    if (!isOpen || available !== null) return;
    let active = true;
    const controller = new AbortController();
    const timer = window.setTimeout(() => setIsConnecting(true), 700);
    const timeout = window.setTimeout(() => controller.abort(), 12000);

    fetch(`${API_URL}/api/v1/health`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Service unavailable');
        return response.json() as Promise<{ chat_configured?: boolean }>;
      })
      .then((health) => {
        if (active) setAvailable(health.chat_configured === true);
      })
      .catch(() => {
        if (active) setAvailable(false);
      })
      .finally(() => {
        window.clearTimeout(timer);
        window.clearTimeout(timeout);
        if (active) setIsConnecting(false);
      });

    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timer);
      window.clearTimeout(timeout);
    };
  }, [available, isOpen]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || isSending) return;
    if (message.length > MAX_LENGTH) {
      setError(`Please keep your message under ${MAX_LENGTH} characters.`);
      return;
    }
    if (messages.filter((item) => item.role === 'user').length >= MAX_MESSAGES) {
      setError('This chat has reached its message limit. Please talk to our team directly.');
      return;
    }
    if (available === false) {
      setError('The assistant is currently unavailable. Please use one of the contact options below.');
      return;
    }

    setError('');
    setDraft('');
    setMessages((current) => [...current, { role: 'user', text: message }, { role: 'assistant', text: '' }]);
    setIsSending(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify({ session_id: sessionRef.current || getSessionId(), message }),
      });
      if (!response.ok || !response.body) {
        if (response.status !== 429) setAvailable(false);
        throw new Error(response.status === 429
          ? 'Chat requests are temporarily limited. Please try again later, or contact our team.'
          : 'The assistant could not respond. Please contact our team.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let reply = '';
      let finished = false;
      while (!finished) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';
        for (const event of events) {
          const dataLine = event.split('\n').find((line) => line.startsWith('data:'));
          if (!dataLine) continue;
          const data = JSON.parse(dataLine.slice(5).trim()) as { type?: string; text?: string; message_count?: number };
          if (data.type === 'chunk' && data.text) {
            reply += data.text;
            setMessages((current) => {
              const next = [...current];
              next[next.length - 1] = { role: 'assistant', text: reply };
              return next;
            });
          } else if (data.type === 'show_lead_form') {
            // Show the inquiry form (only once per session)
            if (!inquirySubmitted) {
              setShowInquiryForm(true);
            }
          } else if (data.type === 'error') {
            throw new Error(data.text || 'The assistant is temporarily unavailable.');
          } else if (data.type === 'done') {
            finished = true;
          }
        }
        if (done) finished = true;
      }
      setAvailable(true);
    } catch (requestError) {
      const messageText = requestError instanceof Error ? requestError.message : 'The assistant is temporarily unavailable.';
      setError(messageText);
      setMessages((current) => current[current.length - 1]?.text
        ? current
        : current.slice(0, -1));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <>
      {showGreeting && (
        <button
          className="chat-greeting"
          type="button"
          onClick={open}
          aria-label="Hi! How can I help you? Open chat"
        >
          <span className="chat-greeting-dot" aria-hidden="true" />
          <span>Hi! How can I help you?</span>
        </button>
      )}
      <button className="chat-orb" type="button" aria-label="Open AI assistant chat" onClick={open}>
        <MessageCircle size={24} aria-hidden="true" />
        <span className="chat-orb-pulse" aria-hidden="true" />
      </button>
      <dialog
        ref={dialogRef}
        className="chat-dialog"
        aria-labelledby="chat-title"
        onClose={() => setIsOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        <section className="chat-panel">
          <header className="chat-header">
            <div className="chat-identity">
              <span className="chat-avatar"><Bot size={19} aria-hidden="true" /></span>
              <span><strong id="chat-title">Autonyx assistant</strong><small>{isConnecting ? 'Connecting…' : available === false ? 'Team contact available' : 'Ask us about your project'}</small></span>
            </div>
            <button type="button" className="icon-button" aria-label="Close chat" onClick={() => dialogRef.current?.close()}><X size={20} aria-hidden="true" /></button>
          </header>

          <div className="chat-messages" ref={streamRef} aria-live="polite" aria-relevant="additions text">
            {messages.length === 0 && (
              <div className="chat-welcome">
                <span className="welcome-icon"><Bot size={24} aria-hidden="true" /></span>
                <h2>What are you working on?</h2>
                <p>Ask about websites, AI assistants or workflow automation.</p>
                {isConnecting && <p className="chat-connecting"><LoaderCircle size={14} className="animate-spin" /> Waking up the assistant…</p>}
                <div className="chat-starters">
                  {STARTERS.map((starter) => <button type="button" key={starter} onClick={() => setDraft(starter)}>{starter}<ArrowUpRight size={14} aria-hidden="true" /></button>)}
                </div>
              </div>
            )}
            {messages.map((message, index) => {
              const isLast = index === messages.length - 1;
              return (
                <div
                  className={`chat-message ${message.role}`}
                  key={`${index}-${message.role}`}
                  ref={isLast ? lastMsgRef : undefined}
                >
                  {message.role === 'assistant' && <span className="chat-message-avatar"><Bot size={14} aria-hidden="true" /></span>}
                  <div>{message.text ? renderMessage(message.text) : <span className="typing-dots" aria-label="Assistant is typing"><i /><i /><i /></span>}</div>
                </div>
              );
            })}

            {/* Inline inquiry form — shown after 3-4 messages */}
            {showInquiryForm && !inquirySubmitted && (
              <InquiryForm
                sessionId={sessionRef.current}
                initialData={extractContactDetails(messages)}
                onComplete={() => {
                  setInquirySubmitted(true);
                  setShowInquiryForm(false);
                }}
              />
            )}

            {/* Success message after inquiry submission */}
            {inquirySubmitted && (
              <div className="chat-inquiry-success">
                <div className="inquiry-success-icon"><Check size={16} /></div>
                <p><strong>Inquiry received! Our team will be in touch.</strong></p>
              </div>
            )}
          </div>

          {error && <div className="chat-error" role="alert">{error}</div>}
          {available === false && (
            <div className="chat-fallback">
              <p>Chat is unavailable right now. Our team can still help.</p>
              <div><Link href="/contact/" onClick={() => dialogRef.current?.close()}>Book a call</Link><a href={BRAND.whatsappLink} target="_blank" rel="noreferrer">WhatsApp</a></div>
            </div>
          )}
          <div className="chat-human-link">
            <Link href="/contact/" onClick={() => dialogRef.current?.close()}>Talk to a human <ArrowUpRight size={13} aria-hidden="true" /></Link>
          </div>
          <form className="chat-compose" onSubmit={sendMessage}>
            <label className="visually-hidden" htmlFor="chat-message">Message the AI assistant</label>
            <textarea
              id="chat-message"
              ref={inputRef}
              value={draft}
              rows={1}
              onChange={(event) => {
                setDraft(event.target.value);
                // Auto-resize textarea
                const el = event.target;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 120) + 'px';
              }}
              onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
                // Enter sends, Shift+Enter inserts newline
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  if (draft.trim() && !isSending && available !== false) {
                    (event.target as HTMLTextAreaElement).form?.requestSubmit();
                  }
                }
              }}
              maxLength={MAX_LENGTH}
              placeholder={available === false ? 'Chat is unavailable' : 'Write a message… (Shift+Enter for new line)'}
              disabled={available === false || isSending}
            />
            <button type="submit" aria-label="Send message" disabled={!draft.trim() || isSending || available === false}>
              {isSending ? <LoaderCircle size={17} className="animate-spin" /> : <Send size={17} />}
            </button>
          </form>
          <p className="chat-disclosure">AI assistant. It can make mistakes. Do not share sensitive information. <Link href="/privacy-policy/" onClick={() => dialogRef.current?.close()}>Privacy</Link></p>
        </section>
      </dialog>
    </>
  );
}
