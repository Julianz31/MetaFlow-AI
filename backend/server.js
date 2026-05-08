const express = require('express');
const cors = require('cors'); // Necesario para conectar con el Dashboard
const { createClient } = require('@supabase/supabase-js');
const metaAdsService = require('./metaAdsService');
const rulesEngine = require('./rulesEngine');
const aiAnalysisService = require('./aiAnalysisService');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3002,http://localhost:3003')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

const requireEnv = (name) => {
    if (!process.env[name]) {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return process.env[name];
};

const getMetaCredentials = (req) => ({
    accessToken: req.header('x-meta-access-token') || undefined,
    adAccountId: req.header('x-meta-ad-account-id') || undefined
});

// Configuración de Middlewares
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }

        callback(new Error(`CORS origin not allowed: ${origin}`));
    }
}));
app.use(express.json({ limit: '100mb' }));

// Inicialización de Supabase
const supabase = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_KEY'));

app.get('/api/health', (req, res) => {
    res.json({ ok: true, service: 'MetaFlow.AI Backend' });
});

app.get('/api/meta/connection', async (req, res) => {
    try {
        const connection = await metaAdsService.testSystemUserConnection(getMetaCredentials(req));
        res.json(connection);
    } catch (error) {
        console.error("Error en /api/meta/connection:", error.message);
        res.status(500).json({
            ok: false,
            error: 'No se pudo validar la conexión con Meta Ads'
        });
    }
});

app.get('/api/campaigns', async (req, res) => {
    try {
        const campaigns = await metaAdsService.getCampaignsWithInsights(getMetaCredentials(req));
        res.json({ campaigns });
    } catch (error) {
        console.error("Error en /api/campaigns:", error.message);
        res.status(500).json({ error: 'Error al obtener campañas de Meta Ads' });
    }
});

app.get('/api/campaigns/:id/detail', async (req, res) => {
    try {
        const detail = await metaAdsService.getCampaignDetail(req.params.id, getMetaCredentials(req));
        res.json(detail);
    } catch (error) {
        console.error("Error en /api/campaigns/:id/detail:", error.message);
        res.status(500).json({ error: 'Error al obtener detalle de campaña' });
    }
});

app.get('/api/adsets/:id/detail', async (req, res) => {
    try {
        const detail = await metaAdsService.getAdSetDetail(req.params.id, getMetaCredentials(req));
        res.json(detail);
    } catch (error) {
        console.error("Error en /api/adsets/:id/detail:", error.message);
        res.status(500).json({ error: 'Error al obtener detalle del conjunto de anuncios' });
    }
});

const getAnthropicKey = (req) => req.header('x-anthropic-api-key') || null;

app.get('/api/ai/analyze', async (req, res) => {
    const anthropicKey = getAnthropicKey(req);
    if (!anthropicKey) return res.status(402).json({ error: 'NO_API_KEY' });
    try {
        const credentials = getMetaCredentials(req);
        const [accountStats, campaigns] = await Promise.all([
            metaAdsService.getAccountStats(credentials),
            metaAdsService.getCampaignsWithInsights(credentials)
        ]);
        const analysis = await aiAnalysisService.analyzeAccount(accountStats, campaigns, anthropicKey);
        res.json({ analysis });
    } catch (error) {
        console.error("Error en /api/ai/analyze:", error.message);
        res.status(500).json({ error: 'Error al generar análisis' });
    }
});

app.post('/api/ai/chat', async (req, res) => {
    const anthropicKey = getAnthropicKey(req);
    if (!anthropicKey) return res.status(402).json({ error: 'NO_API_KEY' });
    try {
        const { messages } = req.body;
        const credentials = getMetaCredentials(req);
        const [accountStats, campaigns] = await Promise.all([
            metaAdsService.getAccountStats(credentials),
            metaAdsService.getCampaignsWithInsights(credentials)
        ]);
        const reply = await aiAnalysisService.chat(messages, accountStats, campaigns, anthropicKey);
        res.json({ reply });
    } catch (error) {
        console.error("Error en /api/ai/chat:", error.message);
        res.status(500).json({ error: 'Error al procesar pregunta' });
    }
});

app.get('/api/campaign-analysis', async (req, res) => {
    try {
        const { data: rules, error: rulesError } = await supabase
            .from('automation_rules')
            .select('*')
            .eq('active', true);

        if (rulesError) throw rulesError;

        const campaigns = await metaAdsService.getCampaignsWithInsights(getMetaCredentials(req));
        const suggestions = await rulesEngine.evaluate(campaigns, rules || []);

        const campaignsWithAnalysis = campaigns.map((campaign) => {
            const campaignSuggestions = suggestions.filter(
                suggestion => suggestion.campaign_id === campaign.campaign_id
            );

            return {
                ...campaign,
                status: getCampaignStatus(campaign, campaignSuggestions),
                suggestions: campaignSuggestions,
                summary: getCampaignSummary(campaign, campaignSuggestions)
            };
        });

        res.json({
            campaigns: campaignsWithAnalysis,
            totalCampaigns: campaignsWithAnalysis.length,
            campaignsWithSuggestions: campaignsWithAnalysis.filter(c => c.suggestions.length > 0).length
        });
    } catch (error) {
        console.error("Error en /api/campaign-analysis:", error.message);
        res.status(500).json({ error: 'Error al analizar campañas de Meta Ads' });
    }
});

app.get('/api/campaign-objectives', (req, res) => {
    res.json({ objectives: metaAdsService.getCampaignObjectives() });
});

app.get('/api/meta/assets', async (req, res) => {
    try {
        const assets = await metaAdsService.getBusinessAssets(getMetaCredentials(req));
        res.json(assets);
    } catch (error) {
        console.error("Error en /api/meta/assets:", error.message);
        res.status(500).json({
            pages: [],
            defaults: {},
            error: 'No se pudieron cargar Fan Pages e Instagram'
        });
    }
});

app.post('/api/campaign-builder/generate-copy', async (req, res) => {
    try {
        const copy = await metaAdsService.generateCampaignCopy(req.body);
        res.json({ success: true, copy });
    } catch (error) {
        console.error("Error en /api/campaign-builder/generate-copy:", error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/campaign-builder/create', async (req, res) => {
    try {
        const result = await metaAdsService.createCampaignFromCreatives(req.body, getMetaCredentials(req));

        await supabase.from('action_logs').insert({
            user_id: req.body.userId || 'system',
            campaign_id: result.campaign_id,
            campaign_name: req.body.name || `Campaña ${result.campaign_id}`,
            action_suggested: 'publish_campaign',
            reason: 'Campaña creada en PAUSED y lista para aprobación final',
            status: 'pending'
        });

        res.json({
            success: true,
            message: 'Campaña creada en pausa para revisión',
            result
        });
    } catch (error) {
        console.error("Error en /api/campaign-builder/create:", error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/approval-actions', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('action_logs')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ actions: data || [] });
    } catch (error) {
        console.error("Error en /api/approval-actions:", error.message);
        res.status(500).json({ error: 'Error al obtener acciones pendientes' });
    }
});

app.post('/api/approval-actions/:id/publish', async (req, res) => {
    try {
        const { data: action, error: fetchError } = await supabase
            .from('action_logs')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (fetchError) throw fetchError;

        const result = await metaAdsService.publishCampaign(action.campaign_id, getMetaCredentials(req));

        const { error: updateError } = await supabase
            .from('action_logs')
            .update({ status: 'executed' })
            .eq('id', req.params.id);

        if (updateError) throw updateError;

        res.json({ success: true, result });
    } catch (error) {
        console.error("Error en /api/approval-actions/:id/publish:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/approval-actions/:id/reject', async (req, res) => {
    try {
        const { error } = await supabase
            .from('action_logs')
            .update({ status: 'rejected' })
            .eq('id', req.params.id);

        if (error) throw error;

        res.json({ success: true });
    } catch (error) {
        console.error("Error en /api/approval-actions/:id/reject:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/rules', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('automation_rules')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ rules: data || [] });
    } catch (error) {
        console.error("Error en GET /api/rules:", error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/rules', async (req, res) => {
    try {
        const { name, metric, operator, value, action, active = true, requires_approval = true } = req.body;
        const { data, error } = await supabase
            .from('automation_rules')
            .insert({ name, metric, operator, value, action, active, requires_approval })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ rule: data });
    } catch (error) {
        console.error("Error en POST /api/rules:", error.message);
        res.status(400).json({ error: error.message });
    }
});

app.put('/api/rules/:id', async (req, res) => {
    try {
        const { name, metric, operator, value, action, active, requires_approval } = req.body;
        const { data, error } = await supabase
            .from('automation_rules')
            .update({ name, metric, operator, value, action, active, requires_approval, updated_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        res.json({ rule: data });
    } catch (error) {
        console.error("Error en PUT /api/rules/:id:", error.message);
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/rules/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('automation_rules')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        res.json({ success: true });
    } catch (error) {
        console.error("Error en DELETE /api/rules/:id:", error.message);
        res.status(400).json({ error: error.message });
    }
});

const getCampaignStatus = (campaign, suggestions) => {
    if (suggestions.length > 0) {
        return 'needs_review';
    }

    if (campaign.spend <= 0) {
        return 'no_spend';
    }

    if (campaign.roas >= 2) {
        return 'healthy';
    }

    return 'watch';
};

const getCampaignSummary = (campaign, suggestions) => {
    if (suggestions.length > 0) {
        return `Revisar: ${suggestions.map(s => s.reason).join(', ')}`;
    }

    if (campaign.spend <= 0) {
        return 'Sin gasto en el periodo analizado.';
    }

    if (campaign.roas >= 2) {
        return 'Buen rendimiento relativo en los últimos 7 días.';
    }

    return 'Rendimiento intermedio: conviene monitorear antes de escalar.';
};

/**
 * RUTA 1: Obtener estadísticas para el Dashboard
 * Esta ruta es la que quita los datos de ejemplo y pone tus datos reales
 */
app.get('/api/stats', async (req, res) => {
    try {
        // Usamos las credenciales del .env para la conexión inicial
        const stats = await metaAdsService.getAccountStats(getMetaCredentials(req));
        
        // También podemos contar cuántas acciones pendientes hay en Supabase
        const { count } = await supabase
            .from('action_logs')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        res.json({
            ...stats,
            acciones: count || 0
        });
    } catch (error) {
        console.error("Error en /api/stats:", error.message);
        res.status(500).json({ error: 'Error al conectar con Meta Ads' });
    }
});

/**
 * RUTA 2: Procesar Reglas de Automatización
 * Aquí es donde la IA evalúa si debe pausar o escalar campañas
 */
app.post('/api/process-rules', async (req, res) => {
    const { userId } = req.body;

    try {
        // 1. Obtener reglas activas de Supabase
        const { data: rules, error: rulesError } = await supabase
            .from('automation_rules')
            .select('*')
            .eq('active', true);

        if (rulesError) throw rulesError;

        // 2. Obtener data real por campaña para evaluar reglas
        const campaignData = await metaAdsService.getCampaignsWithInsights(getMetaCredentials(req)); 

        // 3. Evaluar reglas (Lógica en rulesEngine.js)
        const suggestions = await rulesEngine.evaluate(campaignData, rules);

        // 4. Guardar en la Cola de Aprobación
        if (suggestions.length > 0) {
            const logsToInsert = suggestions.map(s => ({
                user_id: userId || 'system',
                campaign_id: s.campaign_id,
                campaign_name: s.campaign_name,
                action_suggested: s.action,
                reason: s.reason,
                status: 'pending' // Siempre a aprobación para mayor seguridad
            }));
            
            const { error: insertError } = await supabase.from('action_logs').insert(logsToInsert);
            if (insertError) throw insertError;
        }

        res.json({ 
            success: true, 
            message: 'Análisis completado', 
            actionsFound: suggestions.length 
        });

    } catch (error) {
        console.error("Error en /api/process-rules:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Inicio del servidor
app.listen(PORT, () => {
    console.log('MetaFlow.AI Backend listo');
    console.log(`Puerto: ${PORT}`);
    console.log(`CORS origins: ${allowedOrigins.join(', ')}`);
});
