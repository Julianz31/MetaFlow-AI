import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  BookOpen,
  Bot,
  CheckCircle2,
  BarChart3,
  Edit2,
  LogOut,
  LayoutDashboard,
  Loader2,
  Plus,
  Send,
  Settings,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Upload,
  XCircle,
  Zap
} from 'lucide-react';
const API_BASE_URL = '';

function App() {
  const [user, setUser] = useState(loadSessionUser());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    inversion: '0.00',
    roas: '0.00x',
    facturacion: '0.00',
    activeCampaignsCount: 0,
    activeCampaigns: [],
    acciones: 0
  });
  const [loading, setLoading] = useState(true);
  const [processingRules, setProcessingRules] = useState(false);
  const [connection, setConnection] = useState(null);
  const [connectionLoading, setConnectionLoading] = useState(false);
  const [campaignAnalysis, setCampaignAnalysis] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [objectives, setObjectives] = useState([]);
  const [businessAssets, setBusinessAssets] = useState({ pages: [], defaults: {} });
  const [metaConnection, setMetaConnection] = useState(loadMetaConnection());
  const [anthropicKey, setAnthropicKey] = useState(loadAnthropicKey());
  const [approvalActions, setApprovalActions] = useState([]);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [builderResult, setBuilderResult] = useState(null);
  const [builderLoading, setBuilderLoading] = useState(false);
  const [copyLoading, setCopyLoading] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaignDetail, setCampaignDetail] = useState(null);
  const [campaignDetailLoading, setCampaignDetailLoading] = useState(false);
  const [selectedAdSet, setSelectedAdSet] = useState(null);
  const [adSetDetail, setAdSetDetail] = useState(null);
  const [adSetDetailLoading, setAdSetDetailLoading] = useState(false);
  const [analysisText, setAnalysisText] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [rules, setRules] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [showRuleForm, setShowRuleForm] = useState(false);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchRealData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'settings') {
      fetchConnectionStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'campaigns') {
      fetchCampaignAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'builder') {
      fetchObjectives();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'approval') {
      fetchApprovalActions();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'rules') {
      fetchRules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'analysis' && !analysisText && !analysisLoading) {
      fetchAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchRealData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/stats`, metaRequestConfig(metaConnection));
      setStats({
        inversion: response.data.inversion,
        roas: response.data.roas,
        facturacion: response.data.facturacion,
        activeCampaignsCount: response.data.activeCampaignsCount,
        activeCampaigns: response.data.activeCampaigns || [],
        acciones: response.data.acciones
      });
      await fetchCampaignAnalysisWithConnection(metaConnection);
    } catch (error) {
      console.error('Error conectando con el backend:', error);
    } finally {
      setLoading(false);
    }
  };

  const processRules = async () => {
    try {
      setProcessingRules(true);
      await axios.post(`${API_BASE_URL}/api/process-rules`, { userId: user.id }, metaRequestConfig(metaConnection));
      await fetchRealData();
      setActiveTab('approval');
    } catch (error) {
      console.error('Error procesando reglas:', error);
    } finally {
      setProcessingRules(false);
    }
  };

  const fetchConnectionStatus = async () => {
    try {
      setConnectionLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/meta/connection`, metaRequestConfig(metaConnection));
      setConnection(response.data);
      if (response.data.adAccountId) {
        const nextConnection = {
          ...metaConnection,
          adAccountId: metaConnection.adAccountId || response.data.adAccountId
        };
        setMetaConnection(nextConnection);
        saveMetaConnection(nextConnection);
      }
    } catch (error) {
      console.error('Error validando conexión con Meta:', error);
      setConnection({ ok: false });
    } finally {
      setConnectionLoading(false);
    }
  };

  const fetchCampaignAnalysis = async () => {
    try {
      setCampaignsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/campaign-analysis`, metaRequestConfig(metaConnection));
      setCampaignAnalysis(response.data.campaigns || []);
    } catch (error) {
      console.error('Error analizando campañas:', error);
      setCampaignAnalysis([]);
    } finally {
      setCampaignsLoading(false);
    }
  };

  const fetchObjectives = async () => {
    try {
      const [objectivesResponse, assetsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/campaign-objectives`),
        axios.get(`${API_BASE_URL}/api/meta/assets`, metaRequestConfig(metaConnection)).catch(() => ({ data: { pages: [], defaults: {} } }))
      ]);
      setObjectives(objectivesResponse.data.objectives || []);
      setBusinessAssets(assetsResponse.data || { pages: [], defaults: {} });
    } catch (error) {
      console.error('Error cargando objetivos:', error);
      setObjectives([]);
    }
  };

  const createCampaign = async (payload) => {
    try {
      setBuilderLoading(true);
      setBuilderResult(null);
      const response = await axios.post(`${API_BASE_URL}/api/campaign-builder/create`, {
        ...payload,
        userId: user.id
      }, metaRequestConfig(metaConnection));
      setBuilderResult(response.data);
      await fetchCampaignAnalysis();
      await fetchApprovalActions();
      setActiveTab('approval');
    } catch (error) {
      console.error('Error creando campaña:', error);
      setBuilderResult({
        success: false,
        error: error.response?.data?.error || 'No se pudo crear la campaña'
      });
    } finally {
      setBuilderLoading(false);
    }
  };

  const generateCopy = async (payload) => {
    try {
      setCopyLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/campaign-builder/generate-copy`, payload, metaRequestConfig(metaConnection));
      return response.data.copy;
    } catch (error) {
      console.error('Error generando copy:', error);
      throw error;
    } finally {
      setCopyLoading(false);
    }
  };

  const connectMeta = async (nextConnection) => {
    setMetaConnection(nextConnection);
    saveMetaConnection(nextConnection);
    setConnectionLoading(true);

    try {
      const response = await axios.get(`${API_BASE_URL}/api/meta/connection`, metaRequestConfig(nextConnection));
      const connectedAccountId = nextConnection.adAccountId || response.data.adAccountId;
      const savedConnection = {
        ...nextConnection,
        adAccountId: connectedAccountId
      };
      setMetaConnection(savedConnection);
      saveMetaConnection(savedConnection);
      setConnection(response.data);
      await Promise.all([
        fetchRealDataWithConnection(savedConnection),
        fetchCampaignAnalysisWithConnection(savedConnection)
      ]);
      return response.data;
    } catch (error) {
      console.error('Error conectando System User:', error);
      setConnection({ ok: false });
      throw error;
    } finally {
      setConnectionLoading(false);
    }
  };

  const fetchRealDataWithConnection = async (connectionOverride) => {
    const response = await axios.get(`${API_BASE_URL}/api/stats`, metaRequestConfig(connectionOverride));
    setStats({
      inversion: response.data.inversion,
      roas: response.data.roas,
      facturacion: response.data.facturacion,
      activeCampaignsCount: response.data.activeCampaignsCount,
      activeCampaigns: response.data.activeCampaigns || [],
      acciones: response.data.acciones
    });
  };

  const fetchCampaignAnalysisWithConnection = async (connectionOverride) => {
    const response = await axios.get(`${API_BASE_URL}/api/campaign-analysis`, metaRequestConfig(connectionOverride));
    setCampaignAnalysis(response.data.campaigns || []);
  };

  const fetchApprovalActions = async () => {
    try {
      setApprovalLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/approval-actions`);
      setApprovalActions(response.data.actions || []);
    } catch (error) {
      console.error('Error cargando aprobación:', error);
      setApprovalActions([]);
    } finally {
      setApprovalLoading(false);
    }
  };

  const publishApprovalAction = async (actionId) => {
    try {
      setApprovalLoading(true);
      await axios.post(`${API_BASE_URL}/api/approval-actions/${actionId}/publish`, {}, metaRequestConfig(metaConnection));
      await fetchApprovalActions();
      await fetchRealData();
    } catch (error) {
      console.error('Error publicando campaña:', error);
    } finally {
      setApprovalLoading(false);
    }
  };

  const rejectApprovalAction = async (actionId) => {
    try {
      setApprovalLoading(true);
      await axios.post(`${API_BASE_URL}/api/approval-actions/${actionId}/reject`);
      await fetchApprovalActions();
    } catch (error) {
      console.error('Error rechazando acción:', error);
    } finally {
      setApprovalLoading(false);
    }
  };

  const fetchRules = async () => {
    try {
      setRulesLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/rules`);
      setRules(response.data.rules || []);
    } catch (error) {
      console.error('Error cargando reglas:', error);
    } finally {
      setRulesLoading(false);
    }
  };

  const saveRule = async (ruleData) => {
    if (editingRule) {
      await axios.put(`${API_BASE_URL}/api/rules/${editingRule.id}`, ruleData);
    } else {
      await axios.post(`${API_BASE_URL}/api/rules`, ruleData);
    }
    setShowRuleForm(false);
    setEditingRule(null);
    await fetchRules();
  };

  const deleteRule = async (ruleId) => {
    try {
      setRulesLoading(true);
      await axios.delete(`${API_BASE_URL}/api/rules/${ruleId}`);
      await fetchRules();
    } catch (error) {
      console.error('Error eliminando regla:', error);
    } finally {
      setRulesLoading(false);
    }
  };

  const toggleRule = async (rule) => {
    try {
      await axios.put(`${API_BASE_URL}/api/rules/${rule.id}`, { ...rule, active: !rule.active });
      await fetchRules();
    } catch (error) {
      console.error('Error cambiando estado de regla:', error);
    }
  };

  const openCampaignDetail = async (campaign) => {
    try {
      setSelectedCampaign(campaign);
      setCampaignDetail(null);
      setCampaignDetailLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/campaigns/${campaign.campaign_id}/detail`, metaRequestConfig(metaConnection));
      setCampaignDetail(response.data);
    } catch (error) {
      console.error('Error cargando detalle de campaña:', error);
    } finally {
      setCampaignDetailLoading(false);
    }
  };

  const fetchAnalysis = async () => {
    try {
      setAnalysisLoading(true);
      setAnalysisError(null);
      const response = await axios.get(`${API_BASE_URL}/api/ai/analyze`, metaRequestConfig(metaConnection, anthropicKey));
      setAnalysisText(response.data.analysis);
      setChatMessages([]);
    } catch (error) {
      if (error.response?.status === 402) {
        setAnalysisError('NO_API_KEY');
      } else {
        setAnalysisError('ERROR');
      }
    } finally {
      setAnalysisLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = { role: 'user', content: chatInput.trim() };
    const nextMessages = [...chatMessages, userMsg];
    setChatMessages(nextMessages);
    setChatInput('');
    setChatLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/ai/chat`, { messages: nextMessages }, metaRequestConfig(metaConnection, anthropicKey));
      setChatMessages([...nextMessages, { role: 'assistant', content: response.data.reply }]);
    } catch {
      setChatMessages([...nextMessages, { role: 'assistant', content: 'Hubo un error al procesar tu pregunta. Intenta de nuevo.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const openAdSetDetail = async (adset) => {
    try {
      setSelectedAdSet(adset);
      setAdSetDetail(null);
      setAdSetDetailLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/adsets/${adset.adset_id}/detail`, metaRequestConfig(metaConnection));
      setAdSetDetail(response.data);
    } catch (error) {
      console.error('Error cargando detalle del conjunto de anuncios:', error);
    } finally {
      setAdSetDetailLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('metaflow_user');
    setUser(null);
  };

  if (!user) {
    return <AuthView onAuth={setUser} />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Zap size={18} />
          </div>
          <span>MetaFlow.AI</span>
        </div>

        <nav className="nav-list">
          <NavItem
            active={activeTab === 'dashboard'}
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            onClick={() => setActiveTab('dashboard')}
          />
          <NavItem
            active={activeTab === 'rules'}
            icon={<Zap size={20} />}
            label="Reglas"
            onClick={() => setActiveTab('rules')}
          />
          <NavItem
            active={activeTab === 'campaigns'}
            icon={<BarChart3 size={20} />}
            label="Campañas"
            onClick={() => setActiveTab('campaigns')}
          />
          <NavItem
            active={activeTab === 'builder'}
            icon={<Upload size={20} />}
            label="Crear Campaña"
            onClick={() => setActiveTab('builder')}
          />
          <NavItem
            active={activeTab === 'approval'}
            icon={<ShieldCheck size={20} />}
            label="Aprobación"
            onClick={() => setActiveTab('approval')}
          />
          <NavItem
            active={activeTab === 'analysis'}
            icon={<Bot size={20} />}
            label="Análisis IA"
            onClick={() => setActiveTab('analysis')}
          />
          <NavItem
            active={activeTab === 'guide'}
            icon={<BookOpen size={20} />}
            label="Guía"
            onClick={() => setActiveTab('guide')}
          />
        </nav>

        <NavItem
          active={activeTab === 'settings'}
          icon={<Settings size={20} />}
          label="Configuración"
          onClick={() => setActiveTab('settings')}
        />
        <button className="nav-item" onClick={logout}>
          <LogOut size={20} /> Salir
        </button>
      </aside>

      <main className="main-content">
        <header className="page-header">
          <div>
            <h1>{getTitle(activeTab)}</h1>
            <p>Bienvenido de nuevo, {user.name}</p>
          </div>
          <button className="primary-button" onClick={processRules} disabled={processingRules}>
            {processingRules ? <Loader2 className="spin" size={18} /> : <Plus size={18} />}
            Analizar reglas
          </button>
        </header>

        {activeTab === 'settings' && (
          <SettingsView
            connection={connection}
            metaConnection={metaConnection}
            loading={connectionLoading}
            onConnect={connectMeta}
            onRefresh={fetchConnectionStatus}
            anthropicKey={anthropicKey}
            onSaveAnthropicKey={(key) => { saveAnthropicKey(key); setAnthropicKey(key); }}
          />
        )}
        {activeTab === 'rules' && (
          <RulesView
            rules={rules}
            loading={rulesLoading}
            processingRules={processingRules}
            showForm={showRuleForm}
            editingRule={editingRule}
            onProcessRules={processRules}
            onNew={() => { setEditingRule(null); setShowRuleForm(true); }}
            onEdit={(rule) => { setEditingRule(rule); setShowRuleForm(true); }}
            onDelete={deleteRule}
            onToggle={toggleRule}
            onSave={saveRule}
            onCancelForm={() => { setShowRuleForm(false); setEditingRule(null); }}
          />
        )}
        {activeTab === 'campaigns' && (
          <CampaignsView
            campaigns={campaignAnalysis}
            loading={campaignsLoading}
            onOpenCampaign={openCampaignDetail}
            onRefresh={fetchCampaignAnalysis}
          />
        )}
        {activeTab === 'builder' && (
          <CampaignBuilderView
            assets={businessAssets}
            copyLoading={copyLoading}
            objectives={objectives}
            loading={builderLoading}
            result={builderResult}
            onCreate={createCampaign}
            onGenerateCopy={generateCopy}
          />
        )}
        {activeTab === 'approval' && (
          <ApprovalView
            actions={approvalActions}
            loading={approvalLoading}
            onRefresh={fetchApprovalActions}
            onPublish={publishApprovalAction}
            onReject={rejectApprovalAction}
            user={user}
          />
        )}
        {activeTab === 'dashboard' && <DashboardView loading={loading} onOpenCampaign={openCampaignDetail} stats={stats} />}
        {activeTab === 'analysis' && (
          <AnalysisView
            analysisText={analysisText}
            analysisLoading={analysisLoading}
            analysisError={analysisError}
            onRefresh={fetchAnalysis}
            chatMessages={chatMessages}
            chatInput={chatInput}
            chatLoading={chatLoading}
            onChatInput={setChatInput}
            onSendChat={sendChatMessage}
          />
        )}
        {activeTab === 'guide' && <GuideView />}
      </main>
      {selectedCampaign && (
        <CampaignDetailDrawer
          campaign={selectedCampaign}
          detail={campaignDetail}
          loading={campaignDetailLoading}
          onClose={() => { setSelectedCampaign(null); setSelectedAdSet(null); setAdSetDetail(null); }}
          onOpenAdSet={openAdSetDetail}
          selectedAdSet={selectedAdSet}
          adSetDetail={adSetDetail}
          adSetDetailLoading={adSetDetailLoading}
          onCloseAdSet={() => { setSelectedAdSet(null); setAdSetDetail(null); }}
        />
      )}
    </div>
  );
}

function AuthView({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const handleChange = (event) => {
    setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  };
  const handleSubmit = (event) => {
    event.preventDefault();
    const nextUser = {
      id: form.email || `user_${Date.now()}`,
      name: form.name || form.email?.split('@')[0] || 'Usuario',
      email: form.email
    };
    localStorage.setItem('metaflow_user', JSON.stringify(nextUser));
    onAuth(nextUser);
  };

  return (
    <main className="auth-shell">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <div className="brand auth-brand">
          <div className="brand-mark"><Zap size={18} /></div>
          <span>MetaFlow.AI</span>
        </div>
        <h1>{mode === 'login' ? 'Ingresa a tu copiloto de Ads' : 'Crea tu cuenta'}</h1>
        <p className="muted-copy">Conecta tu System User, analiza campañas y crea anuncios con IA.</p>
        {mode === 'register' && (
          <label>
            Nombre
            <input name="name" value={form.name} onChange={handleChange} placeholder="Tu nombre" />
          </label>
        )}
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="tu@email.com" required />
        </label>
        <label>
          Contraseña
          <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••••" required />
        </label>
        <button className="primary-button" type="submit">
          {mode === 'login' ? 'Entrar' : 'Registrarme'}
        </button>
        <button className="secondary-button compact-button" type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Crear cuenta' : 'Ya tengo cuenta'}
        </button>
      </form>
    </main>
  );
}

function NavItem({ active, icon, label, onClick }) {
  return (
    <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
      {icon}
      {label}
    </button>
  );
}

function DashboardView({ loading, onOpenCampaign, stats }) {
  const investment = parseFloat(stats.inversion || 0).toLocaleString('en-US');
  const billing = parseFloat(stats.facturacion || 0).toLocaleString('en-US');

  return (
    <section className="dashboard-stack">
      <div className="metrics-grid">
        <MetricCard label="Inversión (7 días)" loading={loading} value={`$${investment}`} />
        <MetricCard label="Facturación / VCV" loading={loading} value={`$${billing}`} tone="success" />
        <MetricCard label="ROAS Promedio" loading={loading} value={stats.roas} tone="success" />
        <MetricCard label="Campañas Activas" loading={loading} value={stats.activeCampaignsCount || 0} />
        <MetricCard label="Acciones Pendientes" loading={loading} value={stats.acciones} />
      </div>
      <section className="card dashboard-active">
        <div className="section-toolbar">
          <div>
            <h2>Campañas activas</h2>
            <p className="muted-copy">Vista rápida sin abrir el Administrador de anuncios.</p>
          </div>
        </div>
        {(stats.activeCampaigns || []).length === 0 ? (
          <div className="empty-state">No hay campañas activas para esta cuenta.</div>
        ) : (
          <div className="campaign-grid">
            {stats.activeCampaigns.map((campaign) => (
              <CampaignCard key={campaign.campaign_id} campaign={campaign} onOpenCampaign={onOpenCampaign} />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

function MetricCard({ label, loading, value, tone }) {
  return (
    <article className="card metric-card">
      <p>{label}</p>
      {loading ? <FuturisticLoader /> : <h2 className={tone === 'success' ? 'success-text' : ''}>{value}</h2>}
    </article>
  );
}

function FuturisticLoader({ small = false }) {
  return (
    <span className={`ai-loader ${small ? 'small' : ''}`} aria-label="Cargando">
      <span />
      <span />
      <span />
    </span>
  );
}

const RULE_METRICS = [
  { value: 'roas',        label: 'ROAS' },
  { value: 'spend',       label: 'Gasto (Spend)' },
  { value: 'cpc',         label: 'CPC' },
  { value: 'cpa',         label: 'CPA (Costo por compra)' },
  { value: 'clicks',      label: 'Clics' },
  { value: 'impressions', label: 'Impresiones' }
];
const RULE_OPERATORS = [
  { value: '<',  label: 'Menor a' },
  { value: '<=', label: 'Menor o igual a' },
  { value: '>',  label: 'Mayor a' },
  { value: '>=', label: 'Mayor o igual a' },
  { value: '=',  label: 'Igual a' }
];
const RULE_ACTIONS = [
  { value: 'pause_campaign',  label: 'Pausar campaña' },
  { value: 'scale_budget',    label: 'Escalar presupuesto' },
  { value: 'reduce_budget',   label: 'Reducir presupuesto' },
  { value: 'notify',          label: 'Notificar' }
];
const ACTION_LABEL = Object.fromEntries(RULE_ACTIONS.map(a => [a.value, a.label]));

const OBJECTIVE_HINTS = {
  OUTCOME_SALES:      'Mayor número de compras al menor costo posible · Puja automática · Evento: Compra en Pixel',
  OUTCOME_TRAFFIC:    'Mayor número de clics al enlace · Puja automática · Optimizado para clics',
  OUTCOME_ENGAGEMENT: 'Mayor interacción con la publicación · Puja automática · Optimizado para engagement',
  OUTCOME_AWARENESS:  'Mayor alcance único posible · Puja automática · Optimizado para reach'
};

function RulesView({ rules, loading, processingRules, showForm, editingRule, onProcessRules, onNew, onEdit, onDelete, onToggle, onSave, onCancelForm }) {
  return (
    <section className="rules-section">
      <div className="card table-card">
        <div className="approval-header">
          <div>
            <h2>Reglas de automatización</h2>
            <p className="muted-copy">Condiciones por métrica; las acciones sugeridas pasan por aprobación.</p>
          </div>
          <div className="rules-header-actions">
            <button className="secondary-button compact-button" onClick={onNew} type="button">
              <Plus size={18} /> Nueva regla
            </button>
            <button className="primary-button" onClick={onProcessRules} disabled={processingRules} type="button">
              {processingRules ? <Loader2 className="spin" size={18} /> : <Zap size={18} />}
              Ejecutar análisis
            </button>
          </div>
        </div>

        {loading && <div className="empty-state"><FuturisticLoader small /> Cargando reglas...</div>}

        {!loading && rules.length === 0 && (
          <div className="empty-state">No hay reglas configuradas. Crea la primera.</div>
        )}

        {!loading && rules.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Condición</th>
                <th>Acción</th>
                <th>Aprobación</th>
                <th>Activa</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td>{rule.name}</td>
                  <td><span className="badge">{rule.metric} {rule.operator} {rule.value}</span></td>
                  <td><span className="badge warning-badge">{ACTION_LABEL[rule.action] || rule.action}</span></td>
                  <td className="muted-copy">{rule.requires_approval ? 'Sí' : 'No'}</td>
                  <td>
                    <button
                      className="toggle-btn"
                      type="button"
                      aria-label={rule.active ? 'Desactivar regla' : 'Activar regla'}
                      onClick={() => onToggle(rule)}
                    >
                      {rule.active
                        ? <ToggleRight size={24} className="toggle-on" />
                        : <ToggleLeft size={24} />}
                    </button>
                  </td>
                  <td className="approval-actions">
                    <button type="button" aria-label="Editar regla" onClick={() => onEdit(rule)}><Edit2 size={18} /></button>
                    <button type="button" aria-label="Eliminar regla" onClick={() => onDelete(rule.id)}><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <RuleForm rule={editingRule} onSave={onSave} onCancel={onCancelForm} />
      )}
    </section>
  );
}

function RuleForm({ rule, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: rule?.name || '',
    metric: rule?.metric || 'roas',
    operator: rule?.operator || '<',
    value: rule?.value ?? '',
    action: rule?.action || 'pause_campaign',
    active: rule?.active !== undefined ? rule.active : true,
    requires_approval: rule?.requires_approval !== undefined ? rule.requires_approval : true
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(curr => ({ ...curr, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      setSaving(true);
      await onSave({ ...form, value: Number(form.value) });
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar la regla');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card rule-form-card">
      <h3>{rule ? 'Editar regla' : 'Nueva regla'}</h3>
      <form onSubmit={handleSubmit}>
        <label>
          Nombre
          <input name="name" value={form.name} onChange={handleChange} placeholder="Ej: Pausar si ROAS es bajo" required />
        </label>
        <div className="rule-condition-grid">
          <label>
            Métrica
            <select name="metric" value={form.metric} onChange={handleChange}>
              {RULE_METRICS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </label>
          <label>
            Operador
            <select name="operator" value={form.operator} onChange={handleChange}>
              {RULE_OPERATORS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
            </select>
          </label>
          <label>
            Valor
            <input name="value" type="number" step="any" value={form.value} onChange={handleChange} placeholder="1.2" required />
          </label>
        </div>
        <label>
          Acción sugerida
          <select name="action" value={form.action} onChange={handleChange}>
            {RULE_ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </label>
        <div className="checkbox-row">
          <label className="checkbox-label">
            <input name="active" type="checkbox" checked={form.active} onChange={handleChange} />
            Activa
          </label>
          <label className="checkbox-label">
            <input name="requires_approval" type="checkbox" checked={form.requires_approval} onChange={handleChange} />
            Requiere aprobación
          </label>
        </div>
        {error && <div className="status-box status-error">{error}</div>}
        <div className="wizard-actions">
          <button className="secondary-button compact-button" type="button" onClick={onCancel}>Cancelar</button>
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? <FuturisticLoader small /> : <CheckCircle2 size={18} />}
            {rule ? 'Actualizar' : 'Crear regla'}
          </button>
        </div>
      </form>
    </div>
  );
}

function CampaignsView({ campaigns, loading, onOpenCampaign, onRefresh }) {
  return (
    <section className="campaigns-section">
      <div className="section-toolbar">
        <div>
          <h2>Análisis por campaña</h2>
          <p className="muted-copy">Lectura individual de los últimos 7 días desde Meta Ads.</p>
        </div>
        <button className="secondary-button compact-button" onClick={onRefresh} disabled={loading}>
          {loading ? <Loader2 className="spin" size={18} /> : <BarChart3 size={18} />}
          Actualizar
        </button>
      </div>

      {loading && (
        <div className="card empty-state">
          <Loader2 className="spin muted-icon" />
          Analizando campañas...
        </div>
      )}

      {!loading && campaigns.length === 0 && (
        <div className="card empty-state">No hay campañas disponibles para el periodo analizado.</div>
      )}

      {!loading && campaigns.length > 0 && (
        <div className="campaign-grid">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.campaign_id} campaign={campaign} onOpenCampaign={onOpenCampaign} />
          ))}
        </div>
      )}
    </section>
  );
}

function CampaignCard({ campaign, onOpenCampaign }) {
  return (
    <button className="card campaign-card campaign-card-button" onClick={() => onOpenCampaign(campaign)} type="button">
      <CampaignCardContent campaign={campaign} />
    </button>
  );
}

function CampaignCardContent({ campaign }) {
  return (
    <>
      <div className="campaign-header">
        <div>
          <h3>{campaign.campaign_name}</h3>
          <p>{campaign.campaign_id}</p>
        </div>
        <span className={`status-pill ${campaign.status}`}>{getStatusLabel(campaign.status)}</span>
      </div>

      <div className="campaign-metrics">
        <SmallMetric label="Gasto" value={formatCurrency(campaign.spend)} />
        <SmallMetric label="VCV" value={formatCurrency(campaign.vcv)} />
        <SmallMetric label="ROAS" value={`${formatNumber(campaign.roas)}x`} />
        <SmallMetric label="CTR" value={`${formatNumber(campaign.ctr)}%`} />
        <SmallMetric label="CPM" value={formatCurrency(campaign.cpm)} />
        <SmallMetric label="CPC" value={formatCurrency(campaign.cpc)} />
        <SmallMetric label="Clicks" value={formatInteger(campaign.clicks)} />
        <SmallMetric label="Impresiones" value={formatInteger(campaign.impressions)} />
      </div>

      <div className="campaign-summary">{campaign.summary}</div>

      {campaign.suggestions?.length > 0 && (
        <div className="suggestions-list">
          {campaign.suggestions.map((suggestion) => (
            <span key={`${suggestion.action}-${suggestion.reason}`} className="badge warning-badge">
              {ACTION_LABEL[suggestion.action] || suggestion.action}: {suggestion.reason}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

function CampaignBuilderView({ assets, copyLoading, objectives, loading, result, onCreate, onGenerateCopy }) {
  const [form, setForm] = useState({
    objective: 'OUTCOME_SALES',
    country: 'CO',
    name: '',
    dailyBudget: '10000',
    destinationUrl: '',
    pageId: '',
    pageName: '',
    instagramAccountId: '',
    instagramName: '',
    whatsappNumber: '',
    businessContext: '',
    primaryText: '',
    headline: '',
    description: ''
  });
  const [creatives, setCreatives] = useState([]);
  const [step, setStep] = useState(1);
  const selectedObjective = objectives.find(objective => objective.value === form.objective);
  const selectedPage = assets.pages?.find(page => page.id === form.pageId);
  const needsUrl = selectedObjective?.requires?.includes('META_DESTINATION_URL');
  const needsWhatsapp = form.objective === 'OUTCOME_SALES';
  const whatsappOptions = [
    ...(assets.whatsappNumbers || []),
    ...(assets.pages || [])
      .filter(page => page.whatsappNumber)
      .map(page => ({ id: page.id, display_phone_number: page.whatsappNumber, verified_name: page.name }))
  ];

  useEffect(() => {
    const defaults = assets.defaults || {};

    setForm(current => ({
      ...current,
      pageId: current.pageId || defaults.pageId || '',
      instagramAccountId: current.instagramAccountId || defaults.instagramAccountId || '',
      destinationUrl: current.destinationUrl || defaults.destinationUrl || '',
      whatsappNumber: current.whatsappNumber || defaults.whatsappNumber || ''
    }));
  }, [assets]);

  useEffect(() => {
    if (!selectedPage) return;

    setForm(current => ({
      ...current,
      pageName: selectedPage.name,
      instagramAccountId: current.instagramAccountId || selectedPage.instagram?.id || '',
      instagramName: current.instagramName || selectedPage.instagram?.username || ''
    }));
  }, [selectedPage]);

  const handleChange = (event) => {
    setForm(current => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  };

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    const encodedFiles = await Promise.all(files.map(readFileAsDataUrl));
    setCreatives(encodedFiles);
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files || []);
    const encodedFiles = await Promise.all(files.map(readFileAsDataUrl));
    setCreatives(encodedFiles);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onCreate({
      ...form,
      dailyBudget: Number(form.dailyBudget),
      generatedCopy: {
        primaryText: form.primaryText,
        headline: form.headline,
        description: form.description
      },
      creatives
    });
  };

  const handleGenerateCopy = async () => {
    const copy = await onGenerateCopy({
      ...form,
      creatives
    });

    setForm(current => ({
      ...current,
      primaryText: copy.primaryText,
      headline: copy.headline,
      description: copy.description,
      policyNotes: copy.policyNotes || []
    }));
  };

  return (
    <form className="builder-wizard" onSubmit={handleSubmit}>
      <section className="card builder-panel">
        <div className="wizard-header">
          <div>
            <h2>Campaña guiada por IA</h2>
            <p className="muted-copy">Describe el producto, sube creativos y revisa antes de publicar.</p>
          </div>
          <div className="wizard-steps">
            {[1, 2, 3, 4].map((item) => <span key={item} className={step >= item ? 'active' : ''}>{item}</span>)}
          </div>
        </div>

        {step === 1 && (
          <div className="wizard-pane">
            <label>
              ¿Qué vas a pautar?
              <textarea
                name="businessContext"
                value={form.businessContext}
                onChange={handleChange}
                placeholder="Describe el producto, oferta, público, diferenciador y tono de marca. La IA usará esto para crear los copys."
              />
            </label>
            <div className="rule-condition-grid">
              <label>
                Objetivo
                <select name="objective" value={form.objective} onChange={handleChange}>
                  {objectives.map((objective) => (
                    <option key={objective.value} value={objective.value} disabled={!objective.supported}>
                      {objective.label}{objective.supported ? '' : ' · requiere setup extra'}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                País
                <select name="country" value={form.country} onChange={handleChange}>
                  <option value="CO">🇨🇴 Colombia</option>
                  <option value="MX">🇲🇽 México</option>
                  <option value="AR">🇦🇷 Argentina</option>
                  <option value="CL">🇨🇱 Chile</option>
                  <option value="PE">🇵🇪 Perú</option>
                  <option value="EC">🇪🇨 Ecuador</option>
                  <option value="US">🇺🇸 Estados Unidos</option>
                  <option value="ES">🇪🇸 España</option>
                </select>
              </label>
            </div>
            {selectedObjective && (
              <div className="objective-hint">
                <strong>Optimización automática:</strong> {OBJECTIVE_HINTS[form.objective] || `Meta optimizará para ${selectedObjective.label.toLowerCase()}`}
              </div>
            )}
            <div className="wizard-actions">
              <button className="primary-button" type="button" disabled={!form.businessContext} onClick={() => setStep(2)}>
                Continuar
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="wizard-pane">
            <label className="upload-zone" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
              <Upload size={26} />
              <span>Arrastra o sube tus creativos</span>
              <small>Imágenes JPG/PNG o videos MP4/MOV. La app creará un anuncio por creativo.</small>
              <input type="file" accept="image/png,image/jpeg,video/mp4,video/quicktime" multiple onChange={handleFiles} />
            </label>
            {creatives.length > 0 && (
              <div className="creative-list">
                {creatives.map((creative) => (
                  <span className="badge" key={creative.name}>{creative.name}</span>
                ))}
              </div>
            )}
            <div className="wizard-actions">
              <button className="secondary-button compact-button" type="button" onClick={() => setStep(1)}>Atrás</button>
              <button className="primary-button" type="button" disabled={creatives.length === 0} onClick={() => setStep(3)}>Continuar</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="wizard-pane">
            <div className="builder-grid">
              <label>
                Fan Page
                <select name="pageId" value={form.pageId} onChange={handleChange}>
                  <option value="">Selecciona una Fan Page</option>
                  {assets.pages?.map((page) => (
                    <option key={page.id} value={page.id}>{page.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Instagram
                <input
                  name="instagramAccountId"
                  value={form.instagramAccountId}
                  onChange={handleChange}
                  placeholder={selectedPage?.instagram?.username || 'Instagram conectado'}
                />
              </label>
            </div>
            {needsUrl && (
              <label>
                URL destino
                <input name="destinationUrl" value={form.destinationUrl} onChange={handleChange} placeholder="https://..." />
              </label>
            )}
            {needsWhatsapp && (
              <label>
                WhatsApp
                {whatsappOptions.length > 0 ? (
                  <select name="whatsappNumber" value={form.whatsappNumber} onChange={handleChange}>
                    <option value="">Selecciona WhatsApp</option>
                    {whatsappOptions.map((phone) => (
                      <option key={`${phone.id}-${phone.display_phone_number}`} value={phone.display_phone_number}>
                        {phone.verified_name || phone.display_phone_number} · {phone.display_phone_number}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input name="whatsappNumber" value={form.whatsappNumber} onChange={handleChange} placeholder="573001234567" />
                )}
              </label>
            )}
            <div className="builder-grid">
              <label>
                Nombre
                <input name="name" value={form.name} onChange={handleChange} placeholder="La IA puede completarlo si lo dejas vacío" />
              </label>
              <label>
                Presupuesto diario
                <input name="dailyBudget" type="number" min="100" value={form.dailyBudget} onChange={handleChange} />
              </label>
            </div>
            <button className="secondary-button builder-submit" type="button" onClick={handleGenerateCopy} disabled={copyLoading}>
              {copyLoading ? <FuturisticLoader small /> : <Zap size={18} />}
              Generar copy con IA
            </button>
            <div className="wizard-actions">
              <button className="secondary-button compact-button" type="button" onClick={() => setStep(2)}>Atrás</button>
              <button className="primary-button" type="button" disabled={!form.primaryText || !form.headline} onClick={() => setStep(4)}>Revisar</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="wizard-pane">
            <div className="review-panel">
              <span className="badge">{selectedObjective?.label}</span>
              <h3>{form.headline}</h3>
              <p>{form.primaryText}</p>
              <small>{form.description}</small>
            </div>
            {form.policyNotes?.length > 0 && (
              <div className="policy-notes">
                {form.policyNotes.map((note) => <span key={note}>{note}</span>)}
              </div>
            )}
            {result && (
              <div className={`status-box ${result.success ? '' : 'status-error'}`}>
                {result.success ? `Campaña lista para aprobación: ${result.result?.campaign_id}` : result.error}
              </div>
            )}
            <div className="wizard-actions">
              <button className="secondary-button compact-button" type="button" onClick={() => setStep(3)}>Atrás</button>
              <button className="primary-button" type="submit" disabled={loading || selectedObjective?.supported === false}>
                {loading ? <FuturisticLoader small /> : <Send size={18} />}
                Enviar a aprobación
              </button>
            </div>
          </div>
        )}
      </section>
    </form>
  );
}

function SmallMetric({ label, value }) {
  return (
    <div className="small-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AdRow({ ad }) {
  return (
    <article className="ad-row">
      {ad.creative?.thumbnail_url ? (
        <img src={ad.creative.thumbnail_url} alt="" />
      ) : (
        <div className="ad-thumb-placeholder">AD</div>
      )}
      <div className="ad-row-main">
        <div className="ad-row-title">
          <strong>{ad.ad_name}</strong>
          <span className="status-pill">{ad.effective_status || ad.status}</span>
        </div>
        <div className="ad-metrics">
          <SmallMetric label="Gasto" value={formatCurrency(ad.spend)} />
          <SmallMetric label="VCV" value={formatCurrency(ad.vcv)} />
          <SmallMetric label="ROAS" value={`${formatNumber(ad.roas)}x`} />
          <SmallMetric label="CPA" value={ad.cpa > 0 ? formatCurrency(ad.cpa) : '$0.00'} />
          <SmallMetric label="CTR" value={`${formatNumber(ad.ctr)}%`} />
          <SmallMetric label="CPM" value={formatCurrency(ad.cpm)} />
          <SmallMetric label="CPC" value={formatCurrency(ad.cpc)} />
          <SmallMetric label="Clicks" value={formatInteger(ad.clicks)} />
          <SmallMetric label="Impr." value={formatInteger(ad.impressions)} />
        </div>
      </div>
    </article>
  );
}

function CampaignDetailDrawer({ campaign, detail, loading, onClose, onOpenAdSet, selectedAdSet, adSetDetail, adSetDetailLoading, onCloseAdSet }) {
  const adsets = detail?.adsets || [];

  return (
    <div className="drawer-backdrop">
      <aside className="campaign-drawer">
        <div className="drawer-header">
          <div>
            <span className="badge">{campaign.effective_status || campaign.status || 'Sin estado'}</span>
            <h2>{campaign.campaign_name}</h2>
            <p className="muted-copy">{campaign.campaign_id}</p>
          </div>
          <button className="secondary-button compact-button" onClick={onClose}>Cerrar</button>
        </div>

        <div className="campaign-metrics drawer-metrics">
          <SmallMetric label="Gasto" value={formatCurrency(campaign.spend)} />
          <SmallMetric label="VCV" value={formatCurrency(campaign.vcv)} />
          <SmallMetric label="ROAS" value={`${formatNumber(campaign.roas)}x`} />
          <SmallMetric label="CTR" value={`${formatNumber(campaign.ctr)}%`} />
          <SmallMetric label="CPM" value={formatCurrency(campaign.cpm)} />
          <SmallMetric label="CPC" value={formatCurrency(campaign.cpc)} />
          <SmallMetric label="Clicks" value={formatInteger(campaign.clicks)} />
          <SmallMetric label="Impresiones" value={formatInteger(campaign.impressions)} />
        </div>

        <section className="drawer-section">
          <h3>Conjuntos de anuncios</h3>
          {loading && <div className="empty-state"><FuturisticLoader small /> Cargando conjuntos...</div>}
          {!loading && adsets.length === 0 && <div className="empty-state">No hay conjuntos de anuncios para esta campaña.</div>}
          {!loading && adsets.length > 0 && (
            <div className="ads-list">
              {adsets.map((adset) => (
                <button
                  key={adset.adset_id}
                  className={`adset-row${selectedAdSet?.adset_id === adset.adset_id ? ' adset-row--active' : ''}`}
                  onClick={() => onOpenAdSet(adset)}
                  type="button"
                >
                  <div className="ad-row-title">
                    <strong>{adset.adset_name}</strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {adset.daily_budget > 0 && (
                        <span className="budget-pill">Presup. diario: {formatCurrency(adset.daily_budget)}</span>
                      )}
                      {adset.lifetime_budget > 0 && (
                        <span className="budget-pill">Presup. total: {formatCurrency(adset.lifetime_budget)}</span>
                      )}
                      <span className="status-pill">{adset.effective_status || adset.status}</span>
                    </div>
                  </div>
                  <div className="ad-metrics">
                    <SmallMetric label="Gasto" value={formatCurrency(adset.spend)} />
                    <SmallMetric label="VCV" value={formatCurrency(adset.vcv)} />
                    <SmallMetric label="ROAS" value={`${formatNumber(adset.roas)}x`} />
                    <SmallMetric label="CPA" value={adset.cpa > 0 ? formatCurrency(adset.cpa) : '$0.00'} />
                    <SmallMetric label="CTR" value={`${formatNumber(adset.ctr)}%`} />
                    <SmallMetric label="CPM" value={formatCurrency(adset.cpm)} />
                    <SmallMetric label="CPC" value={formatCurrency(adset.cpc)} />
                    <SmallMetric label="Clicks" value={formatInteger(adset.clicks)} />
                    <SmallMetric label="Impr." value={formatInteger(adset.impressions)} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </aside>

      {selectedAdSet && (
        <aside className="campaign-drawer adset-drawer">
          <div className="drawer-header">
            <div>
              <span className="badge">{selectedAdSet.effective_status || selectedAdSet.status || 'Sin estado'}</span>
              <h2>{selectedAdSet.adset_name}</h2>
              <p className="muted-copy">{selectedAdSet.adset_id}</p>
            </div>
            <button className="secondary-button compact-button" onClick={onCloseAdSet}>Cerrar</button>
          </div>

          <div className="campaign-metrics drawer-metrics">
            <SmallMetric label="Gasto" value={formatCurrency(selectedAdSet.spend)} />
            <SmallMetric label="VCV" value={formatCurrency(selectedAdSet.vcv)} />
            <SmallMetric label="ROAS" value={`${formatNumber(selectedAdSet.roas)}x`} />
            <SmallMetric label="CPA" value={selectedAdSet.cpa > 0 ? formatCurrency(selectedAdSet.cpa) : '$0.00'} />
            <SmallMetric label="CTR" value={`${formatNumber(selectedAdSet.ctr)}%`} />
            <SmallMetric label="CPM" value={formatCurrency(selectedAdSet.cpm)} />
            <SmallMetric label="CPC" value={formatCurrency(selectedAdSet.cpc)} />
            <SmallMetric label="Clicks" value={formatInteger(selectedAdSet.clicks)} />
            <SmallMetric label="Impr." value={formatInteger(selectedAdSet.impressions)} />
          </div>

          <section className="drawer-section">
            <h3>Anuncios</h3>
            {adSetDetailLoading && <div className="empty-state"><FuturisticLoader small /> Cargando anuncios...</div>}
            {!adSetDetailLoading && (adSetDetail?.ads || []).length === 0 && (
              <div className="empty-state">No hay anuncios en este conjunto.</div>
            )}
            {!adSetDetailLoading && (adSetDetail?.ads || []).length > 0 && (
              <div className="ads-list">
                {(adSetDetail.ads).map((ad) => <AdRow key={ad.ad_id} ad={ad} />)}
              </div>
            )}
          </section>
        </aside>
      )}
    </div>
  );
}

function SettingsView({ connection, metaConnection, loading, onConnect, onRefresh, anthropicKey, onSaveAnthropicKey }) {
  const [draft, setDraft] = useState(metaConnection || { accessToken: '', adAccountId: '' });
  const [anthropicDraft, setAnthropicDraft] = useState(anthropicKey || '');

  const handleChange = (event) => {
    setDraft(current => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onConnect(draft);
  };

  const handleAccountSelect = (event) => {
    const nextDraft = {
      ...draft,
      adAccountId: event.target.value
    };
    setDraft(nextDraft);
    onConnect(nextDraft);
  };

  return (
    <form className="card narrow-panel token-panel" onSubmit={handleSubmit}>
      <h2>Conecta tu System User</h2>
      <p className="muted-copy">Pega el token generado en Business Manager. La app cargará las cuentas, Fan Pages, Instagram y WhatsApp permitidos.</p>
      <div className={`status-box ${connection?.ok === false ? 'status-error' : ''}`}>
        {loading && <><FuturisticLoader small /> Validando conexión con Meta Ads...</>}
        {!loading && connection?.ok && `Conectado por System User a ${connection.account?.name || connection.adAccountId}.`}
        {!loading && connection?.ok === false && 'No se pudo validar la conexión con Meta Ads.'}
        {!loading && !connection && 'Aún no hay una conexión validada.'}
      </div>
      <label>
        System User Access Token
        <input name="accessToken" type="password" value={draft.accessToken || ''} onChange={handleChange} placeholder="EAAB..." />
      </label>
      <label>
        Ad Account ID
        <input name="adAccountId" value={draft.adAccountId || ''} onChange={handleChange} placeholder="act_123456789 o vacío para detectar" />
      </label>
      {connection?.ok && (
        <div className="connection-details">
          <span>Graph API: {connection.graphVersion}</span>
          <span>Cuenta activa: {connection.adAccountId}</span>
          <span>Cuentas detectadas: {connection.adAccounts?.length || 0}</span>
          <span>Campañas legibles: {connection.readableCampaigns}</span>
        </div>
      )}
      {connection?.adAccounts?.length > 0 && (
        <label>
          Cuenta publicitaria
          <select value={draft.adAccountId || connection.adAccountId || ''} onChange={handleAccountSelect}>
            {connection.adAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} · {account.id}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="settings-actions">
        <button className="primary-button" type="submit" disabled={loading || !draft.accessToken}>
          {loading ? <FuturisticLoader small /> : <ShieldCheck size={18} />}
          Conectar
        </button>
        <button className="secondary-button compact-button" type="button" onClick={onRefresh} disabled={loading}>
          Validar de nuevo
        </button>
      </div>

      <div className="settings-divider" />

      <h2>Análisis con IA</h2>
      <p className="muted-copy">Tu API Key de Anthropic se guarda solo en este navegador y se usa para el diagnóstico automático de campañas.</p>
      <label>
        Anthropic API Key
        <input
          type="password"
          value={anthropicDraft}
          onChange={e => setAnthropicDraft(e.target.value)}
          placeholder="sk-ant-api03-..."
        />
      </label>
      <div className="settings-actions">
        <button
          className="primary-button"
          type="button"
          onClick={() => onSaveAnthropicKey(anthropicDraft)}
          disabled={!anthropicDraft.trim()}
        >
          <Bot size={18} /> Guardar API Key
        </button>
        {anthropicKey && (
          <span style={{ fontSize: 12, color: '#6ee7b7' }}>✓ Key guardada</span>
        )}
      </div>
    </form>
  );
}

function ApprovalView({ actions, loading, onPublish, onRefresh, onReject, user }) {
  return (
    <section className="card table-card">
      <div className="approval-header">
        <div>
          <h2>Aprobación final</h2>
          <p className="muted-copy">Campañas y acciones listas para revisar antes de publicar.</p>
        </div>
        <button className="secondary-button compact-button" onClick={onRefresh} disabled={loading}>
          {loading ? <FuturisticLoader small /> : <ShieldCheck size={18} />}
          Actualizar
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Campaña</th>
            <th>Acción Sugerida</th>
            <th>Motivo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan="4"><div className="empty-state"><FuturisticLoader small /> Cargando aprobación...</div></td>
            </tr>
          )}
          {!loading && actions.length === 0 && (
            <tr>
              <td>Campañas de {user.name}</td>
              <td><span className="badge">Sin pendientes</span></td>
              <td className="muted-copy">No hay acciones pendientes hoy</td>
              <td className="approval-actions">
                <button aria-label="Aprobar acción" disabled><CheckCircle2 size={20} /></button>
                <button aria-label="Rechazar acción" disabled><XCircle size={20} /></button>
              </td>
            </tr>
          )}
          {!loading && actions.map((action) => (
            <tr key={action.id}>
              <td>{action.campaign_name || action.campaign_id}</td>
              <td><span className="badge warning-badge">{ACTION_LABEL[action.action_suggested] || action.action_suggested}</span></td>
              <td className="muted-copy">{action.reason}</td>
              <td className="approval-actions">
                <button aria-label="Publicar campaña" onClick={() => onPublish(action.id)} disabled={loading}><CheckCircle2 size={20} /></button>
                <button aria-label="Rechazar acción" onClick={() => onReject(action.id)} disabled={loading}><XCircle size={20} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function getTitle(activeTab) {
  const titles = {
    dashboard: 'Rendimiento General',
    rules: 'Mis Reglas',
    campaigns: 'Campañas',
    builder: 'Crear Campaña',
    approval: 'Acciones Pendientes',
    settings: 'Conexión con Meta Ads',
    analysis: 'Análisis con IA',
    guide: 'Guía de Configuración'
  };

  return titles[activeTab];
}

function formatAnalysisText(text) {
  if (!text) return null;
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <br key={i} />;
    const parts = line.split(/\*\*(.*?)\*\*/g);
    const formatted = parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part);
    return <p key={i} style={{ margin: '2px 0' }}>{formatted}</p>;
  });
}

function AnalysisView({ analysisText, analysisLoading, analysisError, onRefresh, chatMessages, chatInput, chatLoading, onChatInput, onSendChat }) {
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSendChat(); }
  };

  return (
    <div className="analysis-view">
      <div className="analysis-panel">
        <div className="analysis-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bot size={22} color="#a78bfa" />
            <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: 16 }}>Diagnóstico automático — últimos 7 días</span>
          </div>
          {!analysisLoading && (
            <button className="secondary-button compact-button" onClick={onRefresh}>Actualizar análisis</button>
          )}
        </div>

        <div className="analysis-body">
          {analysisLoading && (
            <div className="analysis-loading">
              <FuturisticLoader small />
              <span>Analizando tus campañas como experto...</span>
            </div>
          )}
          {!analysisLoading && analysisError === 'NO_API_KEY' && (
            <div className="analysis-no-key">
              <p><strong>Se necesita una API Key de Anthropic</strong> para activar el análisis con IA.</p>
              <p>Pasos para obtenerla:</p>
              <ol>
                <li>Ve a <strong>console.anthropic.com</strong> y crea una cuenta</li>
                <li>En el menú lateral selecciona <strong>API Keys</strong></li>
                <li>Haz clic en <strong>Create Key</strong> y copia el valor</li>
                <li>Abre el archivo <strong>backend/.env</strong> y agrega:<br /><code>ANTHROPIC_API_KEY=sk-ant-api03-...</code></li>
                <li>Reinicia el backend y recarga esta página</li>
              </ol>
            </div>
          )}
          {!analysisLoading && analysisError === 'ERROR' && (
            <div className="analysis-no-key">
              <p>Hubo un error al generar el análisis. Verifica tu conexión con Meta y vuelve a intentarlo.</p>
              <button className="primary-button" onClick={onRefresh} style={{ marginTop: 12 }}>Reintentar</button>
            </div>
          )}
          {!analysisLoading && !analysisError && analysisText && (
            <div className="analysis-text">{formatAnalysisText(analysisText)}</div>
          )}
        </div>
      </div>

      {!analysisError && (
        <div className="chat-panel">
          <div className="chat-header">
            <Bot size={18} color="#a78bfa" />
            <span>Pregúntale al analista</span>
          </div>
          <div className="chat-messages">
            {chatMessages.length === 0 && !analysisLoading && (
              <div className="chat-placeholder">Puedes preguntarme cosas como: "¿Cuál campaña debería pausar?" o "¿Por qué está bajo el ROAS?"</div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`chat-bubble chat-bubble--${msg.role}`}>
                {msg.role === 'assistant' ? formatAnalysisText(msg.content) : msg.content}
              </div>
            ))}
            {chatLoading && (
              <div className="chat-bubble chat-bubble--assistant">
                <FuturisticLoader small />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="chat-input-row">
            <textarea
              className="chat-input"
              placeholder="Escribe tu pregunta..."
              value={chatInput}
              onChange={e => onChatInput(e.target.value)}
              onKeyDown={handleKey}
              rows={2}
              disabled={chatLoading || analysisLoading}
            />
            <button className="primary-button chat-send-btn" onClick={onSendChat} disabled={chatLoading || !chatInput.trim()}>
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function GuideView() {
  return (
    <div className="guide-view">
      <div className="guide-section">
        <h2>Bienvenido a MetaFlow.AI</h2>
        <p className="muted-copy">Sigue estos pasos para conectar tu cuenta y empezar a analizar tus campañas.</p>
      </div>

      <div className="guide-steps">
        <div className="guide-step">
          <div className="step-number">1</div>
          <div className="step-body">
            <h3>Obtén tu Meta Access Token</h3>
            <p>El token es la llave que le da acceso a la app para leer tus datos de Meta Ads.</p>
            <ol>
              <li>Ve a <strong>developers.facebook.com/tools/explorer</strong></li>
              <li>Selecciona tu app (o crea una nueva)</li>
              <li>En permisos, agrega: <code>ads_read</code>, <code>ads_management</code>, <code>business_management</code></li>
              <li>Haz clic en <strong>Generate Access Token</strong></li>
              <li>Copia el token generado — lo necesitarás en el paso 3</li>
            </ol>
            <div className="guide-tip">Si el token expira cada hora, genera un <strong>token de larga duración</strong> (Long-Lived Token) desde la documentación de Meta.</div>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">2</div>
          <div className="step-body">
            <h3>Obtén tu Ad Account ID</h3>
            <p>Es el ID de tu cuenta publicitaria en Meta Ads Manager.</p>
            <ol>
              <li>Entra a <strong>business.facebook.com/adsmanager</strong></li>
              <li>En la URL verás algo como: <code>?act=636721115311720</code></li>
              <li>Ese número es tu Ad Account ID — también lo puedes ver en <strong>Configuración de la cuenta</strong></li>
            </ol>
            <div className="guide-tip">El formato es solo el número: <code>636721115311720</code>, sin el prefijo "act_".</div>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">3</div>
          <div className="step-body">
            <h3>Conecta en la app</h3>
            <ol>
              <li>Ve a la sección <strong>Configuración</strong> en el menú lateral</li>
              <li>Pega tu <strong>Access Token</strong> en el primer campo</li>
              <li>Pega tu <strong>Ad Account ID</strong> en el segundo campo</li>
              <li>Haz clic en <strong>Conectar</strong></li>
              <li>Si aparece tu nombre de cuenta, ¡la conexión fue exitosa!</li>
            </ol>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">4</div>
          <div className="step-body">
            <h3>Activa el Análisis con IA (opcional)</h3>
            <p>Para usar el diagnóstico automático de campañas necesitas una API Key de Anthropic.</p>
            <ol>
              <li>Crea una cuenta en <strong>console.anthropic.com</strong></li>
              <li>Ve a <strong>API Keys → Create Key</strong></li>
              <li>Copia la key (empieza con <code>sk-ant-api03-...</code>)</li>
              <li>Abre el archivo <strong>backend/.env</strong> del proyecto</li>
              <li>Agrega la línea: <code>ANTHROPIC_API_KEY=sk-ant-api03-tu-key</code></li>
              <li>Reinicia el backend y ve a la sección <strong>Análisis IA</strong></li>
            </ol>
            <div className="guide-tip">Anthropic ofrece $5 de crédito gratis al crear tu cuenta. Con eso puedes hacer cientos de análisis.</div>
          </div>
        </div>

        <div className="guide-step">
          <div className="step-number">5</div>
          <div className="step-body">
            <h3>Explora el Dashboard</h3>
            <p>Con todo conectado puedes usar todas las funciones:</p>
            <ul>
              <li><strong>Dashboard</strong> — Resumen general: inversión, ROAS y facturación de los últimos 7 días</li>
              <li><strong>Campañas</strong> — Detalle por campaña, conjuntos de anuncios y anuncios individuales</li>
              <li><strong>Análisis IA</strong> — Diagnóstico automático experto + chat para preguntas</li>
              <li><strong>Reglas</strong> — Configura automatizaciones (pausar si ROAS baja, alertas, etc.)</li>
              <li><strong>Crear Campaña</strong> — Lanza nuevas campañas directamente desde la app</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function getStatusLabel(status) {
  const labels = {
    healthy: 'Sana',
    watch: 'Monitorear',
    needs_review: 'Revisar',
    no_spend: 'Sin gasto',
    ACTIVE: 'Activa',
    PAUSED: 'Pausada',
    DELETED: 'Eliminada',
    ARCHIVED: 'Archivada',
    IN_PROCESS: 'Procesando',
    WITH_ISSUES: 'Con problemas',
    DISAPPROVED: 'Desaprobada',
    PENDING_REVIEW: 'En revisión',
    CAMPAIGN_PAUSED: 'Camp. pausada',
    ADSET_PAUSED: 'Ad Set pausado'
  };

  return labels[status] || status || 'Sin estado';
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatInteger(value) {
  return Number(value || 0).toLocaleString('en-US');
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      name: file.name,
      type: file.type,
      size: file.size,
      dataUrl: reader.result
    });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const isBrowser = typeof window !== 'undefined';

function loadMetaConnection() {
  if (!isBrowser) return { accessToken: '', adAccountId: '' };
  try {
    return JSON.parse(localStorage.getItem('metaflow_meta_connection')) || { accessToken: '', adAccountId: '' };
  } catch {
    return { accessToken: '', adAccountId: '' };
  }
}

function saveMetaConnection(connection) {
  if (isBrowser) localStorage.setItem('metaflow_meta_connection', JSON.stringify(connection));
}

function loadSessionUser() {
  if (!isBrowser) return null;
  try {
    return JSON.parse(localStorage.getItem('metaflow_user'));
  } catch {
    return null;
  }
}

function loadAnthropicKey() {
  if (!isBrowser) return '';
  return localStorage.getItem('metaflow_anthropic_key') || '';
}

function saveAnthropicKey(key) {
  if (isBrowser) localStorage.setItem('metaflow_anthropic_key', key);
}

function metaRequestConfig(connection, anthropicKey) {
  return {
    headers: {
      ...(connection?.accessToken ? { 'x-meta-access-token': connection.accessToken } : {}),
      ...(connection?.adAccountId ? { 'x-meta-ad-account-id': connection.adAccountId } : {}),
      ...(anthropicKey ? { 'x-anthropic-api-key': anthropicKey } : {})
    }
  };
}

export default App;
