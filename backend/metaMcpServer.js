#!/usr/bin/env node
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { ListToolsRequestSchema, CallToolRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { createClient } = require('@supabase/supabase-js');
const metaAdsService = require('./metaAdsService');
const rulesEngine = require('./rulesEngine');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const TOOLS = [
    {
        name: 'get_account_stats',
        description: 'Obtiene el resumen de rendimiento de la cuenta publicitaria: inversión, ROAS, facturación, CPM, CTR, CPC, clics, impresiones y campañas activas.',
        inputSchema: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    {
        name: 'get_campaigns',
        description: 'Lista todas las campañas de Meta Ads con sus insights de los últimos 7 días: gasto, ROAS, CPC, CTR, clics e impresiones por campaña.',
        inputSchema: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    {
        name: 'get_campaign_detail',
        description: 'Obtiene el detalle de una campaña específica incluyendo todos sus anuncios con métricas individuales.',
        inputSchema: {
            type: 'object',
            properties: {
                campaign_id: {
                    type: 'string',
                    description: 'ID de la campaña en Meta Ads (sin prefijo act_)'
                }
            },
            required: ['campaign_id']
        }
    },
    {
        name: 'get_automation_rules',
        description: 'Lista todas las reglas de automatización configuradas en MetaFlow.AI con su estado activo/inactivo.',
        inputSchema: {
            type: 'object',
            properties: {
                active_only: {
                    type: 'boolean',
                    description: 'Si es true, retorna solo las reglas activas. Por defecto false.'
                }
            },
            required: []
        }
    },
    {
        name: 'process_automation_rules',
        description: 'Evalúa las reglas de automatización activas contra los datos reales de campañas y encola las acciones sugeridas para aprobación.',
        inputSchema: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    {
        name: 'get_pending_actions',
        description: 'Lista las acciones sugeridas por las reglas de automatización que están esperando aprobación manual.',
        inputSchema: {
            type: 'object',
            properties: {},
            required: []
        }
    },
    {
        name: 'approve_action',
        description: 'Aprueba y ejecuta una acción pendiente. Si la acción es pause_campaign o scale_budget, se ejecuta directamente en Meta Ads.',
        inputSchema: {
            type: 'object',
            properties: {
                action_id: {
                    type: 'string',
                    description: 'UUID de la acción en la tabla action_logs'
                }
            },
            required: ['action_id']
        }
    },
    {
        name: 'reject_action',
        description: 'Rechaza una acción pendiente sin ejecutarla.',
        inputSchema: {
            type: 'object',
            properties: {
                action_id: {
                    type: 'string',
                    description: 'UUID de la acción en la tabla action_logs'
                }
            },
            required: ['action_id']
        }
    }
];

const handlers = {
    get_account_stats: async () => {
        const stats = await metaAdsService.getAccountStats();
        return JSON.stringify(stats, null, 2);
    },

    get_campaigns: async () => {
        const campaigns = await metaAdsService.getCampaignsWithInsights();
        return JSON.stringify(campaigns, null, 2);
    },

    get_campaign_detail: async ({ campaign_id }) => {
        if (!campaign_id) throw new Error('campaign_id es requerido');
        const detail = await metaAdsService.getCampaignDetail(campaign_id);
        return JSON.stringify(detail, null, 2);
    },

    get_automation_rules: async ({ active_only = false }) => {
        let query = supabase.from('automation_rules').select('*').order('created_at', { ascending: false });
        if (active_only) query = query.eq('active', true);
        const { data, error } = await query;
        if (error) throw error;
        return JSON.stringify(data || [], null, 2);
    },

    process_automation_rules: async () => {
        const { data: rules, error: rulesError } = await supabase
            .from('automation_rules')
            .select('*')
            .eq('active', true);

        if (rulesError) throw rulesError;

        const campaigns = await metaAdsService.getCampaignsWithInsights();
        const suggestions = await rulesEngine.evaluate(campaigns, rules || []);

        if (suggestions.length > 0) {
            const { error: insertError } = await supabase.from('action_logs').insert(
                suggestions.map(s => ({
                    user_id: 'mcp',
                    campaign_id: s.campaign_id,
                    campaign_name: s.campaign_name,
                    action_suggested: s.action,
                    reason: s.reason,
                    status: 'pending'
                }))
            );
            if (insertError) throw insertError;
        }

        return JSON.stringify({
            rules_evaluated: (rules || []).length,
            campaigns_checked: campaigns.length,
            actions_queued: suggestions.length,
            suggestions
        }, null, 2);
    },

    get_pending_actions: async () => {
        const { data, error } = await supabase
            .from('action_logs')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return JSON.stringify(data || [], null, 2);
    },

    approve_action: async ({ action_id }) => {
        if (!action_id) throw new Error('action_id es requerido');

        const { data: action, error: fetchError } = await supabase
            .from('action_logs')
            .select('*')
            .eq('id', action_id)
            .single();

        if (fetchError) throw fetchError;
        if (action.status !== 'pending') {
            throw new Error(`La acción ya tiene estado: ${action.status}`);
        }

        let result = { executed: true };
        if (action.action_suggested === 'publish_campaign' && action.campaign_id) {
            result = await metaAdsService.publishCampaign(action.campaign_id);
        }

        const { error: updateError } = await supabase
            .from('action_logs')
            .update({ status: 'executed', updated_at: new Date().toISOString() })
            .eq('id', action_id);

        if (updateError) throw updateError;

        return JSON.stringify({ success: true, action_id, action: action.action_suggested, result }, null, 2);
    },

    reject_action: async ({ action_id }) => {
        if (!action_id) throw new Error('action_id es requerido');

        const { error } = await supabase
            .from('action_logs')
            .update({ status: 'rejected', updated_at: new Date().toISOString() })
            .eq('id', action_id);

        if (error) throw error;
        return JSON.stringify({ success: true, action_id, status: 'rejected' }, null, 2);
    }
};

const server = new Server(
    { name: 'metaflow-ai', version: '1.0.0' },
    { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;
    const handler = handlers[name];

    if (!handler) {
        return {
            content: [{ type: 'text', text: `Herramienta desconocida: ${name}` }],
            isError: true
        };
    }

    try {
        const text = await handler(args);
        return { content: [{ type: 'text', text }] };
    } catch (error) {
        return {
            content: [{ type: 'text', text: `Error en ${name}: ${error.message}` }],
            isError: true
        };
    }
});

const transport = new StdioServerTransport();
server.connect(transport).then(() => {
    console.error('MetaFlow.AI MCP server listo');
}).catch((error) => {
    console.error('Error al iniciar MCP server:', error);
    process.exit(1);
});
