const Anthropic = require('@anthropic-ai/sdk');

const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-4-5';

const SYSTEM_PROMPT = `Eres el motor de automatización de MetaFlow.AI, un sistema que evalúa campañas de Meta Ads contra reglas de negocio configuradas por el usuario.

Tu tarea es analizar cada campaña frente a las reglas activas y decidir qué acciones recomendar. Aplica las reglas con criterio:

- Aplica la regla si la métrica supera el umbral Y la campaña tiene contexto suficiente (gasto mínimo relevante).
- No recomiendes pausar campañas con gasto $0: probablemente aún no iniciaron o ya están pausadas.
- Si ROAS es bajo pero el gasto es menor a $5, marca para monitoreo (notify) en lugar de pausar.
- Usa la herramienta report_campaign_actions para devolver tu análisis. Si no hay acciones que tomar, devuelve un array vacío.
- Escribe las razones en español claro, explicando el problema y su magnitud (ej: "ROAS de 0.7x está 42% por debajo del umbral mínimo de 1.2x con $45 de gasto").`;

const REPORT_TOOL = {
    name: 'report_campaign_actions',
    description: 'Reporta las acciones de automatización a encolar basadas en el análisis de campañas.',
    input_schema: {
        type: 'object',
        properties: {
            actions: {
                type: 'array',
                description: 'Lista de acciones recomendadas. Vacía si no hay nada que hacer.',
                items: {
                    type: 'object',
                    properties: {
                        campaign_id: { type: 'string' },
                        campaign_name: { type: 'string' },
                        action: {
                            type: 'string',
                            enum: ['pause_campaign', 'scale_budget', 'reduce_budget', 'notify']
                        },
                        requires_approval: { type: 'boolean' },
                        reason: { type: 'string' }
                    },
                    required: ['campaign_id', 'campaign_name', 'action', 'requires_approval', 'reason']
                }
            }
        },
        required: ['actions']
    }
};

let client = null;
const getClient = () => {
    if (!client) {
        client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    return client;
};

const buildAnalysisPrompt = (campaigns, rules) => {
    const rulesText = rules.map(r =>
        `- ID ${r.id}: Si ${r.metric} ${r.operator} ${r.value} → acción "${r.action}" (requiere aprobación: ${r.requires_approval})`
    ).join('\n');

    const campaignsText = campaigns.slice(0, 50).map(c =>
        `• ${c.campaign_name} (ID: ${c.campaign_id}) | Estado: ${c.effective_status || c.status} | Gasto: $${c.spend} | ROAS: ${c.roas}x | CPC: $${c.cpc} | Clics: ${c.clicks} | Impresiones: ${c.impressions}`
    ).join('\n');

    return [
        `REGLAS ACTIVAS (${rules.length}):`,
        rulesText,
        '',
        `CAMPAÑAS A EVALUAR (${Math.min(campaigns.length, 50)} de ${campaigns.length}):`,
        campaignsText
    ].join('\n');
};

const evaluateWithClaude = async (campaigns, rules) => {
    const response = await getClient().messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 2048,
        system: [
            {
                type: 'text',
                text: SYSTEM_PROMPT,
                cache_control: { type: 'ephemeral' }
            }
        ],
        tools: [REPORT_TOOL],
        tool_choice: { type: 'tool', name: 'report_campaign_actions' },
        messages: [
            { role: 'user', content: buildAnalysisPrompt(campaigns, rules) }
        ]
    });

    const toolUse = response.content.find(block => block.type === 'tool_use');
    if (!toolUse) {
        throw new Error('Claude no devolvió una respuesta de herramienta válida');
    }

    return toolUse.input.actions || [];
};

const evaluateSimple = (campaignData, rules) => {
    const actionsToTake = [];

    campaignData.forEach((campaign) => {
        const metrics = {
            roas: Number(campaign.roas || 0),
            spend: Number(campaign.spend || 0),
            cpc: Number(campaign.cpc || 0),
            cpa: Number(campaign.cpa || 0),
            clicks: Number(campaign.clicks || 0),
            impressions: Number(campaign.impressions || 0)
        };

        rules.forEach((rule) => {
            if (evaluateCondition(metrics[rule.metric], rule.operator, Number(rule.value))) {
                actionsToTake.push({
                    campaign_id: campaign.campaign_id,
                    campaign_name: campaign.campaign_name,
                    action: rule.action,
                    requires_approval: rule.requires_approval,
                    reason: `${rule.metric} ${rule.operator} ${rule.value}`
                });
            }
        });
    });

    return actionsToTake;
};

const evaluateCondition = (metricValue, operator, ruleValue) => {
    if (!Number.isFinite(metricValue) || !Number.isFinite(ruleValue)) {
        return false;
    }

    switch (operator) {
        case '<': return metricValue < ruleValue;
        case '<=': return metricValue <= ruleValue;
        case '>': return metricValue > ruleValue;
        case '>=': return metricValue >= ruleValue;
        case '=':
        case '==': return metricValue === ruleValue;
        default: return false;
    }
};

const rulesEngine = {
    async evaluate(campaignData, rules) {
        if (!Array.isArray(campaignData)) {
            throw new Error('rulesEngine.evaluate expects campaignData to be an array');
        }

        if (!Array.isArray(rules) || rules.length === 0 || campaignData.length === 0) {
            return [];
        }

        if (!process.env.ANTHROPIC_API_KEY) {
            return evaluateSimple(campaignData, rules);
        }

        try {
            return await evaluateWithClaude(campaignData, rules);
        } catch (error) {
            console.error('rulesEngine: Claude falló, usando evaluación simple:', error.message);
            return evaluateSimple(campaignData, rules);
        }
    }
};

module.exports = rulesEngine;
