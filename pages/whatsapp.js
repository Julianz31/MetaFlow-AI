import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { getSupabaseBrowser } from '../lib/supabase-browser';
import {
  MessageSquare, Settings, Send, Bot, User, ChevronRight,
  Copy, Check, ToggleLeft, ToggleRight, Search, RefreshCw,
  Zap, LayoutDashboard, BarChart3, Upload, ShieldCheck,
  BookOpen, BookMarked, Globe, ShoppingBag, Wand2, LogOut,
  AlertCircle, Wifi, WifiOff
} from 'lucide-react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || '';

// ─── helpers ──────────────────────────────────────────────────────────────────

function authHeader() {
  try {
    const session = JSON.parse(localStorage.getItem('metaflow_session') || '{}');
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  } catch {
    return {};
  }
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'ahora';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function statusBadge(status) {
  const map = {
    bot: { label: 'Bot', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    human: { label: 'Revisión', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    closed: { label: 'Cerrado', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  };
  const s = map[status] || map.bot;
  return (
    <span style={{
      fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px',
      color: s.color, background: s.bg, whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  );
}

// ─── Nav (same structure as index.js) ─────────────────────────────────────────

function NavItem({ active, icon, label, onClick, badge }) {
  return (
    <button
      className={`nav-item ${active ? 'active' : ''}`}
      onClick={onClick}
      style={{ position: 'relative' }}
    >
      {icon}
      {label}
      {badge && (
        <span style={{
          marginLeft: 'auto', fontSize: '10px', fontWeight: 700,
          background: '#f59e0b', color: '#000', borderRadius: '8px',
          padding: '1px 6px',
        }}>
          {badge}
        </span>
      )}
    </button>
  );
}

// ─── Config modal ─────────────────────────────────────────────────────────────

function ConfigModal({ config, appUrl, onSave, onClose }) {
  const [form, setForm] = useState({
    agent_name: config?.agent_name || 'Asistente',
    agent_prompt: config?.agent_prompt || '',
    phone_number_id: config?.phone_number_id || '',
    access_token: '',
  });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState('');

  const webhookUrl = `${appUrl}/api/whatsapp/webhook`;
  const verifyToken = config?.verify_token || '(guarda primero para generar)';

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  function copyText(text, key) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '16px',
    }}>
      <div style={{
        background: '#111827', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '560px',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Configurar WhatsApp Agent</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '20px' }}>×</button>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Nombre del agente</label>
              <input
                value={form.agent_name}
                onChange={e => setForm(f => ({ ...f, agent_name: e.target.value }))}
                placeholder="Ej: Asistente de Ventas"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Instrucciones del agente</label>
              <textarea
                value={form.agent_prompt}
                onChange={e => setForm(f => ({ ...f, agent_prompt: e.target.value }))}
                rows={5}
                placeholder={`Ej: Eres un asistente de ventas de [Tu Empresa]. Ayudas a los clientes con preguntas sobre nuestros productos, precios y disponibilidad. Siempre sé amable y profesional. Nuestros productos son...`}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <div>
              <label style={labelStyle}>Phone Number ID (Meta)</label>
              <input
                value={form.phone_number_id}
                onChange={e => setForm(f => ({ ...f, phone_number_id: e.target.value }))}
                placeholder="123456789012345"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Access Token de Meta (WhatsApp Business)</label>
              <input
                type="password"
                value={form.access_token}
                onChange={e => setForm(f => ({ ...f, access_token: e.target.value }))}
                placeholder={config?.access_token ? '••••••••  (dejar vacío para no cambiar)' : 'EAAxxxxxxx...'}
                style={inputStyle}
              />
            </div>

            <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '12px', padding: '16px' }}>
              <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: '#a78bfa' }}>
                Configuración en Meta Developer Portal
              </p>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ ...labelStyle, fontSize: '11px', marginBottom: '4px' }}>URL del Webhook</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <code style={{ flex: 1, background: '#0b0f19', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', color: '#e2e8f0', wordBreak: 'break-all' }}>
                    {webhookUrl}
                  </code>
                  <button type="button" onClick={() => copyText(webhookUrl, 'webhook')} style={copyBtnStyle}>
                    {copied === 'webhook' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ ...labelStyle, fontSize: '11px', marginBottom: '4px' }}>Verify Token</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <code style={{ flex: 1, background: '#0b0f19', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', color: '#e2e8f0', wordBreak: 'break-all' }}>
                    {verifyToken}
                  </code>
                  <button type="button" onClick={() => copyText(verifyToken, 'verify')} style={copyBtnStyle}>
                    {copied === 'verify' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                background: '#8b5cf6', color: 'white', border: 'none',
                padding: '12px 24px', borderRadius: '10px', fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                fontSize: '14px',
              }}
            >
              {saving ? 'Guardando...' : 'Guardar configuración'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '6px', fontWeight: 500 };
const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px', padding: '10px 14px', color: '#f3f4f6', fontSize: '14px',
  outline: 'none', boxSizing: 'border-box',
};
const copyBtnStyle = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '8px', padding: '8px', color: '#9ca3af', cursor: 'pointer', flexShrink: 0,
  display: 'flex', alignItems: 'center',
};

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function WhatsAppPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [config, setConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [convsLoading, setConvsLoading] = useState(false);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [notification, setNotification] = useState(null);
  const messagesEndRef = useRef(null);
  const realtimeRef = useRef(null);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('metaflow_user'));
      if (!u) { router.replace('/'); return; }
      setUser(u);
    } catch { router.replace('/'); }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user) return;
    loadConfig();
    loadConversations();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Supabase Realtime for new messages
  useEffect(() => {
    if (!user || !selectedConv) return;
    const supabase = getSupabaseBrowser();

    const channel = supabase
      .channel(`wa-messages-${selectedConv.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'whatsapp_messages',
        filter: `conversation_id=eq.${selectedConv.id}`,
      }, payload => {
        setMessages(prev => {
          if (prev.find(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
      })
      .subscribe();

    realtimeRef.current = channel;
    return () => supabase.removeChannel(channel);
  }, [user, selectedConv?.id]);

  // Realtime for conversation list updates
  useEffect(() => {
    if (!user) return;
    const supabase = getSupabaseBrowser();

    const channel = supabase
      .channel('wa-conversations-list')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'whatsapp_conversations',
      }, () => {
        loadConversations();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  async function loadConfig() {
    setConfigLoading(true);
    try {
      const r = await fetch('/api/whatsapp/config', { headers: authHeader() });
      if (r.ok) {
        const d = await r.json();
        setConfig(d.config);
      }
    } catch {}
    setConfigLoading(false);
  }

  async function loadConversations() {
    setConvsLoading(true);
    try {
      const r = await fetch('/api/whatsapp/conversations', { headers: authHeader() });
      if (r.ok) {
        const d = await r.json();
        setConversations(d.conversations || []);
      }
    } catch {}
    setConvsLoading(false);
  }

  async function loadMessages(conv) {
    setSelectedConv(conv);
    setMsgsLoading(true);
    setMessages([]);
    try {
      const r = await fetch(`/api/whatsapp/messages?conversation_id=${conv.id}`, { headers: authHeader() });
      if (r.ok) {
        const d = await r.json();
        setMessages(d.messages || []);
      }
    } catch {}
    setMsgsLoading(false);
  }

  async function saveConfig(form) {
    const r = await fetch('/api/whatsapp/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify(form),
    });
    if (r.ok) {
      const d = await r.json();
      setConfig(d.config);
      showNotif('Configuración guardada', 'success');
      setShowConfig(false);
    } else {
      showNotif('Error al guardar', 'error');
    }
  }

  async function handleTakeover(action) {
    if (!selectedConv) return;
    const r = await fetch('/api/whatsapp/takeover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader() },
      body: JSON.stringify({ conversation_id: selectedConv.id, action }),
    });
    if (r.ok) {
      const d = await r.json();
      const newStatus = d.conversation.status;
      setSelectedConv(prev => ({ ...prev, status: newStatus }));
      setConversations(prev => prev.map(c => c.id === selectedConv.id ? { ...c, status: newStatus } : c));
      showNotif(action === 'take' ? 'Tomaste control de la conversación' : 'El bot retomó el control', 'success');
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || !selectedConv || sending) return;
    if (selectedConv.status !== 'human') return;
    setSending(true);
    const text = input.trim();
    setInput('');
    try {
      const r = await fetch('/api/whatsapp/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ conversation_id: selectedConv.id, content: text }),
      });
      if (r.ok) {
        const d = await r.json();
        setMessages(prev => [...prev, d.message]);
        setConversations(prev => prev.map(c => c.id === selectedConv.id
          ? { ...c, last_message: text, last_message_at: new Date().toISOString() } : c));
      } else {
        showNotif('Error al enviar mensaje', 'error');
      }
    } catch {
      showNotif('Error de conexión', 'error');
    }
    setSending(false);
  }

  function showNotif(msg, type = 'success') {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  }

  function logout() {
    localStorage.removeItem('metaflow_user');
    localStorage.removeItem('metaflow_session');
    router.replace('/');
  }

  const filteredConvs = conversations.filter(c => {
    if (!search) return true;
    const name = c.whatsapp_contacts?.name || '';
    const phone = c.whatsapp_contacts?.phone || '';
    return name.toLowerCase().includes(search.toLowerCase()) || phone.includes(search);
  });

  const isConfigured = config?.phone_number_id && config?.access_token;
  const isActive = config?.is_active;

  if (!mounted) return null;

  return (
    <>
      <Head>
        <title>WhatsApp Agent — MetaFlow.AI</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0b0f19; color: #f3f4f6; font-family: 'Inter', system-ui, sans-serif; height: 100vh; overflow: hidden; }
        .app-shell { display: flex; height: 100vh; }
        .sidebar { width: 220px; min-width: 220px; background: #111827; border-right: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; padding: 20px 12px; gap: 4px; overflow-y: auto; }
        .brand { display: flex; align-items: center; gap: 10px; padding: 0 8px; margin-bottom: 20px; font-weight: 700; font-size: 15px; }
        .brand-mark { width: 32px; height: 32px; background: linear-gradient(135deg,#8b5cf6,#6366f1); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 8px; border: none; background: none; color: #9ca3af; cursor: pointer; font-size: 13px; font-weight: 500; width: 100%; text-align: left; transition: all 0.15s; }
        .nav-item:hover { background: rgba(255,255,255,0.05); color: #f3f4f6; }
        .nav-item.active { background: rgba(139,92,246,0.15); color: #a78bfa; }
        .nav-list { flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .page-header { padding: 20px 28px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: space-between; }
        .page-header h1 { font-size: 20px; font-weight: 700; }
        .page-header p { font-size: 13px; color: #6b7280; margin-top: 2px; }
        .wa-layout { display: flex; flex: 1; overflow: hidden; }
        .conv-list { width: 300px; min-width: 280px; border-right: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column; }
        .conv-search { padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .conv-search input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 8px 12px 8px 36px; color: #f3f4f6; font-size: 13px; outline: none; }
        .conv-search-wrap { position: relative; }
        .conv-search-wrap svg { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #6b7280; pointer-events: none; }
        .conv-items { flex: 1; overflow-y: auto; }
        .conv-item { padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.04); cursor: pointer; transition: background 0.1s; }
        .conv-item:hover { background: rgba(255,255,255,0.03); }
        .conv-item.active { background: rgba(139,92,246,0.1); }
        .conv-name { font-size: 14px; font-weight: 600; color: #f3f4f6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .conv-preview { font-size: 12px; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 3px; }
        .chat-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .chat-header { padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: space-between; }
        .chat-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 12px; }
        .bubble { max-width: 70%; padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.5; word-break: break-word; }
        .bubble-customer { background: rgba(255,255,255,0.07); border-radius: 4px 12px 12px 12px; align-self: flex-start; }
        .bubble-bot { background: rgba(99,102,241,0.2); border: 1px solid rgba(99,102,241,0.2); border-radius: 12px 4px 12px 12px; align-self: flex-end; }
        .bubble-human { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.2); border-radius: 12px 4px 12px 12px; align-self: flex-end; }
        .bubble-meta { font-size: 11px; color: #6b7280; margin-top: 3px; }
        .chat-input-area { padding: 16px 20px; border-top: 1px solid rgba(255,255,255,0.06); }
        .chat-form { display: flex; gap: 10px; }
        .chat-input { flex: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 10px 16px; color: #f3f4f6; font-size: 14px; outline: none; }
        .chat-input:disabled { opacity: 0.4; cursor: not-allowed; }
        .send-btn { background: #8b5cf6; border: none; border-radius: 10px; padding: 10px 16px; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 12px; color: #4b5563; text-align: center; padding: 40px; }
        .toggle-btn { display: flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 8px; border: 1px solid; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s; }
        .notif { position: fixed; top: 24px; right: 24px; padding: 12px 20px; border-radius: 10px; font-size: 13px; font-weight: 600; z-index: 2000; animation: slideIn 0.2s ease; }
        .notif-success { background: rgba(16,185,129,0.9); color: white; }
        .notif-error { background: rgba(239,68,68,0.9); color: white; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}</style>

      {notification && (
        <div className={`notif notif-${notification.type}`}>{notification.msg}</div>
      )}

      {showConfig && (
        <ConfigModal
          config={config}
          appUrl={APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')}
          onSave={saveConfig}
          onClose={() => setShowConfig(false)}
        />
      )}

      <div className="app-shell">
        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark"><Zap size={18} /></div>
            <span>MetaFlow.AI</span>
          </div>

          <nav className="nav-list">
            <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" onClick={() => router.push('/')} />
            <NavItem icon={<Zap size={18} />} label="Reglas" onClick={() => router.push('/')} />
            <NavItem icon={<BarChart3 size={18} />} label="Campañas" onClick={() => router.push('/')} />
            <NavItem icon={<Upload size={18} />} label="Crear Campaña" onClick={() => router.push('/')} />
            <NavItem icon={<ShieldCheck size={18} />} label="Aprobación" onClick={() => router.push('/')} />
            <NavItem icon={<Bot size={18} />} label="Análisis IA" onClick={() => router.push('/')} />
            <NavItem icon={<ShoppingBag size={18} />} label="Productos" onClick={() => router.push('/')} />
            <NavItem icon={<Wand2 size={18} />} label="Crear Imagen IA" onClick={() => router.push('/')} />
            <NavItem icon={<Globe size={18} />} label="Generar Landing Page" onClick={() => router.push('/')} />
            <NavItem icon={<BookMarked size={18} />} label="Biblioteca" onClick={() => router.push('/')} />
            <NavItem icon={<MessageSquare size={18} />} label="WhatsApp Agent" active onClick={() => {}} badge="Nuevo" />
            <NavItem icon={<BookOpen size={18} />} label="Guía" onClick={() => router.push('/')} />
          </nav>

          <NavItem icon={<Settings size={18} />} label="Configuración" onClick={() => router.push('/')} />
          <button className="nav-item" onClick={logout}><LogOut size={18} /> Salir</button>
        </aside>

        {/* ── Main ── */}
        <div className="main">
          <header className="page-header">
            <div>
              <h1>WhatsApp Agent</h1>
              <p>Responde clientes automáticamente con IA</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {isConfigured && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: isActive ? '#10b981' : '#6b7280' }}>
                  {isActive ? <Wifi size={16} /> : <WifiOff size={16} />}
                  {isActive ? 'Agente activo' : 'Agente inactivo'}
                </div>
              )}
              <button
                onClick={() => setShowConfig(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)',
                  color: '#a78bfa', borderRadius: '8px', padding: '8px 16px',
                  cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                }}
              >
                <Settings size={15} /> Configurar
              </button>
              <button
                onClick={loadConversations}
                style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  color: '#9ca3af', borderRadius: '8px', padding: '8px', cursor: 'pointer',
                }}
              >
                <RefreshCw size={15} />
              </button>
            </div>
          </header>

          {/* ── Unconfigured state ── */}
          {!configLoading && !isConfigured && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
              <div style={{
                maxWidth: '480px', textAlign: 'center',
                background: 'rgba(17,24,39,0.8)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px', padding: '48px 40px',
              }}>
                <div style={{
                  width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 24px',
                  background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px',
                }}>
                  💬
                </div>
                <div style={{
                  display: 'inline-block', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                  color: '#f59e0b', borderRadius: '20px', padding: '4px 14px', fontSize: '12px',
                  fontWeight: 600, marginBottom: '16px',
                }}>
                  Pendiente de configuración
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>
                  Activa tu Agente de WhatsApp
                </h2>
                <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.6', marginBottom: '32px' }}>
                  Conecta tu número de WhatsApp Business API para que la IA responda
                  automáticamente a tus clientes. Necesitas tener acceso a la API de WhatsApp
                  Business de Meta para continuar.
                </p>
                <button
                  onClick={() => setShowConfig(true)}
                  style={{
                    background: '#8b5cf6', color: 'white', border: 'none',
                    padding: '14px 28px', borderRadius: '12px', fontWeight: 600,
                    cursor: 'pointer', fontSize: '15px',
                  }}
                >
                  Configurar ahora
                </button>

                {/* Grayed-out preview */}
                <div style={{ marginTop: '40px', opacity: 0.25, pointerEvents: 'none', filter: 'blur(2px)' }}>
                  <div style={{ display: 'flex', gap: '8px', height: '120px' }}>
                    <div style={{ flex: '0 0 100px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }} />
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Chat layout ── */}
          {(configLoading || isConfigured) && (
            <div className="wa-layout" style={{ opacity: configLoading ? 0.5 : 1 }}>
              {/* Conversation list */}
              <div className="conv-list">
                <div className="conv-search">
                  <div className="conv-search-wrap">
                    <Search size={15} />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Buscar contacto..."
                    />
                  </div>
                </div>

                <div className="conv-items">
                  {convsLoading && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
                      Cargando...
                    </div>
                  )}
                  {!convsLoading && filteredConvs.length === 0 && (
                    <div style={{ padding: '32px 16px', textAlign: 'center', color: '#4b5563', fontSize: '13px' }}>
                      <MessageSquare size={28} style={{ marginBottom: '8px', opacity: 0.4 }} />
                      <p>Sin conversaciones aún</p>
                      <p style={{ fontSize: '12px', marginTop: '4px' }}>Los mensajes aparecerán aquí cuando lleguen</p>
                    </div>
                  )}
                  {filteredConvs.map(conv => (
                    <div
                      key={conv.id}
                      className={`conv-item ${selectedConv?.id === conv.id ? 'active' : ''}`}
                      onClick={() => loadMessages(conv)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <span className="conv-name">{conv.whatsapp_contacts?.name || conv.whatsapp_contacts?.wa_id || 'Contacto'}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          {conv.unread_count > 0 && (
                            <span style={{
                              background: '#8b5cf6', color: 'white', borderRadius: '10px',
                              padding: '1px 7px', fontSize: '11px', fontWeight: 700,
                            }}>
                              {conv.unread_count}
                            </span>
                          )}
                          <span style={{ fontSize: '11px', color: '#4b5563' }}>{timeAgo(conv.last_message_at)}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', gap: '8px' }}>
                        <span className="conv-preview">{conv.last_message || '—'}</span>
                        {statusBadge(conv.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat area */}
              <div className="chat-area">
                {!selectedConv ? (
                  <div className="empty-state">
                    <MessageSquare size={48} style={{ opacity: 0.2 }} />
                    <p style={{ fontSize: '15px', fontWeight: 600 }}>Selecciona una conversación</p>
                    <p style={{ fontSize: '13px' }}>Elige un contacto de la lista para ver sus mensajes</p>
                  </div>
                ) : (
                  <>
                    <div className="chat-header">
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '15px' }}>
                          {selectedConv.whatsapp_contacts?.name || selectedConv.whatsapp_contacts?.wa_id}
                        </p>
                        <p style={{ fontSize: '12px', color: '#6b7280' }}>
                          +{selectedConv.whatsapp_contacts?.phone || selectedConv.whatsapp_contacts?.wa_id}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {statusBadge(selectedConv.status)}
                        {selectedConv.status === 'bot' ? (
                          <button
                            className="toggle-btn"
                            onClick={() => handleTakeover('take')}
                            style={{ borderColor: 'rgba(245,158,11,0.4)', color: '#f59e0b', background: 'rgba(245,158,11,0.08)' }}
                          >
                            <User size={15} /> Tomar control
                          </button>
                        ) : selectedConv.status === 'human' ? (
                          <button
                            className="toggle-btn"
                            onClick={() => handleTakeover('release')}
                            style={{ borderColor: 'rgba(16,185,129,0.4)', color: '#10b981', background: 'rgba(16,185,129,0.08)' }}
                          >
                            <Bot size={15} /> Devolver al bot
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <div className="chat-messages">
                      {msgsLoading && (
                        <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '13px', padding: '20px' }}>
                          Cargando mensajes...
                        </div>
                      )}
                      {!msgsLoading && messages.length === 0 && (
                        <div style={{ textAlign: 'center', color: '#4b5563', fontSize: '13px', padding: '40px' }}>
                          Sin mensajes aún en esta conversación
                        </div>
                      )}
                      {messages.map(msg => (
                        <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'customer' ? 'flex-start' : 'flex-end' }}>
                          <div className={`bubble bubble-${msg.sender}`}>
                            {msg.sender === 'bot' && <span style={{ fontSize: '11px', color: '#818cf8', display: 'block', marginBottom: '4px' }}>🤖 {config?.agent_name || 'Bot'}</span>}
                            {msg.sender === 'human' && <span style={{ fontSize: '11px', color: '#34d399', display: 'block', marginBottom: '4px' }}>👤 Tú</span>}
                            {msg.content}
                          </div>
                          <span className="bubble-meta">{timeAgo(msg.created_at)}</span>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-input-area">
                      {selectedConv.status !== 'human' && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px',
                          background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)',
                          borderRadius: '8px', marginBottom: '10px', fontSize: '12px', color: '#818cf8',
                        }}>
                          <AlertCircle size={14} />
                          El bot está al mando. Toma control para escribir manualmente.
                        </div>
                      )}
                      <form className="chat-form" onSubmit={sendMessage}>
                        <input
                          className="chat-input"
                          value={input}
                          onChange={e => setInput(e.target.value)}
                          placeholder={selectedConv.status === 'human' ? 'Escribe un mensaje...' : 'Solo disponible en modo manual'}
                          disabled={selectedConv.status !== 'human' || sending}
                        />
                        <button
                          type="submit"
                          className="send-btn"
                          disabled={selectedConv.status !== 'human' || !input.trim() || sending}
                        >
                          <Send size={16} />
                        </button>
                      </form>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
