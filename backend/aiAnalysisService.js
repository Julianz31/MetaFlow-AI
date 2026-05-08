const Anthropic = require('@anthropic-ai/sdk');

const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `Eres un experto en Meta Ads con más de 10 años de experiencia gestionando cuentas publicitarias de alto rendimiento en Colombia y Latinoamérica. Analizas datos con criterio estratégico, no solo reportas números.

Tu análisis siempre:
- Va directo al punto con observaciones concretas y accionables
- Identifica qué está funcionando bien y qué necesita atención urgente
- Compara métricas con benchmarks del mercado (ROAS saludable >2x, CTR bueno >1.5%, CPC eficiente depende del sector)
- Prioriza las recomendaciones por impacto en el negocio
- Habla en términos de dinero y resultados, no solo porcentajes
- Usa un tono directo, como si fueras el consultor de confianza del cliente

Formato de respuesta: usa secciones claras con títulos en negrita, bullet points para recomendaciones y números específicos. No uses markdown complejo, solo texto limpio con negritas (**texto**) y listas con •.`;

const getClient = (apiKey) => new Anthropic({ apiKey });

const buildAnalysisPrompt = (accountStats, campaigns) => {
    const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE' || c.effective_status === 'ACTIVE');
    const pausedCampaigns = campaigns.filter(c => c.status !== 'ACTIVE' && c.effective_status !== 'ACTIVE');

    const campaignLines = campaigns.map(c =>
        `- ${c.campaign_name} | Estado: ${c.effective_status || c.status} | Gasto: $${Number(c.spend || 0).toLocaleString('es-CO')} | VCV: $${Number(c.vcv || 0).toLocaleString('es-CO')} | ROAS: ${c.roas}x | CTR: ${c.ctr}% | CPC: $${c.cpc} | Clicks: ${c.clicks} | Impr: ${c.impressions}`
    ).join('\n');

    return `Analiza esta cuenta de Meta Ads con datos de los últimos 7 días:

**RESUMEN DE CUENTA**
• Inversión total: $${Number(accountStats.inversion || 0).toLocaleString('es-CO')}
• Facturación/VCV: $${Number(accountStats.facturacion || 0).toLocaleString('es-CO')}
• ROAS general: ${accountStats.roas}
• CTR promedio: ${accountStats.ctr}%
• CPM promedio: $${accountStats.cpm}
• CPC promedio: $${accountStats.cpc}
• Clicks totales: ${Number(accountStats.clicks || 0).toLocaleString('es-CO')}
• Impresiones: ${Number(accountStats.impressions || 0).toLocaleString('es-CO')}
• Campañas activas: ${activeCampaigns.length} | Pausadas: ${pausedCampaigns.length}

**CAMPAÑAS INDIVIDUALES**
${campaignLines || 'Sin datos de campañas'}

Haz un análisis experto completo. Incluye: diagnóstico general, evaluación por campaña, alertas de lo que está mal, y las 3-5 acciones más importantes que debe tomar HOY.`;
};

const analyzeAccount = async (accountStats, campaigns, apiKey) => {
    const response = await getClient(apiKey).messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 2048,
        system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: buildAnalysisPrompt(accountStats, campaigns) }]
    });

    return response.content[0]?.text || '';
};

const chat = async (messages, accountStats, campaigns, apiKey) => {
    const contextBlock = buildAnalysisPrompt(accountStats, campaigns);

    const systemWithContext = `${SYSTEM_PROMPT}

Tienes acceso a los datos actuales de la cuenta (últimos 7 días):
${contextBlock}

Responde las preguntas del usuario basándote en estos datos. Sé directo y específico.`;

    const response = await getClient(apiKey).messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        system: [{ type: 'text', text: systemWithContext, cache_control: { type: 'ephemeral' } }],
        messages
    });

    return response.content[0]?.text || '';
};

module.exports = { analyzeAccount, chat };
