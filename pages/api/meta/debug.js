const axios = require('axios');
const { getMetaCredentials } = require('../../../lib/apiHelpers');

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).end();

    const { accessToken, adAccountId } = getMetaCredentials(req);
    const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v25.0';

    const tokenPreview = accessToken
        ? `${accessToken.slice(0, 10)}...${accessToken.slice(-6)} (${accessToken.length} chars)`
        : 'NO RECIBIDO';

    const meResult = await axios.get(`https://graph.facebook.com/${GRAPH_VERSION}/me`, {
        params: { access_token: accessToken, fields: 'id,name' }
    }).then(r => ({ ok: true, data: r.data })).catch(e => ({
        ok: false,
        code: e.response?.data?.error?.code,
        message: e.response?.data?.error?.message,
        type: e.response?.data?.error?.type
    }));

    const accountId = adAccountId?.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
    const accountResult = adAccountId
        ? await axios.get(`https://graph.facebook.com/${GRAPH_VERSION}/${accountId}`, {
            params: { access_token: accessToken, fields: 'id,name,account_status' }
        }).then(r => ({ ok: true, data: r.data })).catch(e => ({
            ok: false,
            code: e.response?.data?.error?.code,
            message: e.response?.data?.error?.message,
            type: e.response?.data?.error?.type
        }))
        : 'adAccountId no recibido';

    res.json({
        token: tokenPreview,
        adAccountId: adAccountId || 'NO RECIBIDO',
        graphVersion: GRAPH_VERSION,
        appSecretSet: !!process.env.META_APP_SECRET,
        meEndpoint: meResult,
        accountEndpoint: accountResult
    });
}
