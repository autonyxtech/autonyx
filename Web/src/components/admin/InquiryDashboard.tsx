'use client';

import {
  CalendarDays,
  ChartNoAxesCombined,
  Eye,
  Globe2,
  Inbox,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  MessageCircle,
  RefreshCw,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';

type Lead = {
  id: number;
  created_at: string;
  source: 'booking' | 'chat';
  name: string;
  email: string;
  phone: string;
  business_name?: string;
  business_type?: string;
  interests?: string[];
  need?: string;
  package?: string | null;
  preferred_day?: string | null;
  time_range?: string | null;
  timezone?: string | null;
  message?: string | null;
};

type DashboardView = 'overview' | 'all' | 'booking' | 'chat';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : '')
).replace(/\/$/, '');
const ADMIN_TOKEN_KEY = 'autonyx-admin-token';

export function InquiryDashboard() {
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [authReady, setAuthReady] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pendingDelete, setPendingDelete] = useState<Lead | null>(null);
  const [deletingLeadId, setDeletingLeadId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [websiteVisits, setWebsiteVisits] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<DashboardView>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const deleteDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const savedToken = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (savedToken) setToken(savedToken);
    setAuthReady(true);
  }, []);

  const loadDashboard = useCallback(async (accessToken: string) => {
    setIsLoading(true);
    setError('');
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const [leadsResponse, analyticsResponse] = await Promise.all([
        fetch(`${API_URL}/api/v1/admin/leads`, { headers }),
        fetch(`${API_URL}/api/v1/admin/analytics`, { headers }),
      ]);
      if (leadsResponse.status === 401 || analyticsResponse.status === 401) {
        window.localStorage.removeItem(ADMIN_TOKEN_KEY);
        setToken('');
        throw new Error('Your session expired. Enter the dashboard password again.');
      }
      if (!leadsResponse.ok || !analyticsResponse.ok) {
        throw new Error('Could not load dashboard data. Please try again.');
      }
      const [leadData, analyticsData] = await Promise.all([
        leadsResponse.json() as Promise<{ leads: Lead[] }>,
        analyticsResponse.json() as Promise<{ website_visits: number }>,
      ]);
      setLeads(leadData.leads);
      setWebsiteVisits(analyticsData.website_visits);
    } catch (loadError) {
      setError(
        loadError instanceof TypeError
          ? 'The dashboard service could not be reached. Check the API URL and try again.'
          : loadError instanceof Error
            ? loadError.message
            : 'Could not load dashboard data. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) void loadDashboard(token);
  }, [loadDashboard, token]);

  useEffect(() => {
    if (!token) return;
    const interval = window.setInterval(() => void loadDashboard(token), 30_000);
    return () => window.clearInterval(interval);
  }, [loadDashboard, token]);

  useEffect(() => {
    const dialog = deleteDialogRef.current;
    if (!dialog) return;
    if (pendingDelete && !dialog.open) dialog.showModal();
    if (!pendingDelete && dialog.open) dialog.close();
  }, [pendingDelete]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/v1/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? 'That password did not match. Please try again.'
            : response.status === 503
              ? 'Dashboard access has not been configured on the API.'
              : response.status === 429
                ? 'Too many attempts. Please wait a minute and try again.'
                : 'Could not sign in. Please try again.',
        );
      }
      const data = (await response.json()) as { token: string };
      window.localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      setPassword('');
      setToken(data.token);
    } catch (loginError) {
      setError(
        loginError instanceof TypeError
          ? 'The dashboard service could not be reached. Check the API URL and try again.'
          : loginError instanceof Error
            ? loginError.message
            : 'Could not sign in. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  function signOut() {
    window.localStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken('');
    setLeads([]);
    setWebsiteVisits(null);
    setActiveView('overview');
    setError('');
  }

  async function deleteInquiry() {
    if (!pendingDelete || !token || deletingLeadId !== null) return;
    setDeletingLeadId(pendingDelete.id);
    setDeleteError('');
    try {
      const response = await fetch(`${API_URL}/api/v1/admin/leads/${pendingDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token },
      });
      if (response.status === 401) {
        window.localStorage.removeItem(ADMIN_TOKEN_KEY);
        setToken('');
        setPendingDelete(null);
        setError('Your session expired. Enter the dashboard password again.');
        return;
      }
      if (response.status === 404) {
        setLeads((currentLeads) => currentLeads.filter((lead) => lead.id !== pendingDelete.id));
        setPendingDelete(null);
        return;
      }
      if (!response.ok) throw new Error('Could not delete this inquiry. Please try again.');
      setLeads((currentLeads) => currentLeads.filter((lead) => lead.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (deleteFailure) {
      setDeleteError(
        deleteFailure instanceof TypeError
          ? 'The dashboard service could not be reached. Check the API URL and try again.'
          : deleteFailure instanceof Error
            ? deleteFailure.message
            : 'Could not delete this inquiry. Please try again.',
      );
    } finally {
      setDeletingLeadId(null);
    }
  }

  const bookingCount = leads.filter((lead) => lead.source === 'booking').length;
  const chatCount = leads.filter((lead) => lead.source === 'chat').length;
  const filteredLeads = leads.filter((lead) => {
    if (activeView === 'booking') return lead.source === 'booking';
    if (activeView === 'chat') return lead.source === 'chat';
    return true;
  });
  const displayedLeads = activeView === 'overview' ? filteredLeads.slice(0, 6) : filteredLeads;
  const viewTitles: Record<DashboardView, string> = {
    overview: 'Overview',
    all: 'All inquiries',
    booking: 'Call requests',
    chat: 'Website chats',
  };
  const navigation = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'all' as const, label: 'All inquiries', icon: Inbox, count: leads.length },
    { id: 'booking' as const, label: 'Call requests', icon: CalendarDays, count: bookingCount },
    { id: 'chat' as const, label: 'Website chats', icon: MessageCircle, count: chatCount },
  ];

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <Link className="admin-brand" href="/">
          <Image
            className="admin-brand-logo"
            src="/brand/logo.png"
            alt=""
            width={1408}
            height={768}
            priority
            aria-hidden="true"
          />
          <span className="admin-brand-copy">AUTONYX <small>STUDIO</small></span>
        </Link>
        {token && (
          <div className="admin-header-actions">
            <div className="admin-visit-count" aria-live="polite">
              <Eye size={17} aria-hidden="true" />
              <span>{websiteVisits === null ? 'â€”' : websiteVisits.toLocaleString()}</span>
              <span>visits</span>
            </div>
            <button className="admin-icon-button" type="button" onClick={() => void loadDashboard(token)} aria-label="Refresh dashboard" title="Refresh dashboard">
              <RefreshCw className={isLoading ? 'admin-spinner' : undefined} size={17} aria-hidden="true" />
            </button>
            <button className="admin-icon-button" type="button" onClick={signOut} aria-label="Sign out" title="Sign out">
              <LogOut size={17} aria-hidden="true" />
            </button>
          </div>
        )}
      </header>

      {!token && !authReady ? (
        <div className="admin-auth-restoring" role="status">
          <LoaderCircle className="admin-spinner" size={20} aria-hidden="true" />
          Restoring your sessionâ€¦
        </div>
      ) : !token ? (
        <section className="admin-login-card" aria-labelledby="admin-title">
          <div className="admin-lock-mark"><LockKeyhole size={22} aria-hidden="true" /></div>
          <p className="eyebrow">Private access</p>
          <h1 id="admin-title">Inquiry dashboard</h1>
          <p>Enter your admin password to view customer inquiries.</p>
          <form onSubmit={handleLogin}>
            <label htmlFor="admin-password">Admin password</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {error && <p className="admin-error" role="alert">{error}</p>}
            <button className="admin-primary-button" type="submit" disabled={isLoading}>
              {isLoading ? <LoaderCircle className="admin-spinner" size={18} aria-hidden="true" /> : <LockKeyhole size={17} aria-hidden="true" />}
              {isLoading ? 'Checkingâ€¦' : 'Open dashboard'}
            </button>
          </form>
        </section>
      ) : (
        <div className="admin-workspace">
          <aside className="admin-sidebar" aria-label="Dashboard navigation">
            <div className="admin-sidebar-label">WORKSPACE</div>
            <nav className="admin-nav">
              {navigation.map(({ id, label, icon: Icon, count }) => (
                <button
                  className={`admin-nav-item${activeView === id ? ' is-active' : ''}`}
                  key={id}
                  type="button"
                  aria-current={activeView === id ? 'page' : undefined}
                  onClick={() => setActiveView(id)}
                >
                  <Icon size={18} aria-hidden="true" />
                  <span>{label}</span>
                  {count !== undefined && <span className="admin-nav-count">{count}</span>}
                </button>
              ))}
            </nav>
            <div className="admin-sidebar-spacer" />
            <div className="admin-sidebar-note">
              <span className="admin-live-dot" />
              <div><strong>All systems ready</strong><span>Inquiry sync is active</span></div>
            </div>
          </aside>
            <section className="admin-content">
              <div className="admin-page-heading">
                <div>
                  <p className="admin-overline"><ChartNoAxesCombined size={14} aria-hidden="true" /> AUTONYX TECHNOLOGIES</p>
                  <h1>{viewTitles[activeView]}</h1>
                  <p className="admin-heading-description">
                    {activeView === 'overview'
                      ? 'A quick look at your customer activity and latest inquiries.'
                      : 'Manage incoming customer requests, newest first.'}
                  </p>
                </div>
                {activeView === 'overview' && (
                  <span className="admin-updated"><span className="admin-live-dot" /> Live data</span>
                )}
              </div>
              {error && <p className="admin-error admin-banner" role="alert">{error}</p>}
              <div className="admin-stat-grid">
                <article className="admin-stat-card">
                  <span className="admin-stat-icon"><Users size={18} aria-hidden="true" /></span>
                  <span className="admin-stat-label">Total inquiries</span>
                  <strong>{leads.length}</strong>
                  <span className="admin-stat-foot">All customer requests</span>
                </article>
                <article className="admin-stat-card">
                  <span className="admin-stat-icon"><CalendarDays size={18} aria-hidden="true" /></span>
                  <span className="admin-stat-label">Call requests</span>
                  <strong>{bookingCount}</strong>
                  <span className="admin-stat-foot">Booking form submissions</span>
                </article>
                <article className="admin-stat-card">
                  <span className="admin-stat-icon"><MessageCircle size={18} aria-hidden="true" /></span>
                  <span className="admin-stat-label">Website chats</span>
                  <strong>{chatCount}</strong>
                  <span className="admin-stat-foot">Chat inquiries received</span>
                </article>
                <article className="admin-stat-card">
                  <span className="admin-stat-icon"><Globe2 size={18} aria-hidden="true" /></span>
                  <span className="admin-stat-label">Website visits</span>
                  <strong>{websiteVisits === null ? 'â€”' : websiteVisits.toLocaleString()}</strong>
                  <span className="admin-stat-foot">Total tracked visits</span>
                </article>
              </div>
              <div className="admin-table-heading">
                <div>
                  <h2>{activeView === 'overview' ? 'Recent inquiries' : viewTitles[activeView]}</h2>
                  <p>{activeView === 'overview' ? 'The latest customer activity' : `${displayedLeads.length} ${displayedLeads.length === 1 ? 'result' : 'results'}`}</p>
                </div>
                {activeView === 'overview' && leads.length > 6 && (
                  <button className="admin-view-all" type="button" onClick={() => setActiveView('all')}>View all inquiries <span aria-hidden="true">â†’</span></button>
                )}
              </div>
              {isLoading && leads.length === 0 ? (
                <div className="admin-empty"><LoaderCircle className="admin-spinner" size={22} aria-hidden="true" />Loading inquiriesâ€¦</div>
              ) : displayedLeads.length === 0 ? (
                <div className="admin-empty"><Inbox size={22} aria-hidden="true" /><span>No inquiries here yet. New submissions will appear here.</span></div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-leads-table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Business</th>
                        <th>Inquiry</th>
                        <th>Call preference</th>
                        <th>Received</th>
                        <th><span className="admin-visually-hidden">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedLeads.map((lead) => (
                        <tr key={lead.id}>
                          <td>
                            <strong>{lead.name}</strong>
                            <a href={`mailto:${lead.email}`}>{lead.email}</a>
                            <a href={`tel:${lead.phone.replace(/[^\d+]/g, '')}`}>{lead.phone}</a>
                          </td>
                          <td>
                            <strong>{lead.business_name || 'â€”'}</strong>
                            <span>{lead.business_type?.replaceAll('_', ' ') || 'â€”'}</span>
                          </td>
                          <td>
                            <span className={`admin-source admin-source-${lead.source}`}>{lead.source === 'chat' ? 'Website chat' : 'Book a call'}</span>
                            <span>{lead.interests?.map((interest) => interest.replaceAll('_', ' ')).join(', ') || lead.need || 'â€”'}</span>
                            {lead.message && <span className="admin-message">{lead.message}</span>}
                          </td>
                          <td>
                            <span>{[lead.preferred_day, lead.time_range].filter(Boolean).join(' Â· ') || 'â€”'}</span>
                            {lead.timezone && <span>{lead.timezone}</span>}
                            {lead.package && <span>{lead.package}</span>}
                          </td>
                          <td>{new Date(lead.created_at).toLocaleString()}</td>
                          <td className="admin-row-actions">
                            <button
                              className="admin-delete-button"
                              type="button"
                              aria-label={`Delete inquiry from ${lead.name}`}
                              title="Delete inquiry"
                              onClick={() => {
                                setDeleteError('');
                                setPendingDelete(lead);
                              }}
                            >
                              <Trash2 size={16} aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
      )}
      <dialog
        className="admin-delete-dialog"
        ref={deleteDialogRef}
        aria-labelledby="admin-delete-title"
        onClose={() => {
          setPendingDelete(null);
          setDeleteError('');
        }}
      >
        {pendingDelete && (
          <div className="admin-delete-dialog-content">
            <button
              className="admin-delete-close"
              type="button"
              aria-label="Close confirmation"
              disabled={deletingLeadId !== null}
              onClick={() => setPendingDelete(null)}
            >
              <X size={18} aria-hidden="true" />
            </button>
            <span className="admin-delete-icon"><Trash2 size={20} aria-hidden="true" /></span>
            <p className="admin-delete-eyebrow">Delete inquiry</p>
            <h2 id="admin-delete-title">Remove this customer inquiry?</h2>
            <p className="admin-delete-description">
              The inquiry from <strong>{pendingDelete.name}</strong> will be permanently deleted. This action cannot be undone.
            </p>
            {deleteError && <p className="admin-delete-error" role="alert">{deleteError}</p>}
            <div className="admin-delete-actions">
              <button
                className="admin-cancel-button"
                type="button"
                disabled={deletingLeadId !== null}
                onClick={() => setPendingDelete(null)}
              >
                Cancel
              </button>
              <button
                className="admin-confirm-delete"
                type="button"
                disabled={deletingLeadId !== null}
                onClick={() => void deleteInquiry()}
              >
                {deletingLeadId === pendingDelete.id ? (
                  <LoaderCircle className="admin-spinner" size={16} aria-hidden="true" />
                ) : (
                  <Trash2 size={16} aria-hidden="true" />
                )}
                {deletingLeadId === pendingDelete.id ? 'Deletingâ€¦' : 'Delete inquiry'}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </main>
  );
}
