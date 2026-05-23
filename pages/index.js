import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { getSupabaseBrowser } from '../lib/supabase-browser';
import {
  BookOpen,
  Bot,
  CheckCircle2,
  BarChart3,
  BookMarked,
  ClipboardCopy,
  Download,
  Edit2,
  ExternalLink,
  Image,
  LogOut,
  LayoutDashboard,
  Loader2,
  Package,
  Plus,
  Rocket,
  Send,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Upload,
  Wand2,
  XCircle,
  Zap
} from 'lucide-react';
const API_BASE_URL = '';

function App() {
  const [user, setUser] = useState(loadSessionUser());
  const [activeTab, setActiveTab] = useState(() => { try { return localStorage.getItem('metaflow_tab') || 'dashboard'; } catch { return 'dashboard'; } });
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
  const [businessAssets, setBusinessAssets] = useState({ pages: [], pixels: [], defaults: {} });
  const [metaConnection, setMetaConnection] = useState(loadMetaConnection());
  const [approvalActions, setApprovalActions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [autoOptimizeLoading, setAutoOptimizeLoading] = useState(false);
  const [builderResult, setBuilderResult] = useState(null);
  const [builderLoading, setBuilderLoading] = useState(false);
  const [batchUpload, setBatchUpload] = useState(null);
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
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [subscription, setSubscription] = useState(null); // null = loading, object = loaded
  const [imageGenLoading, setImageGenLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [adForm, setAdForm] = useState(() => {
    const defaults = { productName: '', description: '', primaryColor: '#6366f1', secondaryColor: '#ffffff', format: 'square', selectedProductId: '', productImageBase64: '', productImageName: '', angles: ['pain', 'desire', 'transformation', 'objection', 'urgency', 'authority', 'comparison', 'guarantee', 'social_proof', 'curiosity', 'price'], fullDesign: true };
    try {
      const saved = localStorage.getItem('metaflow_adform');
      if (saved) return { ...defaults, ...JSON.parse(saved), productImageBase64: '', productImageName: '' };
    } catch {}
    return defaults;
  });
  const [builderPrefill, setBuilderPrefill] = useState(null);
  const [libraryCreatives, setLibraryCreatives] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);

  useEffect(() => { try { localStorage.setItem('metaflow_tab', activeTab); } catch {} }, [activeTab]);

  // Verificar suscripción cuando hay usuario logueado
  useEffect(() => {
    if (!user?.email) return;
    axios.get(`/api/payments/status?email=${encodeURIComponent(user.email)}`)
      .then(r => setSubscription(r.data))
      .catch(() => setSubscription({ status: 'inactive', isActive: false }));
  }, [user?.email]);
  useEffect(() => {
    try {
      const { productImageBase64, productImageName, ...rest } = adForm;
      localStorage.setItem('metaflow_adform', JSON.stringify(rest));
    } catch {}
  }, [adForm]);

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

  useEffect(() => {
    if (activeTab === 'products') fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'library') fetchLibrary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'ad-creator') fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchRealData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/stats`, await buildConfig(metaConnection));
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
      const authHeader = await getAuthHeader();
      const response = await axios.get(`${API_BASE_URL}/api/meta/connection`, {
        headers: { ...metaRequestConfig(metaConnection).headers, ...authHeader }
      });
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
      const errData = error.response?.data;
      setConnection(errData?.ok === false ? errData : { ok: false });
    } finally {
      setConnectionLoading(false);
    }
  };

  const fetchCampaignAnalysis = async () => {
    try {
      setCampaignsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/campaign-analysis`, await buildConfig(metaConnection));
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
        buildConfig(metaConnection).then(cfg => axios.get(`${API_BASE_URL}/api/meta/assets`, cfg)).catch(() => ({ data: { pages: [], pixels: [], defaults: {} } }))
      ]);
      setObjectives(objectivesResponse.data.objectives || []);
      setBusinessAssets(assetsResponse.data || { pages: [], pixels: [], defaults: {} });
    } catch (error) {
      console.error('Error cargando objetivos:', error);
      setObjectives([]);
    }
  };

  const BATCH_SIZE = 5;
  const BATCH_COOLDOWN_SECONDS = 320;

  const createCampaign = async (payload) => {
    const allCreatives = payload.creatives || [];
    const batches = [];
    for (let i = 0; i < allCreatives.length; i += BATCH_SIZE) {
      batches.push(allCreatives.slice(i, i + BATCH_SIZE));
    }

    try {
      setBuilderLoading(true);
      setBuilderResult(null);
      setBatchUpload(null);

      const firstResponse = await axios.post(`${API_BASE_URL}/api/campaign-builder/create`, {
        ...payload,
        creatives: batches[0],
        userId: user.id
      }, await buildConfig(metaConnection));

      if (!firstResponse.data.success) {
        setBuilderResult(firstResponse.data);
        return;
      }

      if (batches.length === 1) {
        setBuilderResult(firstResponse.data);
        await fetchCampaignAnalysis();
        await fetchApprovalActions();
        setActiveTab('approval');
        return;
      }

      const { campaign_id, adset_id } = firstResponse.data.result;
      const remainingBatches = batches.slice(1);

      setBatchUpload({
        campaignId: campaign_id,
        adsetId: adset_id,
        payload: { ...payload, creatives: undefined },
        remainingBatches,
        completedBatches: 1,
        totalBatches: batches.length,
        completedAds: batches[0].length,
        totalAds: allCreatives.length,
        countdown: BATCH_COOLDOWN_SECONDS
      });
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

  const uploadNextBatch = async () => {
    if (!batchUpload || batchUpload.remainingBatches.length === 0) return;
    const { campaignId, adsetId, payload, remainingBatches, completedBatches, completedAds, totalBatches, totalAds } = batchUpload;
    const [nextBatch, ...rest] = remainingBatches;

    try {
      setBatchUpload(prev => ({ ...prev, countdown: null }));
      await axios.post(`${API_BASE_URL}/api/campaign-builder/add-ads`, {
        ...payload,
        creatives: nextBatch,
        campaignId,
        adsetId
      }, await buildConfig(metaConnection));

      const newCompleted = completedBatches + 1;
      const newCompletedAds = completedAds + nextBatch.length;

      if (rest.length === 0) {
        setBatchUpload(null);
        setBuilderResult({ success: true, message: `Campaña creada con ${totalAds} creativos` });
        await fetchCampaignAnalysis();
        await fetchApprovalActions();
        setActiveTab('approval');
      } else {
        setBatchUpload(prev => ({
          ...prev,
          remainingBatches: rest,
          completedBatches: newCompleted,
          completedAds: newCompletedAds,
          countdown: BATCH_COOLDOWN_SECONDS
        }));
      }
    } catch (error) {
      console.error('Error subiendo tanda:', error);
      setBatchUpload(prev => ({
        ...prev,
        error: error.response?.data?.error || 'Error subiendo creativos'
      }));
    }
  };

  const generateCopy = async (payload) => {
    try {
      setCopyLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/campaign-builder/generate-copy`, payload, await buildConfig(metaConnection));
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
      const authHeader = await getAuthHeader();
      const response = await axios.get(`${API_BASE_URL}/api/meta/connection`, {
        headers: { ...metaRequestConfig(nextConnection).headers, ...authHeader }
      });
      const connectedAccountId = nextConnection.adAccountId || response.data.adAccountId;
      const savedConnection = {
        ...nextConnection,
        adAccountId: connectedAccountId
      };
      setMetaConnection(savedConnection);
      saveMetaConnection(savedConnection);
      // Persist to Supabase so the connection is available on any device
      try {
        const supabase = getSupabaseBrowser();
        await supabase.auth.updateUser({ data: { metaConnection: savedConnection } });
      } catch (_) { /* non-critical */ }
      setConnection(response.data);
      await Promise.all([
        fetchRealDataWithConnection(savedConnection),
        fetchCampaignAnalysisWithConnection(savedConnection)
      ]);
      return response.data;
    } catch (error) {
      console.error('Error conectando System User:', error);
      const errData = error.response?.data;
      setConnection(errData?.ok === false ? errData : { ok: false });
      throw error;
    } finally {
      setConnectionLoading(false);
    }
  };

  const fetchRealDataWithConnection = async (connectionOverride) => {
    const response = await axios.get(`${API_BASE_URL}/api/stats`, await buildConfig(connectionOverride));
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
    const response = await axios.get(`${API_BASE_URL}/api/campaign-analysis`, await buildConfig(connectionOverride));
    setCampaignAnalysis(response.data.campaigns || []);
  };

  const fetchApprovalActions = async () => {
    try {
      setApprovalLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/approval-actions`);
      const all = response.data.actions || [];
      setNotifications(all.filter(a => a.action_suggested === 'suggest_new_campaign'));
      setApprovalActions(all.filter(a => a.action_suggested !== 'suggest_new_campaign'));
    } catch (error) {
      console.error('Error cargando aprobación:', error);
      setApprovalActions([]);
      setNotifications([]);
    } finally {
      setApprovalLoading(false);
    }
  };

  const runAutoOptimize = async () => {
    try {
      setAutoOptimizeLoading(true);
      await axios.post(`${API_BASE_URL}/api/auto-optimize`, { userId: user?.id }, await buildConfig(metaConnection));
      await fetchApprovalActions();
    } catch (error) {
      console.error('Error en auto-optimización:', error);
    } finally {
      setAutoOptimizeLoading(false);
    }
  };

  const dismissNotification = async (actionId) => {
    try {
      await axios.post(`${API_BASE_URL}/api/approval-actions/${actionId}/reject`);
      await fetchApprovalActions();
    } catch (error) {
      console.error('Error descartando notificación:', error);
    }
  };

  const publishApprovalAction = async (actionId) => {
    try {
      setApprovalLoading(true);
      await axios.post(`${API_BASE_URL}/api/approval-actions/${actionId}/publish`, {}, await buildConfig(metaConnection));
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
      const response = await axios.get(`${API_BASE_URL}/api/campaigns/${campaign.campaign_id}/detail`, await buildConfig(metaConnection));
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
      const authHeader = await getAuthHeader();
      const response = await axios.get(`${API_BASE_URL}/api/ai/analyze`, {
        headers: { ...metaRequestConfig(metaConnection).headers, ...authHeader }
      });
      setAnalysisText(response.data.analysis);
      setChatMessages([]);
    } catch (error) {
      if (error.response?.status === 402) {
        setAnalysisError('NO_CREDITS');
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
      const authHeader = await getAuthHeader();
      const response = await axios.post(
        `${API_BASE_URL}/api/ai/chat`,
        { messages: nextMessages },
        { headers: { ...metaRequestConfig(metaConnection).headers, ...authHeader } }
      );
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
      const response = await axios.get(`${API_BASE_URL}/api/adsets/${adset.adset_id}/detail`, await buildConfig(metaConnection));
      setAdSetDetail(response.data);
    } catch (error) {
      console.error('Error cargando detalle del conjunto de anuncios:', error);
    } finally {
      setAdSetDetailLoading(false);
    }
  };

  const isAdmin = user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/products`);
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  const saveProduct = async (productData) => {
    try {
      setProductsLoading(true);
      if (editingProduct) {
        await axios.put(`${API_BASE_URL}/api/products/${editingProduct.id}`, { ...productData, userEmail: user?.email });
      } else {
        await axios.post(`${API_BASE_URL}/api/products`, { ...productData, userEmail: user?.email });
      }
      setShowProductForm(false);
      setEditingProduct(null);
      await fetchProducts();
    } catch (error) {
      console.error('Error guardando producto:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/products/${id}?userEmail=${encodeURIComponent(user?.email || '')}`);
      await fetchProducts();
    } catch (error) {
      console.error('Error eliminando producto:', error);
    }
  };

  const generateAdImage = async (formData) => {
    try {
      setImageGenLoading(true);
      setGeneratedImages([]);
      const authHeader = await getAuthHeader();
      const response = await axios.post(`${API_BASE_URL}/api/generate-image`, formData, { headers: authHeader, timeout: 300000 });
      setGeneratedImages(response.data.images || []);
    } catch (error) {
      alert(error.response?.data?.error || 'Error generando imágenes');
    } finally {
      setImageGenLoading(false);
    }
  };

  const adjustImage = async (img, note) => {
    const authHeader = await getAuthHeader();
    const response = await axios.post(`${API_BASE_URL}/api/generate-image`, {
      productName: adForm.productName,
      description: adForm.description,
      format: adForm.format,
      angles: [img.angle],
      primaryColor: adForm.primaryColor,
      productImageBase64: adForm.productImageBase64 || undefined,
      adjustmentInstruction: note,
      variationsCount: 1,
      fullDesign: !!adForm.fullDesign,
      existingCopy: img.copy,
    }, { headers: authHeader, timeout: 300000 });
    const updated = response.data.images?.[0];
    if (updated) {
      const updatedWithVariation = { ...updated, variation: img.variation ?? 0 };
      setGeneratedImages(prev => prev.map(i =>
        i.angle === img.angle && (i.variation ?? 0) === (img.variation ?? 0) ? updatedWithVariation : i
      ));
    }
  };

  const launchInBuilder = (img) => {
    setBuilderPrefill({
      headline: img.copy?.headline || '',
      primaryText: img.copy?.primaryText || '',
      description: img.copy?.description || '',
      creative: {
        name: `creativo-${img.angle}-v${(img.variation ?? 0) + 1}.jpg`,
        type: 'image/jpeg',
        size: 0,
        dataUrl: img.imageUrl,
      },
    });
    setActiveTab('builder');
  };

  const fetchLibrary = async () => {
    if (!user?.email) return;
    try {
      setLibraryLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/creatives?userEmail=${encodeURIComponent(user.email)}`);
      setLibraryCreatives(res.data.creatives || []);
    } catch (e) {
      console.error('Error cargando biblioteca:', e);
    } finally {
      setLibraryLoading(false);
    }
  };

  const saveCreative = async (img) => {
    if (!user?.email) return;
    await axios.post(`${API_BASE_URL}/api/creatives`, {
      userEmail: user.email,
      angle: img.angle,
      label: img.label,
      imageBase64: img.imageUrl,
      headline: img.copy?.headline,
      primaryText: img.copy?.primaryText,
      description: img.copy?.description,
      cta: img.copy?.cta,
      productName: adForm.productName || '',
    });
  };

  const deleteCreative = async (id) => {
    if (!confirm('¿Eliminar este creativo de la biblioteca?')) return;
    await axios.delete(`${API_BASE_URL}/api/creatives/${id}`);
    setLibraryCreatives(prev => prev.filter(c => c.id !== id));
  };

  const logout = async () => {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    localStorage.removeItem('metaflow_user');
    setUser(null);
  };

  if (!user) {
    const initialMode = isBrowser && window.location.search.includes('signup=1') ? 'register' : 'login';
    return <AuthView onAuth={setUser} initialMode={initialMode} />;
  }

  // Suscripción: null = verificando, objeto = verificado
  if (subscription === null) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at 18% 8%, rgba(59,130,246,0.22), transparent 28%), radial-gradient(circle at 84% 12%, rgba(168,85,247,0.18), transparent 24%), #030509', gap: 24 }}>
        <style>{`
          @keyframes mf-pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.7), 0 0 26px rgba(99,102,241,0.52), inset 0 0 12px rgba(255,255,255,0.24); transform: scale(1); }
            50% { box-shadow: 0 0 0 12px rgba(99,102,241,0), 0 0 40px rgba(99,102,241,0.7), inset 0 0 12px rgba(255,255,255,0.24); transform: scale(1.08); }
          }
          @keyframes mf-fade {
            0%, 100% { opacity: 0.5; } 50% { opacity: 1; }
          }
        `}</style>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 48, height: 48, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#2563eb,#7c3aed 58%,#ef4444)', borderRadius: 14, animation: 'mf-pulse 1.8s ease-in-out infinite' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>MetaFlow.AI</span>
        </div>
        <span style={{ fontSize: 13, color: '#475569', animation: 'mf-fade 1.8s ease-in-out infinite' }}>Cargando tu cuenta…</span>
      </div>
    );
  }

  if (!subscription.isActive) {
    if (isBrowser) window.location.href = '/pricing';
    return null;
  }

  return (
    <div className="app-shell">
      {subscription?.gracePeriod && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, background: 'linear-gradient(90deg,#b45309,#92400e)', color: '#fef3c7', fontSize: 13, fontWeight: 600, textAlign: 'center', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          ⚠️ Tu suscripción venció — tienes {subscription.daysLeft} día{subscription.daysLeft !== 1 ? 's' : ''} de gracia.{' '}
          <a href="/pricing" style={{ color: '#fef3c7', textDecoration: 'underline' }}>Renovar ahora</a>
        </div>
      )}
      <aside className="sidebar" style={subscription?.gracePeriod ? { marginTop: 40 } : {}}>
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
            active={activeTab === 'products'}
            icon={<ShoppingBag size={20} />}
            label="Productos"
            onClick={() => setActiveTab('products')}
          />
          <NavItem
            active={activeTab === 'ad-creator'}
            icon={<Wand2 size={20} />}
            label="Crear Imagen IA"
            onClick={() => setActiveTab('ad-creator')}
          />
          <NavItem
            active={activeTab === 'library'}
            icon={<BookMarked size={20} />}
            label="Biblioteca"
            onClick={() => setActiveTab('library')}
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
            user={user}
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
            batchUpload={batchUpload}
            onBatchReady={uploadNextBatch}
            onBatchTick={(seconds) => setBatchUpload(prev => prev ? { ...prev, countdown: seconds } : null)}
            onCreate={createCampaign}
            onGenerateCopy={generateCopy}
            prefill={builderPrefill}
            onPrefillApplied={() => setBuilderPrefill(null)}
            onGoToCreator={() => setActiveTab('ad-creator')}
          />
        )}
        {activeTab === 'approval' && (
          <ApprovalView
            actions={approvalActions}
            notifications={notifications}
            loading={approvalLoading}
            autoOptimizeLoading={autoOptimizeLoading}
            onRefresh={fetchApprovalActions}
            onPublish={publishApprovalAction}
            onReject={rejectApprovalAction}
            onAutoOptimize={runAutoOptimize}
            onDismissNotification={dismissNotification}
            onCreateSimilar={(actionId) => { dismissNotification(actionId); setActiveTab('builder'); }}
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
        {activeTab === 'products' && (
          <ProductsView
            products={products}
            loading={productsLoading}
            showForm={showProductForm}
            editingProduct={editingProduct}
            isAdmin={isAdmin}
            onNew={() => { setEditingProduct(null); setShowProductForm(true); }}
            onEdit={(p) => { setEditingProduct(p); setShowProductForm(true); }}
            onDelete={deleteProduct}
            onSave={saveProduct}
            onCancelForm={() => { setShowProductForm(false); setEditingProduct(null); }}
          />
        )}
        {activeTab === 'ad-creator' && (
          <AdCreatorView
            products={products}
            loading={imageGenLoading}
            generatedImages={generatedImages}
            adForm={adForm}
            onFormChange={(f) => setAdForm(f)}
            onGenerate={generateAdImage}
            onClearImages={() => setGeneratedImages([])}
            onLaunchInBuilder={launchInBuilder}
            onSaveCreative={saveCreative}
            onAdjustImage={adjustImage}
          />
        )}
        {activeTab === 'library' && (
          <LibraryView
            creatives={libraryCreatives}
            loading={libraryLoading}
            onDelete={deleteCreative}
            onLaunch={launchInBuilder}
            onRefresh={fetchLibrary}
          />
        )}
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

function AuthView({ onAuth, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = getSupabaseBrowser();

    try {
      if (mode === 'register') {
        setError('El registro está temporalmente cerrado. Contáctanos para obtener acceso.');
        return;
        const { data, error: err } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { name: form.name || form.email.split('@')[0] } }
        });
        if (err) { setError(err.message); return; }

        // If session is null, Supabase requires email confirmation
        if (!data.session) {
          setConfirmEmail(form.email);
          return;
        }

        // Email confirmation disabled — log in directly
        const u = data.user;
        const nextUser = { id: u.id, name: u.user_metadata?.name || form.email.split('@')[0], email: u.email };
        localStorage.setItem('metaflow_user', JSON.stringify(nextUser));
        onAuth(nextUser);
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (err) {
          if (err.message === 'Invalid login credentials') setError('Email o contraseña incorrectos');
          else if (err.message.includes('Email not confirmed')) setError('Debes confirmar tu email antes de ingresar. Revisa tu bandeja de entrada.');
          else setError(err.message);
          return;
        }
        const u = data.user;
        const nextUser = { id: u.id, name: u.user_metadata?.name || u.email.split('@')[0], email: u.email };
        localStorage.setItem('metaflow_user', JSON.stringify(nextUser));
        // Restore Meta connection from Supabase if not in localStorage (e.g. different device)
        const savedConn = u.user_metadata?.metaConnection;
        if (savedConn?.accessToken && !localStorage.getItem('metaflow_meta_connection')) {
          localStorage.setItem('metaflow_meta_connection', JSON.stringify(savedConn));
        }
        onAuth(nextUser);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Email confirmation screen ──
  if (confirmEmail) {
    return (
      <main className="auth-shell">
        <div className="auth-bg-glow" />
        <div className="auth-card-new" style={{ textAlign: 'center' }}>
          <div className="auth-logo" style={{ justifyContent: 'center' }}>
            <div className="brand-mark"><Zap size={18} /></div>
            <span>MetaFlow.AI</span>
          </div>
          <div style={{ fontSize: 52, margin: '8px 0' }}>📬</div>
          <div className="auth-header">
            <h1>Revisa tu correo</h1>
            <p>Te enviamos un enlace de confirmación a:</p>
            <p style={{ color: '#a78bfa', fontWeight: 700, marginTop: 6 }}>{confirmEmail}</p>
          </div>
          <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
            Haz clic en el enlace del email para activar tu cuenta. Puede tardar unos minutos — revisa también la carpeta de spam.
          </p>
          <button
            className="auth-submit"
            style={{ marginTop: 4 }}
            onClick={() => { setConfirmEmail(''); setMode('login'); setForm(f => ({ ...f, password: '' })); }}
          >
            Ir a iniciar sesión
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-shell">
      <div className="auth-bg-glow" />
      <form className="auth-card-new" onSubmit={handleSubmit}>
        <div className="auth-logo">
          <div className="brand-mark"><Zap size={18} /></div>
          <span>MetaFlow.AI</span>
        </div>

        <div className="auth-header">
          <h1>{mode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta gratis'}</h1>
          <p>{mode === 'login' ? 'Ingresa para gestionar tus Meta Ads con IA.' : 'Empieza a optimizar tus anuncios con inteligencia artificial.'}</p>
        </div>

        <div className="auth-mode-tabs">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); }}>Iniciar sesión</button>
        </div>

        <div className="auth-fields">
          {mode === 'register' && (
            <div className="auth-field">
              <label>Nombre</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Tu nombre completo" autoComplete="name" />
            </div>
          )}
          <div className="auth-field">
            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="tu@email.com" required autoComplete="email" />
          </div>
          <div className="auth-field">
            <label>Contraseña</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Mínimo 6 caracteres" required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={6} />
          </div>
        </div>

        {error && <div className="auth-error"><XCircle size={14} />{error}</div>}

        <button className="auth-submit" type="submit" disabled={loading}>
          {loading ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
          {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>

        <p className="auth-footer-text">
          ¿Quieres acceso? Contáctanos para más información.
        </p>
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
const ACTION_LABEL = {
  ...Object.fromEntries(RULE_ACTIONS.map(a => [a.value, a.label])),
  scale_budget_auto:    'Presupuesto escalado (+25%)',
  suggest_new_campaign: 'Oportunidad detectada'
};

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

function CampaignBuilderView({ assets, copyLoading, objectives, loading, result, batchUpload, onBatchReady, onBatchTick, onCreate, onGenerateCopy, prefill, onPrefillApplied, onGoToCreator }) {
  const isValidUrl = (urlString) => {
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (!batchUpload || batchUpload.countdown === null || batchUpload.countdown <= 0) {
      if (batchUpload && batchUpload.countdown === 0) onBatchReady();
      return;
    }
    const timer = setTimeout(() => onBatchTick(batchUpload.countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [batchUpload?.countdown]);

  useEffect(() => {
    if (!prefill) return;
    setForm(current => ({
      ...current,
      headline: prefill.headline || current.headline,
      primaryText: prefill.primaryText || current.primaryText,
      description: prefill.description || current.description,
    }));
    if (prefill.creative) {
      setCreatives([prefill.creative]);
      setStep(3);
    }
    onPrefillApplied?.();
  }, [prefill]);

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
    pixelId: '',
    businessContext: '',
    primaryText: '',
    headline: '',
    description: ''
  });
  const [creatives, setCreatives] = useState([]);
  const [step, setStep] = useState(1);
  
  const [showPageDropdown, setShowPageDropdown] = useState(false);
  const [showPixelDropdown, setShowPixelDropdown] = useState(false);
  const [showWhatsappDropdown, setShowWhatsappDropdown] = useState(false);

  const handlePageSelect = (page) => {
    setForm(current => ({
      ...current,
      pageId: page.id,
      pageName: page.name,
      instagramAccountId: page.instagram?.id || '',
      instagramName: page.instagram?.username || '',
      whatsappNumber: page.whatsappNumber || current.whatsappNumber || ''
    }));
  };

  const selectedObjective = objectives.find(objective => objective.value === form.objective);
  const selectedPage = assets.pages?.find(page => page.id === form.pageId);
  const needsUrl = selectedObjective?.requires?.includes('META_DESTINATION_URL');
  const pixelRequired = selectedObjective?.requires?.includes('META_PIXEL_ID');
  const needsPixel = true;
  const needsWhatsapp = form.objective === 'OUTCOME_SALES';
  const whatsappOptions = [
    ...(assets.whatsappNumbers || []),
    ...(assets.pages || [])
      .filter(page => page.whatsappNumber)
      .map(page => ({ id: page.id, display_phone_number: page.whatsappNumber, verified_name: page.name }))
  ];

  useEffect(() => {
    const defaults = assets.defaults || {};
    const pixels = assets.pixels || [];

    setForm(current => ({
      ...current,
      pageId: current.pageId || defaults.pageId || '',
      instagramAccountId: current.instagramAccountId || defaults.instagramAccountId || '',
      destinationUrl: current.destinationUrl || defaults.destinationUrl || '',
      whatsappNumber: current.whatsappNumber || defaults.whatsappNumber || '',
      pixelId: current.pixelId || (pixels.length === 1 ? pixels[0].id : ''),
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
    try {
      const files = Array.from(event.target.files || []);
      const encodedFiles = await Promise.all(files.map(readFileAsDataUrl));
      setCreatives(encodedFiles);
    } catch (err) {
      console.error('Error al procesar archivos:', err);
      alert(err.message || 'Error al procesar los archivos. Por favor, asegúrate de que no superen los límites permitidos.');
    }
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    try {
      const files = Array.from(event.dataTransfer.files || []);
      const encodedFiles = await Promise.all(files.map(readFileAsDataUrl));
      setCreatives(encodedFiles);
    } catch (err) {
      console.error('Error al procesar archivos arrastrados:', err);
      alert(err.message || 'Error al procesar los archivos. Por favor, asegúrate de que no superen los límites permitidos.');
    }
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
    try {
      // Evitamos enviar los strings base64 pesados (dataUrl) que superan los límites de tamaño
      // de Next.js (413 Payload Too Large). Solo necesitamos los nombres y tipos de creativos.
      const sanitizedCreatives = (creatives || []).map(c => ({
        name: c.name,
        type: c.type,
        size: c.size
      }));

      const copy = await onGenerateCopy({
        ...form,
        creatives: sanitizedCreatives
      });

      setForm(current => ({
        ...current,
        primaryText: copy.primaryText,
        headline: copy.headline,
        description: copy.description,
        policyNotes: copy.policyNotes || []
      }));
    } catch (err) {
      console.error('Error al generar copy con IA:', err);
      alert(err.response?.data?.error || err.message || 'Error al conectar con el servidor para generar el copy. Por favor, intenta de nuevo.');
    }
  };

  if (batchUpload) {
    const { completedAds, totalAds, completedBatches, totalBatches, countdown, error } = batchUpload;
    const pct = Math.round((completedAds / totalAds) * 100);
    const mins = Math.floor((countdown || 0) / 60);
    const secs = String((countdown || 0) % 60).padStart(2, '0');
    return (
      <section className="card builder-panel" style={{ textAlign: 'center', padding: '48px 32px' }}>
        <Zap size={36} style={{ color: '#6366f1', marginBottom: '16px' }} />
        <h2>Subiendo creativos por tandas</h2>
        <p className="muted-copy" style={{ marginBottom: '24px' }}>
          Tanda {completedBatches} de {totalBatches} completada — {completedAds} de {totalAds} creativos subidos
        </p>
        <div style={{ background: '#e5e7eb', borderRadius: '999px', height: '8px', margin: '0 auto 24px', maxWidth: '400px' }}>
          <div style={{ background: '#6366f1', borderRadius: '999px', height: '8px', width: `${pct}%`, transition: 'width 0.5s' }} />
        </div>
        {error ? (
          <p style={{ color: '#ef4444' }}>{error}</p>
        ) : countdown > 0 ? (
          <>
            <p style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '2px', margin: '0 0 8px' }}>{mins}:{secs}</p>
            <p className="muted-copy">Esperando para no superar los límites de Meta Ads</p>
          </>
        ) : (
          <p className="muted-copy"><FuturisticLoader small /> Subiendo siguiente tanda...</p>
        )}
      </section>
    );
  }

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
            {creatives.length === 0 && (
              <div className="no-creatives-banner">
                <span className="no-creatives-text">¿No tienes imágenes? Créalas con IA en segundos</span>
                <button type="button" className="no-creatives-btn" onClick={onGoToCreator}>
                  Ir al Creador de Imágenes →
                </button>
              </div>
            )}
            <label className="upload-zone" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
              <Upload size={26} />
              <span>Arrastra o sube tus creativos</span>
              <small>Imágenes JPG/PNG o videos MP4/MOV. La app creará un anuncio por creativo y subirá en tandas de 5.</small>
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
            <style>{`
              @keyframes mf-pulse-green {
                0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); }
                70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
                100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
              }
            `}</style>
            <div className="builder-grid" style={{ marginBottom: '20px' }}>
              <label style={{ position: 'relative' }}>
                Fan Page
                <div 
                  onClick={() => setShowPageDropdown(!showPageDropdown)} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    minHeight: '48px',
                    transition: 'all 0.2s',
                    boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.2)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.6)'; e.currentTarget.style.boxShadow = '0 0 10px rgba(99, 102, 241, 0.15)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.25)'; e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0, 0, 0, 0.2)'; }}
                >
                  {selectedPage ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {selectedPage.picture ? (
                        <img 
                          src={selectedPage.picture} 
                          alt={selectedPage.name} 
                          style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} 
                        />
                      ) : (
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #1877f2, #0d59c6)', display: 'grid', placeItems: 'center', fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>
                          {selectedPage.name.substring(0,2).toUpperCase()}
                        </div>
                      )}
                      <span style={{ fontWeight: '600', color: '#f8fafc' }}>{selectedPage.name}</span>
                    </div>
                  ) : (
                    <span style={{ color: '#64748b' }}>Selecciona una Fan Page</span>
                  )}
                  <span style={{ color: '#64748b', fontSize: '12px' }}>▼</span>
                </div>
                
                {showPageDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '6px',
                    background: '#0f172a',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.5)',
                    zIndex: 999,
                    maxHeight: '250px',
                    overflowY: 'auto',
                    padding: '6px'
                  }}>
                    {assets.pages?.length > 0 ? (
                      assets.pages.map((page) => (
                        <div
                          key={page.id}
                          onClick={() => {
                            handlePageSelect(page);
                            setShowPageDropdown(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          {page.picture ? (
                            <img 
                              src={page.picture} 
                              alt={page.name} 
                              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} 
                            />
                          ) : (
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #1877f2, #0d59c6)', display: 'grid', placeItems: 'center', fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>
                              {page.name.substring(0,2).toUpperCase()}
                            </div>
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: '500', color: '#f8fafc', fontSize: '14px' }}>{page.name}</span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>ID: {page.id}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '16px', textAlignment: 'center', color: '#64748b' }}>No se encontraron Fan Pages</div>
                    )}
                  </div>
                )}
              </label>
              <label>
                Instagram
                {selectedPage?.instagram ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'linear-gradient(135deg, rgba(225, 48, 108, 0.08), rgba(225, 48, 108, 0.02))',
                    border: '1px solid rgba(225, 48, 108, 0.25)',
                    borderRadius: '12px',
                    minHeight: '48px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {selectedPage.instagram.profilePictureUrl ? (
                        <img 
                          src={selectedPage.instagram.profilePictureUrl} 
                          alt={selectedPage.instagram.username} 
                          style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(225,48,108,0.3)' }} 
                        />
                      ) : (
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', display: 'grid', placeItems: 'center', fontSize: '11px', fontWeight: 'bold', color: '#fff' }}>
                          IG
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '600', color: '#f8fafc', fontSize: '14px' }}>@{selectedPage.instagram.username}</span>
                        <span style={{ fontSize: '10px', color: '#e1306c', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#e1306c' }}></span>
                          Presencia de Instagram vinculada
                        </span>
                      </div>
                    </div>
                    <div style={{
                      background: 'rgba(225, 48, 108, 0.15)',
                      color: '#e1306c',
                      padding: '4px 8px',
                      borderRadius: '20px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      letterSpacing: '0.5px'
                    }}>
                      CONECTADO
                    </div>
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 14px',
                    background: 'rgba(15, 23, 42, 0.4)',
                    border: '1px dashed rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    minHeight: '48px',
                  }}>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>
                      {selectedPage ? 'Sin cuenta de Instagram (usará la presencia de la Fan Page)' : 'Selecciona una Fan Page primero'}
                    </span>
                  </div>
                )}
              </label>
            </div>
            {needsPixel && (
              <label style={{ position: 'relative', display: 'block', marginBottom: '20px' }}>
                Pixel de Meta{!pixelRequired && <span style={{ fontWeight: 400, color: '#64748b', marginLeft: 6 }}>(opcional)</span>}
                {assets.pixels?.length > 0 ? (
                  <>
                    <div 
                      onClick={() => setShowPixelDropdown(!showPixelDropdown)} 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(99, 102, 241, 0.25)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        minHeight: '48px',
                        transition: 'all 0.2s',
                        boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.2)',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.6)'; e.currentTarget.style.boxShadow = '0 0 10px rgba(99, 102, 241, 0.15)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.25)'; e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0, 0, 0, 0.2)'; }}
                    >
                      {form.pixelId ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', animation: 'mf-pulse-green 1.5s infinite' }}></span>
                          <span style={{ fontWeight: '600', color: '#f8fafc' }}>
                            {assets.pixels.find(p => p.id === form.pixelId)?.name || form.pixelId}
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>({form.pixelId})</span>
                        </div>
                      ) : (
                        <span style={{ color: '#64748b' }}>Selecciona un Pixel de Meta</span>
                      )}
                      <span style={{ color: '#64748b', fontSize: '12px' }}>▼</span>
                    </div>

                    {showPixelDropdown && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '6px',
                        background: '#0f172a',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.5)',
                        zIndex: 999,
                        maxHeight: '200px',
                        overflowY: 'auto',
                        padding: '6px'
                      }}>
                        <div
                          onClick={() => {
                            setForm(c => ({ ...c, pixelId: '' }));
                            setShowPixelDropdown(false);
                          }}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: '#64748b',
                            fontSize: '14px',
                            transition: 'background 0.2s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          Ninguno / Omitir
                        </div>
                        {assets.pixels.map((pixel) => (
                          <div
                            key={pixel.id}
                            onClick={() => {
                              setForm(c => ({ ...c, pixelId: pixel.id }));
                              setShowPixelDropdown(false);
                            }}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'background 0.2s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <span style={{ fontWeight: '500', color: '#f8fafc', fontSize: '14px' }}>{pixel.name}</span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>ID: {pixel.id} {pixel.lastFired ? `· Activo el ${new Date(pixel.lastFired).toLocaleDateString()}` : ''}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <input name="pixelId" value={form.pixelId} onChange={handleChange} placeholder="ID del Pixel de Meta" />
                )}
              </label>
            )}
            {needsUrl && (
              <label style={{ display: 'block', marginBottom: '20px' }}>
                URL destino
                <input 
                  name="destinationUrl" 
                  value={form.destinationUrl} 
                  onChange={handleChange} 
                  placeholder="https://..." 
                  style={{
                    borderColor: form.destinationUrl && !isValidUrl(form.destinationUrl) ? 'rgba(239, 68, 68, 0.6)' : 'rgba(99, 102, 241, 0.25)',
                    boxShadow: form.destinationUrl && !isValidUrl(form.destinationUrl) ? '0 0 0 1px rgba(239, 68, 68, 0.6)' : 'none'
                  }}
                />
                {form.destinationUrl && !isValidUrl(form.destinationUrl) && (
                  <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px', display: 'block', fontWeight: '500' }}>
                    ⚠️ Ingresa una URL válida (ej: https://antojitoscol.com/gotas-plant-pwr)
                  </span>
                )}
              </label>
            )}
            {needsWhatsapp && (
              <label style={{ position: 'relative', display: 'block', marginBottom: '20px' }}>
                WhatsApp
                {whatsappOptions.length > 0 ? (
                  <>
                    <div 
                      onClick={() => setShowWhatsappDropdown(!showWhatsappDropdown)} 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: 'linear-gradient(135deg, rgba(37, 211, 102, 0.08), rgba(37, 211, 102, 0.02))',
                        border: '1px solid rgba(37, 211, 102, 0.25)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        minHeight: '48px',
                        transition: 'all 0.2s',
                        boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.2)',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(37, 211, 102, 0.6)'; e.currentTarget.style.boxShadow = '0 0 10px rgba(37, 211, 102, 0.15)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(37, 211, 102, 0.25)'; e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0, 0, 0, 0.2)'; }}
                    >
                      {form.whatsappNumber ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="#25D366" style={{ filter: 'drop-shadow(0 0 3px rgba(37,211,102,0.4))' }}>
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.455L0 24zm6.59-4.846c1.6.95 3.18 1.449 4.825 1.451 5.436 0 9.858-4.42 9.862-9.864.002-2.637-1.017-5.114-2.87-6.97C16.51 1.916 14.032.894 11.4.894c-5.44 0-9.866 4.418-9.87 9.865-.001 1.702.463 3.362 1.34 4.8l-.927 3.385 3.475-.91c1.554.848 3.125 1.299 4.632 1.299zm11.233-7.6c-.3-.149-1.772-.874-2.046-.973-.274-.1-.474-.149-.674.15-.2.299-.773.973-.948 1.172-.175.199-.35.224-.65.075-.3-.15-1.265-.466-2.41-1.487-.893-.796-1.496-1.78-1.67-2.08-.175-.299-.019-.461.13-.61.135-.133.3-.349.45-.523.15-.174.2-.299.3-.499.1-.2.05-.374-.025-.524-.075-.15-.674-1.623-.924-2.223-.244-.589-.493-.51-.674-.519-.174-.009-.374-.01-.574-.01s-.524.075-.798.374c-.274.299-1.047 1.022-1.047 2.492 0 1.47 1.072 2.89 1.222 3.09.15.199 2.11 3.22 5.11 4.516.714.308 1.272.492 1.707.63.717.228 1.368.196 1.883.118.574-.087 1.772-.723 2.022-1.42.25-.697.25-1.294.175-1.42-.075-.125-.275-.199-.575-.349z" />
                          </svg>
                          <span style={{ fontWeight: '600', color: '#f8fafc' }}>
                            {whatsappOptions.find(phone => phone.display_phone_number === form.whatsappNumber)?.verified_name || 'WhatsApp Conectado'}
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>({form.whatsappNumber})</span>
                        </div>
                      ) : (
                        <span style={{ color: '#64748b' }}>Selecciona WhatsApp</span>
                      )}
                      <span style={{ color: '#64748b', fontSize: '12px' }}>▼</span>
                    </div>

                    {showWhatsappDropdown && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '6px',
                        background: '#0f172a',
                        border: '1px solid rgba(37, 211, 102, 0.3)',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.5)',
                        zIndex: 999,
                        maxHeight: '200px',
                        overflowY: 'auto',
                        padding: '6px'
                      }}>
                        {whatsappOptions.map((phone) => (
                          <div
                            key={`${phone.id}-${phone.display_phone_number}`}
                            onClick={() => {
                              setForm(c => ({ ...c, whatsappNumber: phone.display_phone_number }));
                              setShowWhatsappDropdown(false);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'background 0.2s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(37, 211, 102, 0.15)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="#25D366">
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.455L0 24zm6.59-4.846c1.6.95 3.18 1.449 4.825 1.451 5.436 0 9.858-4.42 9.862-9.864.002-2.637-1.017-5.114-2.87-6.97C16.51 1.916 14.032.894 11.4.894c-5.44 0-9.866 4.418-9.87 9.865-.001 1.702.463 3.362 1.34 4.8l-.927 3.385 3.475-.91c1.554.848 3.125 1.299 4.632 1.299zm11.233-7.6c-.3-.149-1.772-.874-2.046-.973-.274-.1-.474-.149-.674.15-.2.299-.773.973-.948 1.172-.175.199-.35.224-.65.075-.3-.15-1.265-.466-2.41-1.487-.893-.796-1.496-1.78-1.67-2.08-.175-.299-.019-.461.13-.61.135-.133.3-.349.45-.523.15-.174.2-.299.3-.499.1-.2.05-.374-.025-.524-.075-.15-.674-1.623-.924-2.223-.244-.589-.493-.51-.674-.519-.174-.009-.374-.01-.574-.01s-.524.075-.798.374c-.274.299-1.047 1.022-1.047 2.492 0 1.47 1.072 2.89 1.222 3.09.15.199 2.11 3.22 5.11 4.516.714.308 1.272.492 1.707.63.717.228 1.368.196 1.883.118.574-.087 1.772-.723 2.022-1.42.25-.697.25-1.294.175-1.42-.075-.125-.275-.199-.575-.349z" />
                            </svg>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: '500', color: '#f8fafc', fontSize: '14px' }}>{phone.verified_name || phone.display_phone_number}</span>
                              <span style={{ fontSize: '11px', color: '#64748b' }}>Número: {phone.display_phone_number}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <input name="whatsappNumber" value={form.whatsappNumber} onChange={handleChange} placeholder="573001234567" />
                )}
              </label>
            )}
            <div className="builder-grid" style={{ marginBottom: '20px' }}>
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
              <button 
                className="primary-button" 
                type="button" 
                disabled={!form.primaryText || !form.headline || (needsUrl && !isValidUrl(form.destinationUrl))} 
                onClick={() => setStep(4)}
              >
                Revisar
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="wizard-pane">
            <div className="review-panel">
              <span className="badge">{selectedObjective?.label || ''}</span>
              <h3>{form.headline || ''}</h3>
              <p>{form.primaryText || ''}</p>
              <small>{form.description || ''}</small>
            </div>
            {Array.isArray(form.policyNotes) && form.policyNotes.length > 0 && (
              <div className="policy-notes">
                {form.policyNotes.map((note, index) => (
                  <span key={index}>
                    {typeof note === 'object' ? JSON.stringify(note) : String(note || '')}
                  </span>
                ))}
              </div>
            )}
            {result && (
              <div className={`status-box ${result.success ? '' : 'status-error'}`}>
                {result.success 
                  ? `Campaña lista para aprobación: ${result.result?.campaign_id || ''}` 
                  : (typeof result.error === 'object' ? (result.error.message || JSON.stringify(result.error)) : String(result.error || ''))}
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
          <span className={`status-pill ${ad.effective_status || ad.status || ''}`}>{ad.effective_status || ad.status}</span>
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
            <span className={`badge ${campaign.effective_status || campaign.status || ''}`}>{campaign.effective_status || campaign.status || 'Sin estado'}</span>
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
                      <span className={`status-pill ${adset.effective_status || adset.status || ''}`}>{adset.effective_status || adset.status}</span>
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
              <span className={`badge ${selectedAdSet.effective_status || selectedAdSet.status || ''}`}>{selectedAdSet.effective_status || selectedAdSet.status || 'Sin estado'}</span>
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

const PLAN_ACCOUNT_LIMITS = { pro: 1, business: 3, agency: 10 };
const SWITCH_COOLDOWN_DAYS = 30;

function SettingsView({ connection, metaConnection, loading, onConnect, onRefresh, user }) {
  const [draft, setDraft] = useState(metaConnection || { accessToken: '', adAccountId: '' });
  const [showToken, setShowToken] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(null);
  const [accountError, setAccountError] = useState('');

  const loadAccounts = async () => {
    setAccountsLoading(true);
    try {
      const authHeader = await getAuthHeader();
      const { data } = await axios.get('/api/meta/my-accounts', { headers: authHeader });
      setAccounts(data.accounts || []);
    } catch {
      // silent — user may not have accounts yet
    } finally {
      setAccountsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) loadAccounts();
  }, [user?.email, connection?.ok]);

  const handleToggle = async (adAccountId, currentlyActive) => {
    setToggleLoading(adAccountId);
    setAccountError('');
    try {
      const authHeader = await getAuthHeader();
      await axios.post('/api/meta/activate-account',
        { adAccountId, activate: !currentlyActive },
        { headers: authHeader }
      );
      await loadAccounts();
    } catch (err) {
      setAccountError(err.response?.data?.error || 'Error al cambiar cuenta');
    } finally {
      setToggleLoading(null);
    }
  };

  const handleChange = (event) => {
    setDraft(current => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onConnect(draft);
  };

  const userPlan = accounts[0]?.plan || 'pro';
  const accountLimit = PLAN_ACCOUNT_LIMITS[userPlan] ?? 1;
  const activeCount = accounts.filter(a => a.is_active).length;

  const cooldownDaysLeft = (account) => {
    if (!account.last_switched_at || userPlan !== 'pro') return 0;
    const daysSince = (Date.now() - new Date(account.last_switched_at).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince < SWITCH_COOLDOWN_DAYS ? Math.ceil(SWITCH_COOLDOWN_DAYS - daysSince) : 0;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '560px' }}>
      <form className="card narrow-panel token-panel" onSubmit={handleSubmit}>
        <h2>Conecta tu System User</h2>
        <p className="muted-copy">Pega el token generado en Business Manager. La app cargará las cuentas, Fan Pages, Instagram y WhatsApp permitidos.</p>
        <div className={`status-box ${connection?.ok === false ? 'status-error' : ''}`}>
          {loading && <><FuturisticLoader small /> Validando conexión con Meta Ads...</>}
          {!loading && connection?.ok && `Conectado por System User a ${connection.account?.name || connection.adAccountId}.`}
          {!loading && connection?.ok === false && (connection?.detail ? `Error: ${connection.detail}` : 'No se pudo validar la conexión con Meta Ads.')}
          {!loading && !connection && 'Aún no hay una conexión validada.'}
        </div>
        <label>
          System User Access Token
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              name="accessToken"
              type={showToken ? 'text' : 'password'}
              value={draft.accessToken || ''}
              onChange={handleChange}
              placeholder="EAAB..."
              style={{ flex: 1, paddingRight: '2.5rem' }}
            />
            <button
              type="button"
              onClick={() => setShowToken(v => !v)}
              style={{ position: 'absolute', right: '0.6rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted, #aaa)', fontSize: '1rem', padding: '0.2rem' }}
              title={showToken ? 'Ocultar token' : 'Mostrar token'}
            >
              {showToken ? '🙈' : '👁️'}
            </button>
          </div>
        </label>
        <label>
          Ad Account ID
          <input name="adAccountId" value={draft.adAccountId || ''} onChange={handleChange} placeholder="act_123456789 o vacío para detectar" />
        </label>
        {connection?.ok && (
          <div className="connection-details">
            <span>Graph API: {connection.graphVersion}</span>
            <span>Cuenta activa: {connection.adAccountId}</span>
            <span>Campañas legibles: {connection.readableCampaigns}</span>
          </div>
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
      </form>

      {accounts.length > 0 && (
        <div className="card narrow-panel token-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <h2 style={{ margin: 0 }}>Cuentas publicitarias</h2>
            <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', background: 'var(--bg-secondary, rgba(255,255,255,0.06))', color: 'var(--text-muted, #aaa)', border: '1px solid var(--border, rgba(255,255,255,0.1))' }}>
              Plan {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)}: {activeCount}/{accountLimit} activa{accountLimit > 1 ? 's' : ''}
            </span>
          </div>
          <p className="muted-copy" style={{ marginBottom: '12px' }}>
            {accountLimit === 1
              ? 'Tu plan permite 1 cuenta activa. Para cambiarla, desactiva la actual primero.'
              : `Tu plan permite hasta ${accountLimit} cuentas activas simultáneamente.`}
          </p>

          {accountError && (
            <div style={{ color: '#f87171', fontSize: '13px', padding: '10px 12px', background: 'rgba(248,113,113,0.08)', borderRadius: '8px', marginBottom: '12px' }}>
              {accountError}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {accountsLoading ? (
              <div style={{ color: 'var(--text-muted, #aaa)', fontSize: '13px' }}>Cargando cuentas...</div>
            ) : accounts.map((account) => {
              const daysLeft = cooldownDaysLeft(account);
              const isToggling = toggleLoading === account.ad_account_id;
              const canDeactivate = account.is_active && daysLeft === 0;
              const canActivate = !account.is_active && activeCount < accountLimit;

              return (
                <div key={account.ad_account_id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 14px', borderRadius: '10px',
                  background: account.is_active ? 'rgba(99,102,241,0.08)' : 'var(--bg-secondary, rgba(255,255,255,0.03))',
                  border: `1px solid ${account.is_active ? 'rgba(99,102,241,0.3)' : 'var(--border, rgba(255,255,255,0.08))'}`,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary, #f8fafc)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {account.ad_account_name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
                      {account.ad_account_id}
                      {account.currency && ` · ${account.currency}`}
                    </div>
                    {daysLeft > 0 && (
                      <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px' }}>
                        Cambio disponible en {daysLeft} día{daysLeft !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span style={{ fontSize: '12px', color: account.is_active ? '#34d399' : 'var(--text-muted, #64748b)' }}>
                      {account.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                    <button
                      onClick={() => handleToggle(account.ad_account_id, account.is_active)}
                      disabled={isToggling || (!canDeactivate && !canActivate)}
                      style={{
                        padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                        border: 'none', cursor: (isToggling || (!canDeactivate && !canActivate)) ? 'not-allowed' : 'pointer',
                        opacity: (isToggling || (!canDeactivate && !canActivate)) ? 0.45 : 1,
                        background: account.is_active ? 'rgba(248,113,113,0.15)' : 'rgba(99,102,241,0.2)',
                        color: account.is_active ? '#f87171' : '#a78bfa',
                        transition: 'opacity 0.15s',
                      }}
                    >
                      {isToggling ? '...' : (account.is_active ? 'Desactivar' : 'Activar')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ApprovalView({ actions, notifications, loading, autoOptimizeLoading, onPublish, onRefresh, onReject, onAutoOptimize, onDismissNotification, onCreateSimilar, user }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {notifications.length > 0 && (
        <section className="card">
          <div className="approval-header">
            <div>
              <h2>Oportunidades detectadas</h2>
              <p className="muted-copy">Campañas con alto rendimiento donde podrías lanzar nuevos creativos.</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            {notifications.map((n) => (
              <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '16px', background: 'var(--bg-secondary, #f9fafb)', borderRadius: '10px', border: '1px solid var(--border, #e5e7eb)' }}>
                <Sparkles size={22} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>{n.campaign_name}</strong>
                  <p className="muted-copy" style={{ margin: 0 }}>{n.reason}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button className="primary-button compact-button" onClick={() => onCreateSimilar(n.id)}>
                    <Plus size={15} /> Crear campaña similar
                  </button>
                  <button className="secondary-button compact-button" onClick={() => onDismissNotification(n.id)}>
                    <XCircle size={15} /> Descartar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card table-card">
        <div className="approval-header">
          <div>
            <h2>Aprobación final</h2>
            <p className="muted-copy">Campañas y acciones listas para revisar antes de publicar.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="secondary-button compact-button" onClick={onAutoOptimize} disabled={autoOptimizeLoading || loading}>
              {autoOptimizeLoading ? <FuturisticLoader small /> : <Zap size={16} />}
              Auto-optimizar
            </button>
            <button className="secondary-button compact-button" onClick={onRefresh} disabled={loading}>
              {loading ? <FuturisticLoader small /> : <ShieldCheck size={18} />}
              Actualizar
            </button>
          </div>
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
                  <button aria-label="Aprobar acción" onClick={() => onPublish(action.id)} disabled={loading}><CheckCircle2 size={20} /></button>
                  <button aria-label="Rechazar acción" onClick={() => onReject(action.id)} disabled={loading}><XCircle size={20} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
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
    guide: 'Guía de Configuración',
    products: 'Vitrina de Productos',
    'ad-creator': 'Creador de Anuncios IA'
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
          {!analysisLoading && analysisError === 'NO_CREDITS' && (
            <div className="analysis-no-key">
              <p><strong>Sin créditos disponibles.</strong> Renueva tu plan para continuar usando el análisis con IA.</p>
              <button className="primary-button" onClick={() => window.location.href = '/pricing'} style={{ marginTop: 12 }}>Ver planes</button>
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
    // Si no es un entorno de navegador o no es una imagen, hacemos el comportamiento normal
    if (typeof window === 'undefined' || !file.type.startsWith('image/')) {
      // Si es un video, validamos el tamaño preventivamente (límite de 4MB)
      if (file.type.startsWith('video/') && file.size > 4 * 1024 * 1024) {
        reject(new Error(`El video "${file.name}" supera el límite de 4MB para subidas directas. Por favor, compresiónalo o sube uno más corto.`));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => resolve({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: reader.result
      });
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    // Si es una imagen, la comprimimos en el cliente usando HTML5 Canvas
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          // Redimensionamos proporcionalmente si supera el máximo
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            // Fallback si no podemos obtener el contexto
            resolve({
              name: file.name,
              type: file.type,
              size: file.size,
              dataUrl: reader.result
            });
            return;
          }

          // Dibujar la imagen redimensionada
          ctx.drawImage(img, 0, 0, width, height);

          // Convertir a JPEG a 85% calidad para máxima optimización
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

          // Estimar el nuevo tamaño en bytes a partir del string base64
          const stringLength = compressedDataUrl.length - 'data:image/jpeg;base64,'.length;
          const estimatedSize = Math.round(stringLength * 0.75);

          // Ajustar el nombre de archivo a formato .jpg
          let newName = file.name;
          const extIndex = newName.lastIndexOf('.');
          if (extIndex !== -1) {
            newName = newName.substring(0, extIndex) + '.jpg';
          } else {
            newName = newName + '.jpg';
          }

          resolve({
            name: newName,
            type: 'image/jpeg',
            size: estimatedSize,
            dataUrl: compressedDataUrl
          });
        } catch (e) {
          // Fallback en caso de cualquier error durante la compresión canvas
          console.warn('Canvas compression failed, falling back to original image:', e);
          resolve({
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl: reader.result
          });
        }
      };
      img.onerror = () => {
        // Fallback si la imagen no se puede decodificar
        resolve({
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: reader.result
        });
      };
      img.src = reader.result;
    };
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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function loadSessionUser() {
  if (!isBrowser) return null;
  try {
    const user = JSON.parse(localStorage.getItem('metaflow_user'));
    // Reject old fake sessions where id was the email, not a real UUID
    if (!user || !UUID_REGEX.test(user.id)) {
      localStorage.removeItem('metaflow_user');
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

function metaRequestConfig(connection) {
  return {
    headers: {
      ...(connection?.accessToken ? { 'x-meta-access-token': connection.accessToken } : {}),
      ...(connection?.adAccountId ? { 'x-meta-ad-account-id': connection.adAccountId } : {}),
    }
  };
}

async function buildConfig(connection) {
  const auth = await getAuthHeader();
  return { headers: { ...auth, ...metaRequestConfig(connection).headers } };
}

async function getAuthHeader() {
  try {
    const supabase = getSupabaseBrowser();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {};
  } catch {
    return {};
  }
}

function ProductsView({ products, loading, showForm, editingProduct, isAdmin, onNew, onEdit, onDelete, onSave, onCancelForm }) {
  const emptyForm = { name: '', description: '', price: '', currency: 'COP', image_url: '', product_url: '', category: '', tags: '' };
  const [form, setForm] = useState(editingProduct ? { ...emptyForm, ...editingProduct } : emptyForm);

  useEffect(() => {
    setForm(editingProduct ? { ...emptyForm, ...editingProduct } : emptyForm);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingProduct]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, price: form.price ? parseFloat(form.price) : null });
  };

  return (
    <div className="products-view">
      <div className="products-header">
        <p className="products-subtitle">{isAdmin ? 'Gestiona el catálogo de productos visible para todos los usuarios.' : 'Explora los productos disponibles y úsalos para crear anuncios.'}</p>
        {isAdmin && (
          <button className="primary-button" onClick={onNew}>
            <Plus size={16} /> Agregar Producto
          </button>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-panel">
            <div className="modal-header">
              <h2>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
              <button className="icon-button" onClick={onCancelForm}><XCircle size={22} /></button>
            </div>
            <form className="product-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre del producto *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Camiseta Premium Negra" required />
                </div>
                <div className="form-group">
                  <label>Categoría</label>
                  <input className="form-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Ej: Ropa, Electrónica, Hogar" />
                </div>
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe el producto para usarlo en la generación de anuncios..." />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Precio</label>
                  <input className="form-input" type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label>Moneda</label>
                  <select className="form-input" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                    <option value="COP">COP</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="MXN">MXN</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>URL de imagen</label>
                <input className="form-input" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." />
              </div>
              <div className="form-group">
                <label>Link del producto</label>
                <input className="form-input" value={form.product_url} onChange={e => setForm(f => ({ ...f, product_url: e.target.value }))} placeholder="https://tutienda.com/producto" />
              </div>
              <div className="form-group">
                <label>Tags (separados por coma)</label>
                <input className="form-input" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="oferta, nuevo, destacado" />
              </div>
              <div className="form-actions">
                <button type="button" className="secondary-button" onClick={onCancelForm}>Cancelar</button>
                <button type="submit" className="primary-button" disabled={loading}>
                  {loading ? <Loader2 className="spin" size={16} /> : <CheckCircle2 size={16} />}
                  {editingProduct ? 'Guardar cambios' : 'Crear producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading && !products.length && (
        <div className="products-loading"><Loader2 className="spin" size={28} /><span>Cargando productos...</span></div>
      )}

      {!loading && products.length === 0 && !showForm && (
        <div className="products-empty">
          <Package size={48} color="#6366f1" />
          <h3>{isAdmin ? 'No hay productos aún' : 'El catálogo está vacío'}</h3>
          <p>{isAdmin ? 'Agrega tu primer producto para que los usuarios puedan verlo.' : 'Pronto habrá productos disponibles aquí.'}</p>
          {isAdmin && <button className="primary-button" onClick={onNew}><Plus size={16} /> Agregar Producto</button>}
        </div>
      )}

      <div className="products-grid">
        {products.map(product => (
          <div key={product.id} className="product-card">
            <div className="product-card-image">
              {product.image_url
                ? <img src={product.image_url} alt={product.name} />
                : <div className="product-placeholder-img"><Package size={40} color="#6366f1" /></div>
              }
              {product.category && <span className="product-badge">{product.category}</span>}
            </div>
            <div className="product-card-body">
              <h3 className="product-name">{product.name}</h3>
              {product.description && <p className="product-desc">{product.description}</p>}
              <div className="product-meta">
                {product.price && (
                  <span className="product-price">
                    {Number(product.price).toLocaleString('es-CO')} {product.currency}
                  </span>
                )}
                {product.product_url && (
                  <a href={product.product_url} target="_blank" rel="noreferrer" className="product-link">
                    <ExternalLink size={14} /> Ver producto
                  </a>
                )}
              </div>
              {product.tags && (
                <div className="product-tags">
                  {String(product.tags).split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                    <span key={tag} className="product-tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>
            {isAdmin && (
              <div className="product-card-actions">
                <button className="icon-button" title="Editar" onClick={() => onEdit(product)}><Edit2 size={16} /></button>
                <button className="icon-button danger" title="Eliminar" onClick={() => onDelete(product.id)}><Trash2 size={16} /></button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultCard({ img, productName, onLaunch, onSave, onAdjust }) {
  const [copied, setCopied] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustNote, setAdjustNote] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const handleAdjustSubmit = async () => {
    if (!adjustNote.trim() || adjusting) return;
    setAdjusting(true);
    try {
      await onAdjust?.(img, adjustNote);
      setShowAdjust(false);
      setAdjustNote('');
    } catch (err) {
      alert('Error ajustando: ' + (err.response?.data?.error || err.message));
    } finally {
      setAdjusting(false);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(field);
      setTimeout(() => setCopied(null), 1800);
    });
  };

  const handleSave = async () => {
    if (saved || saving || !onSave) return;
    try {
      setSaving(true);
      await onSave(img);
      setSaved(true);
    } catch {
      alert('Error guardando creativo. Verifica la configuración de Supabase.');
    } finally {
      setSaving(false);
    }
  };

  const angle = ANGLE_OPTIONS.find(a => a.value === img.angle);
  const copy = img.copy;

  const copyFields = copy ? [
    { key: 'headline',    label: 'Titular',        value: copy.headline },
    { key: 'primaryText', label: 'Texto principal', value: copy.primaryText },
    { key: 'description', label: 'Descripción',    value: copy.description },
    { key: 'cta',         label: 'CTA',             value: copy.cta },
  ] : [];

  return (
    <div className="result-card">
      <img src={img.imageUrl} alt={img.label} className="result-card-image" />
      <div className="result-card-footer">
        <span className="result-card-label">{angle?.emoji} {img.label}</span>
        <a href={img.imageUrl} download={`${(productName || 'creativo').toLowerCase().replace(/\s+/g, '-')}-${img.angle}-v${(img.variation ?? 0) + 1}.jpg`} className="result-card-download">
          <Download size={13} /> Descargar
        </a>
      </div>
      <div className="result-card-actions">
        <button className="rc-action-btn launch" onClick={() => onLaunch?.(img)}>
          <Rocket size={13} /> Lanzar en Meta
        </button>
        <button className={`rc-action-btn save ${saved ? 'saved' : ''}`} onClick={handleSave} disabled={saved || saving}>
          <BookMarked size={13} /> {saving ? 'Guardando…' : saved ? 'Guardado ✓' : 'Guardar'}
        </button>
        <button className={`rc-action-btn adjust ${showAdjust ? 'active' : ''}`} onClick={() => setShowAdjust(v => !v)} disabled={adjusting}>
          <Edit2 size={13} /> Ajustar
        </button>
      </div>
      {showAdjust && (
        <div className="adjust-row">
          <input
            className="adjust-input"
            placeholder="Ej: título más grande, fondo más oscuro, quitar el texto inferior…"
            value={adjustNote}
            onChange={e => setAdjustNote(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdjustSubmit()}
            autoFocus
          />
          <button className="adjust-submit" onClick={handleAdjustSubmit} disabled={adjusting || !adjustNote.trim()}>
            {adjusting ? <Loader2 size={14} className="spin" /> : <Wand2 size={14} />}
          </button>
        </div>
      )}
      {adjusting && (
        <div className="adjust-loading">
          <Loader2 size={15} className="spin" /> Ajustando imagen…
        </div>
      )}
      {copyFields.length > 0 && (
        <div className="copy-section">
          {copyFields.map(f => (
            <div key={f.key} className="copy-field">
              <div className="copy-field-header">
                <span className="copy-field-label">{f.label}</span>
                <button
                  className={`copy-btn ${copied === f.key ? 'copied' : ''}`}
                  onClick={() => copyToClipboard(f.value, f.key)}
                >
                  <ClipboardCopy size={12} />
                  {copied === f.key ? '¡Copiado!' : 'Copiar'}
                </button>
              </div>
              <p className="copy-field-value">{f.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const ANGLE_OPTIONS = [
  { value: 'pain',           label: 'Dolor',           emoji: '😣', desc: 'El problema que resuelves' },
  { value: 'desire',         label: 'Deseo',            emoji: '✨', desc: 'La vida ideal con el producto' },
  { value: 'transformation', label: 'Transformación',   emoji: '🔄', desc: 'Antes vs Después' },
  { value: 'objection',      label: 'Objeción',         emoji: '🤔', desc: 'Vence el escepticismo' },
  { value: 'urgency',        label: 'Urgencia',         emoji: '⚡', desc: 'Actúa ahora' },
  { value: 'authority',      label: 'Autoridad',        emoji: '🏆', desc: 'Credibilidad y confianza' },
  { value: 'comparison',     label: 'Comparativa',      emoji: '⚖️', desc: 'Nosotros vs la competencia' },
  { value: 'guarantee',      label: 'Garantía',         emoji: '🛡️', desc: 'Sin riesgo, 100% garantizado' },
  { value: 'social_proof',   label: 'Prueba Social',    emoji: '⭐', desc: 'Miles ya lo compraron' },
  { value: 'curiosity',      label: 'Curiosidad',       emoji: '🤫', desc: 'El secreto que nadie te contó' },
  { value: 'price',          label: 'Precio/Oferta',    emoji: '💰', desc: 'Descuento especial limitado' },
];

function AdCreatorView({ products, loading, generatedImages, adForm, onFormChange, onGenerate, onClearImages, onLaunchInBuilder, onSaveCreative, onAdjustImage }) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const formats = [
    { value: 'square', label: '1:1', sub: 'Feed' },
    { value: 'vertical', label: '9:16', sub: 'Stories' },
    { value: 'horizontal', label: '16:9', sub: 'Banner' },
  ];

  const selectedAngles = adForm.angles || [];

  const toggleAngle = (value) => {
    if (selectedAngles.includes(value)) {
      if (selectedAngles.length === 1) return;
      onFormChange({ ...adForm, angles: selectedAngles.filter(a => a !== value) });
    } else {
      onFormChange({ ...adForm, angles: [...selectedAngles, value] });
    }
  };

  const [urlInput, setUrlInput] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);

  const handleImageFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result.split(',')[1];
      onFormChange({ ...adForm, productImageBase64: base64, productImageName: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleImageUrl = async () => {
    if (!urlInput.trim()) return;
    try {
      setUrlLoading(true);
      const res = await fetch(urlInput.trim());
      if (!res.ok) throw new Error('No se pudo cargar la imagen');
      const blob = await res.blob();
      if (!blob.type.startsWith('image/')) throw new Error('La URL no es una imagen válida');
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target.result.split(',')[1];
        const name = urlInput.split('/').pop().split('?')[0] || 'imagen-url.jpg';
        onFormChange({ ...adForm, productImageBase64: base64, productImageName: name });
        setUrlInput('');
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      alert('No se pudo cargar la imagen desde esa URL. Intenta descargarla y subirla manualmente.');
    } finally {
      setUrlLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleImageFile(e.dataTransfer.files[0]);
  };

  const handleProductSelect = (e) => {
    const p = products.find(x => x.id === e.target.value);
    if (p) {
      onFormChange({ ...adForm, selectedProductId: p.id, productName: p.name, description: p.description || '' });
    } else {
      onFormChange({ ...adForm, selectedProductId: '', productName: '', description: '' });
    }
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    onGenerate({
      productName: adForm.productName,
      description: adForm.description,
      format: adForm.format,
      angles: selectedAngles,
      primaryColor: adForm.primaryColor,
      productImageBase64: adForm.productImageBase64 || undefined,
      fullDesign: !!adForm.fullDesign,
    });
  };

  return (
    <div className="ad-creator-view">
      <div className="ad-creator-grid">

        {/* ── LEFT PANEL ── */}
        <div className="ad-creator-panel">
          <div className="acp-section-title">
            <Wand2 size={16} color="#a78bfa" />
            Configurar creativos
          </div>

          <form onSubmit={handleGenerate} className="ad-creator-form">

            {products.length > 0 && (
              <div className="acp-block">
                <label className="acp-label">Producto de la vitrina</label>
                <select className="acp-select" value={adForm.selectedProductId} onChange={handleProductSelect}>
                  <option value="">— Selecciona un producto —</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="acp-block">
              <label className="acp-label">Imagen del producto <span className="acp-optional">PNG · JPG · WEBP</span></label>
              <div
                className={`upload-zone ${dragOver ? 'drag-over' : ''} ${adForm.productImageBase64 ? 'has-image' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => handleImageFile(e.target.files[0])}
                />
                {adForm.productImageBase64 ? (
                  <div className="upload-preview">
                    <img src={`data:image/png;base64,${adForm.productImageBase64}`} alt="Producto" />
                    <button type="button" className="upload-remove" onClick={(e) => { e.stopPropagation(); onFormChange({ ...adForm, productImageBase64: '', productImageName: '' }); }}>
                      <XCircle size={16} />
                    </button>
                    <span className="upload-filename">{adForm.productImageName}</span>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <div className="upload-icon-wrap"><Upload size={22} /></div>
                    <p>Arrastra tu imagen aquí</p>
                    <span>o haz clic para seleccionar</span>
                  </div>
                )}
              </div>
              <p className="acp-hint">Gemini analizará la imagen para generar creativos fieles al producto.</p>
              {!adForm.productImageBase64 && (
                <div className="url-image-row">
                  <input
                    className="acp-input"
                    type="url"
                    placeholder="O pega una URL de imagen externa..."
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleImageUrl())}
                  />
                  <button type="button" className="url-load-btn" onClick={handleImageUrl} disabled={urlLoading || !urlInput.trim()}>
                    {urlLoading ? <Loader2 size={14} className="spin" /> : 'Cargar'}
                  </button>
                </div>
              )}
            </div>

            <div className="acp-block">
              <label className="acp-label">Nombre del producto</label>
              <input className="acp-input" value={adForm.productName} onChange={e => onFormChange({ ...adForm, productName: e.target.value })} placeholder="Ej: Zapatillas Runner Pro" required={!adForm.productImageBase64} />
            </div>

            <div className="acp-block">
              <label className="acp-label">Descripción <span className="acp-optional">opcional pero recomendada</span></label>
              <textarea className="acp-input" rows={4} value={adForm.description} onChange={e => onFormChange({ ...adForm, description: e.target.value })} placeholder="Ej: Sérum facial con vitamina C para mujeres de 28-45 años. Elimina manchas y piel opaca. Resultados visibles en 21 días." />
              <p className="acp-hint">
                Para mejores resultados incluye: <strong>qué es</strong> · <strong>qué problema resuelve</strong> · <strong>a quién va dirigido</strong> · <strong>resultado principal</strong>.<br />
                Ej de belleza: <em>"Sérum con retinol para mujeres 30+. Reduce arrugas y manchas en 3 semanas."</em><br />
                Ej de mascotas: <em>"Omega 3 líquido para perros. Mejora pelaje opaco y articulaciones en 1 semana."</em><br />
                Ej de fitness: <em>"Proteína whey para hombres activos. Más músculo y recuperación rápida post-entreno."</em>
              </p>
            </div>

            {/* Colores de marca */}
            <div className="acp-block">
              <label className="acp-label">Colores de marca</label>
              <div className="brand-colors-row">
                <div className="color-picker-item">
                  <label className="color-picker-label">Primario</label>
                  <div className="color-picker-wrap">
                    <input type="color" className="color-native" value={adForm.primaryColor} onChange={e => onFormChange({ ...adForm, primaryColor: e.target.value })} />
                    <div className="color-swatch" style={{ background: adForm.primaryColor }} />
                    <span className="color-hex">{adForm.primaryColor.toUpperCase()}</span>
                  </div>
                </div>
                <div className="color-divider" />
                <div className="color-picker-item">
                  <label className="color-picker-label">Secundario</label>
                  <div className="color-picker-wrap">
                    <input type="color" className="color-native" value={adForm.secondaryColor} onChange={e => onFormChange({ ...adForm, secondaryColor: e.target.value })} />
                    <div className="color-swatch" style={{ background: adForm.secondaryColor }} />
                    <span className="color-hex">{adForm.secondaryColor.toUpperCase()}</span>
                  </div>
                </div>
              </div>
              <p className="acp-hint">Gemini usará estos colores como acento en los textos y elementos del creativo.</p>
            </div>

            {/* Ángulos de venta */}
            <div className="acp-block">
              <label className="acp-label">
                Ángulos de venta
                <span className="acp-optional">{selectedAngles.length} seleccionado{selectedAngles.length !== 1 ? 's' : ''}</span>
              </label>
              <div className="angle-grid">
                {ANGLE_OPTIONS.map(a => (
                  <button
                    type="button"
                    key={a.value}
                    className={`angle-card ${selectedAngles.includes(a.value) ? 'active' : ''}`}
                    onClick={() => toggleAngle(a.value)}
                  >
                    <span className="angle-emoji">{a.emoji}</span>
                    <span className="angle-label">{a.label}</span>
                    <span className="angle-desc">{a.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Formato */}
            <div className="acp-block">
              <label className="acp-label">Formato</label>
              <div className="format-chips">
                {formats.map(f => (
                  <button type="button" key={f.value}
                    className={`format-chip ${adForm.format === f.value ? 'active' : ''}`}
                    onClick={() => onFormChange({ ...adForm, format: f.value })}>
                    <span className="format-chip-ratio">{f.label}</span>
                    <span className="format-chip-sub">{f.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="generate-cta" disabled={loading}>
              {loading
                ? <><Loader2 className="spin" size={18} /> Generando {selectedAngles.length} creativo{selectedAngles.length !== 1 ? 's' : ''}...</>
                : <><Sparkles size={18} /> Generar {selectedAngles.length} creativo{selectedAngles.length !== 1 ? 's' : ''} con Gemini</>}
            </button>
          </form>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="ad-result-panel">
          <div className="acp-section-title">
            <Image size={16} color="#a78bfa" />
            Creativos generados
          </div>

          {loading && (
            <div className="result-loading">
              <div className="ai-pulse" />
              <p>Gemini está generando {selectedAngles.length} creativo{selectedAngles.length !== 1 ? 's' : ''}...</p>
              <p className="result-hint">Puede tomar entre 30 y 90 segundos</p>
            </div>
          )}

          {!loading && generatedImages.length === 0 && (
            <div className="result-empty">
              <div className="result-empty-preview">
                <div className="result-empty-inner">
                  <Sparkles size={36} color="#6366f1" />
                </div>
              </div>
              <p className="result-empty-title">Tus creativos aparecerán aquí</p>
              <p className="result-hint">Selecciona ángulos y haz clic en Generar</p>
            </div>
          )}

          {!loading && generatedImages.length > 0 && (
            <>
              <div className="result-actions" style={{ justifyContent: 'flex-end' }}>
                <button className="secondary-button" onClick={onClearImages}>
                  <XCircle size={15} /> Nueva generación
                </button>
              </div>
              <div className="result-grid">
                {generatedImages.map(img => (
                  <ResultCard key={`${img.angle}_${img.variation ?? 0}`} img={img} productName={adForm.productName} onLaunch={onLaunchInBuilder} onSave={onSaveCreative} onAdjust={onAdjustImage} />
                ))}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

function LibraryView({ creatives, loading, onDelete, onLaunch, onRefresh }) {
  if (loading) {
    return (
      <div className="library-view">
        <div className="result-loading" style={{ marginTop: 60 }}>
          <div className="ai-pulse" />
          <p>Cargando biblioteca...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="library-view">
      <div className="library-header">
        <div>
          <h2 className="library-title">Biblioteca de creativos</h2>
          <p className="library-subtitle">{creatives.length} creativo{creatives.length !== 1 ? 's' : ''} guardado{creatives.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="secondary-button" onClick={onRefresh}>Actualizar</button>
      </div>

      {creatives.length === 0 ? (
        <div className="library-empty">
          <BookMarked size={40} color="#334155" />
          <p>Aún no tienes creativos guardados.</p>
          <p className="result-hint">Genera imágenes en el módulo "Crear Imagen IA" y guárdalas aquí.</p>
        </div>
      ) : (
        <div className="library-grid">
          {creatives.map(c => (
            <div key={c.id} className="library-card">
              <img src={c.image_url} alt={c.label} className="library-card-image" />
              <div className="library-card-body">
                <span className="library-card-angle">
                  {ANGLE_OPTIONS.find(a => a.value === c.angle)?.emoji} {c.label}
                </span>
                {c.product_name && <span className="library-card-product">{c.product_name}</span>}
                {c.headline && <p className="library-card-headline">"{c.headline}"</p>}
              </div>
              <div className="library-card-footer">
                <button className="rc-action-btn launch" onClick={() => onLaunch({
                  imageUrl: c.image_url,
                  angle: c.angle,
                  label: c.label,
                  copy: { headline: c.headline, primaryText: c.primary_text, description: c.description, cta: c.cta },
                })}>
                  <Rocket size={13} /> Lanzar en Meta
                </button>
                <button className="rc-action-btn delete" onClick={() => onDelete(c.id)}>
                  <Trash2 size={13} /> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
