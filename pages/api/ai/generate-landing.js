const Anthropic = require('@anthropic-ai/sdk');
const { requireAuth } = require('../../../lib/auth');
const { checkCredits, deductCredits } = require('../../../lib/credits');

const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';

const SYSTEM_PROMPT = `Eres un copywriter senior y diseñador web experto en embudos de alta conversión (especialmente para comercio electrónico, infoproductos y servicios).
Tu tarea es generar el contenido persuasivo y el diseño visual (HTML/CSS responsivo integrado) para una sección de una landing page.

Debes diseñar componentes modernos, premium e interactivos con un estilo sofisticado (estética premium, sombras suaves, bordes redondeados y tipografía moderna). Usa estilos CSS inline o bloques <style> integrados en el HTML. Las secciones deben ser 100% responsivas y verse espectaculares tanto en móvil como en escritorio.

Si se proporciona un Link de Producto (productUrl), colócalo obligatoriamente como el atributo 'href' de todos los botones de llamado a la acción (CTA) y enlaces de compra en el código HTML generado. Si no se proporciona, usa '#' como valor predeterminado.

Tipos de secciones que puedes generar:
- Hero: Gancho inicial, propuesta de valor clara, beneficio principal, imagen del producto y botón de llamado a la acción (CTA) destacado.
- Oferta: Presentación del paquete de precios, descuentos, urgencia y garantía.
- Antes/Después: Contraste visual y de copy sobre la transformación del cliente.
- Beneficios: Lista de los 3-4 beneficios clave del producto con iconos limpios.
- Tabla Comparativa: Tabla intuitiva que compare tu producto (ganando) vs alternativas genéricas.
- Testimonios: Prueba social con estrellas, opiniones de clientes y avatares.
- Prueba de Autoridad: Respaldos científicos, certificaciones, sellos de calidad o logotipos de prensa.
- Modo de Uso: Explicación paso a paso de cómo se aplica o utiliza el producto.
- Logística: Envíos rápidos, métodos de pago (ej. pago contraentrega en Colombia) y garantías.
- Preguntas Frecuentes: Acordeón interactivo con las dudas más comunes resueltas con copy de ventas.

Debes responder estrictamente con un objeto JSON válido que contenga:
{
  "copy": "Texto resumido del copy persuasivo para que el usuario lo lea rápido.",
  "html": "<section style='...'>... código completo HTML y CSS inline ...</section>"
}

IMPORTANTE: No añadas explicaciones, saludos ni bloques de código markdown fuera del JSON. Devuelve únicamente el objeto JSON listo para ser parseado.`;

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const user = await requireAuth(req, res);
    if (!user) return;

    const creditCheck = await checkCredits(user.email, 'landing');
    if (!creditCheck.ok) {
        return res.status(creditCheck.status).json({ error: creditCheck.error, balance: creditCheck.balance });
    }

    try {
        const { productName, productDescription, productUrl, logoUrl, logoText, instructions, size, language, sectionType, shippingInfo } = req.body;

        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            throw new Error('ANTHROPIC_API_KEY no configurada');
        }

        const anthropic = new Anthropic({ apiKey });

        const prompt = `Genera una sección de tipo "${sectionType}" para una landing page de alta conversión.
Información del producto:
- Nombre: ${productName || 'Producto no especificado'}
- Descripción: ${productDescription || 'Sin descripción'}
- Link de compra/checkout (productUrl): ${productUrl || 'No especificado'}
- Logo: ${logoText || ''} (${logoUrl || 'Sin imagen de logo'})
- Tamaño objetivo: ${size || 'Móvil'}
- Idioma: ${language || 'Español'}
- Información de envío/pago: ${shippingInfo || 'Envío Express, Pago Contraentrega'}

Instrucciones adicionales del usuario:
"${instructions || 'Sin instrucciones adicionales'}"

Genera el copy y el HTML/CSS responsivo en base a estos datos. Recuerda devolver únicamente el objeto JSON con las propiedades "copy" y "html".`;

        const response = await anthropic.messages.create({
            model: CLAUDE_MODEL,
            max_tokens: 4000,
            system: [{ type: 'text', text: SYSTEM_PROMPT }],
            messages: [{ role: 'user', content: prompt }]
        });

        const rawText = response.content[0]?.text || '';
        
        // Clean JSON formatting if Claude added markdown code block wraps
        let cleanJsonText = rawText.trim();
        if (cleanJsonText.startsWith('```json')) {
            cleanJsonText = cleanJsonText.substring(7);
        } else if (cleanJsonText.startsWith('```')) {
            cleanJsonText = cleanJsonText.substring(3);
        }
        if (cleanJsonText.endsWith('```')) {
            cleanJsonText = cleanJsonText.substring(0, cleanJsonText.length - 3);
        }
        cleanJsonText = cleanJsonText.trim();

        const result = JSON.parse(cleanJsonText);

        await deductCredits(user.email, 'landing', { model: CLAUDE_MODEL });

        res.json(result);
    } catch (error) {
        console.error('Error al generar sección de landing:', error);
        res.status(500).json({ error: 'Error al conectar con la IA para generar la landing page.' });
    }
}
