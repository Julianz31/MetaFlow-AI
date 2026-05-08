const axios = require('axios');
const crypto = require('crypto');
const FormData = require('form-data');
const aiCopyService = require('./aiCopyService');

const GRAPH_VERSION = (process.env.META_GRAPH_VERSION || 'v25.0').trim();
const DEFAULT_DATE_PRESET = process.env.META_DATE_PRESET || 'last_7d';

const requireEnv = (name) => {
    const value = process.env[name];

    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
};

const getAccessToken = (options = {}) => options.accessToken || requireEnv('META_ACCESS_TOKEN');

const getAdAccountId = (options = {}) => {
    const rawAdAccountId = options.adAccountId || requireEnv('META_AD_ACCOUNT_ID');
    return rawAdAccountId.startsWith('act_') ? rawAdAccountId : `act_${rawAdAccountId}`;
};

const graphGet = async (path, params = {}, options = {}) => {
    const accessToken = getAccessToken(options);
    const appSecret = process.env.META_APP_SECRET;
    const appsecretProof = appSecret
        ? crypto.createHmac('sha256', appSecret).update(accessToken).digest('hex')
        : undefined;

    const response = await axios.get(`https://graph.facebook.com/${GRAPH_VERSION}/${path}`, {
        params: {
            access_token: accessToken,
            ...(appsecretProof ? { appsecret_proof: appsecretProof } : {}),
            ...params
        }
    });

    return response.data;
};

const getAuthParams = (options = {}) => {
    const accessToken = getAccessToken(options);
    const appSecret = process.env.META_APP_SECRET;
    const appsecretProof = appSecret
        ? crypto.createHmac('sha256', appSecret).update(accessToken).digest('hex')
        : undefined;

    return {
        access_token: accessToken,
        ...(appsecretProof ? { appsecret_proof: appsecretProof } : {})
    };
};

const graphPost = async (path, data = {}, options = {}) => {
    const response = await axios.post(`https://graph.facebook.com/${GRAPH_VERSION}/${path}`, null, {
        params: {
            ...getAuthParams(options),
            ...data
        }
    });

    return response.data;
};

const graphPostForm = async (path, form, options = {}) => {
    const response = await axios.post(`https://graph.facebook.com/${GRAPH_VERSION}/${path}`, form, {
        params: getAuthParams(options),
        headers: form.getHeaders()
    });

    return response.data;
};

const getRoasValue = (purchaseRoas) => {
    if (!Array.isArray(purchaseRoas) || purchaseRoas.length === 0) {
        return 0;
    }

    const value = parseFloat(purchaseRoas[0].value);
    return Number.isFinite(value) ? value : 0;
};

const PURCHASE_ACTION_TYPES = new Set([
    'purchase',
    'omni_purchase',
    'offsite_conversion.fb_pixel_purchase'
]);

const getActionValue = (items = [], actionTypes = PURCHASE_ACTION_TYPES) => {
    if (!Array.isArray(items)) {
        return 0;
    }

    return items.reduce((total, item) => {
        if (!actionTypes.has(item.action_type)) {
            return total;
        }

        const value = parseFloat(item.value || 0);
        return Number.isFinite(value) ? total + value : total;
    }, 0);
};

const getPurchaseCount = (actions = []) => {
    if (!Array.isArray(actions)) return 0;
    return actions.reduce((total, item) => {
        if (!PURCHASE_ACTION_TYPES.has(item.action_type)) return total;
        const value = parseFloat(item.value || 0);
        return Number.isFinite(value) ? total + value : total;
    }, 0);
};

const toNumber = (value) => {
    const number = parseFloat(value || 0);
    return Number.isFinite(number) ? number : 0;
};

const toInteger = (value) => {
    const number = parseInt(value || 0, 10);
    return Number.isFinite(number) ? number : 0;
};

const getAccountStats = async (options = {}) => {
    try {
        const adAccountId = getAdAccountId(options);

        const response = await graphGet(`${adAccountId}/insights`, {
            date_preset: DEFAULT_DATE_PRESET,
            fields: 'spend,purchase_roas,action_values,cpm,ctr,cpc,clicks,impressions'
        }, options);

        const data = response.data?.[0] || {};
        const facturacion = getActionValue(data.action_values);
        const inversion = toNumber(data.spend);
        const avgRoas = inversion > 0 ? (facturacion / inversion).toFixed(2) : '0.00';
        const campaigns = await getCampaignsWithInsights(options).catch(() => []);
        const activeCampaigns = campaigns.filter(campaign => campaign.effective_status === 'ACTIVE');

        return {
            inversion: data.spend || "0.00",
            roas: `${avgRoas}x`,
            facturacion: facturacion.toFixed(2),
            cpm: toNumber(data.cpm).toFixed(2),
            ctr: toNumber(data.ctr).toFixed(2),
            cpc: toNumber(data.cpc).toFixed(2),
            clicks: toInteger(data.clicks),
            impressions: toInteger(data.impressions),
            activeCampaignsCount: activeCampaigns.length,
            activeCampaigns: activeCampaigns.slice(0, 6),
            acciones: 0 
        };
    } catch (error) {
        logMetaError(error);
        throw error;
    }
};

const getAdAccountProfile = async (options = {}) => {
    try {
        const adAccountId = getAdAccountId(options);

        return graphGet(adAccountId, {
            fields: 'id,name,account_status,currency,timezone_name'
        }, options);
    } catch (error) {
        logMetaError(error);
        throw error;
    }
};

const getCampaignInsights = async (options = {}) => {
    try {
        const adAccountId = getAdAccountId(options);

        const response = await graphGet(`${adAccountId}/insights`, {
            date_preset: DEFAULT_DATE_PRESET,
            level: 'campaign',
            fields: 'campaign_id,campaign_name,spend,purchase_roas,cpc,cpm,ctr,clicks,impressions,action_values,actions'
        }, options);

        return (response.data || []).map((campaign) => {
            const spend = toNumber(campaign.spend);
            const purchases = getActionValue(campaign.actions, PURCHASE_ACTION_TYPES);
            const cpa = purchases > 0 ? spend / purchases : 0;

            return {
                campaign_id: campaign.campaign_id,
                campaign_name: campaign.campaign_name || 'Campaña sin nombre',
                spend,
                roas: getRoasValue(campaign.purchase_roas),
                cpc: toNumber(campaign.cpc),
                cpm: toNumber(campaign.cpm),
                ctr: toNumber(campaign.ctr),
                vcv: getActionValue(campaign.action_values),
                cpa,
                clicks: toInteger(campaign.clicks),
                impressions: toInteger(campaign.impressions)
            };
        });
    } catch (error) {
        logMetaError(error);
        throw error;
    }
};

const getCampaigns = async (options = {}) => {
    try {
        const adAccountId = getAdAccountId(options);

        const response = await graphGet(`${adAccountId}/campaigns`, {
            fields: 'id,name,status,effective_status,objective,created_time',
            limit: 100
        }, options);

        return response.data || [];
    } catch (error) {
        logMetaError(error);
        throw error;
    }
};

const getCampaignsWithInsights = async (options = {}) => {
    const [campaigns, insights] = await Promise.all([
        getCampaigns(options),
        getCampaignInsights(options).catch(() => [])
    ]);
    const insightByCampaignId = new Map(insights.map((campaign) => [campaign.campaign_id, campaign]));

    return campaigns.map((campaign) => ({
        campaign_id: campaign.id,
        campaign_name: campaign.name || 'Campaña sin nombre',
        status: campaign.status,
        effective_status: campaign.effective_status,
        objective: campaign.objective,
        created_time: campaign.created_time,
        spend: 0,
        roas: 0,
        cpc: 0,
        cpm: 0,
        ctr: 0,
        vcv: 0,
        cpa: 0,
        clicks: 0,
        impressions: 0,
        ...insightByCampaignId.get(campaign.id)
    }));
};

const buildAdFromInsight = (ad, insight) => {
    const spend = toNumber(insight.spend);
    const purchases = getPurchaseCount(insight.actions);
    return {
        ad_id: ad.id,
        ad_name: ad.name,
        status: ad.status,
        effective_status: ad.effective_status,
        created_time: ad.created_time,
        creative: ad.creative || null,
        spend,
        roas: getRoasValue(insight.purchase_roas),
        cpc: toNumber(insight.cpc),
        cpm: toNumber(insight.cpm),
        ctr: toNumber(insight.ctr),
        vcv: getActionValue(insight.action_values),
        clicks: toInteger(insight.clicks),
        impressions: toInteger(insight.impressions),
        cpa: purchases > 0 ? spend / purchases : 0
    };
};

const getCampaignDetail = async (campaignId, options = {}) => {
    const [campaignResponse, adsetsResponse, adsetInsightsResponse] = await Promise.all([
        graphGet(campaignId, {
            fields: 'id,name,status,effective_status,objective,created_time'
        }, options),
        graphGet(`${campaignId}/adsets`, {
            fields: 'id,name,status,effective_status,created_time,daily_budget,lifetime_budget',
            limit: 100
        }, options),
        graphGet(`${campaignId}/insights`, {
            date_preset: DEFAULT_DATE_PRESET,
            level: 'adset',
            fields: 'adset_id,adset_name,spend,purchase_roas,cpc,cpm,ctr,clicks,impressions,action_values,actions'
        }, options).catch(() => ({ data: [] }))
    ]);

    const insightById = new Map((adsetInsightsResponse.data || []).map((i) => [i.adset_id, i]));
    const adsets = (adsetsResponse.data || []).map((adset) => {
        const insight = insightById.get(adset.id) || {};
        const spend = toNumber(insight.spend);
        const purchases = getPurchaseCount(insight.actions);
        return {
            adset_id: adset.id,
            adset_name: adset.name,
            status: adset.status,
            effective_status: adset.effective_status,
            created_time: adset.created_time,
            daily_budget: toNumber(adset.daily_budget),
            lifetime_budget: toNumber(adset.lifetime_budget),
            spend,
            roas: getRoasValue(insight.purchase_roas),
            cpc: toNumber(insight.cpc),
            cpm: toNumber(insight.cpm),
            ctr: toNumber(insight.ctr),
            vcv: getActionValue(insight.action_values),
            clicks: toInteger(insight.clicks),
            impressions: toInteger(insight.impressions),
            cpa: purchases > 0 ? spend / purchases : 0
        };
    });

    return { campaign: campaignResponse, adsets };
};

const getAdSetDetail = async (adsetId, options = {}) => {
    const [adsResponse, adInsightsResponse] = await Promise.all([
        graphGet(`${adsetId}/ads`, {
            fields: 'id,name,status,effective_status,created_time,creative{id,name,thumbnail_url}',
            limit: 100
        }, options),
        graphGet(`${adsetId}/insights`, {
            date_preset: DEFAULT_DATE_PRESET,
            level: 'ad',
            fields: 'ad_id,ad_name,spend,purchase_roas,cpc,cpm,ctr,clicks,impressions,action_values,actions'
        }, options).catch(() => ({ data: [] }))
    ]);

    const insightById = new Map((adInsightsResponse.data || []).map((i) => [i.ad_id, i]));
    const ads = (adsResponse.data || []).map((ad) => buildAdFromInsight(ad, insightById.get(ad.id) || {}));

    return { ads };
};

const getAdAccounts = async (options = {}) => {
    const response = await graphGet('me/adaccounts', {
        fields: 'id,name,account_status,currency,timezone_name'
    }, options);

    return (response.data || []).map((account) => ({
        id: account.id,
        name: account.name,
        account_status: account.account_status,
        currency: account.currency,
        timezone_name: account.timezone_name
    }));
};

const getBusinessAssets = async (options = {}) => {
    const pagesResponse = await graphGet('me/accounts', {
        fields: 'id,name,instagram_business_account{id,username},whatsapp_number'
    }, options);
    const whatsappNumbers = await getWhatsAppNumbers(options).catch(() => []);

    return {
        pages: (pagesResponse.data || []).map((page) => ({
            id: page.id,
            name: page.name,
            instagram: page.instagram_business_account || null,
            whatsappNumber: page.whatsapp_number || null
        })),
        whatsappNumbers,
        defaults: {
            pageId: process.env.META_PAGE_ID || '',
            instagramAccountId: process.env.META_INSTAGRAM_ACCOUNT_ID || '',
            destinationUrl: process.env.META_DESTINATION_URL || '',
            whatsappNumber: process.env.META_WHATSAPP_NUMBER || ''
        }
    };
};

const getWhatsAppNumbers = async (options = {}) => {
    const businessesResponse = await graphGet('me/businesses', {
        fields: 'id,name,owned_whatsapp_business_accounts{id,name,phone_numbers{id,display_phone_number,verified_name}}'
    }, options);

    return (businessesResponse.data || [])
        .flatMap((business) => business.owned_whatsapp_business_accounts?.data || [])
        .flatMap((waba) => (waba.phone_numbers?.data || []).map((phone) => ({
            id: phone.id,
            display_phone_number: phone.display_phone_number,
            verified_name: phone.verified_name,
            waba_id: waba.id,
            waba_name: waba.name
        })));
};

const CAMPAIGN_OBJECTIVES = [
    {
        value: 'OUTCOME_SALES',
        label: 'Ventas',
        optimizationGoal: 'OFFSITE_CONVERSIONS',
        requires: ['META_PIXEL_ID', 'META_PAGE_ID', 'META_DESTINATION_URL'],
        supported: true
    },
    {
        value: 'OUTCOME_LEADS',
        label: 'Clientes potenciales',
        optimizationGoal: 'LEAD_GENERATION',
        requires: ['META_PAGE_ID', 'META_LEAD_FORM_ID'],
        supported: false
    },
    {
        value: 'OUTCOME_TRAFFIC',
        label: 'Tráfico',
        optimizationGoal: 'LINK_CLICKS',
        requires: ['META_PAGE_ID', 'META_DESTINATION_URL'],
        supported: true
    },
    {
        value: 'OUTCOME_ENGAGEMENT',
        label: 'Interacción',
        optimizationGoal: 'POST_ENGAGEMENT',
        requires: ['META_PAGE_ID', 'META_DESTINATION_URL'],
        supported: true
    },
    {
        value: 'OUTCOME_AWARENESS',
        label: 'Reconocimiento',
        optimizationGoal: 'REACH',
        requires: ['META_PAGE_ID', 'META_DESTINATION_URL'],
        supported: true
    },
    {
        value: 'OUTCOME_APP_PROMOTION',
        label: 'Promoción de app',
        optimizationGoal: 'APP_INSTALLS',
        requires: ['META_APPLICATION_ID'],
        supported: false
    }
];

const getCampaignObjectives = () => CAMPAIGN_OBJECTIVES;

const generateCampaignCopy = async (payload) => aiCopyService.generateAdCopy(payload);

const createCampaignFromCreatives = async (payload, options = {}) => {
    const objective = CAMPAIGN_OBJECTIVES.find(item => item.value === payload.objective);

    if (!objective) {
        throw new Error('Objetivo de campaña no soportado');
    }

    if (!objective.supported) {
        throw new Error(`El objetivo ${objective.label} necesita assets extra y aún no está automatizado solo con creativos`);
    }

    if (!Array.isArray(payload.creatives) || payload.creatives.length === 0) {
        throw new Error('Debes enviar al menos un creativo');
    }

    const config = buildCampaignConfig(payload, objective);
    const adAccountId = getAdAccountId(options);

    const campaign = await graphPost(`${adAccountId}/campaigns`, {
        name: config.campaignName,
        objective: objective.value,
        buying_type: 'AUCTION',
        status: 'PAUSED',
        special_ad_categories: JSON.stringify([])
    }, options);

    const adSet = await graphPost(`${adAccountId}/adsets`, {
        name: `${config.campaignName} - Ad Set 1`,
        campaign_id: campaign.id,
        daily_budget: config.dailyBudget,
        billing_event: config.billingEvent,
        optimization_goal: objective.optimizationGoal,
        bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
        targeting: JSON.stringify(config.targeting),
        status: 'PAUSED',
        ...(config.promotedObject ? { promoted_object: JSON.stringify(config.promotedObject) } : {})
    }, options);

    const createdAds = [];
    const generatedCopy = payload.generatedCopy || await aiCopyService.generateAdCopy(payload);

    for (const [index, creative] of payload.creatives.entries()) {
        const uploadedCreative = await uploadCreativeAsset(creative, options);
        const creativeResponse = await graphPost(`${adAccountId}/adcreatives`, {
            name: `${config.campaignName} - Creative ${index + 1}`,
            object_story_spec: JSON.stringify(buildObjectStorySpec({
                ...config,
                ...generatedCopy
            }, uploadedCreative))
        }, options);

        const ad = await graphPost(`${adAccountId}/ads`, {
            name: `${config.campaignName} - Ad ${index + 1}`,
            adset_id: adSet.id,
            creative: JSON.stringify({ creative_id: creativeResponse.id }),
            status: 'PAUSED'
        }, options);

        createdAds.push({
            ad_id: ad.id,
            creative_id: creativeResponse.id,
            asset: uploadedCreative,
            filename: creative.name
        });
    }

    return {
        status: 'PAUSED',
        campaign_id: campaign.id,
        adset_id: adSet.id,
        ads: createdAds,
        objective: objective.value,
        generatedCopy
    };
};

const publishCampaign = async (campaignId, options = {}) => {
    if (!campaignId) {
        throw new Error('campaignId es requerido');
    }

    const adsetsResponse = await graphGet(`${campaignId}/adsets`, {
        fields: 'id,name'
    }, options);
    const adsets = adsetsResponse.data || [];
    const ads = [];

    for (const adset of adsets) {
        const adsResponse = await graphGet(`${adset.id}/ads`, {
            fields: 'id,name'
        }, options);
        ads.push(...(adsResponse.data || []));
    }

    await graphPost(campaignId, { status: 'ACTIVE' }, options);

    for (const adset of adsets) {
        await graphPost(adset.id, { status: 'ACTIVE' }, options);
    }

    for (const ad of ads) {
        await graphPost(ad.id, { status: 'ACTIVE' }, options);
    }

    return {
        campaign_id: campaignId,
        adsets_activated: adsets.length,
        ads_activated: ads.length
    };
};

const rejectCampaign = async (campaignId, options = {}) => {
    if (!campaignId) {
        throw new Error('campaignId es requerido');
    }

    await graphPost(campaignId, { status: 'PAUSED' }, options);

    return {
        campaign_id: campaignId,
        status: 'PAUSED'
    };
};

const buildCampaignConfig = (payload, objective) => {
    const pageId = payload.pageId || process.env.META_PAGE_ID;
    const pixelId = payload.pixelId || process.env.META_PIXEL_ID;
    const destinationUrl = payload.destinationUrl || process.env.META_DESTINATION_URL;
    const dailyBudget = Number(payload.dailyBudget || process.env.META_DEFAULT_DAILY_BUDGET || 10000);
    const missing = objective.requires.filter((name) => !process.env[name] && !payload[envToPayloadKey(name)]);

    if (missing.length > 0) {
        throw new Error(`Faltan datos para ${objective.label}: ${missing.join(', ')}`);
    }

    return {
        campaignName: payload.name || `MetaFlow ${objective.label} ${new Date().toISOString().slice(0, 10)}`,
        dailyBudget: Math.max(100, Math.round(dailyBudget)),
        billingEvent: 'IMPRESSIONS',
        pageId,
        pageName: payload.pageName,
        instagramAccountId: payload.instagramAccountId || process.env.META_INSTAGRAM_ACCOUNT_ID,
        instagramName: payload.instagramName,
        whatsappNumber: payload.whatsappNumber || process.env.META_WHATSAPP_NUMBER,
        pixelId,
        destinationUrl,
        primaryText: payload.primaryText || 'Conoce más sobre esta oferta.',
        headline: payload.headline || 'Descubre más',
        description: payload.description || '',
        objective: objective.value,
        targeting: payload.targeting || {
            geo_locations: {
                countries: [payload.country || 'CO']
            },
            age_min: 18,
            age_max: 65
        },
        promotedObject: getPromotedObject(objective.value, { pageId, pixelId })
    };
};

const envToPayloadKey = (name) => ({
    META_PAGE_ID: 'pageId',
    META_PIXEL_ID: 'pixelId',
    META_DESTINATION_URL: 'destinationUrl',
    META_LEAD_FORM_ID: 'leadFormId',
    META_APPLICATION_ID: 'applicationId'
}[name]);

const getPromotedObject = (objective, config) => {
    if (objective === 'OUTCOME_SALES') {
        return {
            pixel_id: config.pixelId,
            custom_event_type: 'PURCHASE'
        };
    }

    if (objective === 'OUTCOME_LEADS' || objective === 'OUTCOME_ENGAGEMENT' || objective === 'OUTCOME_AWARENESS') {
        return {
            page_id: config.pageId
        };
    }

    return null;
};

const uploadImageCreative = async (creative, options = {}) => {
    const match = creative.dataUrl?.match(/^data:(.+);base64,(.+)$/);

    if (!match) {
        throw new Error(`Creativo inválido: ${creative.name || 'sin nombre'}`);
    }

    const form = new FormData();
    form.append('filename', Buffer.from(match[2], 'base64'), {
        filename: creative.name || 'creative.jpg',
        contentType: match[1]
    });

    const response = await graphPostForm(`${getAdAccountId(options)}/adimages`, form, options);
    const firstImage = Object.values(response.images || {})[0];

    if (!firstImage?.hash) {
        throw new Error('Meta no devolvió hash para el creativo subido');
    }

    return firstImage;
};

const uploadVideoCreative = async (creative, options = {}) => {
    const match = creative.dataUrl?.match(/^data:(.+);base64,(.+)$/);

    if (!match) {
        throw new Error(`Video inválido: ${creative.name || 'sin nombre'}`);
    }

    const form = new FormData();
    form.append('source', Buffer.from(match[2], 'base64'), {
        filename: creative.name || 'creative.mp4',
        contentType: match[1]
    });

    const response = await graphPostForm(`${getAdAccountId(options)}/advideos`, form, options);

    if (!response.id) {
        throw new Error('Meta no devolvió id para el video subido');
    }

    return { type: 'video', id: response.id };
};

const uploadCreativeAsset = async (creative, options = {}) => {
    if (creative.type?.startsWith('video/')) {
        return uploadVideoCreative(creative, options);
    }

    const image = await uploadImageCreative(creative, options);
    return {
        type: 'image',
        hash: image.hash
    };
};

const buildObjectStorySpec = (config, asset) => {
    const baseSpec = {
        page_id: config.pageId,
        ...(config.instagramAccountId ? { instagram_actor_id: config.instagramAccountId } : {})
    };

    const callToAction = buildCallToAction(config);

    if (asset.type === 'video') {
        return {
            ...baseSpec,
            video_data: {
                video_id: asset.id,
                message: config.primaryText,
                title: config.headline,
                call_to_action: callToAction
            }
        };
    }

    return {
        ...baseSpec,
        link_data: {
            image_hash: asset.hash,
            link: config.destinationUrl,
            message: config.primaryText,
            name: config.headline,
            description: config.description,
            call_to_action: callToAction
        }
    };
};

const buildCallToAction = (config) => {
    if (config.whatsappNumber && config.objective === 'OUTCOME_SALES') {
        return {
            type: 'WHATSAPP_MESSAGE',
            value: {
                app_destination: 'WHATSAPP',
                whatsapp_number: config.whatsappNumber
            }
        };
    }

    return {
        type: 'LEARN_MORE',
        value: {
            link: config.destinationUrl
        }
    };
};

const testSystemUserConnection = async (options = {}) => {
    const selectedAccountId = options.adAccountId || process.env.META_AD_ACCOUNT_ID;
    if (!selectedAccountId) throw new Error('Se requiere un Ad Account ID');

    const accountOptions = { ...options, adAccountId: selectedAccountId };
    const account = await getAdAccountProfile(accountOptions);
    const campaigns = await getCampaignsWithInsights(accountOptions);
    const adAccounts = await getAdAccounts(options).catch(() => []);

    return {
        ok: true,
        authMethod: 'system_user_access_token',
        graphVersion: GRAPH_VERSION,
        adAccountId: getAdAccountId(accountOptions),
        account: {
            id: account.id,
            name: account.name,
            account_status: account.account_status,
            currency: account.currency,
            timezone_name: account.timezone_name
        },
        adAccounts,
        readableCampaigns: campaigns.length
    };
};

const logMetaError = (error) => {
    if (error.response?.data?.error) {
        const metaError = error.response.data.error;
        console.error('DETALLE DEL ERROR DE META:', {
            message: metaError.message,
            type: metaError.type,
            code: metaError.code,
            subcode: metaError.error_subcode
        });
        return;
    }

    console.error('Error de red o configuración:', error.message);
};

module.exports = {
    createCampaignFromCreatives,
    generateCampaignCopy,
    getAccountStats,
    getAdAccounts,
    getAdAccountProfile,
    getBusinessAssets,
    getCampaignDetail,
    getAdSetDetail,
    getCampaigns,
    getCampaignsWithInsights,
    getCampaignInsights,
    getCampaignObjectives,
    publishCampaign,
    rejectCampaign,
    testSystemUserConnection
};
