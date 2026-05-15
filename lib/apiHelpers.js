const getMetaCredentials = (req) => ({
    accessToken: req.headers['x-meta-access-token'] || undefined,
    adAccountId: req.headers['x-meta-ad-account-id'] || undefined,
});

const getCampaignStatus = (campaign, suggestions) => {
    if (suggestions.length > 0) return 'needs_review';
    if (campaign.spend <= 0) return 'no_spend';
    if (campaign.roas >= 2) return 'healthy';
    return 'watch';
};

const getCampaignSummary = (campaign, suggestions) => {
    if (suggestions.length > 0) return `Revisar: ${suggestions.map(s => s.reason).join(', ')}`;
    if (campaign.spend <= 0) return 'Sin gasto en el periodo analizado.';
    if (campaign.roas >= 2) return 'Buen rendimiento relativo en los últimos 7 días.';
    return 'Rendimiento intermedio: conviene monitorear antes de escalar.';
};

module.exports = { getMetaCredentials, getCampaignStatus, getCampaignSummary };
