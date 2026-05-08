const Anthropic = require('@anthropic-ai/sdk');

const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-4-5';

const SYSTEM_PROMPT = [
    'Eres un estratega senior de Meta Ads.',
    'Genera copys persuasivos en español neutro para anuncios de Meta.',
    'Cumple políticas de Meta: no afirmes atributos personales sensibles, no prometas resultados garantizados,',
    'no uses claims engañosos, no uses miedo, vergüenza o presión excesiva.',
    'Usa la herramienta generate_ad_copy para estructurar tu respuesta.'
].join(' ');

const AD_COPY_TOOL = {
    name: 'generate_ad_copy',
    description: 'Genera copy estructurado para un anuncio de Meta Ads.',
    input_schema: {
        type: 'object',
        properties: {
            primaryText: {
                type: 'string',
                description: 'Texto principal del anuncio (máx. 500 caracteres)'
            },
            headline: {
                type: 'string',
                description: 'Titular del anuncio (máx. 120 caracteres)'
            },
            description: {
                type: 'string',
                description: 'Descripción breve (máx. 180 caracteres)'
            },
            policyNotes: {
                type: 'array',
                items: { type: 'string' },
                description: 'Notas de cumplimiento de políticas de Meta (máx. 6 ítems)'
            }
        },
        required: ['primaryText', 'headline', 'description', 'policyNotes']
    }
};

let client = null;
const getClient = () => {
    if (!client) {
        client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    return client;
};

const generateAdCopy = async (payload) => {
    if (!process.env.ANTHROPIC_API_KEY) {
        return getFallbackCopy(payload);
    }

    const response = await getClient().messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        system: [
            {
                type: 'text',
                text: SYSTEM_PROMPT,
                cache_control: { type: 'ephemeral' }
            }
        ],
        tools: [AD_COPY_TOOL],
        tool_choice: { type: 'tool', name: 'generate_ad_copy' },
        messages: [
            { role: 'user', content: buildPrompt(payload) }
        ]
    });

    const toolUse = response.content.find(block => block.type === 'tool_use');
    if (!toolUse) {
        throw new Error('Claude no devolvió una llamada a herramienta válida');
    }

    return sanitizeCopy(toolUse.input);
};

const buildPrompt = (payload) => {
    const creativeNames = (payload.creatives || []).map(creative => creative.name).join(', ');

    return [
        `Objetivo de campaña: ${payload.objective}.`,
        `Nombre o idea: ${payload.name || 'Campaña nueva'}.`,
        `URL destino: ${payload.destinationUrl || 'No aplica'}.`,
        `WhatsApp: ${payload.whatsappNumber || 'No aplica'}.`,
        `Fan Page: ${payload.pageName || payload.pageId || 'No especificada'}.`,
        `Instagram: ${payload.instagramName || payload.instagramAccountId || 'No especificado'}.`,
        `Creativos recibidos: ${creativeNames || 'Sin nombres'}.`,
        `Contexto de negocio: ${payload.businessContext || 'No especificado'}.`,
        'Escribe para performance, pero evita lenguaje que implique conocer condiciones personales del usuario.',
        'No uses frases como "si tienes deudas", "sabemos que necesitas", "garantizado", "100% seguro", "pierde peso", "cura", "hazte rico".'
    ].join('\n');
};

const sanitizeCopy = (copy) => ({
    primaryText: String(copy.primaryText || '').slice(0, 500),
    headline: String(copy.headline || '').slice(0, 120),
    description: String(copy.description || '').slice(0, 180),
    policyNotes: Array.isArray(copy.policyNotes) ? copy.policyNotes.slice(0, 6) : []
});

const getFallbackCopy = (payload) => ({
    primaryText: payload.primaryText || 'Descubre una forma simple de conocer esta oferta y dar el siguiente paso cuando estés listo.',
    headline: payload.headline || 'Conoce más hoy',
    description: payload.description || 'Información clara para tomar una mejor decisión.',
    policyNotes: [
        'Fallback local usado porque ANTHROPIC_API_KEY no está configurada.',
        'Evita promesas garantizadas y afirmaciones sobre atributos personales.'
    ]
});

module.exports = { generateAdCopy };
