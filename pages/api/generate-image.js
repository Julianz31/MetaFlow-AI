import sharp from 'sharp';

export const config = {
  api: { bodyParser: { sizeLimit: '15mb' } },
};

const GEMINI_VISION_URL = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;

const GEMINI_IMAGE_URL = (key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${key}`;

const ANGLES = {
  pain: {
    label: 'Dolor',
    buildPrompt: (ctx, format) =>
      `Professional advertising lifestyle photography. ${ctx} The scene shows a person clearly struggling with a common frustration or problem — worried, tired, or overwhelmed expression. Realistic home or everyday environment. No product in scene. The person is experiencing the problem the product solves. Natural lighting, photorealistic, cinematic quality. ${formatHint(format)}`,
  },
  desire: {
    label: 'Deseo',
    buildPrompt: (ctx, format) =>
      `Professional advertising lifestyle photography. ${ctx} The scene shows a happy, radiant, successful person who has achieved their ideal outcome. Bright aspirational environment, golden hour lighting. The person feels confident and fulfilled. No product in scene. Photorealistic, premium advertising quality. ${formatHint(format)}`,
  },
  transformation: {
    label: 'Transformación',
    buildPrompt: (ctx, format) =>
      `Professional advertising split-panel image. ${ctx} LEFT HALF: person struggling, unhappy, "before" state — dull environment, problem visible. RIGHT HALF: same person thriving, happy, glowing, "after" state — bright vibrant environment. Bold clean dividing line. No product shown, only the people and environments. Photorealistic advertising quality. ${formatHint(format)}`,
  },
  objection: {
    label: 'Objeción',
    buildPrompt: (ctx, format) =>
      `Professional advertising lifestyle photography. ${ctx} Scene shows a thoughtful, initially skeptical person carefully examining or reading something — expression transitioning from doubt to approval and trust. Credible, trustworthy home environment. Conveys "I was unsure but this works". No product in scene. Natural lighting, photorealistic. ${formatHint(format)}`,
  },
  urgency: {
    label: 'Urgencia',
    buildPrompt: (ctx, format) =>
      `High-energy dynamic advertising photography. ${ctx} Scene shows an excited, thrilled person who just discovered an amazing opportunity. Vibrant bold colors, sense of movement and action. Energy and enthusiasm. No product in scene. Dramatic lighting, photorealistic, bold composition. ${formatHint(format)}`,
  },
  authority: {
    label: 'Autoridad',
    buildPrompt: (ctx, format) =>
      `Premium professional advertising photography. ${ctx} Scene shows a credible, expert person in a clean premium or clinical environment. Conveys expertise, science, and trustworthiness. Neutral clean tones, crisp professional lighting. The setting projects authority and reliability. No product in scene. Photorealistic. ${formatHint(format)}`,
  },
};

function formatHint(format) {
  if (format === 'vertical') return 'Vertical 9:16 portrait composition.';
  if (format === 'horizontal') return 'Horizontal 16:9 landscape composition.';
  return 'Square 1:1 composition.';
}

async function analyzeProduct(imageBase64, apiKey) {
  const res = await fetch(GEMINI_VISION_URL(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: 'Describe this product for advertising in 50 words max. Include: what it is, who uses it, main benefit, use context. Be specific and factual.' },
          { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
        ],
      }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Error analizando producto');
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function generateScene(prompt, apiKey) {
  const res = await fetch(GEMINI_IMAGE_URL(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['IMAGE'] },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Error generando escena');
  const imgPart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!imgPart) throw new Error('Gemini no devolvió imagen. Verifica tu API key de Google AI Studio.');
  return { data: imgPart.inlineData.data, mimeType: imgPart.inlineData.mimeType };
}

async function compositeProductOnScene(sceneBase64, productBase64) {
  const sceneBuffer = Buffer.from(sceneBase64, 'base64');
  const productBuffer = Buffer.from(productBase64, 'base64');

  const { width: sw, height: sh } = await sharp(sceneBuffer).metadata();

  const targetH = Math.round(sh * 0.42);
  const resizedProduct = await sharp(productBuffer)
    .resize({ height: targetH, fit: 'inside', withoutEnlargement: false })
    .png()
    .toBuffer();

  const { width: pw } = await sharp(resizedProduct).metadata();
  const left = Math.round((sw - pw) / 2);
  const top = Math.round(sh - targetH - sh * 0.03);

  const result = await sharp(sceneBuffer)
    .composite([{ input: resizedProduct, left, top, blend: 'over' }])
    .jpeg({ quality: 92 })
    .toBuffer();

  return result.toString('base64');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const apiKey = req.headers['x-google-ai-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'Se requiere tu Google AI Studio API Key. Ingrésala en el generador.' });
  }

  const { productName, description, angles, angle = 'desire', format = 'square', productImageBase64 } = req.body;

  if (!productName && !productImageBase64) {
    return res.status(400).json({ error: 'Se requiere nombre del producto o imagen.' });
  }

  const selectedAngles = Array.isArray(angles) && angles.length > 0 ? angles : [angle];

  try {
    let productContext = '';
    if (productImageBase64) {
      productContext = await analyzeProduct(productImageBase64, apiKey);
    } else {
      productContext = `Product: ${productName}. ${description || ''}`;
    }

    const results = await Promise.allSettled(
      selectedAngles.map(async (a) => {
        const angleConfig = ANGLES[a] || ANGLES.desire;
        const scenePrompt = angleConfig.buildPrompt(productContext, format);
        const scene = await generateScene(scenePrompt, apiKey);

        let imageUrl;
        if (productImageBase64) {
          const composited = await compositeProductOnScene(scene.data, productImageBase64);
          imageUrl = `data:image/jpeg;base64,${composited}`;
        } else {
          imageUrl = `data:${scene.mimeType};base64,${scene.data}`;
        }

        return { imageUrl, angle: a, label: angleConfig.label };
      })
    );

    const images = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
    const errors = results.filter((r) => r.status === 'rejected').map((r) => r.reason?.message);

    if (images.length === 0) {
      return res.status(500).json({ error: errors[0] || 'Error generando imágenes' });
    }

    return res.status(200).json({ images, ...(errors.length && { errors }) });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Error generando imágenes' });
  }
}
